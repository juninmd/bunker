import { deriveKey, encryptPayload, decryptPayload, base64ToBytes, bytesToBase64 } from '../utils/crypto.js';

const STORAGE_KEY = 'bunkerpass.vault.v1';
const SALT_KEY = 'bunkerpass.salt.v1';
const VAULT_SCHEMA_VERSION = 1;

export class VaultService {
  constructor() {
    this.cachedVault = [];
    this.masterPassword = null;
    this.salt = null;
  }

  async unlock(masterPassword) {
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

  async save(newVault) {
    if (!this.masterPassword || !this.salt) {
      throw new Error('Vault is locked');
    }
    await this.saveInternal(newVault, this.masterPassword, this.salt);
    this.cachedVault = newVault;
  }

  async saveInternal(vault, password, salt) {
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

  sanitizeVault(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.credentials)) return data.credentials;
    return [];
  }

  async getStorage(key) {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
       const data = await browser.storage.local.get(key);
       return data[key];
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => resolve(result[key]));
      });
    }
    return localStorage.getItem(key);
  }

  async setStorage(key, value) {
    if (typeof browser !== 'undefined' && browser.storage?.local) {
      return browser.storage.local.set({ [key]: value });
    }
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, resolve);
      });
    }
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

  async clearSessionKey() {
      if (typeof chrome !== 'undefined' && chrome.storage?.session) {
          await chrome.storage.session.remove('sessionKey');
      }
  }
}
