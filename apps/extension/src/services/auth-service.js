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
    const userId = new TextEncoder().encode(username);

    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "BunkerPass",
        id: window.location.hostname
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
        userVerification: "preferred"
      },
      timeout: 60000,
      attestation: "none"
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });
      // In a full implementation, you'd securely store the credential ID and public key
      // (potentially wrapped by a derived master key if syncing to drive).
      return credential;
    } catch (error) {
      console.error("Error during WebAuthn registration:", error);
      throw error;
    }
  }

  /**
   * Authenticates the user via WebAuthn for Passwordless login.
   * @param {Uint8Array} credentialId The credential ID to authenticate against.
   * @returns {Promise<boolean>} True if authentication succeeded.
   */
  static async authenticatePasswordless(credentialId) {
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported in this browser.");
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [
        {
          id: credentialId,
          type: "public-key"
        }
      ],
      userVerification: "preferred",
      timeout: 60000
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      // Verification logic of the assertion signature would happen here.
      // If successful, the background script or vault service could release the session key.
      return !!assertion;
    } catch (error) {
      console.error("Error during WebAuthn authentication:", error);
      throw error;
    }
  }
}
