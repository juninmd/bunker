import { VAULT_KDF_ITERATIONS, deriveKey, decryptWithKey, encryptWithKey, base64ToBytes, bytesToBase64, exportRawKey, importRawKey } from '../utils/crypto.js';
import { formatLocalBlob, parseLocalBlob } from '../utils/vault-envelope.js';
import { getLocal, removeLocal, setLocalMany } from '../utils/local-storage.js';
import { getSessionValue, removeSessionValues, setSessionValues } from '../utils/session-storage.js';
import * as pinLock from './pin-lock.js';
import { createRecoveryCode, recoverMasterPassword } from './recovery-key.js';
import { changeMasterPassword } from './master-password.js';

export const STORAGE_KEY = 'bunkerpass.vault.v1';
export const SALT_KEY = 'bunkerpass.salt.v1';
const SESSION_KEY = 'sessionKey';
export const VAULT_SCHEMA_VERSION = 1;
export const MIN_MASTER_PASSWORD_LENGTH = 12;

// The derived key, not the master password, is what keeps the vault open; the password is held only while typed in this popup.
export class VaultService {
  cachedVault: any[] = [];
  masterPassword: null | string = null;
  salt: null | Uint8Array = null;
  iterations = VAULT_KDF_ITERATIONS;
  key: null | CryptoKey = null;

  get isUnlocked() {
    return !!this.key;
  }

  async hasVault() {
    return !!(await this.getStorage(STORAGE_KEY));
  }

  async unlock(masterPassword: string) {
    this.salt = await this.getSalt() ?? crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await this.getStorage(STORAGE_KEY);
    if (!encrypted) {
      if (masterPassword.length < MIN_MASTER_PASSWORD_LENGTH) throw new Error('WEAK_MASTER_PASSWORD');
      this.iterations = VAULT_KDF_ITERATIONS;
      this.key = await deriveKey(masterPassword, this.salt, this.iterations);
      await this.setStorage(SALT_KEY, bytesToBase64(this.salt));
      await this.save([]);
    } else {
      const { iterations, ciphertext } = parseLocalBlob(encrypted);
      const key = await deriveKey(masterPassword, this.salt, iterations);
      try {
        this.cachedVault = this.sanitizeVault(await decryptWithKey(ciphertext, key));
      } catch (e) {
        throw new Error('Invalid password or corrupted vault');
      }
      this.iterations = Math.max(iterations, VAULT_KDF_ITERATIONS);
      this.key = iterations < VAULT_KDF_ITERATIONS ? await deriveKey(masterPassword, this.salt, this.iterations) : key;
      if (iterations < VAULT_KDF_ITERATIONS) await this.save(this.cachedVault);
    }
    await this.removeStorage(pinLock.LEGACY_PIN_LOCAL_KEYS);
    this.masterPassword = masterPassword;
    return this.cachedVault;
  }

  async unlockWithKey(key: CryptoKey) {
    const encrypted = await this.getStorage(STORAGE_KEY);
    if (!encrypted) throw new Error('No vault');
    const { iterations, ciphertext } = parseLocalBlob(encrypted);
    this.cachedVault = this.sanitizeVault(await decryptWithKey(ciphertext, key));
    this.salt = await this.getSalt();
    this.iterations = iterations;
    this.key = key;
    return this.cachedVault;
  }

  async restoreSession(): Promise<boolean> {
    const raw = await getSessionValue<string>(SESSION_KEY);
    if (!raw) return false;
    try {
      await this.unlockWithKey(await importRawKey(raw));
      return true;
    } catch {
      await this.clearSessionKey();
      return false;
    }
  }

  async save(newVault: any[]) {
    if (!this.key) throw new Error('Vault is locked');
    const encrypted = await encryptWithKey({ schemaVersion: VAULT_SCHEMA_VERSION, credentials: newVault }, this.key);
    await this.setStorage(STORAGE_KEY, formatLocalBlob(this.iterations, encrypted));
    this.cachedVault = newVault;
  }

  async changeMasterPassword(current: string, next: string) {
    await changeMasterPassword(this, current, next);
  }

  lock() {
    Object.assign(this, { masterPassword: null, key: null, cachedVault: [] });
    this.clearSessionKey();
  }

  getVault() {
    return this.cachedVault;
  }

  sanitizeVault(data: any) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.credentials)) return data.credentials;
    return [];
  }

  async getStorage(key: string): Promise<any> {
    return getLocal(key);
  }

  async setStorage(key: string, value: any): Promise<any> {
    return setLocalMany({ [key]: value });
  }

  async removeStorage(keys: string[]): Promise<void> {
    return removeLocal(keys);
  }

  async getSalt() {
    const stored = await this.getStorage(SALT_KEY);
    return stored ? base64ToBytes(stored) : null;
  }

  async exportSessionKey() {
    if (!this.key) throw new Error('Locked');
    await setSessionValues({ [SESSION_KEY]: await exportRawKey(this.key) });
  }

  async clearSessionKey() {
    await removeSessionValues([SESSION_KEY]);
  }

  async setupPin(pin: string) {
    if (!this.key) throw new Error('Locked');
    await pinLock.setupPin(pin, await exportRawKey(this.key));
  }

  async unlockWithPin(pin: string) {
    return await this.unlockWithKey(await importRawKey(await pinLock.recoverVaultKey(pin)));
  }

  async generateRecoveryKey() {
    if (!this.masterPassword) throw new Error('MASTER_PASSWORD_REQUIRED');
    return createRecoveryCode(this.masterPassword);
  }

  async unlockWithRecoveryKey(code: string) {
    return this.unlock(await recoverMasterPassword(code));
  }
}
