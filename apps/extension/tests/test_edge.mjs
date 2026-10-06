import assert from 'assert';
import { readFileSync } from 'node:fs';

const { edgeManifest } = await import('../scripts/build-edge.mjs');

const chromeManifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const edge = edgeManifest(chromeManifest);

assert.ok(!('browser_specific_settings' in edge));
assert.deepStrictEqual(edge.background, chromeManifest.background);
assert.deepStrictEqual(edge.permissions, chromeManifest.permissions);
assert.deepStrictEqual(edge.content_scripts, chromeManifest.content_scripts);
assert.deepStrictEqual(edge.oauth2, chromeManifest.oauth2);

console.log('Edge Manifest Test Passed');
