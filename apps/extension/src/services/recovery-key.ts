import { base64ToBytes, bytesToBase64, decryptPayload, encryptPayload } from '../utils/crypto.js';
import { getLocal, setLocalMany } from '../utils/local-storage.js';

const SALT_KEY = 'bunkerpass.recovery.salt';
const DATA_KEY = 'bunkerpass.recovery.encrypted';
export const RECOVERY_KEYS = [SALT_KEY, DATA_KEY];

// The code wraps the master password (not the key) so it survives salt changes from sync; 128 random bits make KDF cost moot.
export async function createRecoveryCode(masterPassword: string): Promise<string> {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await encryptPayload({ masterPassword }, code, salt);
  await setLocalMany({ [SALT_KEY]: bytesToBase64(salt), [DATA_KEY]: encrypted });
  return code;
}

export async function recoverMasterPassword(code: string): Promise<string> {
  const [salt, encrypted] = await Promise.all([getLocal(SALT_KEY), getLocal(DATA_KEY)]);
  if (!salt || !encrypted) throw new Error('Recovery key not set');
  try {
    const payload = await decryptPayload(encrypted, code.trim().toLowerCase(), base64ToBytes(salt));
    return payload.masterPassword;
  } catch {
    throw new Error('Invalid recovery key');
  }
}

export async function hasRecoveryCode(): Promise<boolean> {
  return !!(await getLocal(DATA_KEY));
}
