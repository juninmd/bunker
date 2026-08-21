import { VaultService } from './services/vault-service.js';
import { SyncService } from './services/sync-service.js';
import { AuthService } from './services/auth-service.js';
import { generatePassword } from './utils/password-generator.js';
import { generateUsername } from './utils/username-generator.js';
import { deriveKey, encryptWithKey, decryptWithKey, bytesToBase64, base64ToBytes } from './utils/crypto.js';

const vaultService = new VaultService();
const syncService = new SyncService(vaultService);

const unlockSection = document.getElementById('unlock-section') as HTMLElement;
const vaultSection = document.getElementById('vault-section') as HTMLElement;
const statusEl = document.getElementById('status') as HTMLElement;
const unlockButton = document.getElementById('unlockButton') as HTMLButtonElement;
const unlockBiometricsBtn = document.getElementById('unlockBiometricsBtn') as HTMLButtonElement;
const lockButton = document.getElementById('lockButton') as HTMLButtonElement;
const setupPasswordlessBtn = document.getElementById('setupPasswordlessBtn') as HTMLButtonElement;
const syncButton = document.getElementById('syncButton') as HTMLButtonElement;
const importCsvButton = document.getElementById('importCsvButton') as HTMLButtonElement;
const downloadCsvBtn = document.getElementById('downloadCsvBtn') as HTMLButtonElement;
const localCsvInput = document.getElementById('localCsvInput') as HTMLInputElement;
const securityDashboardBtn = document.getElementById('securityDashboardBtn') as HTMLButtonElement;
const securityDashboardSection = document.getElementById('security-dashboard-section') as HTMLElement;
const backToVaultBtn = document.getElementById('backToVaultBtn') as HTMLButtonElement;
const statTotal = document.getElementById('statTotal') as HTMLElement;
const statWeak = document.getElementById('statWeak') as HTMLElement;
const statReused = document.getElementById('statReused') as HTMLElement;
const statOld = document.getElementById('statOld') as HTMLElement;
const statScore = document.getElementById('statScore') as HTMLElement;
const statLeaked = document.getElementById('statLeaked') as HTMLElement;
const checkPwnedBtn = document.getElementById('checkPwnedBtn') as HTMLButtonElement;
const lastSyncEl = document.getElementById('last-sync') as HTMLElement;
const masterPasswordInput = document.getElementById('masterPassword') as HTMLInputElement;
const form = document.getElementById('credentialForm') as HTMLFormElement;
const credentialIdInput = document.getElementById('credentialId') as HTMLInputElement;
const credentialList = document.getElementById('credentialList') as HTMLUListElement;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;

const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const generatorOptions = document.getElementById('generatorOptions') as HTMLElement;
const lengthRange = document.getElementById('lengthRange') as HTMLInputElement;
const lengthVal = document.getElementById('lengthVal') as HTMLElement;
const useUppercase = document.getElementById('useUppercase') as HTMLInputElement;
const useLowercase = document.getElementById('useLowercase') as HTMLInputElement;
const useNumbers = document.getElementById('useNumbers') as HTMLInputElement;
const useSymbols = document.getElementById('useSymbols') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const notesInput = document.getElementById('notes') as HTMLTextAreaElement;
const passwordWrapper = document.getElementById('passwordWrapper') as HTMLElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const usernameWrapper = document.getElementById('usernameWrapper') as HTMLElement;
const generateUsernameBtn = document.getElementById('generateUsernameBtn') as HTMLButtonElement;
const siteInput = document.getElementById('site') as HTMLInputElement;
const cardFields = document.getElementById('cardFields') as HTMLElement;
const cardNameInput = document.getElementById('cardName') as HTMLInputElement;
const cardNumberInput = document.getElementById('cardNumber') as HTMLInputElement;
const cardExpInput = document.getElementById('cardExp') as HTMLInputElement;
const cardCvvInput = document.getElementById('cardCvv') as HTMLInputElement;
const addressFields = document.getElementById('addressFields') as HTMLElement;
const addressFullNameInput = document.getElementById('addressFullName') as HTMLInputElement;
const addressPhoneInput = document.getElementById('addressPhone') as HTMLInputElement;
const addressEmailInput = document.getElementById('addressEmail') as HTMLInputElement;
const addressStreetInput = document.getElementById('addressStreet') as HTMLInputElement;
const addressCityInput = document.getElementById('addressCity') as HTMLInputElement;
const addressStateInput = document.getElementById('addressState') as HTMLInputElement;
const addressZipInput = document.getElementById('addressZip') as HTMLInputElement;
const addressCountryInput = document.getElementById('addressCountry') as HTMLInputElement;
const folderInput = document.getElementById('folder') as HTMLInputElement;
const folderDatalist = document.getElementById('folderOptions') as HTMLDataListElement;
const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;

