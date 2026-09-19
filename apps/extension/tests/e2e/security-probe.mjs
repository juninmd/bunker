import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, startSite, SHOTS_DIR } from './harness.mjs';
import { createVault, importLastPass, openPopup, MASTER } from './popup-steps.mjs';
import { clickjacking, leakCheckPrivacy, lockWipesPopup, messageExtension, otherOrigin, syntheticClick, tamperedKdf } from './security-attacks.mjs';

// Attacks the running extension the way a hostile page or a disk thief would, and records what held.
const SECRETS = ['Gh!7pQz#v2Lm9Rt$', 'Acme-Pa55!phrase', 'Nb#2024-seguro!Xk', 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', 'corvo-azul-77', 'ana.dev@example.com', MASTER];
const results = [];
const quiet = { step: async (name, fn) => fn(), shot: async () => undefined };
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

function leaksIn(buffer) {
  return SECRETS.filter(s => buffer.includes(Buffer.from(s, 'utf8')) || buffer.includes(Buffer.from(s, 'utf16le')));
}

function scanDir(dir, found = new Map()) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path, { throwIfNoEntry: false });
    if (!info) continue;
    if (info.isDirectory()) scanDir(path, found);
    else if (info.size < 64 * 1024 * 1024) leaksIn(readFileSync(path)).forEach(s => found.set(s, path));
  }
  return found;
}

const { server, url } = await startSite();
const app = await launch({ keepProfile: true });
try {
  const popup = await openPopup(app.context, app.popupUrl);
  await createVault(quiet, popup);
  await importLastPass(quiet, popup);

  const site = await app.context.newPage();
  await site.goto(url);
  await site.locator('.bunkerpass-icon').waitFor({ timeout: 8000 });
  await check('page script cannot autofill with synthetic clicks', () => syntheticClick(site));
  await check('page script cannot message the extension', () => messageExtension(site, app.id));
  await check('invisible icon ignores real clicks (clickjacking)', () => clickjacking(site));
  await check('another origin gets no credentials', () => otherOrigin(app.context, url));
  await check('leak check sends only 5-char hash prefixes', () => leakCheckPrivacy(app.context, popup));

  await check('no plaintext secret in chrome.storage.local', async () => {
    const dump = await app.worker.evaluate(() => chrome.storage.local.get(null).then(JSON.stringify));
    const leaked = leaksIn(Buffer.from(dump));
    expect(leaked.length === 0, `plaintext found: ${leaked.join(', ')}`);
  });
  await check('auto-lock drops the key and wipes the popup', () => lockWipesPopup(popup, app.worker));
  await check('locked vault gives pages nothing', async () => {
    await site.reload();
    await site.locator('.bunkerpass-locked').waitFor({ timeout: 8000 });
    expect(await site.locator('.bunkerpass-dropdown').count() === 0, 'picker shown while locked');
  });
  await check('tampered KDF cost is refused fast', () => tamperedKdf(popup, app.worker));
} finally {
  await app.close();
  server.close();
}

await check('no plaintext secret anywhere in the closed Chrome profile', async () => {
  const found = scanDir(app.profile);
  expect(found.size === 0, [...found].map(([s, p]) => `${s.slice(0, 4)}… in ${p.slice(app.profile.length)}`).join('; '));
});
rmSync(app.profile, { recursive: true, force: true });

writeFileSync(join(SHOTS_DIR, 'security-results.json'), JSON.stringify(results, null, 2));
const failed = results.filter(r => !r.ok);
console.log(`${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
