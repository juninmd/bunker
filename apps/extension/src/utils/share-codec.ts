import { LEGACY_KDF_ITERATIONS, VAULT_KDF_ITERATIONS, base64ToBytes, bytesToBase64, decryptWithKey, deriveKey, encryptWithKey } from './crypto.js';

const PREFIX = 'bunker2';
const WORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

// 5 groups of 5 symbols from a 31-char alphabet ≈ 124 bits: safe even if the code leaks, and easy to dictate.
export function generatePassphrase(): string {
  const limit = 256 - (256 % WORD_ALPHABET.length);
  let chars = '';
  while (chars.length < 25) {
    for (const byte of crypto.getRandomValues(new Uint8Array(32))) {
      if (byte < limit && chars.length < 25) chars += WORD_ALPHABET[byte % WORD_ALPHABET.length];
    }
  }
  return (chars.match(/.{5}/g) as string[]).join('-');
}

export async function sealShare(data: unknown, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = await encryptWithKey(data, await deriveKey(passphrase, salt, VAULT_KDF_ITERATIONS));
  return `${PREFIX}:${bytesToBase64(salt)}:${encrypted}`;
}

// Accepts the current format and the legacy "salt:iv.ciphertext" codes produced before it.
export async function openShare(code: string, passphrase: string): Promise<any> {
  const parts = code.trim().split(':');
  const modern = parts[0] === PREFIX;
  const [saltB64, payload] = modern ? [parts[1], parts[2]] : [parts[0], parts[1]];
  if (!saltB64 || !payload || parts.length !== (modern ? 3 : 2)) throw new Error('INVALID_SHARE_CODE');
  const iterations = modern ? VAULT_KDF_ITERATIONS : LEGACY_KDF_ITERATIONS;
  try {
    return await decryptWithKey(payload, await deriveKey(passphrase.trim(), base64ToBytes(saltB64), iterations));
  } catch {
    throw new Error('WRONG_SHARE_PASSPHRASE');
  }
}