const passwordStrengthContainer = document.getElementById('passwordStrengthContainer') as HTMLElement;
const passwordStrengthBar = document.getElementById('password-strength-bar') as HTMLElement;
const passwordStrengthText = document.getElementById('password-strength-text') as HTMLElement;

unlockButton.addEventListener('click', handleUnlock);
unlockBiometricsBtn.addEventListener('click', handleUnlockBiometrics);
lockButton.addEventListener('click', handleLock);
setupPasswordlessBtn.addEventListener('click', handleSetupPasswordless);
syncButton.addEventListener('click', handleSync);
importCsvButton.addEventListener('click', handleImportCSV);
downloadCsvBtn.addEventListener('click', handleDownloadLocalCSV);
localCsvInput.addEventListener('change', handleImportLocalCSV);
form.addEventListener('submit', handleSaveCredential);

searchInput.addEventListener('input', handleSearch);

securityDashboardBtn.addEventListener('click', showSecurityDashboard);
backToVaultBtn.addEventListener('click', hideSecurityDashboard);
checkPwnedBtn.addEventListener('click', handleCheckPwned);

async function handleCheckPwned() {
  const vault = vaultService.getVault();
  const passwords = vault.filter(item => (!item.type || item.type === 'password') && !item.deletedAt && item.password);

  checkPwnedBtn.disabled = true;
  checkPwnedBtn.textContent = 'Verificando...';
  let leakedCount = 0;

  for (const item of passwords) {
    try {
      // Create SHA-1 hash using crypto.subtle
      const msgBuffer = new TextEncoder().encode(item.password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer); // NOSONAR SHA-1 is required by HIBP k-anonymity API
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);

      const url = `https://api.pwnedpasswords.com/range/${prefix}`; // NOSONAR
      const response = await fetch(url); // NOSONAR
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith(suffix)) {
            leakedCount++;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error('Pwned check error:', e);
    }
  }

  statLeaked.textContent = String(leakedCount);
  checkPwnedBtn.disabled = false;
  checkPwnedBtn.textContent = 'Verificar Novamente';
}

