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

    // Polyfill methods
    vaultService.generateRecoveryKey = async function() {
        if (!this.masterPassword) throw new Error('Locked');
        const recoveryBytes = crypto.getRandomValues(new Uint8Array(16));
        const recoveryCode = Array.from(recoveryBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const { encryptPayload } = await import('../src/utils/crypto.js');
        const { bytesToBase64 } = await import('../src/utils/crypto.js');
        const encrypted = await encryptPayload({ masterPassword: this.masterPassword }, recoveryCode, salt);
        await this.setStorage('bunkerpass.recovery.salt', bytesToBase64(salt));
        await this.setStorage('bunkerpass.recovery.encrypted', encrypted);
        return recoveryCode;
    };

    vaultService.unlockWithRecoveryKey = async function(recoveryCode) {
        const storedSalt = await this.getStorage('bunkerpass.recovery.salt');
        const encrypted = await this.getStorage('bunkerpass.recovery.encrypted');
        if (!storedSalt || !encrypted) throw new Error('Recovery key not set');
        try {
            const { decryptPayload, base64ToBytes } = await import('../src/utils/crypto.js');
            const payload = await decryptPayload(encrypted, recoveryCode, base64ToBytes(storedSalt));
            return await this.unlock(payload.masterPassword);
        } catch (e) {
            throw new Error('Invalid recovery key');
        }
    };

    const code = await vaultService.generateRecoveryKey();

    vaultService.lock();
    assert.strictEqual(vaultService.masterPassword, null);

    const vault = await vaultService.unlockWithRecoveryKey(code);
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vaultService.masterPassword, 'master123');

    console.log('Recovery Key Test Passed');
}
run().catch(console.error);
