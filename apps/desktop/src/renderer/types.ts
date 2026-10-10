// Tipos do renderer. Nenhum arquivo de src/renderer tem import/export: o tsc os emite como scripts clássicos
// (o sandbox do Electron não carrega módulos via file://) e todos compartilham o namespace Bunker.
namespace Bunker {
  export type Kind = 'password' | 'note' | 'card' | 'address' | 'passkey';
  export type Filter = 'all' | Kind;
  export type SyncStatus = 'idle' | 'busy' | 'ok' | 'error';
  export type CsvRow = Record<string, string>;

  export interface Item {
    id: string;
    kind: Kind;
    title: string;
    url: string;
    name: string;
    username: string;
    password: string;
    notes: string;
    group: string;
    haystack: string;
  }

  export interface Group {
    name: string;
    items: Item[];
  }

  export interface State {
    items: Item[];
    filter: Filter;
    query: string;
    openId: string | null;
    sync: SyncStatus;
    syncedAt: Date | null;
  }
}

// Exposto pelo preload (contextBridge). Em um navegador comum a API não existe.
interface Window {
  electronAPI?: { syncGoogleDrive?: () => Promise<string> };
}
