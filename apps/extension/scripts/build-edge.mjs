// Builds the Edge flavor from the Chrome manifest and the compiled sources (run `npm run build` first).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const EDGE_DIR = join(root, 'dist', 'edge');
// .woff2 and .txt carry the bundled fonts and their OFL license texts.
const SHIPPED = new Set(['.js', '.html', '.css', '.png', '.svg', '.woff2', '.txt']);

export function edgeManifest(chrome) {
  const { browser_specific_settings, ...manifest } = chrome;
  return manifest;
}

export function buildEdge(outDir = EDGE_DIR) {
  const chrome = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(join(root, 'src'), join(outDir, 'src'), {
    recursive: true,
    filter: src => !extname(src) || SHIPPED.has(extname(src))
  });
  writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(edgeManifest(chrome), null, 2)}\n`);
  return outDir;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Edge build at ${buildEdge()}`);
}
