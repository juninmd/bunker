import { itemTitle, visibleItems, type AppContext } from './context.js';
import { byId, button, el } from './dom.js';
import { icon } from './icons.js';
import { itemRow } from './item-row.js';

const ALL = '';
let activeFolder = ALL;

function matches(item: any, query: string): boolean {
  if (!query) return true;
  return [itemTitle(item), item.site, item.username, item.grouping].some(v => String(v || '').toLowerCase().includes(query));
}

function renderChips(items: any[], ctx: AppContext) {
  const folders = Array.from(new Set(items.map(i => i.grouping).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (activeFolder && !folders.includes(activeFolder)) activeFolder = ALL;
  const chips = byId('folderChips');
  chips.hidden = folders.length === 0;
  chips.replaceChildren(...[ALL, ...folders].map(folder => {
    const chip = button(folder || 'Tudo', 'chip', () => {
      activeFolder = folder;
      renderVaultList(ctx);
    });
    chip.setAttribute('aria-pressed', String(folder === activeFolder));
    return chip;
  }));
}

function emptyState(ctx: AppContext, searching: boolean): HTMLLIElement {
  const li = el('li', 'empty');
  if (searching) {
    li.append(el('p', '', 'Nada encontrado. Tente o nome do site ou do usuário.'));
    return li;
  }
  li.append(
    el('h2', '', 'Seu cofre está vazio'),
    el('p', '', 'Adicione um login ou traga tudo do LastPass com o arquivo CSV exportado.'),
    button('Adicionar item', 'btn primary', () => ctx.openEditor()),
    button('Importar do LastPass', 'btn ghost', () => ctx.go('settings'))
  );
  return li;
}

export function renderVaultList(ctx: AppContext) {
  const query = byId<HTMLInputElement>('searchInput').value.trim().toLowerCase();
  const all = visibleItems(ctx.vault.getVault());
  renderChips(all, ctx);
  const items = all
    .filter(item => matches(item, query) && (!activeFolder || item.grouping === activeFolder))
    .sort((a, b) => itemTitle(a).localeCompare(itemTitle(b), 'pt-BR'));
  const list = byId('credentialList');
  if (items.length === 0) {
    list.replaceChildren(emptyState(ctx, !!query || !!activeFolder));
    return;
  }
  const rows: HTMLElement[] = [];
  const grouped = !activeFolder && !query;
  let lastFolder: string | null = null;
  const ordered = grouped ? [...items].sort((a, b) => String(a.grouping || '~').localeCompare(String(b.grouping || '~'), 'pt-BR')) : items;
  ordered.forEach(item => {
    const folder = item.grouping || '';
    if (grouped && folder !== lastFolder && all.some(i => i.grouping)) {
      rows.push(el('li', 'folder-label', folder || 'Sem pasta'));
      lastFolder = folder;
    }
    rows.push(itemRow(item, ctx));
  });
  list.replaceChildren(...rows);
}

export function initVaultList(ctx: AppContext) {
  const search = byId<HTMLInputElement>('searchInput');
  search.parentElement?.prepend(icon('search'));
  search.addEventListener('input', () => renderVaultList(ctx));
  const newBtn = byId('newItemBtn');
  newBtn.append(icon('plus'));
  newBtn.addEventListener('click', () => ctx.openEditor());
}
