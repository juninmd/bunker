import { itemTitle, parseJsonNotes, type AppContext } from './context.js';
import { el } from './dom.js';
import { icon, iconButton, type IconName } from './icons.js';
import { copySecret, flashDone, CLIPBOARD_SECONDS } from './clipboard.js';
import { totpChip } from './totp-chip.js';

const TYPE_ICON: Record<string, IconName> = { note: 'note', card: 'card', address: 'pin' };

function avatar(item: any, title: string): HTMLElement {
  const node = el('span', 'avatar');
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  node.style.background = `hsl(${hash % 360} 38% 66%)`;
  const typeIcon = TYPE_ICON[item.type];
  if (typeIcon) node.append(icon(typeIcon));
  else node.textContent = (title[0] || '?').toUpperCase();
  return node;
}

function subtitle(item: any): string {
  const data = parseJsonNotes(item);
  if (item.type === 'note') return 'Nota segura';
  if (item.type === 'card') return data.number ? `Cartão final ${String(data.number).slice(-4)}` : 'Cartão';
  if (item.type === 'address') return data.fullName || 'Endereço';
  return item.username || 'Sem usuário';
}

function copyAction(ctx: AppContext, name: IconName, label: string, value: string, done: string) {
  const btn = iconButton(name, label, async () => {
    try {
      await copySecret(value);
      flashDone(btn);
      ctx.notify(`${done} Some da área de transferência em ${CLIPBOARD_SECONDS} s.`);
    } catch {
      ctx.notify('Não foi possível copiar.', 'error');
    }
  });
  return btn;
}

export function itemRow(item: any, ctx: AppContext): HTMLLIElement {
  const li = el('li', 'item');
  const title = itemTitle(item);
  const main = el('button', 'item-main');
  main.type = 'button';
  main.setAttribute('aria-label', `Abrir ${title}`);
  const text = el('span', 'item-text');
  text.append(el('span', 'item-title', title), el('span', 'item-sub', subtitle(item)));
  main.append(avatar(item, title), text);
  main.addEventListener('click', () => ctx.openEditor(item.id));

  const actions = el('div', 'item-actions');
  const type = item.type || 'password';
  if (type === 'password') {
    const chip = item.totp ? totpChip(item.totp, async (code, node) => {
      await copySecret(code);
      node.classList.add('done');
      ctx.notify(`Código 2FA copiado. Some da área de transferência em ${CLIPBOARD_SECONDS} s.`);
    }) : null;
    if (chip) actions.append(chip);
    if (item.username) actions.append(copyAction(ctx, 'user', `Copiar usuário de ${title}`, item.username, 'Usuário copiado.'));
    if (item.password) actions.append(copyAction(ctx, 'key', `Copiar senha de ${title}`, item.password, 'Senha copiada.'));
  } else if (type === 'note') {
    const content = item.notes || '';
    if (content) actions.append(copyAction(ctx, 'copy', `Copiar nota ${title}`, content, 'Nota copiada.'));
  } else if (type === 'card') {
    const number = parseJsonNotes(item).number;
    if (number) actions.append(copyAction(ctx, 'copy', `Copiar número do cartão ${title}`, String(number), 'Número copiado.'));
  }
  li.append(main, actions);
  return li;
}
