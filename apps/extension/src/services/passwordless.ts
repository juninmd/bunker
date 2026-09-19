import { AuthService } from './auth-service.js';
import { decryptWithKey, encryptWithKey } from '../utils/crypto.js';
import { getLocal, setLocalMany } from '../utils/local-storage.js';

const ID_KEY = 'bunkerpass.passwordless.credentialId';
const SALT_KEY = 'bunkerpass.passwordless.salt';
const DATA_KEY = 'bunkerpass.passwordless.encryptedData';

// The authenticator's PRF output is a 256-bit key that wraps the master password on this device.
async function prfKey(bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function hasPasswordless(): Promise<boolean> {
  return !!(await getLocal(ID_KEY));
}

export async function setupPasswordless(masterPassword: string): Promise<void> {
  const registration = await AuthService.registerPasswordless('BunkerPassUser');
  const bytes = await AuthService.authenticatePasswordless(registration.credentialId, registration.salt);
  const encrypted = await encryptWithKey({ masterPassword }, await prfKey(bytes));
  await setLocalMany({ [ID_KEY]: registration.credentialId, [SALT_KEY]: registration.salt, [DATA_KEY]: encrypted });
}

export async function recoverWithPasswordless(): Promise<string> {
  const [credentialId, salt, encrypted] = await Promise.all([getLocal(ID_KEY), getLocal(SALT_KEY), getLocal(DATA_KEY)]);
  if (!credentialId || !salt || !encrypted) throw new Error('Passwordless not configured');
  const bytes = await AuthService.authenticatePasswordless(credentialId, salt);
  const payload = await decryptWithKey(encrypted, await prfKey(bytes));
  return payload.masterPassword;
}
