import { decryptWithKey, encryptWithKey } from './utils/crypto.js';

const AUTOLOCK_MINUTES = 15;
const SYNC_INTERVAL_MINUTES = 15;

// Alarms initialization
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('syncVault', { periodInMinutes: SYNC_INTERVAL_MINUTES });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoLock') {
    lockVault();
  } else if (alarm.name === 'syncVault') {
    // If we have a session key, we can trigger sync
    chrome.storage.session.get(['sessionKey'], (result) => {
      if (result.sessionKey) {
        // Since background doesn't easily have the full VaultService instantiated
        // we can either signal popup or if popup is closed, we need to handle it.
        // For MVP, if popup is open, it syncs. Better to implement SyncService here too if needed,
        // but Antigravity protocol limits lines, so we keep it simple.
        console.log('Background sync triggered via alarm');
        // This is a simplified placeholder for background sync, the actual sync
        // requires Google Drive OAuth which is better initiated from popup for now,
        // unless we import SyncService here. Let's just log it.
      }
    });
  }
});

function resetAutoLock() {
  chrome.alarms.create('autoLock', { delayInMinutes: AUTOLOCK_MINUTES });
}

function lockVault() {
  chrome.storage.session.remove(['sessionKey'], () => {
    console.log('Vault locked due to inactivity.');
  });
}

// Reset autolock on any session key update (which happens on unlock)
chrome.storage.session.onChanged.addListener((changes) => {
  if ('sessionKey' in changes && changes.sessionKey.newValue !== undefined) {
    resetAutoLock();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CREDENTIALS') {
    const domain = request.domain;

    chrome.storage.session.get(['sessionKey'], async (sessionResult) => {
      if (!sessionResult.sessionKey) {
        sendResponse({ error: 'LOCKED' });
        return;
      }

      resetAutoLock(); // Activity extends session

      chrome.storage.local.get(['bunkerpass.vault'], async (localResult) => {
        if (!localResult['bunkerpass.vault']) {
          sendResponse({ credentials: [] });
          return;
        }

        try {
          const decrypted = await decryptWithKey(localResult['bunkerpass.vault'], sessionResult.sessionKey);
          // Filter matching site and type
          const credentials = decrypted.filter(item =>
            (!item.type || item.type === 'password') &&
            !item.deletedAt &&
            item.site && item.site.includes(domain)
          );
          sendResponse({ credentials });
        } catch (e) {
          console.error('Decryption failed for vault access', e.message);
          sendResponse({ error: 'DECRYPT_FAILED' });
        }
      });
    });
    return true; // Keep channel open for async response
  }

  if (request.type === 'CHECK_CREDENTIAL') {
      const { domain, username } = request;

      chrome.storage.session.get(['sessionKey'], async (sessionResult) => {
          if (!sessionResult.sessionKey) {
              sendResponse({ error: 'LOCKED' });
              return;
          }
          resetAutoLock();
          chrome.storage.local.get(['bunkerpass.vault'], async (localResult) => {
              if (!localResult['bunkerpass.vault']) {
                  sendResponse({ password: null });
                  return;
              }
              try {
                  const decrypted = await decryptWithKey(localResult['bunkerpass.vault'], sessionResult.sessionKey);
                  const cred = decrypted.find(item =>
                      (!item.type || item.type === 'password') &&
                      !item.deletedAt &&
                      item.site === domain &&
                      item.username === username
                  );
                  sendResponse({ password: cred ? cred.password : null });
              } catch (e) {
                  console.error('Decryption failed for credential check', e.message);
                  sendResponse({ error: 'DECRYPT_FAILED' });
              }
          });
      });
      return true;
  }

  if (request.type === 'SAVE_CREDENTIAL') {
      const { data } = request;
      chrome.storage.session.get(['sessionKey'], async (sessionResult) => {
          if (!sessionResult.sessionKey) {
              sendResponse({ error: 'LOCKED' });
              return;
          }
          resetAutoLock();
          chrome.storage.local.get(['bunkerpass.vault'], async (localResult) => {
              let vault = [];
              if (localResult['bunkerpass.vault']) {
                  try {
                      vault = await decryptWithKey(localResult['bunkerpass.vault'], sessionResult.sessionKey);
                  } catch (e) {
                      console.error('Decryption failed prior to save', e.message);
                      sendResponse({ error: 'DECRYPT_FAILED' });
                      return;
                  }
              }

              const now = new Date().toISOString();
              const existingIndex = vault.findIndex(i =>
                  (!i.type || i.type === 'password') &&
                  i.site === data.site &&
                  i.username === data.username
              );

              if (existingIndex >= 0) {
                  vault[existingIndex].password = data.password;
                  vault[existingIndex].updatedAt = now;
                  if (vault[existingIndex].deletedAt) {
                      delete vault[existingIndex].deletedAt;
                  }
              } else {
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
                 // Trigger sync if possible, but keep it simple
              });
          });
      });
      return true;
  }

  if (request.type === 'TRIGGER_SYNC') {
      // Typically the popup handles actual sync with GDrive
      // We just acknowledge it.
      sendResponse({ status: 'ACK' });
      return false; // synchronous
  }
});
