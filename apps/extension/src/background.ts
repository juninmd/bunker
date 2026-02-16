import { base64ToBytes, decryptWithKey } from './utils/crypto';

console.log('BunkerPass: Background Service Worker started');

const STORAGE_KEY = 'bunkerpass.vault.v1';

chrome.runtime.onInstalled.addListener(() => {
  console.log('BunkerPass: Extension installed');
});

chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: (response?: any) => void) => {
  if (message.type === 'GET_CREDENTIALS') {
    handleGetCredentials(message.domain, sendResponse);
    return true; // Keep channel open for async response
  }
  return false;
});

async function handleGetCredentials(domain: string, sendResponse: (response: any) => void) {
  try {
    // 1. Get session key
    // @ts-ignore
    const session = await chrome.storage.session.get('sessionKey') as any;
    if (!session || !session.sessionKey) {
      console.log('BunkerPass: Vault locked');
      sendResponse({ error: 'LOCKED' });
      return;
    }

    // 2. Import key
    const keyData = base64ToBytes(session.sessionKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData as any,
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
    const vaultData = await decryptWithKey(encryptedVault as string, key);

    // 5. Filter credentials
    const credentials = (vaultData.credentials || []).filter((cred: any) => {
        // Simple domain matching
        if (!cred.site) return false;
        // Check if domain contains the site or site contains the domain
        // Ideally we should use a proper URL parsing
        return domain.includes(cred.site) || cred.site.includes(domain);
    });

    sendResponse({ credentials });

  } catch (error: any) {
    console.error('BunkerPass: Failed to retrieve credentials', error);
    sendResponse({ error: error.message });
  }
}
