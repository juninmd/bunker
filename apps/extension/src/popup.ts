import { GoogleDriveService } from './services/google-drive';
import { encryptPayload, decryptPayload, deriveKey, bytesToBase64, base64ToBytes } from './utils/crypto';

declare const browser: any;

const STORAGE_KEY = 'bunkerpass.vault.v1';
const SALT_KEY = 'bunkerpass.salt.v1';
const LAST_SYNC_KEY = 'bunkerpass.last_sync';
const VAULT_SCHEMA_VERSION = 1;

const unlockSection = document.getElementById('unlock-section') as HTMLElement;
const vaultSection = document.getElementById('vault-section') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const unlockButton = document.getElementById('unlockButton') as HTMLButtonElement;
const lockButton = document.getElementById('lockButton') as HTMLButtonElement;
const syncButton = document.getElementById('syncButton') as HTMLButtonElement;
const masterPasswordInput = document.getElementById('masterPassword') as HTMLInputElement;
const form = document.getElementById('credentialForm') as HTMLFormElement;
const credentialList = document.getElementById('credentialList') as HTMLElement;
const lastSyncEl = document.getElementById('last-sync') as HTMLElement;

interface VaultItem {
  id: string;
  site: string;
  username: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

interface VaultPayload {
  schemaVersion: number;
  credentials: VaultItem[];
}

let unlocked = false;
let activeMasterPassword = '';
let cachedVault: VaultItem[] = [];

if (unlockButton) {
  unlockButton.addEventListener('click', handleUnlock);
}

if (masterPasswordInput) {
  masterPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });
}

if (lockButton) {
  lockButton.addEventListener('click', handleLock);
}

if (form) {
  form.addEventListener('submit', handleSaveCredential);
}

if (syncButton) {
  syncButton.addEventListener('click', handleSync);
}

// Check if vault is already present
getStorage(STORAGE_KEY).then((data: any) => {
  if (data) {
    setStatus('Cofre encontrado. Insira a senha mestra.');
  } else {
    setStatus('Novo cofre será criado com a senha informada.');
  }
});

async function handleSync() {
  if (!unlocked) {
    setStatus('Desbloqueie o cofre antes de sincronizar.');
    return;
  }

  setStatus('Iniciando sincronização...');
  try {
    const driveService = new GoogleDriveService();
    await driveService.authorize();
    await syncVault(driveService);

    const now = new Date().toLocaleString();
    if (lastSyncEl) lastSyncEl.textContent = `Última sincronização: ${now}`;
    await setStorage(LAST_SYNC_KEY, now);
  } catch (error: any) {
    console.error(error);
    setStatus(`Erro na sincronização: ${error.message}`);
  }
}

async function syncVault(driveService: GoogleDriveService) {
  setStatus('Verificando cofre no Google Drive...');
  const vaultFile = await driveService.findFile('vault.enc');
  let mergedVault = [...cachedVault];

  const storedSalt = await getStorage(SALT_KEY);
  const salt = base64ToBytes(storedSalt);

  if (vaultFile) {
    setStatus('Cofre remoto encontrado. Baixando...');
    try {
      const remoteContent = await driveService.getFileContent(vaultFile.id);
      const remoteVaultData = await decryptPayload(remoteContent, activeMasterPassword, salt);
      const remoteCredentials = sanitizeVault(remoteVaultData);
      mergedVault = mergeVaults(cachedVault, remoteCredentials);
      setStatus('Cofre mesclado. Atualizando remoto...');
    } catch (e) {
      console.error('Falha ao processar remoto', e);
      setStatus('Falha na criptografia/sync. Verifique a senha.');
      return;
    }
  } else {
    setStatus('Cofre remoto não encontrado. Criando...');
  }

  // 1. Encrypt and Upload Vault
  const payload: VaultPayload = {
    schemaVersion: VAULT_SCHEMA_VERSION,
    credentials: mergedVault
  };
  const encrypted = await encryptPayload(payload, activeMasterPassword, salt);

  if (vaultFile) {
    await driveService.updateFile(vaultFile.id, encrypted, 'text/plain');
  } else {
    await driveService.createFile('vault.enc', encrypted, 'text/plain');
  }

  // 2. Generate and Upload CSV (Plain text for user visibility as requested)
  const csvContent = generateCSV(mergedVault);
  const csvFile = await driveService.findFile('passwords.csv');

  if (csvFile) {
    await driveService.updateFile(csvFile.id, csvContent, 'text/csv');
  } else {
    await driveService.createFile('passwords.csv', csvContent, 'text/csv');
  }

  // 3. Update Local
  cachedVault = mergedVault;
  await saveVault(activeMasterPassword, cachedVault);
  renderVault();
  setStatus('Sincronização concluída!');
}

