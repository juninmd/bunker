import { passwordStrength } from './password-strength.js';

export interface SecurityReport {
  total: number;
  weak: any[];
  reused: any[];
  old: any[];
  withoutTotp: number;
  score: number;
}

const OLD_DAYS = 365;

// Pure scoring so the dashboard and its tests agree; only live password items count.
export function buildSecurityReport(items: any[], now = Date.now()): SecurityReport {
  const logins = items.filter(i => (!i.type || i.type === 'password') && !i.deletedAt && i.password);
  const counts = new Map<string, number>();
  logins.forEach(i => counts.set(i.password, (counts.get(i.password) || 0) + 1));
  const weak = logins.filter(i => passwordStrength(i.password).score <= 1);
  const reused = logins.filter(i => (counts.get(i.password) || 0) > 1);
  const old = logins.filter(i => {
    const updated = Date.parse(i.updatedAt || i.createdAt || '');
    return Number.isNaN(updated) || now - updated > OLD_DAYS * 86400000;
  });
  const withoutTotp = logins.filter(i => !i.totp).length;
  const penalty = logins.length === 0 ? 0 : ((weak.length * 3 + reused.length * 2 + old.length) / (logins.length * 3)) * 100;
  return { total: logins.length, weak, reused, old, withoutTotp, score: logins.length ? Math.max(0, Math.round(100 - penalty)) : 100 };
}

export async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text)); // NOSONAR: SHA-1 is mandated by the HIBP range API
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// k-anonymity: only the first 5 hex chars of each hash leave the device; identical prefixes are fetched once.
export async function findLeaked(items: any[], fetcher: (url: string) => Promise<Response> = url => fetch(url)): Promise<any[]> {
  const logins = items.filter(i => (!i.type || i.type === 'password') && !i.deletedAt && i.password);
  const hashes = await Promise.all(logins.map(i => sha1Hex(i.password)));
  const ranges = new Map<string, Promise<string>>();
  const leaked: any[] = [];
  for (let i = 0; i < logins.length; i++) {
    const hash = hashes[i] as string;
    const prefix = hash.slice(0, 5);
    if (!ranges.has(prefix)) {
      ranges.set(prefix, fetcher(`https://api.pwnedpasswords.com/range/${prefix}`).then(r => (r.ok ? r.text() : Promise.reject(new Error(`HIBP ${r.status}`)))));
    }
    const body = await (ranges.get(prefix) as Promise<string>);
    if (body.split('\n').some(line => line.startsWith(hash.slice(5)))) leaked.push(logins[i]);
  }
  return leaked;
}
