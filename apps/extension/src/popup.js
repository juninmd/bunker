import { VaultService } from './services/vault-service.js';
import { SyncService } from './services/sync-service.js';
import { generatePassword } from './utils/password-generator.js';
import { generateUsername } from './utils/username-generator.js';

const vaultService = new VaultService();
const syncService = new SyncService(vaultService);

const unlockSection = document.getElementById('unlock-section');
const vaultSection = document.getElementById('vault-section');
const statusEl = document.getElementById('status');
const unlockButton = document.getElementById('unlockButton');
const lockButton = document.getElementById('lockButton');
const syncButton = document.getElementById('syncButton');
const importCsvButton = document.getElementById('importCsvButton');
const securityDashboardBtn = document.getElementById('securityDashboardBtn');
const securityDashboardSection = document.getElementById('security-dashboard-section');
const backToVaultBtn = document.getElementById('backToVaultBtn');
const statTotal = document.getElementById('statTotal');
const statWeak = document.getElementById('statWeak');
const statReused = document.getElementById('statReused');
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
const usernameWrapper = document.getElementById('usernameWrapper');
const generateUsernameBtn = document.getElementById('generateUsernameBtn');
const siteInput = document.getElementById('site');
const cardFields = document.getElementById('cardFields');
const cardNameInput = document.getElementById('cardName');
const cardNumberInput = document.getElementById('cardNumber');
const cardExpInput = document.getElementById('cardExp');
const cardCvvInput = document.getElementById('cardCvv');
const folderInput = document.getElementById('folder');
const folderDatalist = document.getElementById('folderOptions');
const submitButton = form.querySelector('button[type="submit"]');

const passwordStrengthContainer = document.getElementById('passwordStrengthContainer');
const passwordStrengthBar = document.getElementById('password-strength-bar');
const passwordStrengthText = document.getElementById('password-strength-text');

unlockButton.addEventListener('click', handleUnlock);
lockButton.addEventListener('click', handleLock);
syncButton.addEventListener('click', handleSync);
importCsvButton.addEventListener('click', handleImportCSV);
form.addEventListener('submit', handleSaveCredential);

searchInput.addEventListener('input', handleSearch);

securityDashboardBtn.addEventListener('click', showSecurityDashboard);
backToVaultBtn.addEventListener('click', hideSecurityDashboard);

function showSecurityDashboard() {
  const vault = vaultService.getVault();
  const passwords = vault.filter(item => (!item.type || item.type === 'password') && !item.deletedAt);

  let weakCount = 0;
  const passwordCounts = {};

  passwords.forEach(item => {
    if (!item.password) return;

    // Check weak password (length < 8)
    if (item.password.length < WEAK_PASSWORD_THRESHOLD) {
      weakCount++;
    }

    // Count occurrences
    passwordCounts[item.password] = (passwordCounts[item.password] || 0) + 1;
  });

  let reusedCount = 0;
  for (const pw in passwordCounts) {
    if (passwordCounts[pw] > 1) {
      reusedCount += passwordCounts[pw]; // Count all instances of reused passwords
    }
  }

  statTotal.textContent = passwords.length;
  statWeak.textContent = weakCount;
  statReused.textContent = reusedCount;

  vaultSection.classList.add('hidden');
  securityDashboardSection.classList.remove('hidden');
}

function hideSecurityDashboard() {
  securityDashboardSection.classList.add('hidden');
  vaultSection.classList.remove('hidden');
}

passwordInput.addEventListener('input', (e) => {
  updatePasswordStrengthUI(e.target.value);
});

document.querySelectorAll('input[name="itemType"]').forEach(radio => {
  radio.addEventListener('change', (e) => updateFormState(e.target.value));
});

function updateFormState(type) {
  if (type === 'note') {
    siteInput.placeholder = 'Título da Nota';
    usernameWrapper.style.display = 'none';
    usernameInput.removeAttribute('required');
    passwordWrapper.style.display = 'none';
    passwordStrengthContainer.classList.add('hidden');
    passwordInput.removeAttribute('required');
    cardFields.classList.add('hidden');
    cardNameInput.removeAttribute('required');
    cardNumberInput.removeAttribute('required');
  } else if (type === 'card') {
    siteInput.placeholder = 'Apelido do Cartão';
    usernameWrapper.style.display = 'none';
    usernameInput.removeAttribute('required');
    passwordWrapper.style.display = 'none';
    passwordStrengthContainer.classList.add('hidden');
    passwordInput.removeAttribute('required');
    cardFields.classList.remove('hidden');
    cardNameInput.setAttribute('required', 'true');
    cardNumberInput.setAttribute('required', 'true');
  } else {
    siteInput.placeholder = 'Site (ex: github.com)';
    usernameWrapper.style.display = 'flex';
    usernameInput.setAttribute('required', 'true');
    passwordWrapper.style.display = 'flex'; // Assuming flex for layout
    passwordStrengthContainer.classList.remove('hidden');
    passwordInput.setAttribute('required', 'true');
    cardFields.classList.add('hidden');
    cardNameInput.removeAttribute('required');
    cardNumberInput.removeAttribute('required');
  }
}

generateUsernameBtn.addEventListener('click', () => {
  // Use the robust username generator with word logic randomly
  const useWords = (crypto.getRandomValues(new Uint8Array(1))[0] % 2) === 0;
  usernameInput.value = generateUsername({ useWords, length: 8 });
});

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

