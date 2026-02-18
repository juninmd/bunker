import { base64ToBytes, decryptWithKey, encryptWithKey } from './utils/crypto.js';

console.log('BunkerPass: Background Service Worker started');

const STORAGE_KEY = 'bunkerpass.vault.v1';

chrome.runtime.onInstalled.addListener(() => {
  console.log('BunkerPass: Extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CREDENTIALS') {
    handleGetCredentials(message.domain, sendResponse);
    return true; // Keep channel open for async response
  }
  if (message.type === 'SAVE_CREDENTIAL') {
    handleSaveCredential(message.data, sendResponse);
    return true;
  }
});

async function handleGetCredentials(domain, sendResponse) {
  try {
    // 1. Get session key
    const session = await chrome.storage.session.get('sessionKey');
    if (!session || !session.sessionKey) {
      console.log('BunkerPass: Vault locked');
      sendResponse({ error: 'LOCKED' });
      return;
    }

    // 2. Import key
    const keyData = base64ToBytes(session.sessionKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 3. Get encrypted vault
    const local = await chrome.storage.local.get(STORAGE_KEY);
    const encryptedVault = local[STORAGE_KEY];

    if (!encryptedVault) {
      sendResponse({ credentials: [] });
      return;
    }

    // 4. Decrypt vault using session key
    const vaultData = await decryptWithKey(encryptedVault, key);

    // 5. Filter credentials
    const credentials = (vaultData.credentials || []).filter(cred => {
        // Simple domain matching
        if (!cred.site) return false;
        // Check if domain contains the site or site contains the domain
        // Ideally we should use a proper URL parsing
        return domain.includes(cred.site) || cred.site.includes(domain);
    });

    sendResponse({ credentials });

  } catch (error) {
    console.error('BunkerPass: Failed to retrieve credentials', error);
    sendResponse({ error: error.message });
  }
}

async function handleSaveCredential(data, sendResponse) {
  try {
    const { site, username, password } = data;
    if (!site || !username || !password) {
      throw new Error('Missing required fields');
    }

    // 1. Get session key
    const session = await chrome.storage.session.get('sessionKey');
    if (!session || !session.sessionKey) {
      console.log('BunkerPass: Vault locked (cannot save)');
      sendResponse({ error: 'LOCKED' });
      return;
    }

    // 2. Import key
    const keyData = base64ToBytes(session.sessionKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 3. Get encrypted vault
    const local = await chrome.storage.local.get(STORAGE_KEY);
    const encryptedVault = local[STORAGE_KEY];

    let vaultData = { schemaVersion: 1, credentials: [] };
    if (encryptedVault) {
      try {
        vaultData = await decryptWithKey(encryptedVault, key);
      } catch (e) {
        console.error('Failed to decrypt vault for saving', e);
        // If we can't decrypt, we shouldn't overwrite, because we might lose data.
        // But if it's corrupted, maybe we should? For now, fail safe.
        throw new Error('Failed to decrypt vault');
      }
    }

    if (!vaultData.credentials) vaultData.credentials = [];

    // 4. Update or Add Credential
    const now = new Date().toISOString();
    // Check if credential exists
    const existingIndex = vaultData.credentials.findIndex(
        c => c.site === site && c.username === username
    );

    if (existingIndex >= 0) {
        vaultData.credentials[existingIndex].password = password;
        vaultData.credentials[existingIndex].updatedAt = now;
        console.log('BunkerPass: Updated existing credential for', site);
    } else {
        vaultData.credentials.push({
            id: crypto.randomUUID(),
            site,
            username,
            password,
            createdAt: now,
            updatedAt: now
        });
        console.log('BunkerPass: Added new credential for', site);
    }

    // 5. Encrypt and Save
    const newEncrypted = await encryptWithKey(vaultData, key);
    await chrome.storage.local.set({ [STORAGE_KEY]: newEncrypted });

    sendResponse({ success: true });

  } catch (error) {
    console.error('BunkerPass: Failed to save credential', error);
    sendResponse({ error: error.message });
  }
}
