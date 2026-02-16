console.log('BunkerPass: Content script loaded');

async function init() {
  const domain = window.location.hostname;

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

function fillForms(credentials: any[]) {
  // Simple heuristic: find password fields
  const passwordInputs = document.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>;

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

function findUsernameInput(passwordInput: HTMLInputElement): HTMLInputElement | null {
  // 1. Check previous element
  let sibling = passwordInput.previousElementSibling as HTMLElement | null;
  while (sibling) {
    if (sibling.tagName === 'INPUT') {
        const input = sibling as HTMLInputElement;
        if (input.type === 'text' || input.type === 'email') {
          return input;
        }
    }
    sibling = sibling.previousElementSibling as HTMLElement | null;
  }

  // 2. Check inputs in the same form before the password field
  if (passwordInput.form) {
    const inputs = Array.from(passwordInput.form.querySelectorAll('input'));
    const index = inputs.indexOf(passwordInput);
    if (index > 0) {
       // Look backwards
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

function dispatchEvents(element: HTMLElement) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

// Run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
