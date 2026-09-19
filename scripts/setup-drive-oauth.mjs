#!/usr/bin/env node
// Pins a stable extension ID and wires the Google OAuth client ID into the manifest.
// Usage: node scripts/setup-drive-oauth.mjs [--client-id <id>.apps.googleusercontent.com]
import { createHash, createPublicKey, generateKeyPairSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = process.env.BUNKER_MANIFEST || join(root, 'apps', 'extension', 'manifest.json');
// The private key never lives in the repository; only its public half goes into the manifest.
const keyPath = process.env.BUNKER_KEY_PATH || join(homedir(), '.bunker', 'extension-key.pem');
const CLIENT_ID = /^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/;

function argument(name) {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
}

function loadOrCreateKey() {
  if (existsSync(keyPath)) return createPublicKey(readFileSync(keyPath, 'utf8'));
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  mkdirSync(dirname(keyPath), { recursive: true, mode: 0o700 });
  writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600, flag: 'wx' });
  console.log(`Chave privada criada em ${keyPath} (guarde fora do Git).`);
  return publicKey;
}

// Chrome derives the ID from SHA-256 of the DER public key, mapping hex digits 0-f to letters a-p.
export function extensionId(der) {
  const hex = createHash('sha256').update(der).digest('hex').slice(0, 32);
  return [...hex].map(c => String.fromCharCode(97 + parseInt(c, 16))).join('');
}

function main() {
  const clientId = argument('--client-id');
  if (clientId !== undefined && !CLIENT_ID.test(clientId)) {
    console.error('Client ID inválido. Formato esperado: 1234567890-abc123.apps.googleusercontent.com');
    process.exit(2);
  }
  const der = loadOrCreateKey().export({ type: 'spki', format: 'der' });
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.key = der.toString('base64');
  if (clientId) manifest.oauth2 = { ...manifest.oauth2, client_id: clientId };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const id = extensionId(der);
  console.log(`ID da extensão: ${id}`);
  if (clientId) {
    console.log('Client ID gravado no manifest. Recarregue a extensão em chrome://extensions e toque em "Sincronizar".');
  } else {
    console.log('Próximo passo: no Google Cloud Console crie um "ID do cliente OAuth" do tipo "Extensão do Chrome"');
    console.log(`com o ID ${id} e rode de novo com --client-id <seu-id>. Guia: docs/SETUP.md`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
