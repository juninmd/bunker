// Authorization-code + PKCE helpers for browsers without chrome.identity.getAuthToken (Firefox).
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export interface AuthRequest {
  url: string;
  state: string;
  verifier: string;
  redirectUri: string;
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomToken(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

// Google refuses Firefox's fixed https redirect domain (ownership cannot be verified);
// Firefox 86+ also intercepts this loopback form, which Google accepts for Desktop clients.
export function loopbackRedirectUri(extensionRedirectUrl: string): string {
  const subdomain = new URL(extensionRedirectUrl).hostname.split('.')[0];
  return `http://127.0.0.1/mozoauth2/${subdomain}`;
}

export async function buildAuthRequest(clientId: string, scopes: string[], redirectUri: string): Promise<AuthRequest> {
  const state = randomToken();
  const verifier = randomToken();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: 'S256'
  });
  return { url: `${AUTH_URL}?${params}`, state, verifier, redirectUri };
}

// The redirect is attacker-reachable input: it must come back to our redirect URI with our state.
export function parseAuthRedirect(responseUrl: string, request: AuthRequest): string {
  const url = new URL(responseUrl);
  if (`${url.origin}${url.pathname}`.replace(/\/$/, '') !== request.redirectUri.replace(/\/$/, '')) throw new Error('OAUTH_BAD_REDIRECT');
  if (url.searchParams.get('state') !== request.state) throw new Error('OAUTH_STATE_MISMATCH');
  const error = url.searchParams.get('error');
  if (error) throw new Error(`OAUTH_${error.toUpperCase()}`);
  const code = url.searchParams.get('code');
  if (!code) throw new Error('OAUTH_NO_CODE');
  return code;
}

export function tokenRequestBody(code: string, request: AuthRequest, clientId: string, clientSecret?: string): URLSearchParams {
  const body = new URLSearchParams({
    client_id: clientId,
    code,
    code_verifier: request.verifier,
    grant_type: 'authorization_code',
    redirect_uri: request.redirectUri
  });
  if (clientSecret) body.set('client_secret', clientSecret);
  return body;
}
