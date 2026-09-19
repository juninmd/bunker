import { itemTitle, parseJsonNotes, type AppContext } from './context.js';
import { byId, button, el, formatDate } from './dom.js';
import { confirmAction } from './dialog.js';
import { buildEditorFields, TYPE_LABELS, type EditorRefs } from './editor-fields.js';
import { wireReveal } from './lock-view.js';
import { totpChip } from './totp-chip.js';
import { copySecret } from './clipboard.js';
import { exportShare } from './share-actions.js';
import { generateWith, loadGeneratorSettings } from './generator-settings.js';
import { passwordStrength } from '../utils/password-strength.js';
import { isValidTotp } from '../utils/totp.js';
import { generateUsername } from '../utils/username-generator.js';
import { restoreFromHistory, softDelete, upsertItem, validateDraft, type ItemDraft, type ItemType } from '../utils/item-model.js';

const SITE_LABELS: Record<ItemType, string> = { password: 'Site', note: 'Título', card: 'Apelido do cartão', address: 'Apelido do endereço' };
const METER_COLORS = ['var(--danger)', 'var(--danger)', 'var(--warn)', 'var(--ok)', 'var(--ok)'];

export function initEditor(ctx: AppContext) {
  const f: EditorRefs = buildEditorFields();
  let currentId = '';
  let currentType: ItemType = 'password';

  const setType = (type: ItemType) => {
    currentType = type;
    f.typeButtons.forEach((b, t) => b.setAttribute('aria-pressed', String(t === type)));
    (f.siteLabel.firstChild as Text).textContent = SITE_LABELS[type];
    f.passwordGroup.hidden = type !== 'password';
    f.cardGroup.hidden = type !== 'card';
    f.addressGroup.hidden = type !== 'address';
    f.site.placeholder = type === 'password' ? 'github.com' : '';
  };

  const updateMeter = () => {
    const { score, label } = passwordStrength(f.password.value);
    f.meterFill.style.width = f.password.value ? `${(score + 1) * 20}%` : '0';
    f.meterFill.style.background = METER_COLORS[score] as string;
    f.meterText.textContent = f.password.value ? `Força: ${label}` : '';
  };

  const updateTotp = () => {
    const value = f.totp.value.trim();
    f.totpPreview.replaceChildren();
    if (!value) return;
    const chip = isValidTotp(value) ? totpChip(value, code => copySecret(code).then(() => ctx.notify('Código 2FA copiado.'))) : null;
    f.totpPreview.append(chip ?? el('span', 'meter-text', 'Chave inválida: use o texto base32 ou o link otpauth:// do QR code.'));
  };

  const renderHistory = (item: any) => {
    const history = [...(item?.history || [])].map((h: any, index: number) => ({ ...h, index })).reverse();
    f.historyToggle.hidden = history.length === 0;
    f.historyList.replaceChildren(...history.map(h => {
      const li = el('li');
      li.append(el('span', 'mono', h.password), el('span', 'meter-text', formatDate(h.timestamp)), button('Restaurar', 'btn ghost', async () => {
        await ctx.persist(restoreFromHistory(ctx.vault.getVault(), item.id, h.index));
        ctx.notify('Senha anterior restaurada.');
        open(item.id);
      }));
      return li;
    }));
  };

  const readDraft = (): ItemDraft => {
    const details = currentType === 'card' ? f.card : currentType === 'address' ? f.address : null;
    const draft: ItemDraft = {
      type: currentType, site: f.site.value, title: f.title.value, username: f.username.value, password: f.password.value,
      totp: f.totp.value, grouping: f.folder.value, notes: f.notes.value
    };
    if (currentId) draft.id = currentId;
    if (details) draft.details = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.value.trim()]));
    return draft;
  };

  function open(id?: string) {
    const item = id ? ctx.vault.getVault().find(i => i.id === id) : null;
    currentId = item?.id ?? '';
    f.form.reset();
    f.password.type = 'password';
    f.historyList.hidden = true;
    setType((item?.type || 'password') as ItemType);
    f.typeBar.hidden = !!item;
    const data = item ? parseJsonNotes(item) : {};
    if (item) {
      f.site.value = item.site || '';
      f.title.value = item.title || '';
      f.folder.value = item.grouping || '';
      f.username.value = item.username || '';
      f.password.value = item.password || '';
      f.totp.value = item.totp || '';
      f.notes.value = item.type === 'card' || item.type === 'address' ? data.notes || '' : item.notes || '';
      Object.entries({ ...f.card, ...f.address }).forEach(([k, input]) => { input.value = data[k] || ''; });
    }
    const folders = new Set(ctx.vault.getVault().map(i => i.grouping).filter(Boolean));
    f.datalist.replaceChildren(...[...folders].sort((a, b) => a.localeCompare(b)).map(name => Object.assign(el('option'), { value: name })));
    byId('editorTitle').textContent = item ? itemTitle(item) : 'Novo item';
    f.share.hidden = f.remove.hidden = !item;
    renderHistory(item);
    updateMeter();
    updateTotp();
    ctx.go('editor');
    f.site.focus();
  }

  f.typeButtons.forEach((b, type) => b.addEventListener('click', () => setType(type)));
  wireReveal(f.reveal, f.password);
  f.password.addEventListener('input', updateMeter);
  f.totp.addEventListener('input', updateTotp);
  f.historyToggle.addEventListener('click', () => { f.historyList.hidden = !f.historyList.hidden; });
  f.genUser.addEventListener('click', () => { f.username.value = generateUsername({ useWords: true, length: 8 }); });
  f.genPass.addEventListener('click', async () => {
    f.password.value = generateWith(await loadGeneratorSettings());
    f.password.type = 'text';
    updateMeter();
  });

  f.form.addEventListener('submit', async event => {
    event.preventDefault();
    const draft = readDraft();
    const problem = validateDraft(draft) ?? (draft.totp && !isValidTotp(draft.totp) ? 'A chave 2FA é inválida.' : null);
    if (problem) return ctx.notify(problem, 'error');
    const { items, created } = upsertItem(ctx.vault.getVault(), draft);
    await ctx.persist(items);
    ctx.notify(created ? `${TYPE_LABELS[currentType]} salvo.` : 'Alterações salvas.');
    ctx.go('vault');
  });

  f.remove.addEventListener('click', async () => {
    const item = ctx.vault.getVault().find(i => i.id === currentId);
    if (!item || !(await confirmAction({ title: 'Excluir item?', message: `"${itemTitle(item)}" sai do cofre em todos os dispositivos.`, confirmLabel: 'Excluir', danger: true }))) return;
    await ctx.persist(softDelete(ctx.vault.getVault(), currentId));
    ctx.notify('Item excluído.');
    ctx.go('vault');
  });

  f.share.addEventListener('click', () => {
    const item = ctx.vault.getVault().find(i => i.id === currentId);
    if (item) exportShare(ctx, { ...item, history: [] }, 'Item');
  });

  return { open };
}
