import { visibleItems, parseJsonNotes, type AppContext } from './context.js';
import { button, el, field, input } from './dom.js';
import { exportShare } from './share-actions.js';

function upsertInternal(ctx: AppContext, type: string, build: (existing: any) => any): any[] {
  const now = new Date().toISOString();
  const items = ctx.vault.getVault().map(i => ({ ...i }));
  const index = items.findIndex(i => i.type === type);
  const next = { ...build(index >= 0 ? items[index] : null), type, updatedAt: now };
  if (index >= 0) {
    const merged = { ...items[index], ...next };
    delete merged.deletedAt;
    items[index] = merged;
  } else {
    items.push({ id: crypto.randomUUID(), createdAt: now, ...next });
  }
  return items;
}

export function openDigitalWill(ctx: AppContext) {
  ctx.openPanel('Testamento digital', body => {
    const current = parseJsonNotes(ctx.vault.getVault().find(i => i.type === 'digital-will' && !i.deletedAt) || {});
    const name = Object.assign(input('dwContactName'), { value: current.contactName || '' });
    const email = Object.assign(input('dwContactEmail', { type: 'email' }), { value: current.contactEmail || '' });
    const note = Object.assign(el('textarea'), { rows: 5, value: current.accessNote || '' });
    const save = button('Salvar testamento', 'btn primary block', async () => {
      if (!name.value.trim()) return ctx.notify('Informe o nome do contato.', 'error');
      const notes = JSON.stringify({ contactName: name.value.trim(), contactEmail: email.value.trim(), accessNote: note.value.trim() });
      await ctx.persist(upsertInternal(ctx, 'digital-will', () => ({ site: 'Testamento digital', username: '', password: '', notes, grouping: '' })));
      ctx.notify('Testamento digital salvo.');
      ctx.go('settings');
    });
    body.append(
      el('p', 'muted', 'Fica cifrado no cofre. Para a pessoa conseguir abrir, entregue também um cofre de emergência (Ajustes → Emergência).'),
      field('Nome do contato', name), field('E-mail do contato', email), field('Instruções de acesso', note), save
    );
  });
}

export function openPolicies(ctx: AppContext) {
  ctx.openPanel('Políticas da empresa', body => {
    const policy = ctx.vault.getVault().find(i => i.type === 'business-policy') || {};
    const min = Object.assign(input('hubMinPasswordLength', { type: 'number', min: '8', max: '64' }), { value: String(policy.minPasswordLength || 16) });
    const blocked = Object.assign(el('textarea'), { rows: 5, value: policy.blockedDomains || '', placeholder: 'exemplo.com\njogos.com' });
    const save = button('Salvar políticas', 'btn primary block', async () => {
      const minPasswordLength = Math.min(64, Math.max(8, parseInt(min.value, 10) || 16));
      await ctx.persist(upsertInternal(ctx, 'business-policy', () => ({ site: 'business-policy', minPasswordLength, blockedDomains: blocked.value })));
      ctx.notify('Políticas salvas.');
      ctx.go('settings');
    });
    body.append(
      field('Tamanho mínimo de senha', min),
      field('Sites bloqueados (um por linha)', blocked),
      el('p', 'meter-text', 'O bloqueio vale enquanto o cofre estiver aberto neste navegador.'),
      save
    );
  });
}

export function openFolderShare(ctx: AppContext) {
  ctx.openPanel('Compartilhar pasta', body => {
    const items = visibleItems(ctx.vault.getVault());
    const folders = Array.from(new Set(items.map(i => i.grouping).filter(Boolean))).sort();
    if (folders.length === 0) {
      body.append(el('p', 'muted', 'Crie uma pasta ao editar um item para poder compartilhá-la.'));
      return;
    }
    body.append(el('p', 'muted', 'Escolha a pasta. Você recebe um código cifrado e uma senha para enviar por canais diferentes.'));
    folders.forEach(folder => {
      const inFolder = items.filter(i => i.grouping === folder);
      body.append(button(`${folder} (${inFolder.length})`, 'btn ghost block', () =>
        exportShare(ctx, inFolder.map(i => ({ ...i, history: [] })), `Pasta ${folder}`)));
    });
  });
}
