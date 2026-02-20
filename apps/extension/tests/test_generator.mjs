import { generatePassword } from '../src/utils/password-generator.js';
import assert from 'assert';

if (!globalThis.crypto) {
    globalThis.crypto = await import('node:crypto').then(m => m.webcrypto);
}

console.log('Testing Password Generator...');

// Test 1: Length
const p1 = generatePassword(16);
assert.strictEqual(p1.length, 16);
console.log('Test 1 Passed: Length correct');

// Test 2: Character Sets
const p2 = generatePassword(100, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
});
assert.match(p2, /[A-Z]/, 'Must contain uppercase');
assert.match(p2, /[a-z]/, 'Must contain lowercase');
assert.match(p2, /[0-9]/, 'Must contain numbers');
// Escape special regex chars in symbols check or just check one by one?
// Simplest is to check that it contains at least one symbol.
const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
let hasSymbol = false;
for (const char of p2) {
    if (symbols.includes(char)) {
        hasSymbol = true;
        break;
    }
}
assert.ok(hasSymbol, 'Must contain symbols');
console.log('Test 2 Passed: Contains all types');

// Test 3: Only Numbers
const p3 = generatePassword(10, {
    uppercase: false,
    lowercase: false,
    numbers: true,
    symbols: false
});
assert.match(p3, /^[0-9]+$/, 'Must contain ONLY numbers');
console.log('Test 3 Passed: Only numbers');

// Test 4: Length Correction
const p4 = generatePassword(2, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
});
assert.strictEqual(p4.length, 4, 'Should auto-correct length to minimum required types');
console.log('Test 4 Passed: Length auto-corrected');

console.log('All Password Generator tests passed! 🚀');
