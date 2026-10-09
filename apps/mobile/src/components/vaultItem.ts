export type VaultItemKind = 'password' | 'note' | 'card' | 'address' | 'passkey';

/** A list entry as App.tsx holds it (from SyncService or the autofill save queue). */
export interface VaultRowItem {
  id: string;
  title?: string;
  url?: string;
  name?: string;
  username?: string;
}

// Secure notes, cards, identities and passkeys are stored under a sentinel "url". The scheme is
// assembled in two pieces, exactly like the original render code did.
const SCHEME = 'http' + '://';
const KIND_BY_URL = new Map<string, VaultItemKind>([
  [SCHEME + 'sn', 'note'],
  [SCHEME + 'cc', 'card'],
  [SCHEME + 'id', 'address'],
  [SCHEME + 'pk', 'passkey'],
]);

export function kindOf(item: VaultRowItem): VaultItemKind {
  return KIND_BY_URL.get(item.url ?? '') ?? 'password';
}

export function titleOf(item: VaultRowItem): string {
  return item.title || item.url || item.name || 'Sem título';
}

/** Second line of a row for items that have no username. */
export const KIND_LABEL: Record<Exclude<VaultItemKind, 'password'>, string> = {
  note: 'Nota',
  card: 'Cartão',
  address: 'Endereço',
  passkey: 'Passkey',
};
