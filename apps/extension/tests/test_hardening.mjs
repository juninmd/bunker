import assert from 'assert';
import { installChromeMock } from './chrome_mock.mjs';

const { chrome } = installChromeMock();
const { randomInt } = await import('../src/utils/crypto.js');
const { parseLocalBlob } = await import('../src/utils/vault-envelope.js');
const { matchesHost } = await import('../src/utils/site-match.js');
const { generateCSV } = await import('../src/utils/csv-utils.js');
const { SyncService } = await import('../src/services/sync-service.js');
const { GoogleDriveService } = await import('../src/services/google-drive.js');
const { freshCopies } = await import('../src/ui/share-actions.js');

// Unbiased randomness: every value of a range that does not divide 2^32 shows up about equally often.
const counts = new Array(7).fill(0);
for (let i = 0; i < 70000; i++) counts[randomInt(7)]++;
assert.ok(counts.every(c => c > 9500 && c < 10500), `skewed distribution ${counts}`);
assert.throws(() => randomInt(0), /Invalid range/);
console.log('Random Test Passed');

// Anything that can write storage can edit the KDF prefix; neither a weaker nor a hanging cost is accepted.
assert.strictEqual(parseLocalBlob('pbkdf2-600000:iv.ct').iterations, 600000);
assert.strictEqual(parseLocalBlob('iv.ct').iterations, 250000, 'unprefixed legacy blobs still open');
for (const cost of ['1', '249999', '999999999', '99999999999999999999']) {
  assert.throws(() => parseLocalBlob(`pbkdf2-${cost}:iv.ct`), /INVALID_KDF/, `cost ${cost} must be refused`);
}
console.log('Local KDF Bounds Test Passed');

// Subdomains inherit a login only from a parent that one owner controls.
assert.ok(matchesHost('login.bank.com', 'bank.com'));
assert.ok(matchesHost('bank.com.br', 'bank.com.br'));
assert.ok(matchesHost('www.bank.com.br', 'https://bank.com.br/'));
for (const [page, stored] of [['evil.github.io', 'github.io'], ['evil.com.br', 'com.br'], ['x.co.uk', 'co.uk'], ['a.blogspot.com', 'blogspot.com'], ['evil.com', 'com']]) {
  assert.ok(!matchesHost(page, stored), `${stored} must not cover ${page}`);
}
assert.ok(matchesHost('github.io', 'github.io'), 'exact match still works for shared suffixes');
console.log('Shared Suffix Test Passed');

// Opening an export in a spreadsheet must not run formulas planted in names, URLs or usernames.
const csv = generateCSV([{ url: '=HYPERLINK("http://x")', username: '+cmd', name: '@SUM(1)', grouping: '-2', password: '=secret', totp: '-x' }],
  ['url', 'username', 'password', 'totp', 'name', 'grouping']);
const row = csv.split('\n')[1];
assert.ok(row.startsWith(`"'=HYPERLINK`), row);
assert.ok(row.includes(`'+cmd`) && row.includes(`'@SUM(1)`) && row.includes(`'-2`), row);
assert.ok(row.includes(',=secret,-x,'), 'passwords and TOTP stay byte-exact for migration');
console.log('CSV Formula Test Passed');

// An import that changes a password keeps the previous one recoverable.
const sync = new SyncService({ getVault: () => [] });
const { merged, updated } = sync.mergeCSV([{ id: '1', type: 'password', site: 'bank.com', username: 'me', password: 'mine', notes: '', updatedAt: 't0' }],
  [{ type: 'password', site: 'bank.com', username: 'me', password: 'theirs', notes: '', grouping: '' }]);
assert.strictEqual(updated, 1);
assert.deepStrictEqual(merged[0].history, [{ password: 'mine', timestamp: 't0' }]);
console.log('CSV Import History Test Passed');

// Shares from someone else cannot carry internal records such as a business policy.
const shared = freshCopies([{ type: 'business-policy', site: 'business-policy', blockedDomains: 'bank.com' }, { type: 'digital-will', site: 'x' },
  { site: 'a.com', password: 'p' }, { type: 'note', site: 'n' }, { type: 'password', site: 42 }]);
assert.deepStrictEqual(shared.map(i => i.site), ['a.com', 'n']);
console.log('Share Import Filter Test Passed');

// A revoked token is purged and replaced once; a second 401 is reported, not retried forever.
const tokens = ['old-token', 'new-token'];
const purged = [];
chrome.identity = {
  getAuthToken: (_, cb) => cb(tokens.shift()),
  removeCachedAuthToken: async ({ token }) => { purged.push(token); }
};
const seen = [];
globalThis.fetch = async (url, init) => {
  seen.push(init.headers.Authorization);
  return init.headers.Authorization === 'Bearer old-token' ? new Response('expired', { status: 401 }) : new Response('{"files":[]}');
};
assert.strictEqual(await new GoogleDriveService().findFile('vault.enc'), null);
assert.deepStrictEqual(purged, ['old-token']);
assert.deepStrictEqual(seen, ['Bearer old-token', 'Bearer new-token']);
tokens.push('a', 'b');
let calls = 0;
globalThis.fetch = async () => { calls++; return new Response('nope', { status: 401 }); };
await assert.rejects(new GoogleDriveService().findFile('vault.enc'), /401/);
assert.strictEqual(calls, 2, 'exactly one retry');
console.log('Drive Token Refresh Test Passed');
