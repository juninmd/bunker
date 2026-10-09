namespace Bunker {
  function buildRow(item: Item): HTMLLIElement {
    const hue = hueOf(item.title);
    const avatar = el('span', 'avatar', initialOf(item.title));
    avatar.style.setProperty('--h', String(hue));
    avatar.classList.toggle('ink', hue >= 15 && hue <= 190); // matizes claros: letra escura mantém o contraste
    avatar.setAttribute('aria-hidden', 'true');

    const badge = el('span', 'badge', KIND_LABEL[item.kind]);
    badge.dataset.kind = item.kind;

    const texts = el('span', 'texts', el('span', 'title', item.title), item.username && el('span', 'sub', item.username));
    const button = el('button', 'row', avatar, texts, badge, icon('chevron', 'chev'));
    button.type = 'button';
    button.title = item.username ? `${item.title} · ${item.username}` : item.title;
    button.setAttribute('aria-expanded', 'false');

    const li = el('li', 'item', button);
    button.addEventListener('click', () => toggleItem(item, li, button));
    return li;
  }

  function buildGroup(group: Group, order: number): HTMLElement {
    const head = el('h2', 'group-head', el('span', 'group-name', groupLabel(group.name)), el('span', 'group-n', String(group.items.length)));
    const section = el('div', 'group', head, el('ul', 'card', ...group.items.map(buildRow)));
    if (order >= 0) {
      section.classList.add('enter');
      section.style.animationDelay = `${Math.min(order, 8) * 45}ms`;
    }
    return section;
  }

  // Desenha as pastas. `animate` só é verdadeiro quando chegam dados novos (importação ou sincronização).
  export function renderList(groups: Group[], animate: boolean): void {
    state.openId = null;
    byId('vaultList').replaceChildren(...groups.map((group, index) => buildGroup(group, animate ? index : -1)));
  }

  function openRow(): HTMLButtonElement | null {
    return document.querySelector<HTMLButtonElement>('#vaultList .row[aria-expanded="true"]');
  }

  // Recolhe o item aberto (se houver) e descarta os detalhes, inclusive os segredos que estavam visíveis.
  export function collapseOpen(): void {
    const row = openRow();
    state.openId = null;
    const panel = row?.parentElement?.querySelector<HTMLElement>('.details');
    if (!row || !panel) return;
    row.setAttribute('aria-expanded', 'false');
    row.removeAttribute('aria-controls');
    panel.inert = true;
    panel.dataset.open = 'false';
    window.setTimeout(() => panel.remove(), transitionMs(panel));
  }

  function toggleItem(item: Item, li: HTMLLIElement, button: HTMLButtonElement): void {
    const wasOpen = state.openId === item.id;
    collapseOpen();
    if (wasOpen) return;
    const panel = buildDetails(item);
    panel.id = `details-${item.id}`;
    li.append(panel);
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-controls', panel.id);
    state.openId = item.id;
    void panel.offsetHeight;
    panel.dataset.open = 'true';
    window.setTimeout(() => panel.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }), transitionMs(panel));
  }

  // Teclado: setas, Home e End movem o foco entre as linhas; Esc recolhe o item aberto.
  export function initListKeys(): void {
    const host = byId('vaultList');
    host.addEventListener('keydown', event => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (event.key === 'Escape') {
        const row = openRow();
        if (!row) return;
        collapseOpen();
        row.focus();
        return;
      }
      const rows = [...host.querySelectorAll<HTMLButtonElement>('.row')];
      const at = rows.indexOf(target as HTMLButtonElement);
      const moves: Record<string, number> = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: rows.length - 1 };
      const next = moves[event.key];
      if (at < 0 || next === undefined || next < 0 || next >= rows.length) return;
      event.preventDefault();
      rows[next].focus();
    });
  }
}
