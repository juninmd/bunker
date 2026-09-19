import { base64ToBytes, decryptWithKey, encryptWithKey } from '../utils/crypto.js';
import { formatLocalBlob, parseLocalBlob } from '../utils/vault-envelope.js';
import { matchesHost, sameHost } from '../utils/site-match.js';

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
// Items saved before ids existed are referenced by what they are, so a concurrent save cannot shift the ref.
const accountRef = (item: any) => (item.id ? String(item.id) : `legacy:${JSON.stringify([item.site, item.username])}`);

export class CredentialService {
  static async isBlocked(domain: string, sendResponse: (response: any) => void) {
    await withVault(sendResponse, async ({ credentials }) => {
      const policy = credentials.find((item: any) => item.type === 'business-policy' && item.site === 'business-policy');
      const blocked = String(policy?.blockedDomains || '').split(/\r?\n/).map(d => d.trim().toLowerCase()).filter(Boolean);
      return { blocked: blocked.some(b => domain === b || domain.endsWith(`.${b}`)) };
    });
  }

  // Pages only learn which accounts exist; a password leaves the worker for one item, on a genuine click.
  static async listAccounts(domain: string, sendResponse: (response: any) => void, onActivity?: () => void) {
    await withVault(sendResponse, async ({ credentials }) => {
      if (onActivity) onActivity();
      const accounts = credentials.map((item: any) => ({ item, ref: accountRef(item) }))
        .filter(({ item }) => isLivePassword(item) && matchesHost(domain, item.site))
        .map(({ item, ref }) => ({ ref, username: String(item.username || '') }));
      return { accounts };
    });
  }

  static async fillCredential(domain: string, ref: string, sendResponse: (response: any) => void, onActivity?: () => void) {
    await withVault(sendResponse, async ({ credentials }) => {
      const item = credentials.find((c: any) => accountRef(c) === ref && isLivePassword(c) && matchesHost(domain, c.site));
      if (!item) return { error: 'NOT_FOUND' };
      if (onActivity) onActivity();
      return { username: String(item.username || ''), password: String(item.password || '') };
    });
  }

  static async checkCredential(domain: string, username: string, password: string, sendResponse: (response: any) => void, onActivity?: () => void) {
    await withVault(sendResponse, async ({ credentials }) => {
      if (onActivity) onActivity();
      const cred = credentials.find((item: any) => isLivePassword(item) && sameHost(item.site, domain) && item.username === username);
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
      const existing = credentials.find((i: any) => (!i.type || i.type === 'password') && sameHost(i.site, domain) && i.username === data.username);

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
