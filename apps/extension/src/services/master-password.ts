import { VAULT_KDF_ITERATIONS, bytesToBase64, deriveKey, encryptWithKey } from '../utils/crypto.js';
import { formatLocalBlob } from '../utils/vault-envelope.js';
import { setLocalMany } from '../utils/local-storage.js';
import { clearPin } from './pin-lock.js';
import { RECOVERY_KEYS } from './recovery-key.js';
import { MIN_MASTER_PASSWORD_LENGTH, SALT_KEY, STORAGE_KEY, VAULT_SCHEMA_VERSION, type VaultService } from './vault-service.js';

const PASSWORDLESS_KEYS = ['bunkerpass.passwordless.credentialId', 'bunkerpass.passwordless.salt', 'bunkerpass.passwordless.encryptedData'];

// Re-keys the vault in one write: used to adopt the salt shared through sync and to change the master password.
export async function rekeyVault(vault: VaultService, masterPassword: string, salt: Uint8Array, iterations: number) {
  const key = await deriveKey(masterPassword, salt, iterations);
  const encrypted = await encryptWithKey({ schemaVersion: VAULT_SCHEMA_VERSION, credentials: vault.cachedVault }, key);
  await setLocalMany({ [SALT_KEY]: bytesToBase64(salt), [STORAGE_KEY]: formatLocalBlob(iterations, encrypted) });
  Object.assign(vault, { key, salt, iterations, masterPassword });
  // The PIN wraps the previous key, so it would open nothing.
  await clearPin();
  await vault.exportSessionKey();
}

export async function changeMasterPassword(vault: VaultService, current: string, next: string) {
  if (next.length < MIN_MASTER_PASSWORD_LENGTH) throw new Error('WEAK_MASTER_PASSWORD');
  await vault.unlock(current);
  await rekeyVault(vault, next, crypto.getRandomValues(new Uint8Array(16)), VAULT_KDF_ITERATIONS);
  // Recovery and passwordless envelopes wrap the old password and would unlock nothing.
  await vault.removeStorage([...RECOVERY_KEYS, ...PASSWORDLESS_KEYS]);
}
