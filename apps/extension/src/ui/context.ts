import type { VaultService } from '../services/vault-service.js';
import type { SyncService } from '../services/sync-service.js';

export type ViewName = 'lock' | 'vault' | 'editor' | 'generator' | 'security' | 'settings' | 'panel';
export type Tone = 'info' | 'error';

// Explicit wiring passed to every view module, so no module reaches into another's DOM or globals.
export interface AppContext {
  vault: VaultService;
  sync: SyncService;
  notify(message: string, tone?: Tone): void;
  go(view: ViewName): void;
  refresh(): void;
  openEditor(id?: string): void;
  openPanel(title: string, build: (body: HTMLElement) => void): void;
  persist(items: any[]): Promise<void>;
  ensureMasterPassword(reason: string): Promise<string | null>;
  lockNow(message?: string): void;
}

export const INTERNAL_TYPES = new Set(['business-policy', 'digital-will']);

export function visibleItems(items: any[]): any[] {
  return items.filter(item => !item.deletedAt && !INTERNAL_TYPES.has(item.type));
}

export function itemTitle(item: any): string {
  if (item.title) return item.title;
  const site = String(item.site || '');
  return site.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '') || 'Sem título';
}

export function parseJsonNotes(item: any): Record<string, any> {
  try {
    const parsed = JSON.parse(item.notes || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}
