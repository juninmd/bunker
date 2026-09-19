import assert from 'assert';
import { installChromeMock } from './chrome_mock.mjs';

const { chrome, listeners } = installChromeMock();
let clipboardAlarm = false;
chrome.alarms.create = name => { if (name === 'clearClipboard') clipboardAlarm = true; };
const { VaultService } = await import('../src/services/vault-service.js');
await import('../src/background.js');

const MASTER = 'correct horse battery staple';
const send = (message, sender) => new Promise(resolve => listeners.message(message, sender, resolve));
const tab = (id, url) => ({ id: 'bunker-test', tab: { id }, url });

const vault = new VaultService();
await vault.unlock(MASTER);
await vault.save([{ id: '1', site: 'acme.com', username: 'ana', password: 'old-Pa55!' }]);
await vault.exportSessionKey();

// Submitting a changed password on acme.com, then landing on another page of the same tab.
assert.deepStrictEqual(await send({ type: 'OFFER_SAVE', username: 'ana', password: 'new-Pa55!' }, tab(5, 'https://acme.com/login')), { pending: true });
assert.deepStrictEqual(await send({ type: 'OFFER_SAVE', username: 'ana', password: 'new-Pa55!' }, tab(6, 'http://acme.com/')), { error: 'FORBIDDEN' }, 'plain http pages cannot queue offers'); // NOSONAR: the insecure origin is the input under test
assert.deepStrictEqual(await send({ type: 'TAKE_PENDING_SAVE' }, tab(5, 'https://evil.com/')), { offer: null }, 'a page of another site in the same tab learns nothing');
const offer = await send({ type: 'TAKE_PENDING_SAVE' }, tab(5, 'https://acme.com/home'));
assert.deepStrictEqual(offer, { offer: { host: 'acme.com', username: 'ana', update: true } }, 'the prompt gets no password');
assert.deepStrictEqual(await send({ type: 'TAKE_PENDING_SAVE' }, tab(7, 'https://acme.com/')), { offer: null }, 'another tab cannot see the offer');
assert.deepStrictEqual(await send({ type: 'RESOLVE_PENDING_SAVE', accept: false }, tab(5, 'https://evil.com/')), { status: 'ACK' });
assert.ok((await send({ type: 'RESOLVE_PENDING_SAVE', accept: true }, tab(5, 'https://acme.com/home'))).success, 'a redirect to another site cannot cancel the offer');
const saved = (await new VaultService().unlock(MASTER)).find(i => i.username === 'ana');
assert.strictEqual(saved.password, 'new-Pa55!', 'the host that received the typed password is the one updated');
assert.strictEqual(saved.site, 'acme.com');

assert.deepStrictEqual(await send({ type: 'OFFER_SAVE', username: 'ana', password: 'new-Pa55!' }, tab(5, 'https://acme.com/')), { pending: false }, 'unchanged passwords are not offered');
await send({ type: 'OFFER_SAVE', username: 'bob', password: 'bob-Pa55!' }, tab(5, 'https://acme.com/'));
await send({ type: 'TAKE_PENDING_SAVE' }, tab(5, 'https://acme.com/'));
await send({ type: 'RESOLVE_PENDING_SAVE', accept: false }, tab(5, 'https://acme.com/'));
assert.ok(!(await new VaultService().unlock(MASTER)).some(i => i.username === 'bob'), 'declining saves nothing');
console.log('Save Offer Test Passed');

// Clipboard clearing and activity pings come from extension pages only, even when the popup is opened in a tab.
listeners.message({ type: 'CLEAR_CLIPBOARD_LATER' }, tab(9, 'https://evil.com/'), () => undefined);
assert.ok(!clipboardAlarm, 'web pages cannot schedule extension work');
await send({ type: 'CLEAR_CLIPBOARD_LATER' }, tab(9, 'chrome-extension://bunker-test/src/popup.html'));
assert.ok(clipboardAlarm, 'the popup in a tab can schedule the clear');
console.log('Extension Page Sender Test Passed');
