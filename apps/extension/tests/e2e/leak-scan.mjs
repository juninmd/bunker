import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { MASTER } from './popup-steps.mjs';

// Every secret in the LastPass fixture plus the master password, searched as UTF-8 and UTF-16 bytes.
export const SECRETS = ['Gh!7pQz#v2Lm9Rt$', 'Acme-Pa55!phrase', 'Nb#2024-seguro!Xk', 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', 'corvo-azul-77', 'ana.dev@example.com', MASTER];

export function leaksIn(buffer) {
  return SECRETS.filter(s => buffer.includes(Buffer.from(s, 'utf8')) || buffer.includes(Buffer.from(s, 'utf16le')));
}

export function scanDir(dir, found = new Map()) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const info = statSync(path, { throwIfNoEntry: false });
    if (!info) continue;
    if (info.isDirectory()) scanDir(path, found);
    else if (info.size < 64 * 1024 * 1024) leaksIn(readFileSync(path)).forEach(s => found.set(s, path));
  }
  return found;
}
