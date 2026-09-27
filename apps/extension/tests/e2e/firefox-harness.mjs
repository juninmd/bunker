import { firefox } from 'playwright';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installTemporaryAddon } from './firefox-rdp.mjs';

function freePort() {
  return new Promise(ok => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => ok(port));
    });
  });
}

// Real installed Firefox driven over WebDriver BiDi; the add-on goes in as a temporary add-on over RDP.
// BiDi cannot script moz-extension:// documents, so extension pages are driven through RDP instead.
export async function launchFirefox(addonDir) {
  const profile = mkdtempSync(join(tmpdir(), 'bunker-ff-'));
  const port = await freePort();
  const context = await firefox.launchPersistentContext(profile, {
    channel: 'moz-firefox',
    headless: true,
    args: ['--start-debugger-server'],
    firefoxUserPrefs: {
      'devtools.debugger.remote-port': port,
      'devtools.debugger.remote-enabled': true,
      'devtools.chrome.enabled': true,
      'devtools.debugger.prompt-connection': false,
      // Lets a test page read the clipboard without the paste prompt, to prove it was emptied.
      'dom.events.testing.asyncClipboard': true
    }
  });
  const addon = await installTemporaryAddon(port, addonDir);
  const close = async () => {
    addon.close();
    await context.close();
  };
  return { context, addon, profile, close, dispose: () => rmSync(profile, { recursive: true, force: true }) };
}

const UNTIL = `async (fn, ms = 10000) => {
  const end = Date.now() + ms;
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() > end) throw new Error('timed out waiting for ' + fn);
    await new Promise(r => setTimeout(r, 100));
  }
}`;

// Runs `body` inside an extension document with $, until() and type() helpers in scope.
export function extensionPage(addon, urlPart) {
  return body => addon.evaluate(urlPart, `(async () => {
    const until = ${UNTIL};
    const $ = s => document.querySelector(s);
    const type = (s, v) => { const el = $(s); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    ${body}
  })()`);
}
