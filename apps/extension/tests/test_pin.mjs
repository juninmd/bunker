import { VaultService } from '../src/services/vault-service.js';
import assert from 'assert'; // NOSONAR
import { deriveKey } from '../src/utils/crypto.js'; // NOSONAR

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
    await vaultService.unlock('master123-long-enough');
    await vaultService.save([{ site: 'example.com', password: 'pw' }]);

    await vaultService.setupPin('1234');

    vaultService.lock();
    assert.strictEqual(vaultService.masterPassword, null);

    const vault = await vaultService.unlockWithPin('1234');
    assert.strictEqual(vault.length, 1);
    assert.ok(vaultService.isUnlocked, 'PIN must reopen the vault');

    console.log('PIN Test Passed');
}
run().catch(e => { console.error(e); process.exitCode = 1; });
