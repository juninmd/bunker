import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const EXTENSION_DIR = resolve(here, '..', '..');
export const SHOTS_DIR = resolve(EXTENSION_DIR, '..', '..', 'docs', 'screenshots');
export const FIXTURES = join(here, 'fixtures');

// Serves the fixture login page on loopback, the only plain-http origin autofill accepts.
export function startSite() {
  const html = readFileSync(join(FIXTURES, 'login.html'));
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(req.url?.startsWith('/done') ? '<h1>Signed in</h1>' : html);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

export async function launch() {
  const profile = mkdtempSync(join(tmpdir(), 'bunker-e2e-'));
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 380, height: 580 },
    args: [`--disable-extensions-except=${EXTENSION_DIR}`, `--load-extension=${EXTENSION_DIR}`]
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const close = async () => {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  };
  return { context, worker, id, popupUrl: `chrome-extension://${id}/src/popup.html`, close };
}

export function recorder() {
  mkdirSync(SHOTS_DIR, { recursive: true });
  const results = [];
  return {
    results,
    async step(name, fn) {
      const started = Date.now();
      try {
        await fn();
        results.push({ name, ok: true, ms: Date.now() - started });
        console.log(`PASS ${name}`);
      } catch (e) {
        results.push({ name, ok: false, error: String(e?.message || e).split('\n')[0] });
        console.log(`FAIL ${name}: ${String(e?.message || e).split('\n')[0]}`);
      }
    },
    shot: (page, file) => page.screenshot({ path: join(SHOTS_DIR, file) })
  };
}
