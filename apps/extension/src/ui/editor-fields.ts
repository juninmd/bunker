import type { ItemType } from '../utils/item-model.js';
import { byId, button, el, field, input } from './dom.js';
import { icon, iconButton } from './icons.js';

export const TYPE_LABELS: Record<ItemType, string> = { password: 'Login', note: 'Nota', card: 'Cartão', address: 'Endereço' };
export const CARD_FIELDS = [['name', 'Nome no cartão'], ['number', 'Número'], ['exp', 'Validade (MM/AA)'], ['cvv', 'CVV']] as const;
export const ADDRESS_FIELDS = [['fullName', 'Nome completo'], ['email', 'E-mail'], ['phone', 'Telefone'], ['street', 'Endereço'], ['city', 'Cidade'], ['state', 'Estado'], ['zip', 'CEP'], ['country', 'País']] as const;

function group(...children: HTMLElement[]): HTMLDivElement {
  const node = el('div', 'stack');
  node.append(...children);
  return node;
}

function withTools(control: HTMLInputElement, ...tools: HTMLButtonElement[]): HTMLDivElement {
  const row = el('div', 'input-row');
  row.append(control, ...tools);
  return row;
}

// Builds the editor form once; item-editor fills and reads it.
export function buildEditorFields() {
  const form = byId<HTMLFormElement>('credentialForm');
  const typeBar = el('div', 'segmented');
  typeBar.setAttribute('role', 'group');
  typeBar.setAttribute('aria-label', 'Tipo de item');
  const typeButtons = new Map<ItemType, HTMLButtonElement>();
  (Object.keys(TYPE_LABELS) as ItemType[]).forEach(type => {
    const b = button(TYPE_LABELS[type], '');
    typeButtons.set(type, b);
    typeBar.append(b);
  });

  const site = input('site', { spellcheck: 'false' });
  const siteLabel = field('Site', site);
  const title = input('itemName');
  const folder = input('folder', { list: 'folderOptions' });
  const datalist = el('datalist');
  datalist.id = 'folderOptions';

  const username = input('username', { autocomplete: 'off', spellcheck: 'false' });
  const genUser = iconButton('refresh', 'Gerar nome de usuário', () => undefined);
  const password = input('password', { type: 'password', autocomplete: 'new-password', spellcheck: 'false' });
  password.classList.add('mono');
  const reveal = iconButton('eye', 'Mostrar senha', () => undefined);
  const genPass = iconButton('sliders', 'Gerar senha forte', () => undefined);
  const meter = el('div', 'meter');
  const meterFill = el('span');
  meter.append(meterFill);
  const meterText = el('span', 'meter-text');
  const totp = input('totp', { spellcheck: 'false', placeholder: 'Chave ou otpauth://' });
  const totpPreview = el('div', 'row');
  const historyToggle = button('Ver senhas anteriores', 'btn ghost');
  historyToggle.prepend(icon('clock'));
  const historyList = el('ul', 'history');
  historyList.hidden = true;
  const passwordGroup = group(
    field('Usuário ou e-mail', withTools(username, genUser)),
    field('Senha', withTools(password, reveal, genPass)),
    group(meter, meterText),
    field('Autenticação em duas etapas (TOTP)', totp),
    totpPreview,
    historyToggle,
    historyList
  );

  const card = Object.fromEntries(CARD_FIELDS.map(([key]) => [key, input(`card-${key}`, { spellcheck: 'false' })])) as Record<string, HTMLInputElement>;
  const cardGroup = group(...CARD_FIELDS.map(([key, label]) => field(label, card[key] as HTMLInputElement)));
  const address = Object.fromEntries(ADDRESS_FIELDS.map(([key]) => [key, input(`address-${key}`)])) as Record<string, HTMLInputElement>;
  const addressGroup = group(...ADDRESS_FIELDS.map(([key, label]) => field(label, address[key] as HTMLInputElement)));

  const notes = el('textarea');
  notes.id = 'notes';
  notes.rows = 3;
  const save = el('button', 'btn primary', 'Salvar');
  save.type = 'submit';
  const share = iconButton('share', 'Compartilhar item', () => undefined, 'btn ghost');
  const remove = iconButton('trash', 'Excluir item', () => undefined, 'btn danger');
  const actions = el('div', 'editor-actions');
  actions.append(save, share, remove);

  form.append(typeBar, siteLabel, field('Nome (opcional)', title), field('Pasta', folder), datalist,
    passwordGroup, cardGroup, addressGroup, field('Notas', notes), actions);

  return { form, typeBar, typeButtons, site, siteLabel, title, folder, datalist, username, genUser, password, reveal, genPass,
    meterFill, meterText, totp, totpPreview, historyToggle, historyList, passwordGroup, card, cardGroup, address, addressGroup,
    notes, save, share, remove };
}

export type EditorRefs = ReturnType<typeof buildEditorFields>;
