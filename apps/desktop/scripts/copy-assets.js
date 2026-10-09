// Copia o que o tsc não emite (HTML, CSS e assets) para dist/. Substitui o `cp`, que não existe no Windows.
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const entries = ['index.html', 'styles', 'assets'];

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });

for (const entry of entries) {
  const from = path.join(root, 'src', entry);
  const to = path.join(root, 'dist', entry);
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`copiado: src/${entry} -> dist/${entry}`);
}
