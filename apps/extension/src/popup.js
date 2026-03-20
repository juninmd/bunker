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
const credentialIdInput = document.getElementById('credentialId');
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
const folderInput = document.getElementById('folder');
const folderDatalist = document.getElementById('folderOptions');
const submitButton = form.querySelector('button[type="submit"]');

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

  // Update folder datalist
  updateFolderOptions(vault);

  if (!query) {
    renderVault(vault);
    return;
  }

  const filtered = vault.filter((item) =>
    (item.site || '').toLowerCase().includes(query) ||
    (item.username || '').toLowerCase().includes(query) ||
    (item.grouping || '').toLowerCase().includes(query)
  );
  renderVault(filtered);
}

function updateFolderOptions(vault) {
  const folders = new Set();
  vault.forEach(item => {
    if (item.grouping && item.grouping !== 'Deleted') {
      folders.add(item.grouping);
    }
  });

  folderDatalist.innerHTML = '';
  Array.from(folders).sort().forEach(folderName => {
    const option = document.createElement('option');
    option.value = folderName;
    folderDatalist.appendChild(option);
  });
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
  const folder = folderInput.value.trim();
  const notes = notesInput.value;
  const credentialId = credentialIdInput.value;

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

  let existingIndex = -1;

  if (credentialId) {
    // Updating existing by ID
    existingIndex = newVault.findIndex(i => i.id === credentialId);
  } else {
    // Creating new - check duplicates to prevent double entry
    if (type === 'password') {
        existingIndex = newVault.findIndex(i => i.site === site && i.username === username && (!i.type || i.type === 'password'));
    } else {
        existingIndex = newVault.findIndex(i => i.site === site && i.type === 'note');
    }
  }

  if (existingIndex >= 0) {
     const item = newVault[existingIndex];
     item.site = site;
     item.username = username;
     item.password = password;
     item.notes = notes;
     item.grouping = folder;
     item.type = type; // Ensure type is updated if changed (though UI restricts switching type on edit usually)
     item.updatedAt = now;

     // Resurrect if it was deleted
     if (item.deletedAt) {
       delete item.deletedAt;
       setStatus('Item restaurado e atualizado localmente.');
     } else {
       setStatus('Item atualizado localmente.');
     }
  } else {
    newVault.push({
      id: crypto.randomUUID(),
      type,
      site,
      username,
      password,
      notes,
      grouping: folder,
      createdAt: now,
      updatedAt: now
    });
    setStatus('Item salvo localmente.');
  }

  await vaultService.save(newVault);

  // Trigger background sync
  chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });

  form.reset();
  credentialIdInput.value = '';
  submitButton.textContent = 'Salvar';

  // Reset UI state to default (Password)
  document.querySelector('input[value="password"]').checked = true;
  updateFormState('password');
  handleSearch();
}

function handleEditCredential(id) {
    const vault = vaultService.getVault();
    const item = vault.find(i => i.id === id);
    if (!item) return;

    credentialIdInput.value = item.id;
    siteInput.value = item.site;
    notesInput.value = item.notes || '';
    folderInput.value = item.grouping || '';

    // Determine type
    const type = item.type || 'password';
    document.querySelector(`input[name="itemType"][value="${type}"]`).checked = true;
    updateFormState(type);

    if (type === 'password') {
        usernameInput.value = item.username;
        passwordInput.value = item.password;
    }

    submitButton.textContent = 'Atualizar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStatus(`Editando: ${item.site}`);
}

async function handleDeleteCredential(credentialId) {
  const vault = vaultService.getVault();
  // Soft delete: mark as deleted instead of removing
  const newVault = vault.map((item) => {
    if (item.id === credentialId) {
      return {
        ...item,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    return item;
  });
  await vaultService.save(newVault);
  // Trigger background sync to propagate deletion
  chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });

  handleSearch();
  setStatus('Credencial removida.');
}

function renderVault(vault) {
  credentialList.textContent = '';
  // Filter out soft-deleted items
  const visibleVault = vault.filter(item => !item.deletedAt);

  if (!visibleVault || !visibleVault.length) {
    const emptyItem = document.createElement('li');
    emptyItem.textContent = 'Nenhuma credencial cadastrada.';
    credentialList.append(emptyItem);
    return;
  }

  // Group by folder
  const grouped = Object.create(null);
        actionsDiv.append(editButton, removeButton);

        li.append(siteEl, userEl, actionsDiv);
        container.append(li);
      });
  };

  // Render Folders
  Object.keys(grouped).sort().forEach(folder => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.classList.add('folder-summary');

    ul.classList.add('folder-list');

    renderList(grouped[folder], ul);

    summary.classList.add('folder-summary');
    credentialList.append(details);
    ul.classList.add('folder-list');
    if (Object.keys(grouped).length > 0) {
      const header = document.createElement('div');
      header.textContent = 'Sem Pasta';
    summary.classList.add('folder-summary');
    }
    ul.classList.add('folder-list');
function normalizeSite(siteInput) {
  const trimmed = siteInput.trim();
  if (!trimmed) {
    summary.classList.add('folder-summary');
  return withoutProtocol.replace(/\/+$/, '').toLowerCase();
    ul.classList.add('folder-list');
}

    ul.classList.add('folder-list');
    summary.classList.add('folder-summary');
    ul.classList.add('folder-list');
    summary.classList.add('folder-summary');
    ul.classList.add('folder-list');
    summary.classList.add('folder-summary');
    ul.classList.add('folder-list');
    summary.classList.add('folder-summary');
    ul.classList.add('folder-list');
    summary.classList.add('folder-summary');
    ul.classList.add('folder-list');
    summary.classList.add('folder-summary');