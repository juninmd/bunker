import { VaultService } from './services/vault-service.js';
import { SyncService } from './services/sync-service.js';
import { generatePassword } from './utils/password-generator.js';

const vaultService = new VaultService();
const syncService = new SyncService(vaultService);

const unlockSection = document.getElementById('unlock-section');
const vaultSection = document.getElementById('vault-section');
const statusEl = document.getElementById('status');
const unlockButton = document.getElementById('unlockButton');
const lockButton = document.getElementById('lockButton');
const syncButton = document.getElementById('syncButton');
const importCsvButton = document.getElementById('importCsvButton');
const lastSyncEl = document.getElementById('last-sync');
const masterPasswordInput = document.getElementById('masterPassword');
const form = document.getElementById('credentialForm');
const credentialList = document.getElementById('credentialList');
const searchInput = document.getElementById('searchInput');

const generateBtn = document.getElementById('generateBtn');
const generatorOptions = document.getElementById('generatorOptions');
const lengthRange = document.getElementById('lengthRange');
const lengthVal = document.getElementById('lengthVal');
const useUppercase = document.getElementById('useUppercase');
const useNumbers = document.getElementById('useNumbers');
const useSymbols = document.getElementById('useSymbols');
const passwordInput = document.getElementById('password');

unlockButton.addEventListener('click', handleUnlock);
lockButton.addEventListener('click', handleLock);
syncButton.addEventListener('click', handleSync);
importCsvButton.addEventListener('click', handleImportCSV);
form.addEventListener('submit', handleSaveCredential);

searchInput.addEventListener('input', handleSearch);

generateBtn.addEventListener('click', () => {
  if (generatorOptions.classList.contains('hidden')) {
    generatorOptions.classList.remove('hidden');
  }
  runGenerate();
});

[lengthRange, useUppercase, useNumbers, useSymbols].forEach(el => {
  el.addEventListener('input', () => {
    if (el === lengthRange) lengthVal.textContent = lengthRange.value;
    runGenerate();
  });
});

function runGenerate() {
  const password = generatePassword(
    parseInt(lengthRange.value, 10),
    useUppercase.checked,
    useNumbers.checked,
    useSymbols.checked
  );
  passwordInput.value = password;
  passwordInput.dispatchEvent(new Event('input'));
}

function handleSearch() {
  const query = searchInput.value.trim().toLowerCase();
  const vault = vaultService.getVault();

  if (!query) {
    renderVault(vault);
    return;
  }

  const filtered = vault.filter((item) =>
    (item.site || '').toLowerCase().includes(query) ||
    (item.username || '').toLowerCase().includes(query)
  );
  renderVault(filtered);
}

async function handleUnlock() {
  const masterPassword = masterPasswordInput.value.trim();
  if (!masterPassword) {
    setStatus('Informe a senha mestra.');
    return;
  }

  try {
    await vaultService.unlock(masterPassword);
    handleSearch();

    try {
        await vaultService.exportSessionKey();
    } catch (e) {
        console.warn('Failed to export session key', e);
    }

    const lastSync = await vaultService.getStorage('bunkerpass.last_sync');
    if (lastSync) {
      lastSyncEl.textContent = `Última sincronização: ${lastSync}`;
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
  vaultService.lock();
  masterPasswordInput.value = '';
  credentialList.textContent = '';
  vaultSection.classList.add('hidden');
  unlockSection.classList.remove('hidden');
  setStatus('Cofre bloqueado.');
  lastSyncEl.textContent = '';
}

async function handleSync() {
  setStatus('Iniciando sincronização...');
  try {
    const { stats } = await syncService.sync();
    handleSearch();

    const now = new Date().toLocaleString();
    lastSyncEl.textContent = `Última sincronização: ${now}`;
    await vaultService.setStorage('bunkerpass.last_sync', now);

    if (stats.added > 0 || stats.updated > 0) {
      setStatus(`Sincronização: +${stats.added} novos, ^${stats.updated} atualizados.`);
    } else {
      setStatus('Sincronização concluída (sem alterações remotas).');
    }
  } catch (error) {
    console.error(error);
    setStatus(`Erro na sincronização: ${error.message}`);
  }
}

async function handleImportCSV() {
  setStatus('Buscando passwords.csv no Drive...');
  try {
    const result = await syncService.importCSV();
    handleSearch();
    setStatus(`Importação concluída: ${result.added} adicionados, ${result.updated} atualizados.`);
  } catch (error) {
    console.error(error);
    setStatus(`Erro na importação: ${error.message}`);
  }
}

async function handleSaveCredential(event) {
  event.preventDefault();
  const site = normalizeSite(document.getElementById('site').value);
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!site || !username || !password) {
    setStatus('Preencha todos os campos.');
    return;
  }

  const now = new Date().toISOString();
  const vault = vaultService.getVault();

  // Create shallow copy of array, and clone objects we modify
  const newVault = vault.map(i => ({...i}));

  const existingIndex = newVault.findIndex(i => i.site === site && i.username === username);

  if (existingIndex >= 0) {
     newVault[existingIndex].password = password;
     newVault[existingIndex].updatedAt = now;
     setStatus('Credencial atualizada localmente.');
  } else {
    newVault.push({
      id: crypto.randomUUID(),
      site,
      username,
      password,
      createdAt: now,
      updatedAt: now
    });
    setStatus('Credencial salva localmente.');
  }

  await vaultService.save(newVault);

  // Trigger background sync
  chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });

  form.reset();
  handleSearch();
}

async function handleDeleteCredential(credentialId) {
  const vault = vaultService.getVault();
  const newVault = vault.filter((item) => item.id !== credentialId);
  await vaultService.save(newVault);
  handleSearch();
  setStatus('Credencial removida.');
}

function renderVault(vault) {
  credentialList.textContent = '';
  if (!vault || !vault.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Nenhuma credencial cadastrada.';
    credentialList.append(emptyItem);
    return;
  }

  // Sort by site
  vault
    .slice()
    .sort((a, b) => (a.site || '').localeCompare(b.site || ''))
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
