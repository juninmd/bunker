import { GoogleDriveService } from './services/google-drive.js';

const STORAGE_KEY = 'bunkerpass.vault.v1';
const SALT_KEY = 'bunkerpass.salt.v1';
const VAULT_SCHEMA_VERSION = 1;

const unlockSection = document.getElementById('unlock-section');
const vaultSection = document.getElementById('vault-section');
const statusEl = document.getElementById('status');
const unlockButton = document.getElementById('unlockButton');
const lockButton = document.getElementById('lockButton');
const syncButton = document.getElementById('syncButton');
const masterPasswordInput = document.getElementById('masterPassword');
const form = document.getElementById('credentialForm');
const credentialList = document.getElementById('credentialList');

let unlocked = false;
let activeMasterPassword = '';
let cachedVault = [];

unlockButton.addEventListener('click', handleUnlock);
lockButton.addEventListener('click', handleLock);
syncButton.addEventListener('click', handleSync);
form.addEventListener('submit', handleSaveCredential);

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
  } catch (error) {
    console.error(error);
    setStatus(`Erro na sincronização: ${error.message}`);
  }
}

async function syncVault(driveService) {
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
  const payload = {
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

function mergeVaults(local, remote) {
  const map = new Map();
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

function generateCSV(vault) {
  const headers = ['url', 'username', 'password', 'grouping', 'fav'];
  const rows = vault.map((item) => {
    const site = `"${(item.site || '').replace(/"/g, '""')}"`;
    const user = `"${(item.username || '').replace(/"/g, '""')}"`;
    const pass = `"${(item.password || '').replace(/"/g, '""')}"`;
    const extra = `""`;
    return `${site},${user},${pass},${extra},0`;
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
    unlockSection.classList.add('hidden');
    vaultSection.classList.remove('hidden');
    setStatus('Cofre desbloqueado (modo offline).');
  } catch {
    setStatus('Senha mestra inválida ou cofre corrompido.');
  }
}

function handleLock() {
  unlocked = false;
  activeMasterPassword = '';
  cachedVault = [];
  masterPasswordInput.value = '';
  credentialList.textContent = '';
  vaultSection.classList.add('hidden');
  unlockSection.classList.remove('hidden');
  setStatus('Cofre bloqueado.');
}

async function handleSaveCredential(event) {
  event.preventDefault();
  if (!unlocked) {
    setStatus('Desbloqueie o cofre antes de salvar.');
    return;
  }

  const site = normalizeSite(document.getElementById('site').value);
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

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

async function handleDeleteCredential(credentialId) {
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

async function loadVault(masterPassword) {
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

async function saveVault(masterPassword, vault) {
  const storedSalt = await getStorage(SALT_KEY);
  const salt = base64ToBytes(storedSalt);
  const payload = {
    schemaVersion: VAULT_SCHEMA_VERSION,
    credentials: vault
  };
  const encrypted = await encryptPayload(payload, masterPassword, salt);
  await setStorage(STORAGE_KEY, encrypted);
}

async function encryptPayload(vaultPayload, masterPassword, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterPassword, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(vaultPayload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

async function decryptPayload(payload, masterPassword, salt) {
  const [ivB64, cipherB64] = payload.split('.');
  const iv = base64ToBytes(ivB64);
  const cipher = base64ToBytes(cipherB64);
  const key = await deriveKey(masterPassword, salt);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

async function deriveKey(masterPassword, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(masterPassword), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250000,
      hash: 'SHA-256'
    },
    material,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

function sanitizeVault(data) {
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

function normalizeSite(siteInput) {
  const trimmed = siteInput.trim();
  if (!trimmed) {
    return '';
  }

  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  return withoutProtocol.replace(/\/+$/, '').toLowerCase();
}

function setStatus(message) {
  statusEl.textContent = message;
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function getStorage(key) {
  const api = getExtensionStorage();
  if (api) {
    const data = await api.get(key);
    return data[key];
  }
  return localStorage.getItem(key);
}

async function setStorage(key, value) {
  const api = getExtensionStorage();
  if (api) {
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
      get: (key) =>
        new Promise((resolve) => {
          chrome.storage.local.get([key], resolve);
        }),
      set: (value) =>
        new Promise((resolve) => {
          chrome.storage.local.set(value, resolve);
        })
    };
  }
  return null;
}
