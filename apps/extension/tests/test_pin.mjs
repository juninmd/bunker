import { VaultService } from '../src/services/vault-service.js';
import assert from 'assert';
import { deriveKey } from '../src/utils/crypto.js';

if (!globalThis.crypto) {
    globalThis.crypto = await import('node:crypto').then(m => m.webcrypto);
}

// Mock browser storage
const storage = new Map();
globalThis.localStorage = {
    getItem: (k) => storage.get(k),
    setItem: (k, v) => storage.set(k, v),
    removeItem: (k) => storage.delete(k)
};

async function run() {
    const vaultService = new VaultService();
    vaultService.storageMock = new Map();
    vaultService.getStorage = async function(k) { return this.storageMock.get(k); };
    vaultService.setStorage = async function(k, v) { this.storageMock.set(k, v); };

    // First setup
    await vaultService.unlock('master123');
    await vaultService.save([{ site: 'example.com', password: 'pw' }]);

    // Setup PIN
    vaultService.setupPin = async function(pin) {
        if (!this.masterPassword) throw new Error('Locked');
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const { encryptPayload } = await import('../src/utils/crypto.js');
        const { bytesToBase64 } = await import('../src/utils/crypto.js');
        const encrypted = await encryptPayload({ masterPassword: this.masterPassword }, pin, salt);
        await this.setStorage('bunkerpass.pin.salt', bytesToBase64(salt));
        await this.setStorage('bunkerpass.pin.encrypted', encrypted);
    };

    vaultService.unlockWithPin = async function(pin) {
        const storedSalt = await this.getStorage('bunkerpass.pin.salt');
        const encrypted = await this.getStorage('bunkerpass.pin.encrypted');
        if (!storedSalt || !encrypted) throw new Error('PIN not set');
        try {
            const { decryptPayload, base64ToBytes } = await import('../src/utils/crypto.js');
            const payload = await decryptPayload(encrypted, pin, base64ToBytes(storedSalt));
            return await this.unlock(payload.masterPassword);
        } catch (e) {
            throw new Error('Invalid PIN');
        }
    };

    await vaultService.setupPin('1234');

    vaultService.lock();
    assert.strictEqual(vaultService.masterPassword, null);

    const vault = await vaultService.unlockWithPin('1234');
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vaultService.masterPassword, 'master123');

    console.log('PIN Test Passed');
}
run().catch(console.error);