function updatePasswordStrengthUI(password) {
  if (!password) {
    passwordStrengthContainer.classList.add('hidden');
    return;
  }

  passwordStrengthContainer.classList.remove('hidden');
  passwordStrengthBar.className = ''; // reset classes

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let strengthClass = '';
  let strengthText = '';

  if (score < 4) {
    strengthClass = 'strength-weak';
    strengthText = 'Fraca';
  } else if (score < 6) {
    strengthClass = 'strength-fair';
    strengthText = 'Razoável';
  } else if (score < 8) {
    strengthClass = 'strength-good';
    strengthText = 'Boa';
  } else {
    strengthClass = 'strength-strong';
    strengthText = 'Forte';
  }

  passwordStrengthBar.classList.add(strengthClass);
  passwordStrengthText.textContent = strengthText;
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
  } else if (type === 'note') {
    // Secure Note
    site = site.trim(); // Title
    username = '';
    password = '';
    if (!site) {
      setStatus('Informe o título da nota.');
      return;
    }
  } else if (type === 'card') {
    site = site.trim();
    username = '';
    password = '';
    if (!site || !cardNameInput.value || !cardNumberInput.value) {
      setStatus('Preencha o apelido, nome e número do cartão.');
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
    } else if (type === 'note') {
        existingIndex = newVault.findIndex(i => i.site === site && i.type === 'note');
    } else if (type === 'card') {
        existingIndex = newVault.findIndex(i => i.site === site && i.type === 'card');
    }
  }

  let finalNotes = notes;
  if (type === 'card') {
      const cardData = {
          name: cardNameInput.value,
          number: cardNumberInput.value,
          exp: cardExpInput.value,
          cvv: cardCvvInput.value,
          notes: notes
      };
      finalNotes = JSON.stringify(cardData);
  }

  if (existingIndex >= 0) {
     const item = newVault[existingIndex];
     item.site = site;
     item.username = username;
     item.password = password;
     item.notes = finalNotes;
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
      notes: finalNotes,
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
  updatePasswordStrengthUI(''); // clear strength meter
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
    } else if (type === 'card') {
        try {
            const cardData = JSON.parse(item.notes || '{}');
            cardNameInput.value = cardData.name || '';
            cardNumberInput.value = cardData.number || '';
            cardExpInput.value = cardData.exp || '';
            cardCvvInput.value = cardData.cvv || '';
            notesInput.value = cardData.notes || '';
        } catch (e) {
            // Fallback if parsing fails
            notesInput.value = item.notes || '';
        }
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
  const grouped = {};
  const noFolder = [];

  visibleVault.forEach(item => {
    if (item.grouping && item.grouping !== 'Deleted') {
      if (!grouped[item.grouping]) grouped[item.grouping] = [];
      grouped[item.grouping].push(item);
    } else {
      noFolder.push(item);
    }
  });

  // Helper to render a list of items into a container
  const renderList = (items, container) => {
    items
      .slice()
      .sort((a, b) => (a.site || '').localeCompare(b.site || ''))
      .forEach((item) => {
        const li = document.createElement('li');

        const siteEl = document.createElement('div');
        siteEl.className = 'item-site';

        if (item.type === 'note') {
           siteEl.textContent = '📝 ' + item.site; // item.site holds Title for notes
        } else if (item.type === 'card') {
           siteEl.textContent = '💳 ' + item.site;
        } else {
           siteEl.textContent = item.site;
        }

        const userEl = document.createElement('div');
        userEl.className = 'item-user';
        if (item.type === 'note') {
            userEl.textContent = '(Nota Segura)';
        } else if (item.type === 'card') {
            userEl.textContent = '(Cartão de Pagamento)';
            try {
                const parsed = JSON.parse(item.notes);
                if (parsed.number) {
                    const last4 = parsed.number.slice(-4);
                    userEl.textContent = `(Cartão final ${last4})`;
                }
            } catch (e) {}
        } else {
            userEl.textContent = item.username;
        }

        if (item.notes && item.type === 'password') { // Only show icon if it's a password with notes
          const notesIcon = document.createElement('span');
          notesIcon.textContent = ' 📄';
          notesIcon.title = item.notes;
          notesIcon.style.cursor = 'help';
          userEl.appendChild(notesIcon);
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-actions'; // For CSS styling if needed

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'secondary small'; // Assuming small class or I can add inline style
        editButton.textContent = 'Edit';
        editButton.style.marginRight = '5px';
        editButton.addEventListener('click', () => {
          handleEditCredential(item.id);
        });

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'danger small';
        removeButton.textContent = 'Remover';
        removeButton.addEventListener('click', () => {
          handleDeleteCredential(item.id);
        });

        actionsDiv.append(editButton, removeButton);

        li.append(siteEl, userEl, actionsDiv);
        container.append(li);
      });
  };

  // Render Folders
  Object.keys(grouped).sort().forEach(folder => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = `📁 ${folder} (${grouped[folder].length})`;
    summary.style.cursor = 'pointer';
    summary.style.fontWeight = 'bold';
    summary.style.marginBottom = '4px';

    const ul = document.createElement('ul');
    ul.style.paddingLeft = '10px';
    ul.style.listStyle = 'none';
    ul.style.margin = '4px 0 12px 0';

    renderList(grouped[folder], ul);

    details.append(summary, ul);
    // Expand by default if searching
    if (searchInput.value.trim()) details.open = true;

    credentialList.append(details);
  });

  // Render items without folder
  if (noFolder.length > 0) {
    if (Object.keys(grouped).length > 0) {
      const header = document.createElement('div');
      header.textContent = 'Sem Pasta';
      header.style.fontWeight = 'bold';
      header.style.marginTop = '8px';
      header.style.marginBottom = '4px';
      credentialList.append(header);
    }
    renderList(noFolder, credentialList);
  }
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
