namespace Bunker {
  function updateHeader(count: number): void {
    const category = CATEGORIES.find(entry => entry.id === state.filter);
    const query = state.query.trim();
    byId('viewTitle').textContent = category ? category.label : 'Todos os itens';
    byId('viewMeta').textContent = query ? `${plural(count, 'resultado', 'resultados')} para “${query}”` : plural(count, 'item', 'itens');
  }

  // Cofre vazio (nada importado) e "Nenhum resultado" (busca ou categoria sem itens) são estados distintos.
  function updateStates(total: number, shown: number): void {
    const query = state.query.trim();
    const none = total > 0 && shown === 0;
    const isSecurity = state.filter === 'security';
    byId('emptyState').hidden = total > 0 || isSecurity;
    byId('noResults').hidden = !none || isSecurity;
    byId('vaultList').hidden = shown === 0 || isSecurity;
    const secView = byId('securityView');
    if (secView) secView.hidden = !isSecurity;

    byId('noText').textContent = query
      ? `Não encontramos itens para “${query}”. Tente outro nome, usuário ou pasta.`
      : 'Não há itens nesta categoria.';
    byId('noReset').textContent = query ? 'Limpar busca' : 'Ver todos os itens';
  }

  // Redesenha tudo o que depende de itens, filtro ou busca.
  export function render(animate = false): void {
    const shown = visibleItems(state.items, state.filter, state.query);
    updateNav(countKinds(state.items), state.filter);
    updateHeader(shown.length);
    updateStates(state.items.length, shown.length);
    if (state.filter === 'security') {
      renderSecurityView(state.items);
    } else {
      renderList(groupItems(shown), animate);
    }
  }
}
