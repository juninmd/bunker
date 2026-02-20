import { deriveKey, encryptWithKey, decryptWithKey, base64ToBytes, bytesToBase64 } from '../utils/crypto.js';

const STORAGE_KEY = 'bunkerpass.vault.v1';
const SALT_KEY = 'bunkerpass.salt.v1';
const VAULT_SCHEMA_VERSION = 1;

export class VaultService {
  constructor() {
    this.cachedVault = [];
    this.masterPassword = null;
    this.cryptoKey = null; // Store the CryptoKey object
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

    // Derive the key once
    this.cryptoKey = await deriveKey(masterPassword, this.salt);
    this.masterPassword = masterPassword;

    const encrypted = await this.getStorage(STORAGE_KEY);
    if (!encrypted) {
      this.cachedVault = [];
      // Initialize vault with empty array encrypted
      await this.save(this.cachedVault);
    } else {
      try {
        // Use the derived key for decryption
        const data = await decryptWithKey(encrypted, this.cryptoKey);
        this.cachedVault = this.sanitizeVault(data);
      } catch (e) {
        throw new Error('Invalid password or corrupted vault');
      }
    }

    return this.cachedVault;
  }

  async unlockWithSessionKey(keyBytes) {
      // Import the raw key back to CryptoKey
      this.cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyBytes,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
      );

      const encrypted = await this.getStorage(STORAGE_KEY);
      if (encrypted) {
          try {
              const data = await decryptWithKey(encrypted, this.cryptoKey);
              this.cachedVault = this.sanitizeVault(data);
          } catch (e) {
              throw new Error('Invalid session key or corrupted vault');
          }
      }
      return this.cachedVault;
  }

  async save(newVault) {
    if (!this.cryptoKey) {
      throw new Error('Vault is locked');
    }
    const payload = {
      schemaVersion: VAULT_SCHEMA_VERSION,
      credentials: newVault
    };
    const encrypted = await encryptWithKey(payload, this.cryptoKey);
    await this.setStorage(STORAGE_KEY, encrypted);
    this.cachedVault = newVault;
  }

  lock() {
    this.masterPassword = null;
    this.cryptoKey = null;
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
