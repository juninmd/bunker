import assert from 'assert';
import { installChromeMock } from './chrome_mock.mjs';

const { chrome, listeners } = installChromeMock();
const { VaultService } = await import('../src/services/vault-service.js');
const { SyncService } = await import('../src/services/sync-service.js');
const { encryptPayload, bytesToBase64 } = await import('../src/utils/crypto.js');
await import('../src/background.js');

const MASTER = 'correct horse battery staple';
const SECRET = 'S3cr3t-Pa55w0rd!';
const VAULT_KEY = 'bunkerpass.vault.v1';

function resetStorage() {
  chrome.storage.local.data.clear();
  chrome.storage.session.data.clear();
}

function driveMock() {
  const files = new Map();
  return {
    files,
    uploads: [],
    async authorize() {},
    async findFile(name) { return files.has(name) ? { id: name, name } : null; },
    async getFileContent(id) { return files.get(id); },
    async createFile(name, content, mimeType) { this.uploads.push({ name, content, mimeType }); files.set(name, content); return { id: name }; },
    async updateFile(id, content, mimeType) { this.uploads.push({ name: id, content, mimeType }); files.set(id, content); return { id }; }
  };
}

function send(message, sender) {
  return new Promise(resolve => listeners.message(message, sender, resolve));
}

async function testWeakMasterPasswordRejected() {
  resetStorage();
  await assert.rejects(new VaultService().unlock('short'), /WEAK_MASTER_PASSWORD/);
  assert.strictEqual(chrome.storage.local.data.get(VAULT_KEY), undefined, 'no vault may be created with a weak password');
}

async function testLegacyVaultMigratesKdf() {
  resetStorage();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const legacy = await encryptPayload({ schemaVersion: 1, credentials: [{ id: '1', site: 'a.com', password: SECRET }] }, MASTER, salt);
  chrome.storage.local.data.set('bunkerpass.salt.v1', bytesToBase64(salt));
  chrome.storage.local.data.set(VAULT_KEY, legacy);

  const vault = await new VaultService().unlock(MASTER);
  assert.strictEqual(vault[0].password, SECRET, 'legacy vault must still open');
  assert.match(chrome.storage.local.data.get(VAULT_KEY), /^pbkdf2-600000:/, 'vault must be re-encrypted at 600k iterations');
  assert.strictEqual((await new VaultService().unlock(MASTER))[0].password, SECRET);
  await assert.rejects(new VaultService().unlock('wrong password here'), /Invalid password/);
}

async function testSyncUploadsOnlyCiphertext() {
  resetStorage();
  const deviceA = new VaultService();
  await deviceA.unlock(MASTER);
  await deviceA.save([{ id: '1', site: 'bank.com', username: 'me', password: SECRET, updatedAt: new Date().toISOString() }]);
  const drive = driveMock();
  const syncA = new SyncService(deviceA);
  syncA.driveService = drive;
  await syncA.sync();

  assert.deepStrictEqual(drive.uploads.map(u => u.name), ['vault.enc'], 'only the encrypted vault may be uploaded');
  assert.ok(!drive.uploads[0].content.includes(SECRET), 'uploaded file must not contain plaintext');

  resetStorage();
  const deviceB = new VaultService();
  await deviceB.unlock(MASTER);
  const syncB = new SyncService(deviceB);
  syncB.driveService = drive;
  const { vault } = await syncB.sync();
  assert.strictEqual(vault[0].password, SECRET, 'a device with a different local salt must open the remote vault');
}

async function testPinIsMemoryOnlyAndWipedAfterFailures() {
  resetStorage();
  chrome.storage.local.data.set('bunkerpass.pin.encrypted', 'legacy-on-disk');
  const vault = new VaultService();
  await vault.unlock(MASTER);
  assert.ok(![...chrome.storage.local.data.keys()].some(k => k.includes('pin')), 'legacy on-disk PIN must be purged');

  await vault.setupPin('4821');
  assert.ok(![...chrome.storage.local.data.keys()].some(k => k.includes('pin')), 'PIN envelope must never hit disk');
  vault.lock();
  await vault.unlockWithPin('4821');
  assert.strictEqual(vault.masterPassword, MASTER);

  for (let i = 0; i < 5; i++) await assert.rejects(vault.unlockWithPin('0000'), /Invalid PIN/);
  assert.strictEqual(await vault.hasPin(), false, 'PIN must be wiped after 5 failures');
  await assert.rejects(vault.unlockWithPin('4821'), /PIN not set/);
  await assert.rejects(vault.setupPin('12'), /PIN too short/);
}

async function testAutofillTrustsSenderOrigin() {
  resetStorage();
  const vault = new VaultService();
  await vault.unlock(MASTER);
  await vault.save([{ id: '1', site: 'bank.com', username: 'me', password: SECRET }]);
  await vault.exportSessionKey();

  const fromBank = { id: 'bunker-test', tab: {}, url: 'https://login.bank.com/' };
  const fromEvil = { id: 'bunker-test', tab: {}, url: 'https://evil.com/' };
  assert.strictEqual((await send({ type: 'GET_CREDENTIALS', domain: 'bank.com' }, fromBank)).credentials[0].password, SECRET);
  assert.deepStrictEqual((await send({ type: 'GET_CREDENTIALS', domain: 'bank.com' }, fromEvil)).credentials, [], 'claimed domain must be ignored');
  assert.strictEqual((await send({ type: 'GET_CREDENTIALS' }, { id: 'other-ext', tab: {}, url: 'https://bank.com/' })).error, 'FORBIDDEN');

  const check = await send({ type: 'CHECK_CREDENTIAL', username: 'me', password: 'guess' }, { ...fromBank, url: 'https://bank.com/' });
  assert.deepStrictEqual(check, { stored: true, same: false }, 'check must never echo the stored password');

  await send({ type: 'SAVE_CREDENTIAL', data: { site: 'bank.com', username: 'new', password: 'x' } }, fromEvil);
  const reopened = await new VaultService().unlock(MASTER);
  assert.ok(reopened.some(c => c.site === 'evil.com' && c.username === 'new'), 'saved site must be the sender origin');
  assert.ok(!reopened.some(c => c.site === 'bank.com' && c.username === 'new'));
}

for (const test of [testWeakMasterPasswordRejected, testLegacyVaultMigratesKdf, testSyncUploadsOnlyCiphertext, testPinIsMemoryOnlyAndWipedAfterFailures, testAutofillTrustsSenderOrigin]) {
  await test();
  console.log(`${test.name} passed`);
}
