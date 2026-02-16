export function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export async function deriveKey(masterPassword, salt) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(masterPassword), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
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

export async function encryptPayload(vaultPayload, masterPassword, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterPassword, salt);
  const plaintext = new TextEncoder().encode(JSON.stringify(vaultPayload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decryptPayload(payload, masterPassword, salt) {
  const [ivB64, cipherB64] = payload.split('.');
  const iv = base64ToBytes(ivB64);
  const cipher = base64ToBytes(cipherB64);
  const key = await deriveKey(masterPassword, salt);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function decryptWithKey(payload, key) {
  const [ivB64, cipherB64] = payload.split('.');
  const iv = base64ToBytes(ivB64);
  const cipher = base64ToBytes(cipherB64);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plaintext));
}
