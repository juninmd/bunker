import { VAULT_KDF_ITERATIONS, base64ToBytes, bytesToBase64, decryptPayload, encryptPayload } from '../utils/crypto.js';
import { getSessionValue, removeSessionValues, setSessionValues } from '../utils/session-storage.js';

// A short PIN is brute-forceable offline, so its envelope of the vault key lives only in memory and dies with the browser.
const PIN_KEY = 'bunkerpass.pin';
export const LEGACY_PIN_LOCAL_KEYS = ['bunkerpass.pin.salt', 'bunkerpass.pin.encrypted'];
export const MAX_PIN_ATTEMPTS = 5;
export const MIN_PIN_LENGTH = 4;

interface PinRecord {
  salt: string;
  encrypted: string;
  failures: number;
}

export async function setupPin(pin: string, vaultKey: string): Promise<void> {
  if (pin.length < MIN_PIN_LENGTH) throw new Error('PIN too short');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await encryptPayload({ vaultKey }, pin, salt, VAULT_KDF_ITERATIONS);
  await setSessionValues({ [PIN_KEY]: { salt: bytesToBase64(salt), encrypted, failures: 0 } });
}

export async function recoverVaultKey(pin: string): Promise<string> {
  const record = await getSessionValue<PinRecord>(PIN_KEY);
  if (!record) throw new Error('PIN not set');
  let vaultKey: string;
  try {
    const payload = await decryptPayload(record.encrypted, pin, base64ToBytes(record.salt), VAULT_KDF_ITERATIONS);
    vaultKey = payload.vaultKey;
  } catch {
    const failures = record.failures + 1;
    if (failures >= MAX_PIN_ATTEMPTS) await clearPin();
    else await setSessionValues({ [PIN_KEY]: { ...record, failures } });
    throw new Error('Invalid PIN');
  }
  await setSessionValues({ [PIN_KEY]: { ...record, failures: 0 } });
  if (!vaultKey) throw new Error('PIN not set');
  return vaultKey;
}

export async function hasPin(): Promise<boolean> {
  return !!(await getSessionValue<PinRecord>(PIN_KEY));
}

export async function clearPin(): Promise<void> {
  await removeSessionValues([PIN_KEY]);
}
