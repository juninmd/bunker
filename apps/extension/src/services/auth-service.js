export class AuthService {
  /**
   * Initializes WebAuthn registration for Passwordless login.
   * This generates a credential bound to the device which can be used later to unlock the vault.
   * @param {string} username The user's identifier.
   * @returns {Promise<Object>} The credential information.
   */
  static async registerPasswordless(username) {
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported in this browser.");
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const prfSalt = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(username);

    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "BunkerPass",
        id: chrome.runtime.id
      },
      user: {
        id: userId,
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required"
      },
      extensions: {
        prf: {
          eval: {
            first: prfSalt
          }
        }
      },
      timeout: 60000,
      attestation: "none"
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      const extensionResults = credential.getClientExtensionResults();
      if (!extensionResults.prf || !extensionResults.prf.enabled) {
        throw new Error("A extensão PRF do WebAuthn não é suportada por este dispositivo/navegador.");
      }

      // Convert rawId to Base64 for easier storage
      const rawIdBytes = new Uint8Array(credential.rawId);
      const rawIdB64 = btoa(String.fromCharCode(...rawIdBytes));
      const saltB64 = btoa(String.fromCharCode(...prfSalt));

      return {
        credentialId: rawIdB64,
        salt: saltB64
      };
    } catch (error) {
      console.error("Error during WebAuthn registration:", error);
      throw error;
    }
  }

  /**
   * Authenticates the user via WebAuthn for Passwordless login.
   * @param {string} credentialIdB64 The base64-encoded credential ID.
   * @param {string} saltB64 The base64-encoded salt used during registration.
   * @returns {Promise<Uint8Array>} The derived PRF key.
   */
  static async authenticatePasswordless(credentialIdB64, saltB64) {
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported in this browser.");
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credentialId = Uint8Array.from(atob(credentialIdB64), c => c.charCodeAt(0));
    const prfSalt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));

    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [
        {
          id: credentialId,
          type: "public-key"
        }
      ],
      userVerification: "required",
      extensions: {
        prf: {
          eval: {
            first: prfSalt
          }
        }
      },
      timeout: 60000
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      const extensionResults = assertion.getClientExtensionResults();
      if (!extensionResults.prf || !extensionResults.prf.results || !extensionResults.prf.results.first) {
         throw new Error("Falha ao obter a chave PRF do autenticador.");
      }

      return new Uint8Array(extensionResults.prf.results.first);
    } catch (error) {
      console.error("Error during WebAuthn authentication:", error);
      throw error;
    }
  }
}
