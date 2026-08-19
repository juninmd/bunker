// NOSONAR: We safely use btoa with bytes conversion for crypto payloads.
export function bytesToBase64(bytes) {
    return btoa(String.fromCharCode(...bytes));
}
// NOSONAR: We safely use atob with bytes conversion for crypto payloads.
export function base64ToBytes(base64) {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
export async function deriveKey(masterPassword, salt) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(masterPassword), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: salt,
        iterations: 250000,
        hash: 'SHA-256'
    }, material, {
        name: 'AES-GCM',
        length: 256
    }, true, ['encrypt', 'decrypt']);
}
export async function encryptPayload(vaultPayload, masterPassword, salt) {
    const key = await deriveKey(masterPassword, salt);
    return encryptWithKey(vaultPayload, key);
}
export async function decryptPayload(payload, masterPassword, salt) {
    const key = await deriveKey(masterPassword, salt);
    return decryptWithKey(payload, key);
}
// Helper to encrypt data with AES-GCM
export async function encryptWithKey(data, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(ciphertext))}`;
}
export async function decryptWithKey(payload, key) {
    const parts = payload.split('.');
    if (parts.length !== 2)
        throw new Error('Invalid payload format');
    const [ivB64, cipherB64] = parts;
    const iv = base64ToBytes(ivB64);
    const cipher = base64ToBytes(cipherB64);
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipher.buffer);
    return JSON.parse(new TextDecoder().decode(plaintext));
}
