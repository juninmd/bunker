import { VAULT_KDF_ITERATIONS, deriveKey, decryptWithKey, encryptWithKey, encryptPayload, decryptPayload, base64ToBytes, bytesToBase64, exportRawKey, importRawKey } from '../utils/crypto.js';
import { formatLocalBlob, parseLocalBlob } from '../utils/vault-envelope.js';
import { getLocal, removeLocal, setLocalMany } from '../utils/local-storage.js';
import { getSessionValue, removeSessionValues, setSessionValues } from '../utils/session-storage.js';
import * as pinLock from './pin-lock.js';

const STORAGE_KEY = 'bunkerpass.vault.v1';
const SALT_KEY = 'bunkerpass.salt.v1';
const SESSION_KEY = 'sessionKey';
const VAULT_SCHEMA_VERSION = 1;
const RECOVERY_PREFIX = 'bunkerpass.recovery';
const PASSWORD_WRAPS = ['bunkerpass.recovery.salt', 'bunkerpass.recovery.encrypted', 'bunkerpass.passwordless.credentialId', 'bunkerpass.passwordless.salt', 'bunkerpass.passwordless.encryptedData'];
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

  // Re-keys the vault in one write: used to adopt the salt shared through sync and to change the master password.
  async rekey(masterPassword: string, salt: Uint8Array, iterations: number) {
    const key = await deriveKey(masterPassword, salt, iterations);
    const encrypted = await encryptWithKey({ schemaVersion: VAULT_SCHEMA_VERSION, credentials: this.cachedVault }, key);
    await setLocalMany({ [SALT_KEY]: bytesToBase64(salt), [STORAGE_KEY]: formatLocalBlob(iterations, encrypted) });
    Object.assign(this, { key, salt, iterations, masterPassword });
    await pinLock.clearPin();
    await this.exportSessionKey();
  }

  async changeMasterPassword(current: string, next: string) {
    if (next.length < MIN_MASTER_PASSWORD_LENGTH) throw new Error('WEAK_MASTER_PASSWORD');
    await this.unlock(current);
    await this.rekey(next, crypto.getRandomValues(new Uint8Array(16)), VAULT_KDF_ITERATIONS);
    // Recovery and passwordless envelopes wrap the old password and would unlock nothing.
    await this.removeStorage(PASSWORD_WRAPS);
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

  async hasPin() {
    return await pinLock.hasPin();
  }

  // The recovery code wraps the master password so it survives salt changes from sync.
  async generateRecoveryKey() {
    if (!this.masterPassword) throw new Error('MASTER_PASSWORD_REQUIRED');
    const recoveryCode = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await encryptPayload({ masterPassword: this.masterPassword }, recoveryCode, salt);
    await setLocalMany({ [`${RECOVERY_PREFIX}.salt`]: bytesToBase64(salt), [`${RECOVERY_PREFIX}.encrypted`]: encrypted });
    return recoveryCode;
  }

  async unlockWithRecoveryKey(recoveryCode: string) {
    const storedSalt = await this.getStorage(`${RECOVERY_PREFIX}.salt`);
    const encrypted = await this.getStorage(`${RECOVERY_PREFIX}.encrypted`);
    if (!storedSalt || !encrypted) throw new Error('Recovery key not set');
    let payload: { masterPassword: string };
    try {
      payload = await decryptPayload(encrypted, recoveryCode, base64ToBytes(storedSalt));
    } catch (e) {
      throw new Error('Invalid recovery key');
    }
    return await this.unlock(payload.masterPassword);
  }

  async hasRecoveryKey() {
    return !!(await this.getStorage(`${RECOVERY_PREFIX}.encrypted`));
  }
}
