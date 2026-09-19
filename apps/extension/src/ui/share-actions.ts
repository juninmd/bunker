import type { AppContext } from './context.js';
import { askText, showInfo } from './dialog.js';
import { copySecret } from './clipboard.js';
import { generatePassphrase, openShare, sealShare } from '../utils/share-codec.js';

// Produces a code plus a generated passphrase; the user sends them through two different channels.
export async function exportShare(ctx: AppContext, data: unknown, what: string) {
  const passphrase = generatePassphrase();
  const code = await sealShare(data, passphrase);
  await copySecret(code);
  await showInfo({
    title: `${what} pronto para enviar`,
    message: 'O código cifrado foi copiado. Envie-o por um canal e a senha abaixo por outro (por exemplo, código por e-mail e senha por mensagem).',
    label: 'Senha do compartilhamento',
    value: passphrase,
    readonly: true
  });
}

async function receive(what: string): Promise<any | null> {
  const code = await askText({ title: `Importar ${what}`, message: 'Cole o código que você recebeu.', label: 'Código', confirmLabel: 'Continuar' });
  if (!code) return null;
  const passphrase = await askText({ title: 'Senha do compartilhamento', label: 'Senha', inputType: 'password', confirmLabel: 'Importar' });
  if (!passphrase) return null;
  return openShare(code, passphrase);
}

function freshCopies(items: any[]): any[] {
  const now = new Date().toISOString();
  return items
    .filter(item => item && typeof item === 'object' && item.site)
    .map(item => {
      const copy = { ...item, id: crypto.randomUUID(), createdAt: now, updatedAt: now, history: [] };
      delete copy.deletedAt;
      return copy;
    });
}

export async function importShare(ctx: AppContext, what: string, expectList: boolean) {
  try {
    const data = await receive(what);
    if (data === null) return;
    if (expectList !== Array.isArray(data)) throw new Error('INVALID_SHARE_CODE');
    const incoming = freshCopies(expectList ? data : [data]);
    if (incoming.length === 0) throw new Error('INVALID_SHARE_CODE');
    await ctx.persist([...ctx.vault.getVault(), ...incoming]);
    ctx.notify(incoming.length === 1 ? 'Item importado.' : `${incoming.length} itens importados.`);
    ctx.go('vault');
  } catch (e: any) {
    ctx.notify(e?.message === 'WRONG_SHARE_PASSPHRASE' ? 'Senha do compartilhamento incorreta.' : 'Código inválido.', 'error');
  }
}