function showSecurityDashboard() {
  const vault = vaultService.getVault();
  const passwords = vault.filter(item => (!item.type || item.type === 'password') && !item.deletedAt);

  let weakCount = 0;
  let oldCount = 0;
  const passwordCounts: Record<string, number> = {};

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  passwords.forEach(item => {
    if (!item.password) return;

    // Check weak password (length < 8)
    if (item.password.length < 8) {
      weakCount++;
    }

    // Check old password (> 6 months)
    if (item.updatedAt) {
      const updatedDate = new Date(item.updatedAt);
      if (updatedDate < sixMonthsAgo) {
        oldCount++;
      }
    } else {
      // If no updatedAt is present, assume it's old
      oldCount++;
    }

    // Count occurrences
    passwordCounts[item.password] = (passwordCounts[item.password] || 0) + 1;
  });

  let reusedCount = 0;
  for (const pw in passwordCounts) {
    if ((passwordCounts[pw] || 0) > 1) {
      reusedCount += (passwordCounts[pw] || 0); // Count all instances of reused passwords
    }
  }

  // Calculate Security Score
  // Base score 100, subtract points for vulnerabilities
  let score = 100;
  if (passwords.length > 0) {
    // Arbitrary weighting: each weak password = -5, reused = -3, old = -1
    const deductions = (weakCount * 5) + (reusedCount * 3) + (oldCount * 1);
    score = Math.max(0, 100 - deductions);
  } else {
    score = 0; // No passwords, no score
  }

  if (statScore) statScore.textContent = String(score);
  if (statTotal) statTotal.textContent = String(passwords.length);
  statWeak.textContent = String(weakCount);
  statReused.textContent = String(reusedCount);
  statOld.textContent = String(oldCount);

  vaultSection.classList.add('hidden');
  securityDashboardSection.classList.remove('hidden');
}

function hideSecurityDashboard() {
  securityDashboardSection.classList.add('hidden');
  vaultSection.classList.remove('hidden');
}

passwordInput.addEventListener('input', (e) => {
  updatePasswordStrengthUI((e.target as HTMLInputElement).value);
});

document.querySelectorAll('input[name="itemType"]').forEach(radio => {
  radio.addEventListener('change', (e) => updateFormState(((e.target as HTMLInputElement).value)));
});

function updateFormState(type: string) {
  const isPassword = type === 'password';
  const isCard = type === 'card';
  const isAddress = type === 'address';

  const placeholders = {
    'note': 'Título da Nota',
    'card': 'Apelido do Cartão',
    'address': 'Apelido do Perfil',
    'password': 'Site (ex: github.com)'
  };
  siteInput.placeholder = placeholders[type] || placeholders['password'];

  usernameWrapper.style.display = isPassword ? 'flex' : 'none';
  passwordWrapper.style.display = isPassword ? 'flex' : 'none';
  if (isPassword) {
    usernameInput.setAttribute('required', 'true');
    passwordInput.setAttribute('required', 'true');
    passwordStrengthContainer.classList.remove('hidden');
  } else {
    usernameInput.removeAttribute('required');
    passwordInput.removeAttribute('required');
    passwordStrengthContainer.classList.add('hidden');
  }

  cardFields.classList.toggle('hidden', !isCard);
  if (isCard) {
    cardNameInput.setAttribute('required', 'true');
    cardNumberInput.setAttribute('required', 'true');
  } else {
    cardNameInput.removeAttribute('required');
    cardNumberInput.removeAttribute('required');
  }

  addressFields.classList.toggle('hidden', !isAddress);
  if (isAddress) {
    addressFullNameInput.setAttribute('required', 'true');
  } else {
    addressFullNameInput.removeAttribute('required');
  }
}

generateUsernameBtn.addEventListener('click', () => {
  // Use the robust username generator with word logic randomly
  const useWords = (crypto.getRandomValues(new Uint8Array(1))[0]! % 2) === 0;
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
    if (el === lengthRange) if (lengthVal) lengthVal.textContent = String(lengthRange.value);
    saveGeneratorSettings();
    runGenerate();
  });
});

