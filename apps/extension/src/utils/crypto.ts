export function bytesToBase64(bytes: any): string {
  // @ts-ignore
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(masterPassword), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 250000,
      hash: 'SHA-256'
    },
    material,
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptPayload(vaultPayload: any, masterPassword: string, salt: Uint8Array): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterPassword, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(vaultPayload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as any }, key, plaintext as any);
  // @ts-ignore
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptPayload(payload: string, masterPassword: string, salt: Uint8Array): Promise<any> {
  const [ivB64, cipherB64] = payload.split('.');
  const iv = base64ToBytes(ivB64);
  const cipher = base64ToBytes(cipherB64);
  const key = await deriveKey(masterPassword, salt);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as any }, key, cipher as any);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function decryptWithKey(payload: string, key: CryptoKey): Promise<any> {
  const [ivB64, cipherB64] = payload.split('.');
  const iv = base64ToBytes(ivB64);
  const cipher = base64ToBytes(cipherB64);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as any }, key, cipher as any);
  return JSON.parse(new TextDecoder().decode(plaintext));
}
