namespace Bunker {
  export function bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
  }

  export function base64ToBytes(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  }

  export const VAULT_KDF_ITERATIONS = 600000;

  export async function deriveKey(masterPassword: string, salt: Uint8Array, iterations = VAULT_KDF_ITERATIONS): Promise<CryptoKey> {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(masterPassword), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations,
        hash: 'SHA-256'
      } as Pbkdf2Params,
      material,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  export async function encryptWithKey(data: any, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
  }

  export async function decryptWithKey(payload: string, key: CryptoKey): Promise<any> {
    const parts = payload.split('.');
    if (parts.length !== 2) throw new Error('Invalid payload format');
    const [ivB64, cipherB64] = parts;
    const iv = base64ToBytes(ivB64 as string);
    const cipher = base64ToBytes(cipherB64 as string);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv } as AesGcmParams, key, cipher.buffer as ArrayBuffer);
    return JSON.parse(new TextDecoder().decode(plaintext));
  }
}