async function loadGeneratorSettings() {
  const settings = await vaultService.getStorage('generator.settings');
  if (settings) {
    if (settings.length) {
      lengthRange.value = String(settings.length);
      lengthVal.textContent = String(settings.length);
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

function updatePasswordStrengthUI(password: string) {
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
  } else if (score < 7) {
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

function updateFolderOptions(vault: any[]) {
  const folders = new Set();
  vault.forEach(item => {
    if (item.grouping && item.grouping !== 'Deleted') {
      folders.add(item.grouping);
    }
  });

  folderDatalist.replaceChildren(); // NOSONAR
  Array.from(folders).sort().forEach(folderName => {
    const option = document.createElement('option');
    option.value = folderName as string;
    folderDatalist.appendChild(option);
  });
}

async function checkBiometrics() {
  const credentialId = await vaultService.getStorage('bunkerpass.passwordless.credentialId');
  if (credentialId) {
    unlockBiometricsBtn.classList.remove('hidden');
  }
}

// Initial check for biometrics when popup loads
document.addEventListener('DOMContentLoaded', checkBiometrics);

async function handleSetupPasswordless() {
  try {
    const username = 'BunkerPassUser';
    const prfData = await AuthService.registerPasswordless(username);

    // Encrypt the master password using the PRF derived key (which we don't have yet from register,
    // actually register doesn't return the PRF derived key directly, it only setups the salt.
    // Wait, the PRF extension on registration doesn't guarantee a key is returned unless we evaluate it.
    // Let's encrypt the master password using a randomly generated device key, and encrypt that device key with PRF?
    // Actually, WebAuthn PRF registration DOES NOT return the PRF key in most implementations.
    // Let's authenticate immediately to get the PRF key to encrypt the master password!
    setStatus('Autenticando biometria para concluir configuração...');

    const prfKeyBytes = await AuthService.authenticatePasswordless(prfData.credentialId, prfData.salt);

    // Import PRF key
    const prfCryptoKey = await crypto.subtle.importKey(
      'raw',
      prfKeyBytes as unknown as BufferSource,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt the master password
    // Get it from the input since vaultService might not expose it directly or safely
    const currentMasterPassword = String((document.getElementById('masterPassword') as HTMLInputElement).value.trim() || vaultService.masterPassword || "");
    if (!currentMasterPassword) {
      throw new Error("Senha mestra não encontrada. Desbloqueie o cofre novamente para configurar.");
    }
    const payload = { masterPassword: currentMasterPassword };
    const encryptedMasterPassword = await encryptWithKey(payload, prfCryptoKey);

    // Save everything to local storage
    await vaultService.setStorage('bunkerpass.passwordless.credentialId', prfData.credentialId);
    await vaultService.setStorage('bunkerpass.passwordless.salt', prfData.salt);
    await vaultService.setStorage('bunkerpass.passwordless.encryptedData', encryptedMasterPassword);

    setStatus('Login sem senha configurado com sucesso!');
  } catch (error: any) {
    console.error(error);
    setStatus('Falha ao configurar login sem senha: ' + error.message);
  }
}

async function handleUnlockBiometrics() {
  try {
    const credentialId = await vaultService.getStorage('bunkerpass.passwordless.credentialId');
    const salt = await vaultService.getStorage('bunkerpass.passwordless.salt');
    const encryptedData = await vaultService.getStorage('bunkerpass.passwordless.encryptedData');

    if (!credentialId || !salt || !encryptedData) {
      setStatus('Login sem senha não configurado adequadamente.');
      return;
    }

    setStatus('Aguardando biometria...');
    const prfKeyBytes = await AuthService.authenticatePasswordless(credentialId, salt);

    const prfCryptoKey = await crypto.subtle.importKey(
      'raw',
      prfKeyBytes as unknown as BufferSource,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const decrypted: any = await decryptWithKey(encryptedData, prfCryptoKey);

    // Use the decrypted master password to unlock the vault
    await doUnlock(decrypted.masterPassword);
  } catch (error: any) {
    console.error(error);
    setStatus('Falha na autenticação biométrica.');
  }
}

async function doUnlock(masterPassword: string) {
  try {
    await vaultService.unlock(masterPassword);
    handleSearch();

    try {
        await vaultService.exportSessionKey();
    } catch (e: any) {
        console.warn('Failed to export session key', e);
    }

    const lastSync = await vaultService.getStorage('bunkerpass.last_sync');
    if (lastSync) {
      lastSyncEl.textContent = `Última sincronização: ${lastSync}`;
    }

    await loadGeneratorSettings();

    unlockSection.classList.add('hidden');
    vaultSection.classList.remove('hidden');
    setStatus('Cofre desbloqueado.');
  } catch (e: any) {
    console.error(e);
    setStatus('Senha mestra inválida ou cofre corrompido.');
  }
}

async function handleUnlock() {
  const masterPassword = masterPasswordInput.value.trim();
  if (!masterPassword) {
    setStatus('Informe a senha mestra.');
    return;
  }

  await doUnlock(masterPassword);
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
  } catch (error: any) {
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
  } catch (error: any) {
    console.error(error);
    setStatus(`Erro na importação: ${error.message}`);
  }
}

async function handleDownloadLocalCSV() {
    try {
        const vault = vaultService.getVault();
        if (!vault || vault.length === 0) {
            setStatus('Cofre vazio.');
            return;
        }
        const csvContent = syncService.generateCSVContent(vault);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; // NOSONAR - local blob url
        a.rel = 'noopener noreferrer';
        a.download = 'bunkerpass_offline_backup.csv';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus('Download offline concluído.');
    } catch (e: any) {
        setStatus('Erro ao exportar CSV: ' + e.message);
    }
}

async function handleImportLocalCSV(e: Event) {
    const file = (e.target as HTMLInputElement).files![0];
    if (!file) return;

    try {
        setStatus('Lendo CSV local...');
        const file = (e.target as HTMLInputElement).files![0];
    if (!file) return;
    const text = await file.text();
        const csvUtils = await import('./utils/csv-utils.js');
        const importedItems = csvUtils.parseCSV(text);

        const formattedImport = importedItems.map(row => csvUtils.mapCSVRowToVaultItem(row));

        const localVault = vaultService.getVault();
        const { merged, added, updated } = syncService.mergeCSV(localVault, formattedImport);

        await vaultService.save(merged);
        setStatus(`Importação local concluída. ${added} adicionados, ${updated} atualizados.`);
        (e.target as HTMLInputElement).value = ''; // reset input
        handleSearch(); // Refresh UI
    } catch (error: any) {
        setStatus('Erro ao importar arquivo CSV: ' + error.message);
        (e.target as HTMLInputElement).value = '';
    }
}

async function handleSaveCredential(event: Event) {
  event.preventDefault();
  const type = (document.querySelector('input[name="itemType"]:checked') as HTMLInputElement).value;
  let site = (document.getElementById('site') as HTMLInputElement).value;
  let username = (document.getElementById('username') as HTMLInputElement).value.trim();
  let password = (document.getElementById('password') as HTMLInputElement).value;
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
  } else if (type === 'address') {
    site = site.trim();
    username = '';
    password = '';
    if (!site || !addressFullNameInput.value) {
      setStatus('Preencha o apelido e o nome completo.');
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
    } else if (type === 'address') {
        existingIndex = newVault.findIndex(i => i.site === site && i.type === 'address');
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
  } else if (type === 'address') {
      const addressData = {
          fullName: addressFullNameInput.value,
          phone: addressPhoneInput.value,
          email: addressEmailInput.value,
          street: addressStreetInput.value,
          city: addressCityInput.value,
          state: addressStateInput.value,
          zip: addressZipInput.value,
          country: addressCountryInput.value,
          notes: notes
      };
      finalNotes = JSON.stringify(addressData);
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
  (document.querySelector('input[value="password"]') as HTMLInputElement).checked = true;
  updateFormState('password');
  updatePasswordStrengthUI(''); // clear strength meter
  handleSearch();
}

function handleEditCredential(id: string) {
    const vault = vaultService.getVault();
    const item = vault.find(i => i.id === id);
    if (!item) return;

    credentialIdInput.value = item.id;
    siteInput.value = item.site;
    notesInput.value = item.notes || '';
    folderInput.value = item.grouping || '';

    // Determine type
    const type = item.type || 'password';
    (document.querySelector(`input[name="itemType"][value="${type}"]`) as HTMLInputElement).checked = true;
    updateFormState(type);

    if (type === 'password') {
        usernameInput.value = item.username;
        passwordInput.value = item.password;
    } else if (type === 'card' || type === 'address') {
        let parsedData: any = {};
        try {
            parsedData = JSON.parse(item.notes || '{}');
            notesInput.value = parsedData.notes || '';
        } catch (e: any) {
            notesInput.value = item.notes || '';
        }

        if (type === 'card') {
            cardNameInput.value = parsedData.name || '';
            cardNumberInput.value = parsedData.number || '';
            cardExpInput.value = parsedData.exp || '';
            cardCvvInput.value = parsedData.cvv || '';
        } else {
            addressFullNameInput.value = parsedData.fullName || '';
            addressPhoneInput.value = parsedData.phone || '';
            addressEmailInput.value = parsedData.email || '';
            addressStreetInput.value = parsedData.street || '';
            addressCityInput.value = parsedData.city || '';
            addressStateInput.value = parsedData.state || '';
            addressZipInput.value = parsedData.zip || '';
            addressCountryInput.value = parsedData.country || '';
        }
    }

    submitButton.textContent = 'Atualizar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStatus(`Editando: ${item.site}`);
}

async function handleDeleteCredential(credentialId: string) {
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

function renderVault(vault: any[]) {
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
  const grouped: Record<string, any[]> = {};
  const noFolder: any[] = [];

  visibleVault.forEach(item => {
    if (item.grouping && item.grouping !== 'Deleted') {
      if (!grouped[item.grouping]) grouped[item.grouping] = [];
      grouped[item.grouping]!.push(item);
    } else {
      noFolder.push(item);
    }
  });

  // Helper to render a list of items into a container
  const renderList = (items: any[], container: HTMLElement) => {
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
        } else if (item.type === 'address') {
           siteEl.textContent = '📍 ' + item.site;
        } else {
           siteEl.textContent = item.site;
        }

        const userEl = document.createElement('div');
        userEl.className = 'item-user';

        let typeLabel = item.username;
        if (item.type === 'note' || item.type === 'card' || item.type === 'address') {
            const defaultLabels = { 'note': '(Nota Segura)', 'card': '(Cartão de Pagamento)', 'address': '(Perfil de Endereço)' };
            typeLabel = defaultLabels[item.type];
            try {
                const parsed = JSON.parse(item.notes);
                if (item.type === 'card' && parsed?.number) {
                    typeLabel = `(Cartão final ${parsed.number?.slice(-4)})`;
                } else if (item.type === 'address' && parsed.fullName) {
                    typeLabel = parsed.fullName;
                }
} catch (e: any) { console.warn('Failed to parse address notes:', e); }
        }
        userEl.textContent = typeLabel;

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

  // Helper to create a folder section
  const renderFolder = (folderName: string, items: any[]) => {
    const li = document.createElement('li');
    li.className = 'folder-container';

    const header = document.createElement('div');
    header.className = 'folder-header collapsed';
    header.textContent = `📁 ${folderName} (${items.length})`;

    const content = document.createElement('div');
    content.className = 'folder-content collapsed';

    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';

    renderList(items, ul);
    content.appendChild(ul);

    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      content.classList.toggle('collapsed');
    });

    // Expand by default if searching
    if (searchInput.value.trim()) {
      header.classList.remove('collapsed');
      content.classList.remove('collapsed');
    }

    li.append(header, content);
    credentialList.append(li);
  };

  // Render Folders
  Object.keys(grouped).sort().forEach(folder => {
    renderFolder(folder, grouped[folder]!);
  });

  // Render items without folder
  if (noFolder.length > 0) {
    if (Object.keys(grouped).length > 0) {
      renderFolder('Sem Pasta', noFolder);
    } else {
      renderList(noFolder || [], credentialList as HTMLUListElement);
    }
  }
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
  statusEl.textContent = message;
}
