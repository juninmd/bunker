import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildFirefox } from '../../scripts/build-firefox.mjs';
import { extensionPage, launchFirefox } from './firefox-harness.mjs';
import { FIXTURES, EXTENSION_DIR, SHOTS_DIR, startSite } from './harness.mjs';
import { leaksIn, scanDir } from './leak-scan.mjs';
import { MASTER } from './popup-steps.mjs';
import { clickjacking, messageExtension, otherOrigin, syntheticClick } from './security-attacks.mjs';

// Runs the Firefox build in the real installed Firefox and repeats the attacks that depend on the browser.
const results = [];
const expect = (cond, message) => { if (!cond) throw new Error(message); };
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: String(e?.message || e).split('\n')[0] });
    console.log(`FAIL ${name}: ${String(e?.message || e).split('\n')[0]}`);
  }
}

const csv = readFileSync(join(FIXTURES, 'lastpass_export.csv'), 'utf8');
const addonDir = buildFirefox(resolve(EXTENSION_DIR, 'dist', 'firefox-e2e'));
const { server, url } = await startSite();
const ff = await launchFirefox(addonDir);
const background = extensionPage(ff.addon, '_generated_background_page');
const popup = extensionPage(ff.addon, 'src/popup.html');
try {
  await check('event page starts and promise-style chrome.* works', async () => {
    const info = await background(`return { promise: chrome.storage.local.get(null) instanceof Promise, session: !!chrome.storage.session, sw: typeof ServiceWorkerGlobalScope };`);
    expect(info.promise && info.session && info.sw === 'undefined', JSON.stringify(info));
  });
  await check('vault is created from the popup', async () => {
    await background(`return chrome.tabs.create({ url: chrome.runtime.getURL('src/popup.html') }).then(() => true);`);
    await popup(`
      await until(() => $('#unlockButton')?.textContent === 'Criar cofre');
      type('#masterPassword', ${JSON.stringify(MASTER)});
      type('#masterConfirm', ${JSON.stringify(MASTER)});
      $('#unlockButton').click();
      return until(() => $('#view-vault:not([hidden])'), 20000) && true;`);
  });
  await check('LastPass CSV import adds 7 items', async () => {
    const count = await popup(`
      // Right after unlock the popup may still be wiring its tabs, so the click repeats until the view opens;
      // the view then re-renders asynchronously, so settle like the Chrome suite before taking the input.
      await until(() => { $('[data-tab=settings]').click(); return $('#view-settings:not([hidden]) #localCsvInput'); });
      await new Promise(r => setTimeout(r, 450));
      const input = $('#localCsvInput');
      const files = new DataTransfer();
      files.items.add(new File([${JSON.stringify(csv)}], 'export.csv', { type: 'text/csv' }));
      Object.defineProperty(input, 'files', { value: files.files });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      (await until(() => $('dialog.bp-dialog[open] button[value=ok]'))).click();
      $('[data-tab=vault]').click();
      return until(() => document.querySelectorAll('#credentialList li.item').length >= 7 && document.querySelectorAll('#credentialList li.item').length);`);
    expect(count >= 7, `only ${count} items`);
  });
  await check('session key lives only in storage.session', async () => {
    const state = await background(`return { session: !!(await chrome.storage.session.get('sessionKey')).sessionKey, local: JSON.stringify(await chrome.storage.local.get(null)) };`);
    expect(state.session, 'no session key after unlock');
    const leaked = leaksIn(Buffer.from(state.local));
    expect(leaked.length === 0, `plaintext in storage.local: ${leaked.join(', ')}`);
  });

  const site = await ff.context.newPage();
  await site.goto(url);
  await site.locator('.bunkerpass-icon').waitFor({ timeout: 8000 });
  await check('page script cannot autofill with synthetic clicks', () => syntheticClick(site));
  await check('page script cannot message the extension', () => messageExtension(site, ff.addon.id));
  await check('invisible icon ignores real clicks (clickjacking)', () => clickjacking(site));
  await check('real click autofills the loopback login', async () => {
    await site.locator('.bunkerpass-icon').click();
    await site.locator('.bunkerpass-dropdown button').first().click();
    expect(await site.inputValue('#user') === 'ana@acme.test', 'username not filled');
    expect(await site.inputValue('#pass') === 'Acme-Pa55!phrase', 'password not filled');
    await site.screenshot({ path: join(SHOTS_DIR, 'firefox-autofill.png') });
  });
  await check('another origin gets no credentials', () => otherOrigin(ff.context, url));
  await check('copied password is cleared after 30 s without offscreen', async () => {
    await popup(`(await until(() => $('[aria-label="Copiar senha de Acme (teste local)"]'))).click(); return true;`);
    await site.waitForTimeout(1000);
    expect(await site.evaluate(() => navigator.clipboard.readText()) === 'Acme-Pa55!phrase', 'password was not copied');
    expect(await background(`return chrome.alarms.get('clearClipboard').then(a => !!a);`), 'clear alarm missing');
    await site.waitForTimeout(33000);
    expect(await site.evaluate(() => navigator.clipboard.readText()) === '', 'clipboard still holds the password');
  });
  await check('lock drops the key, wipes the popup and silences pages', async () => {
    await background(`return chrome.storage.session.remove('sessionKey').then(() => true);`);
    const items = await popup(`await until(() => $('#view-lock:not([hidden])'), 5000); return document.querySelectorAll('#credentialList li').length;`);
    expect(items === 0, `${items} decrypted rows left in the locked popup`);
    await site.reload();
    await site.locator('.bunkerpass-locked').waitFor({ timeout: 8000 });
    expect(await site.locator('.bunkerpass-dropdown').count() === 0, 'picker shown while locked');
  });
} finally {
  await ff.close();
  server.close();
}

await check('no plaintext secret anywhere in the closed Firefox profile', async () => {
  const found = scanDir(ff.profile);
  expect(found.size === 0, [...found].map(([s, p]) => `${s.slice(0, 4)}… in ${p.slice(ff.profile.length)}`).join('; '));
});
ff.dispose();

writeFileSync(join(SHOTS_DIR, 'firefox-results.json'), JSON.stringify(results, null, 2));
const failed = results.filter(r => !r.ok);
console.log(`${results.length - failed.length}/${results.length} passed`);
process.exitCode = failed.length ? 1 : 0;
