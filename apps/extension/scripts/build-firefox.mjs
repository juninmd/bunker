// Builds the Firefox flavor from the Chrome manifest and the compiled sources (run `npm run build` first).
// Env: BUNKER_FIREFOX_ID (add-on id), BUNKER_FIREFOX_CLIENT_ID / BUNKER_FIREFOX_CLIENT_SECRET (Google "Desktop app" OAuth client).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FIREFOX_DIR = join(root, 'dist', 'firefox');
export const DEFAULT_GECKO_ID = 'bunkerpass@bunker.local';
const SHIPPED = new Set(['.js', '.html', '.css', '.png', '.svg']);
const CHROME_ONLY_PERMISSIONS = new Set(['offscreen']);

export function firefoxManifest(chrome, env = process.env) {
  const { background, key, oauth2, ...rest } = chrome;
  const manifest = {
    ...rest,
    // Firefox has no extension service workers; the same module runs as an event page.
    background: { scripts: [background.service_worker], type: 'module' },
    permissions: chrome.permissions.filter(p => !CHROME_ONLY_PERMISSIONS.has(p)),
    // Chrome gets tokens from getAuthToken; Firefox exchanges the PKCE code itself.
    host_permissions: [...chrome.host_permissions, 'https://oauth2.googleapis.com/*'],
    browser_specific_settings: {
      gecko: {
        id: env.BUNKER_FIREFOX_ID || DEFAULT_GECKO_ID,
        // 140 ESR: first version honoring data_collection_permissions; storage.session (115) and install-time host grants (127) predate it.
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['none'] }
      }
    }
  };
  // The Chrome client id is bound to Chrome's extension id; Firefox needs its own Desktop client.
  const clientId = env.BUNKER_FIREFOX_CLIENT_ID || 'YOUR_CLIENT_ID.apps.googleusercontent.com';
  manifest.oauth2 = { client_id: clientId, scopes: oauth2?.scopes ?? [] };
  if (env.BUNKER_FIREFOX_CLIENT_SECRET) manifest.oauth2.client_secret = env.BUNKER_FIREFOX_CLIENT_SECRET;
  return manifest;
}

export function buildFirefox(outDir = FIREFOX_DIR, env = process.env) {
  const chrome = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(join(root, 'src'), join(outDir, 'src'), {
    recursive: true,
    filter: src => !extname(src) || SHIPPED.has(extname(src))
  });
  rmSync(join(outDir, 'src', 'offscreen.html'), { force: true });
  rmSync(join(outDir, 'src', 'offscreen.js'), { force: true });
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(firefoxManifest(chrome, env), null, 2)}\n`);
  return outDir;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Firefox build at ${buildFirefox()}`);
}
