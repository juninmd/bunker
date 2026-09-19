import { base64ToBytes, decryptWithKey, encryptWithKey } from '../utils/crypto.js';
import { formatLocalBlob, parseLocalBlob } from '../utils/vault-envelope.js';

const STORAGE_KEY = 'bunkerpass.vault.v1';

interface UnlockedVault {
  key: CryptoKey;
  iterations: number;
  credentials: any[];
}

async function loadVault(): Promise<UnlockedVault | 'LOCKED'> {
  const { sessionKey } = await chrome.storage.session.get('sessionKey');
  if (!sessionKey) return 'LOCKED';
  const key = await crypto.subtle.importKey('raw', base64ToBytes(sessionKey as string) as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const stored = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] as string | undefined;
  if (!stored) return { key, iterations: 0, credentials: [] };
  const { iterations, ciphertext } = parseLocalBlob(stored);
  const data = await decryptWithKey(ciphertext, key);
  const credentials = Array.isArray(data) ? data : Array.isArray(data?.credentials) ? data.credentials : [];
  return { key, iterations, credentials };
}

async function withVault(sendResponse: (response: any) => void, onUnlocked: (vault: UnlockedVault) => Promise<any>) {
  try {
    const vault = await loadVault();
    sendResponse(vault === 'LOCKED' ? { error: 'LOCKED' } : await onUnlocked(vault));
  } catch (e) {
    console.error(e); // NOSONAR
    sendResponse({ error: 'DECRYPT_FAILED' });
  }
}

const isLivePassword = (item: any) => (!item.type || item.type === 'password') && !item.deletedAt;

export class CredentialService {
  static async getPolicies(sendResponse: (response: any) => void) {
    await withVault(sendResponse, async ({ credentials }) => ({
      policies: credentials.find((item: any) => item.type === 'business-policy' && item.site === 'business-policy') || null
    }));
  }

  static async getCredentials(domain: string, sendResponse: (response: any) => void, onActivity?: () => void) {
    await withVault(sendResponse, async ({ credentials }) => {
      if (onActivity) onActivity();
      return {
        credentials: credentials.filter((item: any) =>
          isLivePassword(item) && item.site && (domain === item.site || domain.endsWith('.' + item.site)))
      };
    });
  }

  static async checkCredential(domain: string, username: string, password: string, sendResponse: (response: any) => void, onActivity?: () => void) {
    await withVault(sendResponse, async ({ credentials }) => {
      if (onActivity) onActivity();
      const cred = credentials.find((item: any) => isLivePassword(item) && item.site === domain && item.username === username);
      // Answer with a comparison only; the stored password never goes back to the page context.
      return { stored: !!cred, same: !!cred && cred.password === password };
    });
  }

  static async saveCredential(domain: string, data: any, sendResponse: (response: any) => void, onActivity?: () => void) {
    await withVault(sendResponse, async ({ key, iterations, credentials }) => {
      // No stored vault means no KDF cost on record; only the popup may create one.
      if (!iterations) return { error: 'NO_VAULT' };
      if (onActivity) onActivity();
      const now = new Date().toISOString();
      const existing = credentials.find((i: any) => (!i.type || i.type === 'password') && i.site === domain && i.username === data.username);

      if (existing) {
        existing.password = data.password;
        existing.updatedAt = now;
        delete existing.deletedAt;
      } else {
        credentials.push({
          id: crypto.randomUUID(), type: 'password', site: domain, username: data.username, password: data.password,
          notes: '', grouping: '', createdAt: now, updatedAt: now
        });
      }

      const encrypted = await encryptWithKey({ schemaVersion: 1, credentials }, key);
      await chrome.storage.local.set({ [STORAGE_KEY]: formatLocalBlob(iterations, encrypted) });
      return { success: true };
    });
  }
}
