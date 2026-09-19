import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, recorder, startSite, SHOTS_DIR } from './harness.mjs';
import { copyAndClear, createItem, createVault, importLastPass, openPopup, tourTabs } from './popup-steps.mjs';
import { accessibility, autofill, autoLock, lightTheme, pinAndLock, sessionPersists } from './session-steps.mjs';

// Drives the built extension end to end in real Chromium and leaves screenshots in docs/screenshots.
const rec = recorder();
const { server, url } = await startSite();
const app = await launch();
const errors = [];
try {
  await app.context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const first = await openPopup(app.context, app.popupUrl);
  await createVault(rec, first);
  await importLastPass(rec, first);
  await createItem(rec, first);
  await copyAndClear(rec, first, app.worker);
  await tourTabs(rec, first);
  errors.push(...first.errors);
  await first.close();

  const page = await sessionPersists(rec, app.context, app.popupUrl);
  await accessibility(rec, page);
  await autofill(rec, app.context, url);
  await pinAndLock(rec, page);
  await autoLock(rec, page, app.worker);
  errors.push(...page.errors);
  await lightTheme(rec, app.context, app.popupUrl);
} finally {
  await app.close();
  server.close();
}

rec.results.push({ name: 'no console errors in popup', ok: errors.length === 0, error: errors.join(' | ') || undefined });
writeFileSync(join(SHOTS_DIR, 'results.json'), JSON.stringify(rec.results, null, 2));
const failed = rec.results.filter(r => !r.ok);
console.log(`${rec.results.length - failed.length}/${rec.results.length} passed`);
process.exit(failed.length ? 1 : 0);
