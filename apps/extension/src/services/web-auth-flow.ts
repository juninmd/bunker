import { buildAuthRequest, loopbackRedirectUri, parseAuthRedirect, tokenRequestBody } from '../utils/oauth-pkce.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
// Refresh a minute early so a request never goes out with a token that expires in flight.
const EXPIRY_MARGIN_MS = 60_000;

export interface WebToken {
  accessToken: string;
  expiresAt: number;
}

interface OAuthManifest {
  client_id?: string;
  client_secret?: string;
  scopes?: string[];
}

// The silent attempt fails whenever Google needs the user (no session, no consent yet); only that case falls through.
async function launch(url: string, interactive: boolean): Promise<string | null> {
  try {
    return (await chrome.identity.launchWebAuthFlow({ url, interactive })) ?? null;
  } catch (e) {
    if (interactive) throw e;
    return null;
  }
}

// Access tokens stay in memory only; no refresh token is requested, so nothing long-lived reaches disk.
// Redirect validation and token exchange errors always surface; they are never retried interactively.
export async function firefoxToken(): Promise<WebToken> {
  const oauth = (chrome.runtime.getManifest() as { oauth2?: OAuthManifest }).oauth2 ?? {};
  if (!oauth.client_id) throw new Error('OAUTH_NOT_CONFIGURED');
  const redirectUri = loopbackRedirectUri(chrome.identity.getRedirectURL());
  let request = await buildAuthRequest(oauth.client_id, oauth.scopes ?? [], redirectUri);
  let responseUrl = await launch(request.url, false);
  if (!responseUrl) {
    request = await buildAuthRequest(oauth.client_id, oauth.scopes ?? [], redirectUri);
    responseUrl = await launch(request.url, true);
  }
  if (!responseUrl) throw new Error('OAUTH_CANCELLED');
  const code = parseAuthRedirect(responseUrl, request);
  const response = await fetch(TOKEN_URL, { method: 'POST', body: tokenRequestBody(code, request, oauth.client_id, oauth.client_secret) });
  if (!response.ok) throw new Error(`OAUTH_TOKEN_${response.status}`);
  const data = await response.json();
  if (typeof data.access_token !== 'string') throw new Error('OAUTH_NO_TOKEN');
  return { accessToken: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 0) * 1000 - EXPIRY_MARGIN_MS };
}
