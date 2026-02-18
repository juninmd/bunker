console.log('BunkerPass: Content script loaded');

async function init() {
  const domain = window.location.hostname;

  // Listen for form submissions
  document.addEventListener('submit', handleFormSubmit, true);

  // Attempt to get credentials from background
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS', domain });

    if (chrome.runtime.lastError) {
      // Ignore if background script is not ready or no listener
      return;
    }

    if (response && response.credentials && response.credentials.length > 0) {
      console.log('BunkerPass: Credentials received', response.credentials.length);
      fillForms(response.credentials);
    } else if (response && response.error === 'LOCKED') {
      console.log('BunkerPass: Vault is locked.');
    }
  } catch (err) {
    console.log('BunkerPass: Error communicating with background', err);
  }
}

function fillForms(credentials) {
  // Simple heuristic: find password fields
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach(passInput => {
    // Check if already filled
    if (passInput.value) return;

    // Find associated username input (usually preceding text/email input)
    let userInput = findUsernameInput(passInput);

    // For MVP, just use the first credential found
    const cred = credentials[0];

    if (userInput) {
      userInput.value = cred.username;
      dispatchEvents(userInput);
    }

    passInput.value = cred.password;
    dispatchEvents(passInput);
  });
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
    const inputs = Array.from(passwordInput.form.querySelectorAll('input'));
    const index = inputs.indexOf(passwordInput);
    if (index > 0) {
       // Look backwards for likely username fields
       for (let i = index - 1; i >= 0; i--) {
           const input = inputs[i];
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
           if (input.type === 'text' || input.type === 'email') {
               return input;
           }
       }
    }
  }
  return null;
}

function handleFormSubmit(event) {
    // Basic heuristic to detect login submission
    const form = event.target;
    const passwordInput = form.querySelector('input[type="password"]');

    if (passwordInput && passwordInput.value) {
        const usernameInput = findUsernameInput(passwordInput);
        if (usernameInput && usernameInput.value) {
            const site = window.location.hostname;
            const username = usernameInput.value;
            const password = passwordInput.value;

            console.log('BunkerPass: Detected form submission', { site, username });

            chrome.runtime.sendMessage({
                type: 'SAVE_CREDENTIAL',
                data: { site, username, password }
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('BunkerPass: Failed to save credential', chrome.runtime.lastError);
                } else {
                    console.log('BunkerPass: Save response', response);
                }
            });
        }
    }
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
