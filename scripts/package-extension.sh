#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
VERSION="${1:-dev}"

mkdir -p "${DIST_DIR}"

cd "${ROOT_DIR}/apps/extension"
npm install
npm run build

cd dist
zip -r "${DIST_DIR}/bunkerpass-extension-${VERSION}.zip" . > /dev/null

echo "Extension packed at dist/bunkerpass-extension-${VERSION}.zip"
