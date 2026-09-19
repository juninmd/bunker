// Memory-only storage: chrome.storage.session never touches disk and is wiped when the browser closes.
const fallback = new Map<string, unknown>();

function sessionArea(): chrome.storage.StorageArea | null {
  return typeof chrome !== 'undefined' && chrome.storage?.session ? chrome.storage.session : null;
}

export async function getSessionValue<T>(key: string): Promise<T | undefined> {
  const area = sessionArea();
  if (!area) return fallback.get(key) as T | undefined;
  return (await area.get(key))[key] as T | undefined;
}

export async function setSessionValues(values: Record<string, unknown>): Promise<void> {
  const area = sessionArea();
  if (!area) {
    Object.entries(values).forEach(([k, v]) => fallback.set(k, v));
    return;
  }
  await area.set(values);
}

export async function removeSessionValues(keys: string[]): Promise<void> {
  const area = sessionArea();
  if (!area) {
    keys.forEach(k => fallback.delete(k));
    return;
  }
  await area.remove(keys);
}
