namespace Bunker {
  const ID_KEY = 'bunkerpass.passwordless.credentialId';
  const SALT_KEY = 'bunkerpass.passwordless.salt';
  const DATA_KEY = 'bunkerpass.passwordless.encryptedData';

  // The authenticator's PRF output is a 256-bit key that wraps the master password on this device.
  async function prfKey(bytes: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey('raw', bytes as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  export async function hasPasswordless(): Promise<boolean> {
    if (!window.electronAPI || !window.electronAPI.storageGet) return false;
    return !!(await window.electronAPI.storageGet(ID_KEY));
  }

  export async function setupPasswordless(masterPassword: string): Promise<void> {
    if (!window.electronAPI || !window.electronAPI.storageSet) return;
    const registration = await AuthService.registerPasswordless('BunkerPassUser');
    const bytes = await AuthService.authenticatePasswordless(registration.credentialId, registration.salt);
    const encrypted = await encryptWithKey({ masterPassword }, await prfKey(bytes));
    await window.electronAPI.storageSet({
      [ID_KEY]: registration.credentialId,
      [SALT_KEY]: registration.salt,
      [DATA_KEY]: encrypted
    });
  }

  export async function recoverWithPasswordless(): Promise<string> {
    if (!window.electronAPI || !window.electronAPI.storageGet) throw new Error('Storage API unavailable');

    const credentialId = await window.electronAPI.storageGet(ID_KEY);
    const salt = await window.electronAPI.storageGet(SALT_KEY);
    const encrypted = await window.electronAPI.storageGet(DATA_KEY);

    if (!credentialId || !salt || !encrypted) throw new Error('Passwordless not configured');

    const bytes = await AuthService.authenticatePasswordless(credentialId, salt);
    const payload = await decryptWithKey(encrypted, await prfKey(bytes));
    return payload.masterPassword;
  }
}
