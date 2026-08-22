import { VaultService } from '../src/services/vault-service.js';
import assert from 'assert'; // NOSONAR
import { deriveKey } from '../src/utils/crypto.js'; // NOSONAR

if (!globalThis.crypto) {
    globalThis.crypto = await import('node:crypto').then(m => m.webcrypto);
}

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

    await vaultService.unlock('master123');
    await vaultService.save([{ site: 'example.com', password: 'pw' }]);

    await vaultService.setupPin('1234');
    vaultService.lock();
    assert.strictEqual(vaultService.masterPassword, null);
    let vault = await vaultService.unlockWithPin('1234');
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vaultService.masterPassword, 'master123');
    console.log('PIN Test Passed');

    const code = await vaultService.generateRecoveryKey();
    vaultService.lock();
    assert.strictEqual(vaultService.masterPassword, null);
    vault = await vaultService.unlockWithRecoveryKey(code);
    assert.strictEqual(vault.length, 1);
    assert.strictEqual(vaultService.masterPassword, 'master123');
    console.log('Recovery Key Test Passed');
}
run().catch(console.error);