function mergeVaults(local: VaultItem[], remote: VaultItem[]): VaultItem[] {
  const map = new Map<string, VaultItem>();
  local.forEach((item) => map.set(item.id, item));

  remote.forEach((remoteItem) => {
    const localItem = map.get(remoteItem.id);
    if (!localItem) {
      map.set(remoteItem.id, remoteItem);
    } else {
      const localDate = new Date(localItem.updatedAt).getTime();
      const remoteDate = new Date(remoteItem.updatedAt).getTime();
      if (remoteDate > localDate) {
        map.set(remoteItem.id, remoteItem);
      }
    }
  });

  return Array.from(map.values());
}

function generateCSV(vault: VaultItem[]) {
  // LastPass CSV format: url,username,password,extra,name,grouping,fav
  const headers = ['url', 'username', 'password', 'extra', 'name', 'grouping', 'fav'];
  const rows = vault.map((item) => {
    const url = `"${(item.site || '').replace(/"/g, '""')}"`;
    const user = `"${(item.username || '').replace(/"/g, '""')}"`;
    const pass = `"${(item.password || '').replace(/"/g, '""')}"`;
    const extra = `""`;
    const name = `"${(item.site || '').replace(/"/g, '""')}"`; // Use site as name for now
    const grouping = `""`;
    const fav = `0`;
    return `${url},${user},${pass},${extra},${name},${grouping},${fav}`;
  });
  return [headers.join(','), ...rows].join('\n');
}

async function handleUnlock() {
  const masterPassword = masterPasswordInput.value.trim();
  if (!masterPassword) {
    setStatus('Informe a senha mestra.');
    return;
  }

  try {
    const vault = await loadVault(masterPassword);
    activeMasterPassword = masterPassword;
    cachedVault = vault;
    unlocked = true;
    renderVault();

    const lastSync = await getStorage(LAST_SYNC_KEY);
    if (lastSync && lastSyncEl) {
      lastSyncEl.textContent = `Última sincronização: ${lastSync}`;
    }

    // Store session key for background script
    const storedSalt = await getStorage(SALT_KEY);
    if (storedSalt) {
      const salt = base64ToBytes(storedSalt);
      const key = await deriveKey(masterPassword, salt);
      const exported = await crypto.subtle.exportKey('raw', key);
      await chrome.storage.session.set({ sessionKey: bytesToBase64(new Uint8Array(exported)) });
    }

    unlockSection.classList.add('hidden');
    vaultSection.classList.remove('hidden');
    setStatus('Cofre desbloqueado (modo offline).');
  } catch (e) {
    console.error(e);
    setStatus('Senha mestra inválida ou cofre corrompido.');
  }
}

function handleLock() {
  unlocked = false;
  activeMasterPassword = '';
  cachedVault = [];
  masterPasswordInput.value = '';
  credentialList.textContent = '';
  chrome.storage.session.remove('sessionKey');
  vaultSection.classList.add('hidden');
  unlockSection.classList.remove('hidden');
  setStatus('Cofre bloqueado.');
  if (lastSyncEl) lastSyncEl.textContent = '';
}

