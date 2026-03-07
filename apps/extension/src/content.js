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
      injectIcons(response.credentials);
    } else if (response && response.error === 'LOCKED') {
      console.log('BunkerPass: Vault is locked.');
      injectLockedIcon();
    }
  } catch (err) {
    console.log('BunkerPass: Error communicating with background', err);
  }
}

function injectIcons(credentials) {
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach(passInput => {
    if (passInput.dataset.bunkerpassInjected) return;
    passInput.dataset.bunkerpassInjected = 'true';

    const icon = document.createElement('div');
    icon.className = 'bunkerpass-icon';
    icon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `;
    icon.style.cssText = `
      position: absolute;
      cursor: pointer;
      z-index: 2147483647;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    document.body.appendChild(icon);

    const positionIcon = () => {
      const rect = passInput.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        icon.style.display = 'none';
        return;
      }
      icon.style.display = 'flex';
      icon.style.top = (rect.top + window.scrollY + (rect.height - 22) / 2) + 'px';
      icon.style.left = (rect.right + window.scrollX - 30) + 'px';
    };

    positionIcon();
    window.addEventListener('resize', positionIcon);
    document.addEventListener('scroll', positionIcon, true);

    icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showDropdown(icon, passInput, credentials, positionIcon);
    });
  });
}

function injectLockedIcon() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');

  passwordInputs.forEach(passInput => {
    if (passInput.dataset.bunkerpassInjected) return;
    passInput.dataset.bunkerpassInjected = 'true';

    const icon = document.createElement('div');
    icon.className = 'bunkerpass-icon bunkerpass-locked';
    icon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `;
    icon.title = "BunkerPass Bloqueado";
    icon.style.cssText = `
      position: absolute;
      cursor: pointer;
      z-index: 2147483647;
      background: white;
      border: 1px solid #fca5a5;
      border-radius: 4px;
      padding: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    document.body.appendChild(icon);

    const positionIcon = () => {
      const rect = passInput.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        icon.style.display = 'none';
        return;
      }
      icon.style.display = 'flex';
      icon.style.top = (rect.top + window.scrollY + (rect.height - 22) / 2) + 'px';
      icon.style.left = (rect.right + window.scrollX - 30) + 'px';
    };

    positionIcon();
    window.addEventListener('resize', positionIcon);
    document.addEventListener('scroll', positionIcon, true);

    icon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      alert("Cofre bloqueado. Abra a extensão para desbloquear.");
    });
  });
}

function showDropdown(icon, passInput, credentials, positionIcon) {
  document.querySelectorAll('.bunkerpass-dropdown').forEach(d => d.remove());

  const dropdown = document.createElement('div');
  dropdown.className = 'bunkerpass-dropdown';
  dropdown.style.cssText = `
    position: absolute;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 2147483647;
    min-width: 150px;
    max-height: 200px;
    overflow-y: auto;
    font-family: sans-serif;
  `;

  credentials.forEach(cred => {
    const item = document.createElement('div');
    item.textContent = cred.username || '(Sem usuário)';
    item.style.cssText = `
      padding: 8px 12px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      color: #333;
      font-size: 14px;
    `;
    item.addEventListener('mouseover', () => item.style.background = '#f0f0f0');
    item.addEventListener('mouseout', () => item.style.background = 'transparent');
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      let userInput = findUsernameInput(passInput);
      if (userInput) {
        userInput.value = cred.username;
        dispatchEvents(userInput);
      }
      passInput.value = cred.password;
      dispatchEvents(passInput);
      dropdown.remove();
    });
    dropdown.appendChild(item);
  });

  document.body.appendChild(dropdown);

  const rect = icon.getBoundingClientRect();
  dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
  dropdown.style.left = (rect.left + window.scrollX - 120) + 'px'; // Shift left a bit

  const closeDropdown = (e) => {
    if (!dropdown.contains(e.target) && !icon.contains(e.target)) {
      dropdown.remove();
      document.removeEventListener('click', closeDropdown);
    }
  };
  document.addEventListener('click', closeDropdown);
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
