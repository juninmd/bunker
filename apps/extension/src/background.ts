import { clearClipboardNow, isClipboardAlarm, scheduleClipboardClear } from './services/clipboard-guard.js';
import { dropPendingSave } from './services/pending-save.js';
import { handlePageMessage } from './services/page-messages.js';

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

// Popup and other extension pages, even when opened in a tab; content scripts report the web page URL instead.
function fromExtensionPage(sender: chrome.runtime.MessageSender): boolean {
  return sender.id === chrome.runtime.id && !!sender.url?.startsWith(chrome.runtime.getURL(''));
}

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  const handled = handlePageMessage(request, sender, sendResponse, resetAutoLock);
  if (handled !== undefined) return handled;
  if (!fromExtensionPage(sender)) return false;

  if (request.type === 'CLEAR_CLIPBOARD_LATER') scheduleClipboardClear();
  else if (request.type === 'ACTIVITY') resetAutoLock();
  sendResponse({ status: 'ACK' });
  return false;
});
