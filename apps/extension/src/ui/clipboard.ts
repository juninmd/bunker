import { icon } from './icons.js';

export const CLIPBOARD_SECONDS = 30;

// Copies a secret and asks the background to wipe the clipboard, which still happens if the popup closes first.
export async function copySecret(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
  try {
    await chrome.runtime.sendMessage({ type: 'CLEAR_CLIPBOARD_LATER' });
  } catch (e) {
    console.warn('Clipboard clear not scheduled', e);
  }
}

export function flashDone(button: HTMLButtonElement) {
  const original = Array.from(button.childNodes);
  button.replaceChildren(icon('check'));
  button.classList.add('done');
  setTimeout(() => {
    button.replaceChildren(...original);
    button.classList.remove('done');
  }, 1200);
}
