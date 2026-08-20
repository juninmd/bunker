import { decryptWithKey, encryptWithKey } from '../utils/crypto.js';
export class CredentialService {
    static async getCredentials(domain, sendResponse, onActivity) {
        chrome.storage.session.get(['sessionKey'], async (sessionResult) => {
            if (!sessionResult.sessionKey) {
                sendResponse({ error: 'LOCKED' });
                return;
            }
            if (onActivity)
                onActivity();
            chrome.storage.local.get(['bunkerpass.vault'], async (localResult) => {
                if (!localResult['bunkerpass.vault']) {
                    sendResponse({ credentials: [] });
                    return;
                }
                try {
                    const decrypted = await decryptWithKey(localResult['bunkerpass.vault'], sessionResult.sessionKey);
                    // Filter matching site and type
                    const credentials = decrypted.filter((item) => (!item.type || item.type === 'password') &&
                        !item.deletedAt &&
                        item.site && (domain === item.site || domain.endsWith('.' + item.site)));
                    sendResponse({ credentials });
                }
                catch (e) {
                    console.error(e); // NOSONAR
                    sendResponse({ error: 'DECRYPT_FAILED' });
                }
            });
        });
    }
    static async checkCredential(domain, username, sendResponse, onActivity) {
        chrome.storage.session.get(['sessionKey'], async (sessionResult) => {
            if (!sessionResult.sessionKey) {
                sendResponse({ error: 'LOCKED' });
                return;
            }
            if (onActivity)
                onActivity();
            chrome.storage.local.get(['bunkerpass.vault'], async (localResult) => {
                if (!localResult['bunkerpass.vault']) {
                    sendResponse({ password: null });
                    return;
                }
                try {
                    const decrypted = await decryptWithKey(localResult['bunkerpass.vault'], sessionResult.sessionKey);
                    const cred = decrypted.find((item) => (!item.type || item.type === 'password') &&
                        !item.deletedAt &&
                        item.site === domain &&
                        item.username === username);
                    sendResponse({ password: cred ? cred.password : null });
                }
                catch (e) {
                    console.error(e); // NOSONAR
                    sendResponse({ error: 'DECRYPT_FAILED' });
                }
            });
        });
    }
    static async saveCredential(data, sendResponse, onActivity) {
        chrome.storage.session.get(['sessionKey'], async (sessionResult) => {
            if (!sessionResult.sessionKey) {
                sendResponse({ error: 'LOCKED' });
                return;
            }
            if (onActivity)
                onActivity();
            chrome.storage.local.get(['bunkerpass.vault'], async (localResult) => {
                let vault = [];
                if (localResult['bunkerpass.vault']) {
                    try {
                        vault = await decryptWithKey(localResult['bunkerpass.vault'], sessionResult.sessionKey);
                    }
                    catch (e) {
                        console.error(e); // NOSONAR
                        sendResponse({ error: 'DECRYPT_FAILED' });
                        return;
                    }
                }
                const now = new Date().toISOString();
                const existingIndex = vault.findIndex((i) => (!i.type || i.type === 'password') &&
                    i.site === data.site &&
                    i.username === data.username);
                if (existingIndex >= 0) {
                    vault[existingIndex].password = data.password;
                    vault[existingIndex].updatedAt = now;
                    if (vault[existingIndex].deletedAt) {
                        delete vault[existingIndex].deletedAt;
                    }
                }
                else {
                    vault.push({
                        id: crypto.randomUUID(),
                        type: 'password',
                        site: data.site,
                        username: data.username,
                        password: data.password,
                        notes: '',
                        grouping: '',
                        createdAt: now,
                        updatedAt: now
                    });
                }
                const encrypted = await encryptWithKey(vault, sessionResult.sessionKey);
                chrome.storage.local.set({ 'bunkerpass.vault': encrypted }, () => {
                    sendResponse({ success: true });
                });
            });
        });
    }
}
