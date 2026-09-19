console.log('BunkerPass: Content script loaded');

async function init() {
  const domain = window.location.hostname;
  // Registered before any await so a fast submit is never missed.
  document.addEventListener('submit', handleFormSubmit, true);

  // Check policies for SaaS Protect
  try {
    const policyResponse = await chrome.runtime.sendMessage({ type: 'GET_POLICIES' });
    if (policyResponse && policyResponse.policies && policyResponse.policies.blockedDomains) {
      const blockedDomains = policyResponse.policies.blockedDomains.split('\n').map((d: string) => d.trim().toLowerCase());
      if (blockedDomains.some((blocked: string) => blocked && (domain === blocked || domain.endsWith('.' + blocked)))) {
        console.log('BunkerPass: Access blocked by SaaS Protect policy.');
        document.body.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #f8d7da; color: #721c24; font-family: sans-serif; text-align: center; padding: 20px;">
            <h1 style="font-size: 48px; margin-bottom: 20px;">Acesso Bloqueado</h1>
            <p style="font-size: 24px;">Esta página foi bloqueada pela política de segurança da sua empresa (BunkerPass SaaS Protect).</p>
          </div>
        `;
        return; // Stop further execution
      }
    }
  } catch (err) {
    console.log('BunkerPass: Error checking policies', err);
  }
  promptPendingSave();

  // Attempt to get credentials from background
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS' });

    if (chrome.runtime.lastError) {
      // Ignore if background script is not ready or no listener
      return;
    }

    if (response && response.credentials && response.credentials.length > 0) {
      console.log('BunkerPass: Credentials received', response.credentials.length);
      injectIcons(response.credentials);
    } else if (response && response.error === 'LOCKED') {
      console.log('BunkerPass: Vault is locked.');
      injectLockedIcon();
    }
  } catch (err) {
    console.log('BunkerPass: Error communicating with background', err);
  }
}

function passwordFields(): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>('input[type="password"]')];
}

function injectIcons(credentials) {
  passwordFields().forEach(passInput => attachFieldIcon(passInput, false, icon =>
    showPicker(icon, credentials, index => fillCredential(passInput, credentials[index]))));
}

function injectLockedIcon() {
  passwordFields().forEach(passInput => attachFieldIcon(passInput, true, () =>
    alert('Cofre bloqueado. Abra a extensão Bunker para desbloquear.')));
}

function fillCredential(passInput, cred) {
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
