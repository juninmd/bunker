import { LEGACY_KDF_ITERATIONS, VAULT_KDF_ITERATIONS, base64ToBytes, bytesToBase64, encryptWithKey } from './crypto.js';

const LOCAL_PREFIX = 'pbkdf2-';
const REMOTE_FORMAT = 'bunkerpass.vault.v2';
const MAX_KDF_ITERATIONS = 5000000;

// Local blob embeds its KDF cost so a migration is a single atomic write.
export function formatLocalBlob(iterations: number, ciphertext: string): string {
  return `${LOCAL_PREFIX}${iterations}:${ciphertext}`;
}

// Storage is writable by anything with profile access: a cost below legacy would weaken the rewrite, one above the cap hangs unlock.
export function parseLocalBlob(stored: string): { iterations: number; ciphertext: string } {
  const match = /^pbkdf2-(\d+):(.+)$/s.exec(stored);
  if (!match) return { iterations: LEGACY_KDF_ITERATIONS, ciphertext: stored };
  const iterations = Number(match[1]);
  if (!Number.isSafeInteger(iterations) || iterations < LEGACY_KDF_ITERATIONS || iterations > MAX_KDF_ITERATIONS) throw new Error('INVALID_KDF');
  return { iterations, ciphertext: match[2] as string };
}

export interface RemoteEnvelope {
  salt: Uint8Array;
  iterations: number;
  data: string;
}

// The remote file declares the KDF salt and cost shared by every device, so a device holding the key syncs without the password.
export async function sealRemoteVault(payload: unknown, key: CryptoKey, salt: Uint8Array, iterations: number): Promise<string> {
  const data = await encryptWithKey(payload, key);
  return JSON.stringify({ format: REMOTE_FORMAT, salt: bytesToBase64(salt), iterations, data });
}

export function parseRemoteEnvelope(content: string): RemoteEnvelope {
  let envelope: { format?: string; salt?: string; iterations?: number; data?: string };
  try {
    envelope = JSON.parse(content);
  } catch {
    throw new Error('Unsupported remote vault format');
  }
  const { format, salt, iterations, data } = envelope;
  // The file is untrusted: refuse KDF downgrades and costs large enough to hang the device.
  const cost = iterations as number;
  if (format !== REMOTE_FORMAT || !salt || !data || !Number.isInteger(cost) || cost < VAULT_KDF_ITERATIONS || cost > MAX_KDF_ITERATIONS) {
    throw new Error('Unsupported remote vault format');
  }
  const saltBytes = base64ToBytes(salt);
  if (saltBytes.length < 16) throw new Error('Unsupported remote vault format');
  return { salt: saltBytes, iterations: cost, data };
}

export function sameKdf(envelope: RemoteEnvelope, salt: Uint8Array | null, iterations: number): boolean {
  return !!salt && envelope.iterations === iterations && bytesToBase64(envelope.salt) === bytesToBase64(salt);
}
