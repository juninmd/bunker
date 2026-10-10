namespace Bunker {
  // Estado único da tela do cofre. Os dados ficam só em memória; nada é gravado em disco pelo renderer.
  export const state: State = {
    items: [],
    filter: 'all',
    query: '',
    openId: null,
    sync: 'idle',
    syncedAt: null
  };
}
