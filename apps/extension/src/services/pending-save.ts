import { matchesHost } from '../utils/site-match.js';

const PENDING_TTL_MS = 60_000;

interface PendingSave {
  host: string;
  username: string;
  password: string;
  update: boolean;
  expires: number;
  prompted: boolean;
}

// Logins usually navigate away on submit, so the offer outlives the page in worker memory, keyed by tab.
const pending = new Map<number, PendingSave>();
const inflight = new Map<number, Promise<void>>();

// Only the site that received the login (or its parent/subdomain after a redirect) may see or confirm the offer.
function live(tabId: number, pageHost: string): PendingSave | null {
  const entry = pending.get(tabId);
  if (!entry || !(matchesHost(pageHost, entry.host) || matchesHost(entry.host, pageHost))) return null;
  if (entry.expires > Date.now()) return entry;
  pending.delete(tabId);
  return null;
}

// The next page can load before the vault check finishes; taking an offer waits for that check.
export function trackOffer(tabId: number, work: Promise<void>) {
  inflight.set(tabId, work);
  work.finally(() => { if (inflight.get(tabId) === work) inflight.delete(tabId); });
}

export async function settledOffer(tabId: number) {
  await inflight.get(tabId);
}

export function holdPendingSave(tabId: number, host: string, username: string, password: string, update: boolean) {
  pending.set(tabId, { host, username, password, update, expires: Date.now() + PENDING_TTL_MS, prompted: false });
}

// Hands the prompt to exactly one page; the password itself never goes back to page context.
export function takePendingSave(tabId: number, pageHost: string): { host: string; username: string; update: boolean } | null {
  const entry = live(tabId, pageHost);
  if (!entry || entry.prompted) return null;
  entry.prompted = true;
  return { host: entry.host, username: entry.username, update: entry.update };
}

export function resolvePendingSave(tabId: number, pageHost: string): PendingSave | null {
  const entry = live(tabId, pageHost);
  if (entry) pending.delete(tabId);
  return entry?.prompted ? entry : null;
}

export function dropPendingSave(tabId: number) {
  pending.delete(tabId);
}
