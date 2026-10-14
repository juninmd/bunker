import QuickCrypto from 'react-native-quick-crypto';
import { Buffer } from '@craftzdog/react-native-buffer';

export function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export function base64ToBytes(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export const VAULT_KDF_ITERATIONS = 600000;

export async function deriveKey(masterPassword: string, salt: Uint8Array, iterations = VAULT_KDF_ITERATIONS): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    QuickCrypto.pbkdf2(
      masterPassword,
      salt,
      iterations,
      32,
      'sha256',
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey as Buffer);
      }
    );
  });
}

export async function decryptWithKey(payload: string, key: Buffer): Promise<any> {
  const parts = payload.split('.');
  if (parts.length !== 2) throw new Error('Invalid payload format');
  const [ivB64, cipherB64] = parts;
  const iv = Buffer.from(base64ToBytes(ivB64 as string));
  const cipher = Buffer.from(base64ToBytes(cipherB64 as string));

  const decipher = QuickCrypto.createDecipheriv('aes-256-gcm', key, iv);

  // QuickCrypto AES-GCM expects the auth tag to be extracted. In standard WebCrypto, the last 16 bytes are the auth tag.
  const authTagLength = 16;
  if (cipher.length < authTagLength) {
     throw new Error('Invalid ciphertext length');
  }
  const encryptedData = Buffer.from(cipher.slice(0, cipher.length - authTagLength));
  const authTag = Buffer.from(cipher.slice(cipher.length - authTagLength));

  decipher.setAuthTag(authTag);

  let decrypted: string = decipher.update(encryptedData, 'utf8', 'utf8') as any as string;
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
