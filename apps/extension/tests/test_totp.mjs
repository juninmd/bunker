import assert from 'assert';
import { base32Decode, generateTotp, parseTotp, isValidTotp } from '../src/utils/totp.js';
import { matchesHost, sameHost } from '../src/utils/site-match.js';
import { parseCSV, mapCSVRowToVaultItem, mapVaultItemToCSVRow } from '../src/utils/csv-utils.js';

// RFC 6238 appendix B vectors (SHA-1, 8 digits, ASCII secret "12345678901234567890").
const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const rfc = { ...parseTotp(`otpauth://totp/x?secret=${rfcSecret}&digits=8`) };
for (const [seconds, expected] of [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'], [1234567890, '89005924'], [2000000000, '69279037']]) {
  assert.strictEqual((await generateTotp(rfc, seconds * 1000)).code, expected, `RFC vector at ${seconds}s`);
}
assert.deepStrictEqual(Array.from(base32Decode('gezd gnbv')), Array.from(base32Decode('GEZDGNBV')), 'spaces and case are ignored');
assert.strictEqual((await generateTotp(parseTotp(rfcSecret), 59000)).code, '287082', 'bare secret defaults to 6 digits');
assert.strictEqual((await generateTotp(parseTotp(rfcSecret), 59000)).remaining, 1);
assert.ok(!isValidTotp('not base32!'), 'invalid characters are rejected');
assert.ok(!isValidTotp('GEZDGNBV'), 'secrets under 80 bits are rejected');
assert.ok(!isValidTotp(`otpauth://hotp/x?secret=${rfcSecret}`), 'HOTP is not TOTP');
console.log('TOTP Test Passed');

assert.ok(matchesHost('login.github.com', 'https://github.com/login'), 'LastPass full URLs match by host');
assert.ok(matchesHost('github.com', 'www.github.com'));
assert.ok(!matchesHost('evilgithub.com', 'github.com'));
assert.ok(!matchesHost('foo.com', 'com'), 'bare TLD never matches subdomains');
assert.ok(sameHost('https://Bank.com/x', 'bank.com'));
console.log('Site Match Test Passed');

const csv = 'url,username,password,totp,extra,name,grouping,fav\nhttps://github.com/login,me,pw1,' + rfcSecret + ',,GitHub,Dev,0\nhttp://sn,,,,"Wi-Fi: abc",Casa,Notas,0\n';
const [login, note] = parseCSV(csv).map(mapCSVRowToVaultItem);
assert.strictEqual(login.totp, rfcSecret, 'LastPass totp column is kept');
assert.strictEqual(login.title, 'GitHub');
assert.strictEqual(login.notes, '', 'password must never be copied into notes');
assert.strictEqual(note.type, 'note');
assert.strictEqual(note.notes, 'Wi-Fi: abc');
assert.strictEqual(mapVaultItemToCSVRow(login).totp, rfcSecret, 'export round-trips totp');
console.log('LastPass CSV Test Passed');
