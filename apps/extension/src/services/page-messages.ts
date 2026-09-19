import { CredentialService } from './credential-service.js';
import { holdPendingSave, resolvePendingSave, settledOffer, takePendingSave, trackOffer } from './pending-save.js';

type Reply = (response: unknown) => void;
const PAGE_TYPES = new Set(['LIST_ACCOUNTS', 'FILL_CREDENTIAL', 'IS_BLOCKED', 'OFFER_SAVE', 'TAKE_PENDING_SAVE', 'RESOLVE_PENDING_SAVE']);

// The page origin comes from the browser, never from the message, so a frame cannot ask for another site's secrets.
export function pageHostname(sender: chrome.runtime.MessageSender): string | null {
  if (sender.id !== chrome.runtime.id || !sender.tab || sender.frameId !== 0 || !sender.url) return null;
  try {
    const url = new URL(sender.url);
    // Plain http has no origin authenticity; only loopback is exempt for local development.
    const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return url.protocol === 'https:' || (url.protocol === 'http:' && loopback) ? url.hostname : null;
  } catch {
    return null;
  }
}

// Returns undefined for messages that are not page messages, so the caller can route them elsewhere.
export function handlePageMessage(request: any, sender: chrome.runtime.MessageSender, reply: Reply, onActivity: () => void): boolean | undefined {
  if (!PAGE_TYPES.has(request?.type)) return undefined;
  const domain = pageHostname(sender);
  const tabId = sender.tab?.id;
  if (!domain || tabId === undefined) {
    reply({ error: 'FORBIDDEN' });
    return false;
  }
  switch (request.type) {
    case 'LIST_ACCOUNTS':
      CredentialService.listAccounts(domain, reply, onActivity);
      return true;
    case 'FILL_CREDENTIAL':
      CredentialService.fillCredential(domain, String(request.ref), reply, onActivity);
      return true;
    case 'IS_BLOCKED':
      CredentialService.isBlocked(domain, reply);
      return true;
    case 'OFFER_SAVE':
      trackOffer(tabId, new Promise<void>(done => CredentialService.checkCredential(domain, String(request.username), String(request.password), check => {
        const offer = !check.error && !check.same;
        if (offer) holdPendingSave(tabId, domain, String(request.username), String(request.password), check.stored);
        reply({ pending: offer });
        done();
      }, onActivity)));
      return true;
    case 'TAKE_PENDING_SAVE':
      settledOffer(tabId).then(() => reply({ offer: takePendingSave(tabId, domain) }));
      return true;
    default: {
      const entry = resolvePendingSave(tabId, domain);
      if (!request.accept || !entry) {
        reply({ status: 'ACK' });
        return false;
      }
      CredentialService.saveCredential(entry.host, { username: entry.username, password: entry.password }, reply, onActivity);
      return true;
    }
  }
}
