const fs = require('fs');

const androidContent = fs.readFileSync('apps/android/src/SyncService.js', 'utf8');
const extensionContent = fs.readFileSync('apps/extension/src/utils/csv-utils.js', 'utf8');

console.log("Checking duplication...");
