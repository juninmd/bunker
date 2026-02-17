
// Mock chrome.identity
global.chrome = {
  identity: {
    getAuthToken: (opts, cb) => cb('mock-token'),
  },
  runtime: {
    lastError: null,
  },
};

// Mock fetch
global.fetch = async (url, options) => {
  console.log('Fetching:', url);
  console.log('Method:', options.method);
  console.log('Headers:', options.headers);
  console.log('Body:', options.body);

  if (options.body) {
    // Basic validation of multipart structure
    const boundaryMatch = options.headers['Content-Type'].match(/boundary=(.*)$/);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = options.body.split(`--${boundary}`);
      // RFC 1341: preamble, part 1, part 2, closing delimiter
      // Split by --boundary gives: [preamble, part1, part2, suffix]
      // If suffix is '--', it's the closing delimiter.

      console.log(`Boundary: ${boundary}`);
      console.log(`Parts count: ${parts.length}`);

      parts.forEach((part, i) => {
        console.log(`Part ${i}: [${part.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}]`);
      });

      if (parts.length < 4) {
         console.error('FAIL: Expected at least 2 parts (metadata + content) + closing delimiter.');
      }

      const lastPart = parts[parts.length - 1];
      if (!lastPart.startsWith('--')) {
        console.error('FAIL: Last part does not start with -- (closing delimiter).');
      }
    }
  }

  return {
    ok: true,
    json: async () => ({ id: 'mock-file-id' }),
    text: async () => 'mock-text',
  };
};

import { GoogleDriveService } from '../apps/extension/src/services/google-drive.js';

async function run() {
  const service = new GoogleDriveService();
  console.log('--- Testing createFile (text/plain) ---');
  await service.createFile('test.txt', 'Hello World', 'text/plain');

  console.log('\n--- Testing createFile (text/csv) ---');
  await service.createFile('test.csv', 'col1,col2\nval1,val2', 'text/csv');
}

run().catch(console.error);
