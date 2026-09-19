declare var browser: any;
import { VAULT_KDF_ITERATIONS, deriveKey, encryptPayload, decryptPayload, base64ToBytes, bytesToBase64 } from '../utils/crypto.js';
import { formatLocalBlob, parseLocalBlob } from '../utils/vault-envelope.js';
import * as pinLock from './pin-lock.js';

const STORAGE_KEY = 'bunkerpass.vault.v1';
const SALT_KEY = 'bunkerpass.salt.v1';
const VAULT_SCHEMA_VERSION = 1;
export const MIN_MASTER_PASSWORD_LENGTH = 12;

export class VaultService {
  cachedVault: any[] = [];
  masterPassword: null | string = null;
  salt: null | Uint8Array = null;
  iterations = VAULT_KDF_ITERATIONS;

  async unlock(masterPassword: string) {
    const storedSalt = await this.getStorage(SALT_KEY);
    if (!storedSalt) {
      // First time initialization or reset
      const newSalt = crypto.getRandomValues(new Uint8Array(16));
      await this.setStorage(SALT_KEY, bytesToBase64(newSalt));
      this.salt = newSalt;
    } else {
      this.salt = base64ToBytes(storedSalt);
    }

    const encrypted = await this.getStorage(STORAGE_KEY);
    if (!encrypted) {
      if (masterPassword.length < MIN_MASTER_PASSWORD_LENGTH) throw new Error('WEAK_MASTER_PASSWORD');
      this.cachedVault = [];
      this.iterations = VAULT_KDF_ITERATIONS;
      await this.saveInternal([], masterPassword, this.salt);
    } else {
      const { iterations, ciphertext } = parseLocalBlob(encrypted);
      try {
        const data = await decryptPayload(ciphertext, masterPassword, this.salt, iterations);
        this.cachedVault = this.sanitizeVault(data);
      } catch (e) {
        throw new Error('Invalid password or corrupted vault');
      }
      this.iterations = Math.max(iterations, VAULT_KDF_ITERATIONS);
      if (iterations < VAULT_KDF_ITERATIONS) await this.saveInternal(this.cachedVault, masterPassword, this.salt);
    }
    await this.removeStorage(pinLock.LEGACY_PIN_LOCAL_KEYS);

    this.masterPassword = masterPassword;
    return this.cachedVault;
  }

  async save(newVault: any[]) {
    if (!this.masterPassword || !this.salt) {
      throw new Error('Vault is locked');
    }
    await this.saveInternal(newVault, this.masterPassword, this.salt);
    this.cachedVault = newVault;
  }

  async saveInternal(vault: any[], password: string, salt: Uint8Array) {
    const payload = {
      schemaVersion: VAULT_SCHEMA_VERSION,
      credentials: vault
    };
    const encrypted = await encryptPayload(payload, password, salt, this.iterations);
    await this.setStorage(STORAGE_KEY, formatLocalBlob(this.iterations, encrypted));
  }

  lock() {
    this.masterPassword = null;
    this.cachedVault = [];
    this.clearSessionKey();
  }

  getVault() {
    return this.cachedVault;
  }

  sanitizeVault(data: any) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.credentials)) return data.credentials;
    return [];
  }

  async getStorage(key: string): Promise<any> {
    if (typeof browser !== 'undefined' && browser.storage?.local) return (await browser.storage.local.get(key))[key];
    if (typeof chrome !== 'undefined' && chrome.storage?.local) return new Promise(r => chrome.storage.local.get([key], res => r(res[key])));
    return localStorage.getItem(key);
  }

  async setStorage(key: string, value: any): Promise<any> {
    if (typeof browser !== 'undefined' && browser.storage?.local) return browser.storage.local.set({ [key]: value });
    if (typeof chrome !== 'undefined' && chrome.storage?.local) return new Promise(r => chrome.storage.local.set({ [key]: value }, () => r(undefined)));
    localStorage.setItem(key, value);
  }

  async removeStorage(keys: string[]): Promise<void> {
    if (typeof browser !== 'undefined' && browser.storage?.local) return browser.storage.local.remove(keys);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) return chrome.storage.local.remove(keys);
    keys.forEach(k => localStorage.removeItem(k));
  }

  async getSalt() {
      if (this.salt) return this.salt;
      const stored = await this.getStorage(SALT_KEY);
      if (stored) {
          this.salt = base64ToBytes(stored);
          return this.salt;
      }
      return null;
  }

  async exportSessionKey() {
      if (!this.masterPassword || !this.salt) throw new Error('Locked');
      const key = await deriveKey(this.masterPassword, this.salt, this.iterations);
      const exported = await crypto.subtle.exportKey('raw', key);
      const b64 = bytesToBase64(new Uint8Array(exported));

      if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          await chrome.storage.session.set({ sessionKey: b64 });
      }
  }

  // NOSONAR: Shared helper for PIN and Recovery to avoid duplication
  async _setupSecret(secret: string, storagePrefix: string) {
      if (!this.masterPassword) throw new Error('Locked');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const encrypted = await encryptPayload({ masterPassword: this.masterPassword }, secret, salt);
      await this.setStorage(`${storagePrefix}.salt`, bytesToBase64(salt));
      await this.setStorage(`${storagePrefix}.encrypted`, encrypted);
  }

  // NOSONAR: Shared helper to unlock with PIN or Recovery Key
  async _unlockWithSecret(secret: string, storagePrefix: string) {
      const storedSalt = await this.getStorage(`${storagePrefix}.salt`);
      const encrypted = await this.getStorage(`${storagePrefix}.encrypted`);
      if (!storedSalt || !encrypted) throw new Error(`${storagePrefix} not set`);
      try {
          const payload = await decryptPayload(encrypted, secret, base64ToBytes(storedSalt));
          return await this.unlock(payload.masterPassword);
      } catch (e) {
          throw new Error(`Invalid ${storagePrefix}`);
      }
  }

  async setupPin(pin: string) {
      if (!this.masterPassword) throw new Error('Locked');
      await pinLock.setupPin(pin, this.masterPassword);
  }

  async unlockWithPin(pin: string) {
      return await this.unlock(await pinLock.recoverMasterPassword(pin));
  }

  async hasPin() {
      return await pinLock.hasPin();
  }

  async generateRecoveryKey() {
      const recoveryBytes = crypto.getRandomValues(new Uint8Array(16));
      const recoveryCode = Array.from(recoveryBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      await this._setupSecret(recoveryCode, 'bunkerpass.recovery');
      return recoveryCode;
  }

  async unlockWithRecoveryKey(recoveryCode: string) {
      return await this._unlockWithSecret(recoveryCode, 'bunkerpass.recovery');
  }

  async hasRecoveryKey() {
      return !!(await this.getStorage('bunkerpass.recovery.encrypted'));
  }

  async clearSessionKey() {
      if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          await chrome.storage.session.remove('sessionKey');
      }
  }
}
