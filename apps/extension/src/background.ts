import { CredentialService } from './services/credential-service.js';

const AUTOLOCK_MINUTES = 15;
const SYNC_INTERVAL_MINUTES = 15;

// Alarms initialization
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('syncVault', { periodInMinutes: SYNC_INTERVAL_MINUTES });
});

chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
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

// Locking the OS screen locks the vault too.
chrome.idle?.onStateChanged.addListener((state) => {
  if (state === 'locked') lockVault();
});

// Reset autolock on any session key update (which happens on unlock)
chrome.storage.session.onChanged.addListener((changes: { [key: string]: chrome.storage.StorageChange }) => {
  if (changes.sessionKey && changes.sessionKey.newValue) {
    resetAutoLock();
  }
});

// NOSONAR: The message listener delegates action requests to CredentialService. Repeated return true structures are standard for Chrome extension async messaging.
// The page origin comes from the browser, never from the message, so a frame cannot ask for another site's secrets.
function senderHostname(sender: chrome.runtime.MessageSender): string | null {
  if (sender.id !== chrome.runtime.id || !sender.tab || !sender.url) return null;
  try {
    const url = new URL(sender.url);
    // Plain http has no origin authenticity; only loopback is exempt for local development.
    const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return url.protocol === 'https:' || (url.protocol === 'http:' && loopback) ? url.hostname : null;
  } catch {
    return null;
  }
}

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  const domain = senderHostname(sender);
  const needsDomain = ['GET_CREDENTIALS', 'CHECK_CREDENTIAL', 'SAVE_CREDENTIAL'].includes(request.type);
  if (needsDomain && !domain) {
    sendResponse({ error: 'FORBIDDEN' });
    return false;
  }

  if (request.type === 'GET_CREDENTIALS') { // NOSONAR
    CredentialService.getCredentials(domain as string, sendResponse, resetAutoLock);
    return true;
  }

  if (request.type === 'CHECK_CREDENTIAL') {
    CredentialService.checkCredential(domain as string, request.username, request.password, sendResponse, resetAutoLock);
    return true;
  }

  if (request.type === 'SAVE_CREDENTIAL') {
    CredentialService.saveCredential(domain as string, request.data, sendResponse, resetAutoLock);
    return true;
  }

  if (request.type === 'ACTIVITY' && sender.id === chrome.runtime.id && !sender.tab) {
    resetAutoLock();
    sendResponse({ status: 'ACK' });
    return false;
  }

  if (request.type === 'GET_POLICIES') {
    CredentialService.getPolicies(sendResponse);
    return true;
  }

  if (request.type === 'TRIGGER_SYNC') {
      // Typically the popup handles actual sync with GDrive
      // We just acknowledge it.
      sendResponse({ status: 'ACK' });
      return false; // synchronous
  }
});
