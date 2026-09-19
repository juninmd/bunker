declare var browser: any;

// Persistent extension storage with a localStorage fallback for plain-page and test contexts.
function extensionArea(): chrome.storage.StorageArea | null {
  if (typeof browser !== 'undefined' && browser.storage?.local) return browser.storage.local;
  if (typeof chrome !== 'undefined' && chrome.storage?.local) return chrome.storage.local;
  return null;
}

export async function getLocal(key: string): Promise<any> {
  const area = extensionArea();
  if (!area) return localStorage.getItem(key);
  return (await area.get(key))[key];
}

// A single set() call keeps related keys consistent if the popup dies mid-write.
export async function setLocalMany(values: Record<string, any>): Promise<void> {
  const area = extensionArea();
  if (!area) {
    Object.entries(values).forEach(([k, v]) => localStorage.setItem(k, v));
    return;
  }
  await area.set(values);
}

export async function removeLocal(keys: string[]): Promise<void> {
  const area = extensionArea();
  if (!area) {
    keys.forEach(k => localStorage.removeItem(k));
    return;
  }
  await area.remove(keys);
}
