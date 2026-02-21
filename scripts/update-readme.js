const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../apps/extension/package.json');
const readmePath = path.join(__dirname, '../README.md');

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  let readme = fs.readFileSync(readmePath, 'utf8');

  const badge = `[![Version](https://img.shields.io/badge/version-${version}-blue.svg)](https://github.com/juninmd/bunker/releases)`;
  const badgeRegex = /\[!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-.*?-blue\.svg\)\]\(.*?\)/;

  if (badgeRegex.test(readme)) {
    readme = readme.replace(badgeRegex, badge);
    console.log(`Updated README badge to version ${version}`);
  } else {
    readme = `${badge}\n\n${readme}`;
    console.log(`Added README badge with version ${version}`);
  }

  fs.writeFileSync(readmePath, readme);
} catch (error) {
  console.error('Error updating README:', error);
  process.exit(1);
}