async function handleSaveCredential(event: Event) {
  event.preventDefault();
  if (!unlocked) {
    setStatus('Desbloqueie o cofre antes de salvar.');
    return;
  }

  const siteInput = document.getElementById('site') as HTMLInputElement;
  const usernameInput = document.getElementById('username') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;

  const site = normalizeSite(siteInput.value);
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!site || !username || !password) {
    setStatus('Preencha todos os campos.');
    return;
  }

  const now = new Date().toISOString();
  cachedVault.push({
    id: crypto.randomUUID(),
    site,
    username,
    password,
    createdAt: now,
    updatedAt: now
  });

  await saveVault(activeMasterPassword, cachedVault);
  form.reset();
  renderVault();
  setStatus('Credencial salva localmente e criptografada.');
}

async function handleDeleteCredential(credentialId: string) {
  if (!unlocked) {
    setStatus('Desbloqueie o cofre antes de remover.');
    return;
  }

  cachedVault = cachedVault.filter((item) => item.id !== credentialId);
  await saveVault(activeMasterPassword, cachedVault);
  renderVault();
  setStatus('Credencial removida.');
}

function renderVault() {
  credentialList.textContent = '';
  if (!cachedVault.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Nenhuma credencial cadastrada.';
    credentialList.append(emptyItem);
    return;
  }

  cachedVault
    .slice()
    .sort((a, b) => a.site.localeCompare(b.site))
    .forEach((item) => {
      const li = document.createElement('li');

      const siteEl = document.createElement('div');
      siteEl.className = 'item-site';
      siteEl.textContent = item.site;

      const userEl = document.createElement('div');
      userEl.className = 'item-user';
      userEl.textContent = item.username;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'danger';
      removeButton.textContent = 'Remover';
      removeButton.addEventListener('click', () => {
        handleDeleteCredential(item.id);
      });

      li.append(siteEl, userEl, removeButton);
      credentialList.append(li);
    });
}

async function loadVault(masterPassword: string): Promise<VaultItem[]> {
  const storedSalt = await getStorage(SALT_KEY);
  const salt = storedSalt ? base64ToBytes(storedSalt) : crypto.getRandomValues(new Uint8Array(16));

  if (!storedSalt) {
    await setStorage(SALT_KEY, bytesToBase64(salt));
  }

  const encrypted = await getStorage(STORAGE_KEY);

  if (!encrypted) {
    await saveVault(masterPassword, []);
    return [];
  }

  const data = await decryptPayload(encrypted, masterPassword, salt);
  return sanitizeVault(data);
}

async function saveVault(masterPassword: string, vault: VaultItem[]) {
  const storedSalt = await getStorage(SALT_KEY);
  const salt = base64ToBytes(storedSalt);
  const payload: VaultPayload = {
    schemaVersion: VAULT_SCHEMA_VERSION,
    credentials: vault
  };
  const encrypted = await encryptPayload(payload, masterPassword, salt);
  await setStorage(STORAGE_KEY, encrypted);
}

function sanitizeVault(data: any): VaultItem[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.credentials)) {
    return data.credentials;
  }

  return [];
}

function normalizeSite(siteInput: string) {
  const trimmed = siteInput.trim();
  if (!trimmed) {
    return '';
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  return withoutProtocol.replace(/\/+$/, '').toLowerCase();
}

function setStatus(message: string) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

async function getStorage(key: string) {
  const api = getExtensionStorage();
  if (api) {
    // @ts-ignore
    const data = await api.get(key);
    // @ts-ignore
    return data[key];
  }
  return localStorage.getItem(key);
}

async function setStorage(key: string, value: any) {
  const api = getExtensionStorage();
  if (api) {
    // @ts-ignore
    await api.set({ [key]: value });
    return;
  }
  localStorage.setItem(key, value);
}

function getExtensionStorage() {
  if (typeof browser !== 'undefined' && browser.storage?.local) {
    return browser.storage.local;
  }
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return {
      get: (key: string) =>
        new Promise((resolve) => {
          chrome.storage.local.get([key], resolve);
        }),
      set: (value: any) =>
        new Promise<void>((resolve) => {
          chrome.storage.local.set(value, () => resolve());
        })
    };
  }
  return null;
}
