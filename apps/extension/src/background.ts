import { CredentialService } from './services/credential-service.js';
import { clearClipboardNow, isClipboardAlarm, scheduleClipboardClear } from './services/clipboard-guard.js';
import { dropPendingSave, holdPendingSave, resolvePendingSave, settledOffer, takePendingSave, trackOffer } from './services/pending-save.js';

const AUTOLOCK_MINUTES = 15;
const SYNC_INTERVAL_MINUTES = 15;

// Alarms initialization
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('syncVault', { periodInMinutes: SYNC_INTERVAL_MINUTES });
});

chrome.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
  if (alarm.name === 'autoLock') {
    lockVault();
  } else if (isClipboardAlarm(alarm)) {
    clearClipboardNow().catch(e => console.error('Clipboard clear failed', e));
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

chrome.tabs.onRemoved.addListener(dropPendingSave);

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

// Popup and other extension pages, even when opened in a tab; content scripts report the web page URL instead.
function fromExtensionPage(sender: chrome.runtime.MessageSender): boolean {
  return sender.id === chrome.runtime.id && !!sender.url?.startsWith(chrome.runtime.getURL(''));
}

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  const domain = senderHostname(sender);
  const needsDomain = ['GET_CREDENTIALS', 'CHECK_CREDENTIAL', 'SAVE_CREDENTIAL', 'OFFER_SAVE', 'TAKE_PENDING_SAVE', 'RESOLVE_PENDING_SAVE'].includes(request.type);
  const tabId = sender.id === chrome.runtime.id ? sender.tab?.id : undefined;
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

  if (request.type === 'OFFER_SAVE' && tabId !== undefined) {
    trackOffer(tabId, new Promise<void>(done => CredentialService.checkCredential(domain as string, request.username, request.password, check => {
      const offer = !check.error && !check.same;
      if (offer) holdPendingSave(tabId, domain as string, String(request.username), String(request.password), check.stored);
      sendResponse({ pending: offer });
      done();
    }, resetAutoLock)));
    return true;
  }

  if (request.type === 'TAKE_PENDING_SAVE' && tabId !== undefined) {
    settledOffer(tabId).then(() => sendResponse({ offer: takePendingSave(tabId, domain as string) }));
    return true;
  }

  if (request.type === 'RESOLVE_PENDING_SAVE' && tabId !== undefined) {
    const entry = resolvePendingSave(tabId, domain as string);
    if (!request.accept || !entry) {
      sendResponse({ status: 'ACK' });
      return false;
    }
    CredentialService.saveCredential(entry.host, { username: entry.username, password: entry.password }, sendResponse, resetAutoLock);
    return true;
  }

  if (request.type === 'CLEAR_CLIPBOARD_LATER' && fromExtensionPage(sender)) {
    scheduleClipboardClear();
    sendResponse({ status: 'ACK' });
    return false;
  }

  if (request.type === 'ACTIVITY' && fromExtensionPage(sender)) {
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
