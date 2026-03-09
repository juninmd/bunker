import { generatePassword, generateUsername } from '../src/utils/password-generator.js';
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

console.log('\nTesting Username Generator...');

// Test 1: Length
const u1 = generateUsername(12);
assert.strictEqual(u1.length, 12);
console.log('Test 1 Passed: Length correct');

// Test 2: Only alphanumeric and lowercase
const u2 = generateUsername(100);
assert.match(u2, /^[a-z0-9]+$/, 'Must contain only lowercase letters and numbers');
console.log('Test 2 Passed: Only alphanumeric characters');

// Test 3: Starts with a letter
const u3 = generateUsername(50);
assert.match(u3[0], /^[a-z]$/, 'Must start with a lowercase letter');
console.log('Test 3 Passed: Starts with a letter');

// Test 4: Throws error if length < 1
assert.throws(() => generateUsername(0), /Length must be at least 1/);
console.log('Test 4 Passed: Throws error for invalid length');

console.log('All Username Generator tests passed! 🚀');
