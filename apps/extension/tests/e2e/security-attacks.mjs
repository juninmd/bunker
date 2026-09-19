import { MASTER } from './popup-steps.mjs';

// Each attack resolves when the defence held and throws with what leaked when it did not.
const expect = (cond, message) => { if (!cond) throw new Error(message); };

export async function syntheticClick(site) {
  await site.evaluate(() => {
    document.querySelector('.bunkerpass-icon').click();
    document.querySelector('.bunkerpass-dropdown button')?.click();
  });
  await site.waitForTimeout(300);
  expect(await site.inputValue('#pass') === '', 'password was filled without a user gesture');
}

export async function messageExtension(site, extensionId) {
  const reachable = await site.evaluate(id => {
    try { chrome.runtime.sendMessage(id, { type: 'LIST_ACCOUNTS' }); return true; } catch { return false; }
  }, extensionId);
  expect(!reachable, 'chrome.runtime.sendMessage to the extension is exposed to web pages');
}

// A real click on an icon the page made invisible (the classic clickjacking setup) must do nothing.
export async function clickjacking(site) {
  for (const [prop, value] of [['opacity', '0.01'], ['clip-path', 'inset(45%)'], ['transform', 'scale(0.1)']]) {
    await site.evaluate(([p, v]) => document.querySelector('.bunkerpass-icon').style.setProperty(p, v, 'important'), [prop, value]);
    await site.locator('.bunkerpass-icon').click({ force: true });
    await site.waitForTimeout(300);
    expect(await site.locator('.bunkerpass-dropdown').count() === 0, `picker opened through an icon hidden with ${prop}`);
    await site.evaluate(p => document.querySelector('.bunkerpass-icon').style.removeProperty(p), prop);
  }
}

export async function otherOrigin(context, url) {
  const page = await context.newPage();
  await page.goto(url.replace('127.0.0.1', 'localhost'));
  await page.waitForTimeout(1500);
  const icons = await page.locator('.bunkerpass-icon').count();
  await page.close();
  expect(icons === 0, 'credentials for 127.0.0.1 were offered on localhost');
}

// The leak check may only send 5-hex-char SHA-1 prefixes; nothing else about a password leaves the device.
export async function leakCheckPrivacy(context, popup) {
  const sent = [];
  await context.route('https://api.pwnedpasswords.com/**', route => {
    sent.push(route.request().url());
    return route.fulfill({ status: 200, body: '', headers: { 'access-control-allow-origin': '*' } });
  });
  await popup.click('[data-tab=security]');
  await popup.getByRole('button', { name: /Verificar vazamentos/ }).click();
  await popup.waitForFunction(() => document.querySelector('#toast')?.textContent?.includes('vazamentos'), null, { timeout: 10000 });
  expect(sent.length > 0, 'no request reached the leak API');
  expect(sent.every(u => /\/range\/[0-9A-F]{5}$/.test(u)), `unexpected request ${sent.find(u => !/\/range\/[0-9A-F]{5}$/.test(u))}`);
}

export async function lockWipesPopup(popup, worker) {
  await popup.click('[data-tab=vault]');
  await popup.click('[aria-label="Abrir GitHub"]');
  expect((await popup.inputValue('#password')).length > 0, 'editor did not load the password');
  await popup.click('[data-back]');
  await worker.evaluate(() => chrome.storage.session.remove('sessionKey'));
  await popup.waitForSelector('#view-lock:not([hidden])', { timeout: 5000 });
  const left = await popup.evaluate(() => ({
    password: document.querySelector('#password').value,
    items: document.querySelectorAll('#credentialList li').length
  }));
  expect(!left.password && left.items === 0, `decrypted data left in the locked popup: ${JSON.stringify({ password: !!left.password, items: left.items })}`);
}

// Rewriting the local KDF cost must neither weaken the vault nor freeze the unlock screen.
export async function tamperedKdf(popup, worker) {
  await worker.evaluate(async () => {
    const key = 'bunkerpass.vault.v1';
    const blob = (await chrome.storage.local.get(key))[key];
    await chrome.storage.local.set({ [key]: blob.replace(/^pbkdf2-\d+:/, 'pbkdf2-999999999:') });
  });
  const started = Date.now();
  await popup.fill('#masterPassword', MASTER);
  await popup.press('#masterPassword', 'Enter');
  await popup.waitForFunction(() => document.querySelector('#toast')?.textContent?.includes('incorreta'), null, { timeout: 15000 });
  expect(Date.now() - started < 5000, `unlock took ${Date.now() - started} ms on a tampered cost`);
  expect(await popup.locator('#view-lock:not([hidden])').count() === 1, 'vault opened with a tampered KDF cost');
}
