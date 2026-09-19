export type ItemType = 'password' | 'note' | 'card' | 'address';

export interface ItemDraft {
  id?: string;
  type: ItemType;
  site: string;
  title?: string;
  username?: string;
  password?: string;
  totp?: string;
  grouping?: string;
  notes?: string;
  details?: Record<string, string>;
}

export function normalizeSite(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '').toLowerCase();
}

export function validateDraft(draft: ItemDraft): string | null {
  if (!draft.site.trim()) return draft.type === 'password' ? 'Informe o site.' : 'Informe um nome para o item.';
  if (draft.type === 'password' && !draft.password) return 'Informe a senha.';
  if (draft.type === 'card' && !draft.details?.number) return 'Informe o número do cartão.';
  if (draft.type === 'address' && !draft.details?.fullName) return 'Informe o nome completo.';
  return null;
}

function sameIdentity(item: any, draft: ItemDraft, site: string): boolean {
  if ((item.type || 'password') !== draft.type || item.site !== site) return false;
  return draft.type !== 'password' || item.username === (draft.username || '');
}

// Returns a new array; the previous password goes to history whenever it changes.
export function upsertItem(items: any[], draft: ItemDraft, now = new Date().toISOString()): { items: any[]; item: any; created: boolean } {
  const site = draft.type === 'password' ? normalizeSite(draft.site) : draft.site.trim();
  const isPassword = draft.type === 'password';
  const notes = draft.details ? JSON.stringify({ ...draft.details, notes: draft.notes || '' }) : draft.notes || '';
  const next = items.map(i => ({ ...i }));
  const index = draft.id ? next.findIndex(i => i.id === draft.id) : next.findIndex(i => !i.deletedAt && sameIdentity(i, draft, site));
  const fields = {
    type: draft.type,
    site,
    title: draft.title?.trim() || '',
    username: isPassword ? (draft.username || '').trim() : '',
    password: isPassword ? draft.password || '' : '',
    totp: isPassword ? (draft.totp || '').trim() : '',
    grouping: (draft.grouping || '').trim(),
    notes,
    updatedAt: now
  };
  if (index >= 0) {
    const current = next[index];
    if (isPassword && current.password && current.password !== fields.password) {
      current.history = [...(current.history || []), { password: current.password, timestamp: current.updatedAt || now }];
    }
    Object.assign(current, fields);
    delete current.deletedAt;
    return { items: next, item: current, created: false };
  }
  const item = { id: crypto.randomUUID(), createdAt: now, ...fields };
  next.push(item);
  return { items: next, item, created: true };
}

export function softDelete(items: any[], id: string, now = new Date().toISOString()): any[] {
  return items.map(i => (i.id === id ? { ...i, deletedAt: now, updatedAt: now } : i));
}

export function restoreFromHistory(items: any[], id: string, historyIndex: number, now = new Date().toISOString()): any[] {
  return items.map(i => {
    const entry = i.id === id ? i.history?.[historyIndex] : null;
    if (!entry) return i;
    const history = i.history.filter((_: unknown, idx: number) => idx !== historyIndex);
    history.push({ password: i.password, timestamp: i.updatedAt || now });
    return { ...i, password: entry.password, history, updatedAt: now };
  });
}
