import assert from 'assert';
import { upsertItem, softDelete, restoreFromHistory, validateDraft } from '../src/utils/item-model.js';
import { generatePassphrase, sealShare, openShare } from '../src/utils/share-codec.js';
import { buildSecurityReport, findLeaked, sha1Hex } from '../src/utils/security-report.js';
import { passwordStrength } from '../src/utils/password-strength.js';
import { deriveKey, encryptWithKey, bytesToBase64, LEGACY_KDF_ITERATIONS } from '../src/utils/crypto.js';
import { holdPendingSave, takePendingSave, resolvePendingSave, trackOffer, settledOffer } from '../src/services/pending-save.js';

// Editing a password must never lose the old one: it is the only way back after a bad change.
let { items, item, created } = upsertItem([], { type: 'password', site: 'https://GitHub.com/', username: 'ana', password: 'old-pass' }, 't1');
assert.ok(created);
assert.strictEqual(item.site, 'github.com', 'site is normalized so autofill matches');
({ items, created } = upsertItem(items, { type: 'password', site: 'github.com', username: 'ana', password: 'new-pass' }, 't2'));
assert.ok(!created, 'same site and user updates instead of duplicating');
assert.deepStrictEqual(items[0].history, [{ password: 'old-pass', timestamp: 't1' }]);
items = restoreFromHistory(items, items[0].id, 0, 't3');
assert.strictEqual(items[0].password, 'old-pass');
assert.strictEqual(items[0].history[0].password, 'new-pass', 'restoring keeps the replaced password in history');
items = softDelete(items, items[0].id, 't4');
assert.strictEqual(items[0].deletedAt, 't4', 'delete is a tombstone so sync propagates it');
assert.ok(upsertItem(items, { type: 'password', site: 'github.com', username: 'ana', password: 'x' }).created, 'deleted items are not revived by identity');
assert.strictEqual(validateDraft({ type: 'password', site: 'a.com', password: '' }), 'Informe a senha.');
assert.strictEqual(validateDraft({ type: 'card', site: 'Visa', details: {} }), 'Informe o número do cartão.');
console.log('Item Model Test Passed');

const passphrase = generatePassphrase();
assert.match(passphrase, /^([a-z2-9]{5}-){4}[a-z2-9]{5}$/);
assert.notStrictEqual(passphrase, generatePassphrase());
const code = await sealShare({ site: 'a.com', password: 'p' }, passphrase);
assert.ok(code.startsWith('bunker2:'));
assert.deepStrictEqual(await openShare(`  ${code}\n`, passphrase), { site: 'a.com', password: 'p' });
await assert.rejects(openShare(code, generatePassphrase()), /WRONG_SHARE_PASSPHRASE/);
await assert.rejects(openShare('garbage', passphrase), /INVALID_SHARE_CODE/);
const legacySalt = crypto.getRandomValues(new Uint8Array(16));
const legacy = `${bytesToBase64(legacySalt)}:${await encryptWithKey({ v: 1 }, await deriveKey('1234', legacySalt, LEGACY_KDF_ITERATIONS))}`;
assert.deepStrictEqual(await openShare(legacy, '1234'), { v: 1 }, 'codes shared before the upgrade still open');
console.log('Share Codec Test Passed');

assert.ok(passwordStrength('netflix123').score <= 1, 'word plus digits is weak');
assert.ok(passwordStrength('Senha2024!').score <= 1);
assert.ok(passwordStrength('correcthorsebatterystaple').score >= 3, 'long passphrases are not punished');
assert.ok(passwordStrength('Gh!7pQz#v2Lm9Rt$').score === 4);
assert.strictEqual(passwordStrength('').score, 0);
const now = Date.parse('2026-01-01');
// NOSONAR: fixture passwords below are deliberately weak test inputs, not credentials.
const report = buildSecurityReport([
  { type: 'password', site: 'a', password: 'netflix123', updatedAt: '2026-01-01' }, // NOSONAR
  { type: 'password', site: 'b', password: 'netflix123', updatedAt: '2024-01-01' }, // NOSONAR
  { type: 'password', site: 'c', password: 'Gh!7pQz#v2Lm9Rt$', totp: 'X', updatedAt: '2026-01-01' }, // NOSONAR
  { type: 'password', site: 'd', password: 'netflix123', deletedAt: 'x' }, // NOSONAR
  { type: 'note', site: 'e', notes: 'n' }
], now);
assert.deepStrictEqual([report.total, report.weak.length, report.reused.length, report.old.length, report.withoutTotp], [3, 2, 2, 1, 2]);
assert.ok(report.score < 100 && report.score >= 0);
console.log('Security Report Test Passed');

const hash = await sha1Hex('password');
assert.strictEqual(hash, '5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8');
const asked = [];
const fetcher = async url => { asked.push(url); return new Response(`${hash.slice(5)}:9\r\nABC:1`); };
const leaked = await findLeaked([{ site: 'a', password: 'password' }, { site: 'b', password: 'password' }, { site: 'c', password: 'unique-Zz9!' }], fetcher); // NOSONAR: known-leaked test input
assert.deepStrictEqual(leaked.map(i => i.site), ['a', 'b']);
assert.ok(asked.every(url => /\/range\/[0-9A-F]{5}$/.test(url)), 'only the 5-char prefix leaves the device');
assert.strictEqual(asked.length, 2, 'identical prefixes are fetched once');
await assert.rejects(findLeaked([{ site: 'a', password: 'x' }], async () => new Response('', { status: 503 })), /HIBP 503/);
console.log('Leak Check Test Passed');

// The save offer survives navigation, is prompted once, and the password is never handed back to a page.
holdPendingSave(7, 'acme.com', 'ana', 's3cret', false);
assert.strictEqual(resolvePendingSave(8, 'acme.com'), null, 'other tabs cannot claim the offer');
holdPendingSave(7, 'acme.com', 'ana', 's3cret', false);
assert.strictEqual(resolvePendingSave(7, 'acme.com'), null, 'saving requires the user to have been prompted');
holdPendingSave(7, 'acme.com', 'ana', 's3cret', false);
assert.strictEqual(takePendingSave(7, 'evil.com'), null, 'a page from another site in the same tab never sees the offer');
assert.strictEqual(resolvePendingSave(7, 'evil.com'), null, 'nor can it confirm or discard it');
const offer = takePendingSave(7, 'login.acme.com');
assert.deepStrictEqual(offer, { host: 'acme.com', username: 'ana', update: false });
assert.strictEqual(takePendingSave(7, 'acme.com'), null, 'a second page does not prompt again');
assert.strictEqual(resolvePendingSave(7, 'acme.com').password, 's3cret');
assert.strictEqual(resolvePendingSave(7, 'acme.com'), null);
const realNow = Date.now;
holdPendingSave(9, 'acme.com', 'ana', 's3cret', true);
Date.now = () => realNow() + 61_000;
assert.strictEqual(takePendingSave(9, 'acme.com'), null, 'offers expire after a minute');
Date.now = realNow;
trackOffer(11, new Promise(done => setTimeout(() => { holdPendingSave(11, 'acme.com', 'ana', 's3cret', false); done(); }, 20)));
await settledOffer(11);
assert.ok(takePendingSave(11, 'acme.com'), 'a page loading before the vault check finishes still gets the prompt');
console.log('Pending Save Test Passed');
