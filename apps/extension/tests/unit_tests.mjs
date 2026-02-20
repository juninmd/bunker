import { generateCSV, parseCSV } from '../src/utils/csv-utils.js';
import { encryptWithKey, decryptWithKey, deriveKey, bytesToBase64, base64ToBytes } from '../src/utils/crypto.js';
import assert from 'assert';

// Polyfill for crypto in Node environment if needed
if (!globalThis.crypto) {
    globalThis.crypto = await import('node:crypto').then(m => m.webcrypto);
}

console.log('Running tests...');

async function testCSV() {
    console.log('Testing CSV...');
    const data = [
        { site: 'google.com', username: 'user1', password: 'pw"1', extra: 'line\nbreak' },
        { site: 'yahoo.com', username: 'user,2', password: 'pw2', extra: '' }
    ];
    const headers = ['site', 'username', 'password', 'extra'];

    const csv = generateCSV(data, headers);
    // console.log('Generated CSV:', csv);

    const parsed = parseCSV(csv);
    // console.log('Parsed CSV:', parsed);

    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].site, 'google.com');
    assert.strictEqual(parsed[0].password, 'pw"1');
    assert.strictEqual(parsed[0].extra, 'line\nbreak');
    assert.strictEqual(parsed[1].username, 'user,2');

    console.log('CSV Test Passed ✅');
}

async function testCrypto() {
    console.log('Testing Crypto...');
    const masterPassword = 'secure_password';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const payload = {
        schemaVersion: 1,
        credentials: [{ id: 1, site: 'example.com', password: 'secret' }]
    };

    // 1. Derive key
    const key = await deriveKey(masterPassword, salt);

    // 2. Encrypt with key
    const encrypted = await encryptWithKey(payload, key);
    // console.log('Encrypted payload:', encrypted);

    // 3. Decrypt with key
    const decrypted = await decryptWithKey(encrypted, key);
    // console.log('Decrypted payload:', decrypted);

    assert.deepStrictEqual(decrypted, payload);
    console.log('Crypto (Key-based) Test Passed ✅');
}

(async () => {
    try {
        await testCSV();
        await testCrypto();
        console.log('All tests passed! 🚀');
    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
})();
