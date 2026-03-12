import { VaultService } from './services/vault-service.js';
import { SyncService } from './services/sync-service.js';
import { base64ToBytes } from './utils/crypto.js';

console.log('BunkerPass: Background Service Worker started');

const vaultService = new VaultService();
const syncService = new SyncService(vaultService);

chrome.runtime.onInstalled.addListener(() => {
  console.log('BunkerPass: Extension installed');
  chrome.alarms.create('autoSync', { periodInMinutes: 15 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'autoSync') {
    await performAutoSync();
  }
  if (alarm.name === 'autoLock') {
    await performAutoLock();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'session' && changes.sessionKey) {
    if (changes.sessionKey.newValue) {
      // Session key was added or changed, set auto-lock alarm
      resetAutoLockTimer();
    } else {
      // Session key removed (locked), clear alarm
      chrome.alarms.clear('autoLock');
    }
  }
});

function resetAutoLockTimer() {
  // Lock after 15 minutes of inactivity
  chrome.alarms.create('autoLock', { delayInMinutes: 15 });
}

async function performAutoLock() {
  console.log('BunkerPass: Auto-locking vault due to inactivity');
  await chrome.storage.session.remove('sessionKey');
}

async function performAutoSync() {
    try {
        const session = await chrome.storage.session.get('sessionKey');
        if (!session || !session.sessionKey) return; // Locked

        const keyBytes = base64ToBytes(session.sessionKey);
        await vaultService.unlockWithSessionKey(keyBytes);
        await syncService.sync();
        console.log('BunkerPass: Auto-sync completed');
    } catch (e) {
        console.error('BunkerPass: Auto-sync failed', e);
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CREDENTIALS') {
    resetAutoLockIfUnlocked();
    handleGetCredentials(message.domain).then(sendResponse);
    return true;
  }
  if (message.type === 'CHECK_CREDENTIAL') {
    resetAutoLockIfUnlocked();
    handleCheckCredential(message.domain, message.username).then(sendResponse);
    return true;
  }
  if (message.type === 'SAVE_CREDENTIAL') {
    resetAutoLockIfUnlocked();
    handleSaveCredential(message.data).then(sendResponse);
    return true;
  }
  if (message.type === 'TRIGGER_SYNC') {
      performAutoSync().then(() => sendResponse({success: true})).catch(e => sendResponse({error: e.message}));
      return true;
  }
});

async function resetAutoLockIfUnlocked() {
  const session = await chrome.storage.session.get('sessionKey');
  if (session && session.sessionKey) {
    resetAutoLockTimer();
  }
}

async function handleGetCredentials(domain) {
    try {
        const session = await chrome.storage.session.get('sessionKey');
        if (!session || !session.sessionKey) return { error: 'LOCKED' };

        const keyBytes = base64ToBytes(session.sessionKey);
        await vaultService.unlockWithSessionKey(keyBytes);
        const vault = vaultService.getVault();

        const credentials = vault.filter(cred => {
            if (!cred.site) return false;
            // Simple domain matching
            return domain.includes(cred.site) || cred.site.includes(domain);
        });
        return { credentials };
    } catch (e) {
        return { error: e.message };
    }
}

async function handleCheckCredential(domain, username) {
    try {
        const session = await chrome.storage.session.get('sessionKey');
        if (!session || !session.sessionKey) return { error: 'LOCKED' };

        const keyBytes = base64ToBytes(session.sessionKey);
        await vaultService.unlockWithSessionKey(keyBytes);
        const vault = vaultService.getVault();

        const credential = vault.find(cred => {
            if (!cred.site) return false;
            return (domain.includes(cred.site) || cred.site.includes(domain)) && cred.username === username;
        });

        if (credential) {
            return { password: credential.password };
        }
        return { password: null };
    } catch (e) {
        return { error: e.message };
    }
}

async function handleSaveCredential(data) {
    try {
        const { site, username, password } = data;
        const session = await chrome.storage.session.get('sessionKey');
        if (!session || !session.sessionKey) return { error: 'LOCKED' };

        const keyBytes = base64ToBytes(session.sessionKey);
        await vaultService.unlockWithSessionKey(keyBytes);

        // Use vaultService to modify and save
        const vault = vaultService.getVault();
        const newVault = vault.map(i => ({...i}));

        const now = new Date().toISOString();
        const existingIndex = newVault.findIndex(c => c.site === site && c.username === username);

        if (existingIndex >= 0) {
            newVault[existingIndex].password = password;
            newVault[existingIndex].updatedAt = now;
        } else {
            newVault.push({
                id: crypto.randomUUID(),
                site, username, password, createdAt: now, updatedAt: now
            });
        }

        await vaultService.save(newVault);

        // Trigger sync immediately (best effort)
        performAutoSync();

        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}
