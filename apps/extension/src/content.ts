async function init() {
  // Registered before any await so a fast submit is never missed.
  document.addEventListener('submit', handleFormSubmit, true);

  try {
    const policy = await chrome.runtime.sendMessage({ type: 'IS_BLOCKED' });
    if (policy?.blocked) return blockPage();
  } catch {
    // Worker not ready; autofill below retries the connection.
  }
  promptPendingSave();

  try {
    const response = await chrome.runtime.sendMessage({ type: 'LIST_ACCOUNTS' });
    if (response?.accounts?.length) injectIcons(response.accounts);
    else if (response?.error === 'LOCKED') injectLockedIcon();
  } catch {
    // No worker, no autofill; the page keeps working.
  }
}

// SaaS Protect: fixed text only; nothing from the policy reaches the DOM.
function blockPage() {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#f8d7da;color:#721c24;font-family:sans-serif;text-align:center;padding:20px;';
  const title = document.createElement('h1');
  title.textContent = 'Acesso bloqueado';
  const text = document.createElement('p');
  text.textContent = 'Esta página foi bloqueada pela política de segurança da sua empresa (Bunker SaaS Protect).';
  box.append(title, text);
  document.body.replaceChildren(box);
}

function passwordFields(): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>('input[type="password"]')];
}

function injectIcons(accounts) {
  passwordFields().forEach(passInput => attachFieldIcon(passInput, false, icon =>
    showPicker(icon, accounts, index => fillAccount(passInput, accounts[index].ref))));
}

function injectLockedIcon() {
  passwordFields().forEach(passInput => attachFieldIcon(passInput, true, () =>
    alert('Cofre bloqueado. Abra a extensão Bunker para desbloquear.')));
}

async function fillAccount(passInput, ref) {
  const cred = await chrome.runtime.sendMessage({ type: 'FILL_CREDENTIAL', ref });
  if (!cred || cred.error) return;
  const userInput = findUsernameInput(passInput);
  if (userInput) {
    userInput.value = cred.username;
    dispatchEvents(userInput);
  }
  passInput.value = cred.password;
  dispatchEvents(passInput);
}

function findUsernameInput(passwordInput) {
  // 1. Check previous element
  let sibling = passwordInput.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === 'INPUT' && (sibling.type === 'text' || sibling.type === 'email')) {
      return sibling;
    }
    sibling = sibling.previousElementSibling;
  }

  // 2. Check inputs in the same form before the password field
  if (passwordInput.form) {
    const inputs = Array.from(passwordInput.form.querySelectorAll('input')) as HTMLInputElement[];
    const index = inputs.indexOf(passwordInput);
    if (index > 0) {
       // Look backwards for likely username fields
       for (let i = index - 1; i >= 0; i--) {
           const input = inputs[i];
           if (!input) continue;
           if (input.type === 'text' || input.type === 'email') {
               const name = (input.name || '').toLowerCase();
               const id = (input.id || '').toLowerCase();
               if (
                   name.includes('user') || name.includes('login') || name.includes('email') ||
                   id.includes('user') || id.includes('login') || id.includes('email')
               ) {
                   return input;
               }
           }
       }
       // Fallback: return the nearest text/email input
       for (let i = index - 1; i >= 0; i--) {
           const input = inputs[i];
           if (!input) continue;
           if (input.type === 'text' || input.type === 'email') {
               return input;
           }
       }
    }
  }
  return null;
}

function handleFormSubmit(event) {
  // On change-password forms the new value is the last filled field, after the current one.
  const passwordInput = [...event.target.querySelectorAll('input[type="password"]')].filter(i => i.value).pop();
  const usernameInput = passwordInput?.value ? findUsernameInput(passwordInput) : null;
  if (usernameInput?.value) offerSave(usernameInput.value, passwordInput.value);
}

function dispatchEvents(element) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
