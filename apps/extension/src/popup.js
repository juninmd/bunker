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
const useLowercase = document.getElementById('useLowercase');
const useNumbers = document.getElementById('useNumbers');
const useSymbols = document.getElementById('useSymbols');
const passwordInput = document.getElementById('password');
const notesInput = document.getElementById('notes');
const passwordWrapper = document.getElementById('passwordWrapper');
const usernameInput = document.getElementById('username');
const siteInput = document.getElementById('site');

unlockButton.addEventListener('click', handleUnlock);
lockButton.addEventListener('click', handleLock);
syncButton.addEventListener('click', handleSync);
importCsvButton.addEventListener('click', handleImportCSV);
form.addEventListener('submit', handleSaveCredential);

searchInput.addEventListener('input', handleSearch);

document.querySelectorAll('input[name="itemType"]').forEach(radio => {
  radio.addEventListener('change', (e) => updateFormState(e.target.value));
});

function updateFormState(type) {
  if (type === 'note') {
    siteInput.placeholder = 'Título da Nota';
    usernameInput.style.display = 'none';
    usernameInput.removeAttribute('required');
    passwordWrapper.style.display = 'none';
    passwordInput.removeAttribute('required');
  } else {
    siteInput.placeholder = 'Site (ex: github.com)';
    usernameInput.style.display = 'block';
    usernameInput.setAttribute('required', 'true');
    passwordWrapper.style.display = 'flex'; // Assuming flex for layout
    passwordInput.setAttribute('required', 'true');
  }
}

generateBtn.addEventListener('click', () => {
  if (generatorOptions.classList.contains('hidden')) {
    generatorOptions.classList.remove('hidden');
  }
  runGenerate();
});

[lengthRange, useUppercase, useLowercase, useNumbers, useSymbols].forEach(el => {
  el.addEventListener('input', () => {
    if (el === lengthRange) lengthVal.textContent = lengthRange.value;
    saveGeneratorSettings();
    runGenerate();
  });
});

async function loadGeneratorSettings() {
  const settings = await vaultService.getStorage('generator.settings');
  if (settings) {
    if (settings.length) {
      lengthRange.value = settings.length;
      lengthVal.textContent = settings.length;
    }
    useUppercase.checked = settings.uppercase !== false;
    useLowercase.checked = settings.lowercase !== false;
    useNumbers.checked = settings.numbers !== false;
    useSymbols.checked = settings.symbols !== false;
  }
}

async function saveGeneratorSettings() {
  const settings = {
    length: lengthRange.value,
    uppercase: useUppercase.checked,
    lowercase: useLowercase.checked,
    numbers: useNumbers.checked,
    symbols: useSymbols.checked
  };
  await vaultService.setStorage('generator.settings', settings);
}

function runGenerate() {
  const options = {
    uppercase: useUppercase.checked,
    lowercase: useLowercase.checked,
    numbers: useNumbers.checked,
    symbols: useSymbols.checked
  };
  const password = generatePassword(
    parseInt(lengthRange.value, 10),
    options
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

    await loadGeneratorSettings();

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
  const type = document.querySelector('input[name="itemType"]:checked').value;
  let site = document.getElementById('site').value;
  let username = document.getElementById('username').value.trim();
  let password = document.getElementById('password').value;
  const notes = notesInput.value;

  if (type === 'password') {
    site = normalizeSite(site);
    if (!site || !username || !password) {
      setStatus('Preencha todos os campos.');
      return;
    }
  } else {
    // Secure Note
    site = site.trim(); // Title
    username = '';
    password = '';
    if (!site) {
      setStatus('Informe o título da nota.');
      return;
    }
  }

  const now = new Date().toISOString();
  const vault = vaultService.getVault();

  // Create shallow copy of array, and clone objects we modify
  const newVault = vault.map(i => ({...i}));

  // Check existence
  let existingIndex = -1;
  if (type === 'password') {
    existingIndex = newVault.findIndex(i => i.site === site && i.username === username && (!i.type || i.type === 'password'));
  } else {
    existingIndex = newVault.findIndex(i => i.site === site && i.type === 'note');
  }

  if (existingIndex >= 0) {
     if (type === 'password') newVault[existingIndex].password = password;
     newVault[existingIndex].notes = notes;
     newVault[existingIndex].updatedAt = now;
     setStatus('Item atualizado localmente.');
  } else {
    newVault.push({
      id: crypto.randomUUID(),
      type,
      site,
      username,
      password,
      notes,
      createdAt: now,
      updatedAt: now
    });
    setStatus('Item salvo localmente.');
  }

  await vaultService.save(newVault);

  // Trigger background sync
  chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });

  form.reset();
  // Reset UI state to default (Password)
  document.querySelector('input[value="password"]').checked = true;
  updateFormState('password');
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

      if (item.type === 'note') {
         siteEl.textContent = '📝 ' + item.site; // item.site holds Title for notes
      } else {
         siteEl.textContent = item.site;
      }

      const userEl = document.createElement('div');
      userEl.className = 'item-user';
      userEl.textContent = item.type === 'note' ? '(Nota Segura)' : item.username;

      if (item.notes && item.type !== 'note') { // Only show icon if it's a password with notes
        const notesIcon = document.createElement('span');
        notesIcon.textContent = ' 📄';
        notesIcon.title = item.notes;
        notesIcon.style.cursor = 'help';
        userEl.appendChild(notesIcon);
      }

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
