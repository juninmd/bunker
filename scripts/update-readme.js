const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '../apps/extension/package.json');
const readmePath = path.join(__dirname, '../README.md');

try {
  const pkg = require(packagePath);
  const version = pkg.version;
  const badgeUrl = `https://img.shields.io/badge/version-${version}-blue.svg`;
  const badgeMarkdown = `[![Version](${badgeUrl})](https://github.com/juninmd/bunker/releases)`;

  let readme = fs.readFileSync(readmePath, 'utf8');

  // Regex to find the badge version.
  // Looking for: https://img.shields.io/badge/version-0.1.0-blue.svg
  const versionRegex = /https:\/\/img\.shields\.io\/badge\/version-([\d\.]+)-blue\.svg/;

  const match = readme.match(versionRegex);
  if (match) {
    if (match[1] === version) {
      console.log(`README badge is already at version ${version}. No changes needed.`);
    } else {
      readme = readme.replace(versionRegex, badgeUrl);
      fs.writeFileSync(readmePath, readme);
      console.log(`Updated README badge to version ${version}`);
    }
  } else {
    // If badge not found, prepend it to the file
    console.log('Version badge not found. Adding it to the top of README.md');
    readme = badgeMarkdown + '\n\n' + readme;
    fs.writeFileSync(readmePath, readme);
  }
} catch (error) {
  console.error('Error updating README:', error);
  process.exit(1);
}
