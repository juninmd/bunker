import { AuthService } from '../src/services/auth-service.js';
import assert from 'assert';

global.window = {
  PublicKeyCredential: true
};

global.chrome = {
  runtime: { id: "test-id" }
};

let storedCredentialId = new Uint8Array([1,2,3,4]);
let mockDerivedKey = new Uint8Array(32);
mockDerivedKey.fill(42);

Object.defineProperty(globalThis, 'navigator', {
  value: {
    credentials: {
      create: async (options) => {
        assert(options.publicKey.extensions.prf.eval.first.length === 32);
        return {
          rawId: storedCredentialId.buffer,
          getClientExtensionResults: () => ({ prf: { enabled: true } })
        };
      },
      get: async (options) => {
        assert(options.publicKey.extensions.prf.eval.first.length === 32);
        return {
          getClientExtensionResults: () => ({ prf: { results: { first: mockDerivedKey.buffer } } })
        };
      }
    }
  },
  writable: true,
  configurable: true
});

async function run() {
  console.log("Testing Passwordless PRF Registration...");
  const reg = await AuthService.registerPasswordless('test_user');
  assert(reg.credentialId);
  assert(reg.salt);
  console.log("Registration OK");

  console.log("Testing Passwordless PRF Authentication...");
  const derived = await AuthService.authenticatePasswordless(reg.credentialId, reg.salt);
  assert(derived.length === 32);
  assert(derived[0] === 42);
  console.log("Authentication OK");
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
