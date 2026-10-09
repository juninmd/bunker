namespace Bunker {
  const searchInput = (): HTMLInputElement => byId<HTMLInputElement>('searchInput');

  // Dica de atalho e botão de limpar se alternam conforme haja texto na busca.
  function syncChrome(): void {
    const filled = searchInput().value !== '';
    byId('searchClear').hidden = !filled;
    byId('searchHint').hidden = filled;
  }

  function apply(): void {
    state.query = searchInput().value;
    render();
  }

  export function resetFilters(): void {
    searchInput().value = '';
    state.filter = 'all';
    syncChrome();
    apply();
  }

  export function initSearch(): void {
    const input = searchInput();
    let timer: number | undefined;
    byId('searchHint').replaceChildren(...keycaps(isMac ? ['⌘', 'K'] : ['Ctrl', 'K']));
    input.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');

    input.addEventListener('input', () => {
      syncChrome();
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, 60);
    });

    byId('searchClear').addEventListener('click', () => {
      input.value = '';
      syncChrome();
      apply();
      input.focus();
    });

    input.addEventListener('keydown', event => {
      if (event.key === 'Escape' && input.value !== '') {
        event.preventDefault();
        input.value = '';
        syncChrome();
        apply();
      } else if (event.key === 'ArrowDown') {
        const first = document.querySelector<HTMLElement>('#vaultList .row');
        if (!first) return;
        event.preventDefault();
        first.focus();
      }
    });

    // Ctrl/Cmd+K leva o foco à busca de qualquer ponto da tela do cofre.
    document.addEventListener('keydown', event => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k' || byId('vaultScreen').hidden) return;
      event.preventDefault();
      input.focus();
      input.select();
    });
  }
}
