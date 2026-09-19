import { LEGACY_KDF_ITERATIONS, base64ToBytes, bytesToBase64, decryptPayload, encryptPayload } from './crypto.js';

const LOCAL_PREFIX = 'pbkdf2-';
const REMOTE_FORMAT = 'bunkerpass.vault.v2';

// Local blob embeds its KDF cost so a migration is a single atomic write.
export function formatLocalBlob(iterations: number, ciphertext: string): string {
  return `${LOCAL_PREFIX}${iterations}:${ciphertext}`;
}

export function parseLocalBlob(stored: string): { iterations: number; ciphertext: string } {
  const match = /^pbkdf2-(\d+):(.+)$/s.exec(stored);
  if (!match) return { iterations: LEGACY_KDF_ITERATIONS, ciphertext: stored };
  return { iterations: Number(match[1]), ciphertext: match[2] as string };
}

// Remote file carries its own salt so every device can open it with the master password alone.
export async function sealRemoteVault(payload: unknown, masterPassword: string, iterations: number): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const data = await encryptPayload(payload, masterPassword, salt, iterations);
  return JSON.stringify({ format: REMOTE_FORMAT, salt: bytesToBase64(salt), iterations, data });
}

export async function openRemoteVault(content: string, masterPassword: string): Promise<any> {
  let envelope: { format?: string; salt?: string; iterations?: number; data?: string };
  try {
    envelope = JSON.parse(content);
  } catch {
    throw new Error('Unsupported remote vault format');
  }
  const { format, salt, iterations, data } = envelope;
  if (format !== REMOTE_FORMAT || !salt || !data || !Number.isInteger(iterations) || (iterations as number) < LEGACY_KDF_ITERATIONS) {
    throw new Error('Unsupported remote vault format');
  }
  return decryptPayload(data, masterPassword, base64ToBytes(salt), iterations);
}
