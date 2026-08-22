declare var browser: any;
import { deriveKey, encryptPayload, decryptPayload, base64ToBytes, bytesToBase64 } from '../utils/crypto.js';

const STORAGE_KEY = 'bunkerpass.vault.v1';
const SALT_KEY = 'bunkerpass.salt.v1';
const VAULT_SCHEMA_VERSION = 1;

export class VaultService {
  cachedVault: any[] = [];
  masterPassword: null | string = null;
  salt: null | Uint8Array = null;

  constructor() {
    this.cachedVault = [];
    this.masterPassword = null;
    this.salt = null;
  }

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
      this.cachedVault = [];
      // Initialize vault with empty array encrypted
      await this.saveInternal([], masterPassword, this.salt);
    } else {
      try {
        const data = await decryptPayload(encrypted, masterPassword, this.salt);
        this.cachedVault = this.sanitizeVault(data);
      } catch (e) {
        throw new Error('Invalid password or corrupted vault');
      }
    }

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
    const encrypted = await encryptPayload(payload, password, salt);
    await this.setStorage(STORAGE_KEY, encrypted);
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
      const key = await deriveKey(this.masterPassword, this.salt);
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
      await this._setupSecret(pin, 'bunkerpass.pin');
  }

  async unlockWithPin(pin: string) {
      return await this._unlockWithSecret(pin, 'bunkerpass.pin');
  }

  async hasPin() {
      return !!(await this.getStorage('bunkerpass.pin.encrypted'));
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
