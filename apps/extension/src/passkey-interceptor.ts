/**
 * This script is intended to be injected into the main page context (MAIN world)
 * to intercept calls to navigator.credentials.create and navigator.credentials.get
 * for Passkey (WebAuthn) support.
 */

if (window.navigator && window.navigator.credentials) {
  const originalCreate = window.navigator.credentials.create.bind(window.navigator.credentials);
  const originalGet = window.navigator.credentials.get.bind(window.navigator.credentials);

  window.navigator.credentials.create = async function (options: CredentialCreationOptions) {
    if (options && options.publicKey) {
      console.info('[DrivePass] Intercepted navigator.credentials.create (Passkey Registration)');
      // Scaffolding: Route this to the extension service worker via Content Script.
      // Currently, we will just fallback to the original behavior since native flow is deferred.

      // In Phase 4, we would dispatch a CustomEvent or postMessage to the content script:
      // return await dispatchToExtension('CREATE_PASSKEY', options);
    }
    return originalCreate(options);
  };

  window.navigator.credentials.get = async function (options: CredentialRequestOptions) {
    if (options && options.publicKey) {
      console.info('[DrivePass] Intercepted navigator.credentials.get (Passkey Authentication)');
      // Scaffolding: Route this to the extension service worker via Content Script.
      // Currently, we will just fallback to the original behavior since native flow is deferred.

      // In Phase 4, we would dispatch a CustomEvent or postMessage to the content script:
      // return await dispatchToExtension('GET_PASSKEY', options);
    }
    return originalGet(options);
  };

  console.info('[DrivePass] WebAuthn Passkey interceptor injected.');
}
