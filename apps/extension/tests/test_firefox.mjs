import assert from 'assert';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { installChromeMock } from './chrome_mock.mjs';

const { chrome } = installChromeMock();
const { firefoxManifest } = await import('../scripts/build-firefox.mjs');
const pkce = await import('../src/utils/oauth-pkce.js');
const { GoogleDriveService } = await import('../src/services/google-drive.js');
const { clearClipboardNow } = await import('../src/services/clipboard-guard.js');

// Firefox refuses service workers and the offscreen permission; everything else must survive the transform.
const chromeManifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const ff = firefoxManifest(chromeManifest, { BUNKER_FIREFOX_CLIENT_ID: 'ff.apps.googleusercontent.com' });
assert.deepStrictEqual(ff.background, { scripts: ['src/background.js'], type: 'module' });
assert.ok(!ff.permissions.includes('offscreen'));
assert.deepStrictEqual(ff.permissions, chromeManifest.permissions.filter(p => p !== 'offscreen'));
assert.deepStrictEqual(ff.content_scripts, chromeManifest.content_scripts);
assert.ok(ff.host_permissions.includes('https://oauth2.googleapis.com/*'));
assert.strictEqual(ff.browser_specific_settings.gecko.id, 'bunkerpass@bunker.local');
assert.deepStrictEqual(ff.browser_specific_settings.gecko.data_collection_permissions, { required: ['none'] });
assert.strictEqual(ff.oauth2.client_id, 'ff.apps.googleusercontent.com', 'Chrome client id must not leak into Firefox');
assert.ok(!('client_secret' in ff.oauth2) && !('key' in ff));
console.log('Firefox Manifest Test Passed');

// S256 challenge checked against Node's own SHA-256, an independent implementation.
const verifier = 'dBjftJeZ4CVP-mJ92ZrlWo2eKdZIfpjSV8yvfoEvE8Y';
assert.strictEqual(await pkce.pkceChallenge(verifier), createHash('sha256').update(verifier).digest('base64url'));
assert.strictEqual(pkce.loopbackRedirectUri('https://abc123.extensions.allizom.org/'), 'http://127.0.0.1/mozoauth2/abc123');
const request = await pkce.buildAuthRequest('cid', ['https://www.googleapis.com/auth/drive.file'], 'http://127.0.0.1/mozoauth2/abc123');
const sent = new URL(request.url).searchParams;
assert.strictEqual(sent.get('code_challenge_method'), 'S256');
assert.strictEqual(sent.get('state'), request.state);
assert.ok(!sent.has('access_type'), 'no refresh token is requested');
const ok = `http://127.0.0.1/mozoauth2/abc123?state=${request.state}&code=4%2Fxyz`;
assert.strictEqual(pkce.parseAuthRedirect(ok, request), '4/xyz');
// A forged redirect (CSRF / code injection) or a foreign redirect target is refused.
assert.throws(() => pkce.parseAuthRedirect(`http://127.0.0.1/mozoauth2/abc123?state=forged&code=x`, request), /STATE_MISMATCH/);
assert.throws(() => pkce.parseAuthRedirect(`https://evil.test/mozoauth2/abc123?state=${request.state}&code=x`, request), /BAD_REDIRECT/);
assert.throws(() => pkce.parseAuthRedirect(`http://127.0.0.1/mozoauth2/abc123?state=${request.state}&error=access_denied`, request), /ACCESS_DENIED/);
assert.throws(() => pkce.parseAuthRedirect(`http://127.0.0.1/mozoauth2/abc123?state=${request.state}`, request), /NO_CODE/);
assert.strictEqual(pkce.tokenRequestBody('c', request, 'cid').get('code_verifier'), request.verifier);
assert.ok(!pkce.tokenRequestBody('c', request, 'cid').has('client_secret'));
console.log('Firefox OAuth PKCE Test Passed');

// Without getAuthToken the Drive client runs the PKCE flow once and reuses the token until it expires.
chrome.runtime.getManifest = () => ({ oauth2: { client_id: 'cid', scopes: ['s'] } });
let flows = 0;
chrome.identity = {
  getRedirectURL: () => 'https://abc123.extensions.allizom.org/',
  launchWebAuthFlow: async ({ url }) => {
    flows++;
    const state = new URL(url).searchParams.get('state');
    return `http://127.0.0.1/mozoauth2/abc123?state=${state}&code=good`;
  }
};
const seen = [];
globalThis.fetch = async (url, init) => {
  seen.push(String(url));
  if (String(url).startsWith('https://oauth2.googleapis.com/token')) {
    assert.strictEqual(init.body.get('code'), 'good');
    return Response.json({ access_token: 'ff-token', expires_in: 3600 });
  }
  assert.strictEqual(init.headers.Authorization, 'Bearer ff-token');
  return Response.json({ files: [] });
};
const drive = new GoogleDriveService();
await drive.findFile('vault.enc');
await drive.findFile('vault.enc');
assert.strictEqual(flows, 1, 'token must be reused while valid');
assert.strictEqual(seen.filter(u => u.includes('/token')).length, 1);
// A silent failure (no Google session) opens the consent window; a forged redirect is never retried.
const modes = [];
chrome.identity.launchWebAuthFlow = async ({ url, interactive }) => {
  modes.push(interactive);
  if (!interactive) throw new Error('User interaction required.');
  return `http://127.0.0.1/mozoauth2/abc123?state=${new URL(url).searchParams.get('state')}&code=good`;
};
await new GoogleDriveService().findFile('vault.enc');
assert.deepStrictEqual(modes, [false, true]);
modes.length = 0;
chrome.identity.launchWebAuthFlow = async ({ interactive }) => { modes.push(interactive); return 'http://127.0.0.1/mozoauth2/abc123?state=forged&code=evil'; };
await assert.rejects(new GoogleDriveService().findFile('vault.enc'), /STATE_MISMATCH/);
assert.deepStrictEqual(modes, [false], 'a tampered silent response must not trigger the consent window');
console.log('Firefox Drive Token Test Passed');

// Firefox has no offscreen documents: the event page itself must empty the clipboard.
let cleared = 0;
globalThis.document = {
  addEventListener(type, fn) {
    assert.strictEqual(type, 'copy');
    const data = new Map([['text/plain', 'secret']]);
    fn({ clipboardData: { setData: (k, v) => data.set(k, v) }, preventDefault() {} });
    if (data.get('text/plain') === '') cleared++;
  },
  execCommand: cmd => cmd === 'copy'
};
assert.strictEqual(chrome.offscreen, undefined);
await clearClipboardNow();
assert.strictEqual(cleared, 1, 'clipboard not cleared without offscreen API');
delete globalThis.document;
console.log('Firefox Clipboard Clear Test Passed');
