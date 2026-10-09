namespace Bunker {
  function showVault(): void {
    byId('lockScreen').hidden = true;
    const vault = byId('vaultScreen');
    vault.hidden = false;
    vault.classList.add('enter');
    byId('searchInput').focus();
  }

  function init(): void {
    hydrateIcons();
    buildSidebar(filter => {
      state.filter = filter;
      render();
    });
    initLock(showVault);
    initSearch();
    initActions();
    initListKeys();
    byId('lockKeys').replaceChildren(...keycaps(isMac ? ['⌘', '⇧', 'L'] : ['Ctrl', 'Shift', 'L']));
    setSyncChip();
    render();
    byId('masterPassword').focus();
  }

  // Este é o último script carregado; o DOM já está pronto.
  init();
}
