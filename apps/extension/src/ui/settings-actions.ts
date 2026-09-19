import { visibleItems, type AppContext } from './context.js';
import { askText, confirmAction, showInfo } from './dialog.js';
import { exportShare } from './share-actions.js';
import { MIN_MASTER_PASSWORD_LENGTH } from '../services/vault-service.js';
import { MIN_PIN_LENGTH, MAX_PIN_ATTEMPTS } from '../services/pin-lock.js';
import { setupPasswordless } from '../services/passwordless.js';
import { mapCSVRowToVaultItem, parseCSV } from '../utils/csv-utils.js';
import { getLocal, setLocalMany } from '../utils/local-storage.js';

export function driveConfigured(): boolean {
  const clientId = chrome.runtime.getManifest().oauth2?.client_id || '';
  return !!clientId && !clientId.startsWith('YOUR_CLIENT_ID');
}

export async function lastSyncLabel(): Promise<string> {
  const last = await getLocal('bunkerpass.last_sync');
  if (!last) return 'Ainda não sincronizado';
  const date = new Date(last);
  return `Última vez: ${Number.isNaN(date.getTime()) ? last : date.toLocaleString('pt-BR')}`;
}

export async function syncNow(ctx: AppContext) {
  if (!driveConfigured()) {
    await showInfo({ title: 'Google Drive não configurado', message: 'Rode "node scripts/setup-drive-oauth.mjs" e siga docs/SETUP.md para criar seu Client ID. Depois recarregue a extensão.' });
    return;
  }
  ctx.notify('Sincronizando…');
  try {
    const { stats } = await ctx.sync.sync(() => askText({ title: 'Confirme a senha mestra', message: 'O cofre no Drive foi criado em outro dispositivo. Digite a senha mestra uma vez para juntar os dois.', label: 'Senha mestra', inputType: 'password' }));
    await setLocalMany({ 'bunkerpass.last_sync': new Date().toISOString() });
    ctx.refresh();
    ctx.notify(stats.added || stats.updated ? `Sincronizado: ${stats.added} novos, ${stats.updated} atualizados.` : 'Tudo sincronizado.');
  } catch (e: any) {
    ctx.notify(e?.message === 'MASTER_PASSWORD_REQUIRED' ? 'Sincronização cancelada.' : `Falha ao sincronizar: ${e?.message || e}`, 'error');
  }
}

export async function importLastPassFile(ctx: AppContext, file: File) {
  try {
    const rows = parseCSV(await file.text());
    const imported = rows.map(mapCSVRowToVaultItem).filter(i => i.site && (i.type !== 'password' || i.password));
    if (imported.length === 0) return ctx.notify('Nenhum item reconhecido. Use o CSV exportado pelo LastPass.', 'error');
    const { merged, added, updated } = ctx.sync.mergeCSV(ctx.vault.getVault(), imported);
    const replace = { title: 'Atualizar itens existentes?', message: updated + ' itens do cofre receberão os dados do arquivo. A senha atual de cada um fica no histórico.', confirmLabel: 'Importar' };
    if (updated > 0 && !(await confirmAction(replace))) return;
    await ctx.persist(merged);
    await showInfo({ title: 'Importação concluída', message: `${added} itens novos e ${updated} atualizados.\n\nApague agora o arquivo CSV do computador e da lixeira: ele tem todas as senhas sem criptografia.` });
    ctx.go('vault');
  } catch (e) {
    console.error('CSV import failed', e);
    ctx.notify('Não foi possível ler o arquivo CSV.', 'error');
  }
}

export async function exportCsv(ctx: AppContext) {
  const ok = await confirmAction({ title: 'Exportar sem criptografia?', message: 'O arquivo CSV terá todas as senhas legíveis. Use só para migrar e apague depois.', confirmLabel: 'Continuar', danger: true });
  if (!ok || !(await ctx.ensureMasterPassword('Confirme a senha mestra para exportar.'))) return;
  const blob = new Blob([ctx.sync.generateCSVContent(visibleItems(ctx.vault.getVault()))], { type: 'text/csv;charset=utf-8' });
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'bunker-export.csv' });
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export async function setupPin(ctx: AppContext) {
  const pin = await askText({ title: 'PIN rápido', message: `Abre o cofre depois do bloqueio automático. Vale até fechar o navegador e é apagado após ${MAX_PIN_ATTEMPTS} erros.`, label: `PIN (mín. ${MIN_PIN_LENGTH} dígitos)`, inputType: 'password', confirmLabel: 'Ativar PIN' });
  if (pin === null) return;
  try {
    await ctx.vault.setupPin(pin);
    ctx.notify('PIN ativado até fechar o navegador.');
  } catch {
    ctx.notify(`O PIN precisa de pelo menos ${MIN_PIN_LENGTH} dígitos.`, 'error');
  }
}

export async function setupBiometrics(ctx: AppContext) {
  const password = await ctx.ensureMasterPassword('Confirme a senha mestra para ativar a biometria.');
  if (!password) return;
  try {
    await setupPasswordless(password);
    ctx.notify('Biometria ativada neste dispositivo.');
  } catch (e: any) {
    ctx.notify(`Biometria indisponível: ${e?.message || 'o dispositivo não suporta WebAuthn PRF'}.`, 'error');
  }
}

export async function createRecoveryCode(ctx: AppContext) {
  if (!(await ctx.ensureMasterPassword('Confirme a senha mestra para gerar o código.'))) return;
  const code = await ctx.vault.generateRecoveryKey();
  await showInfo({ title: 'Código de recuperação', message: 'Guarde fora do computador (papel ou cofre físico). Ele abre o cofre se você esquecer a senha mestra. Gerar um novo invalida este.', label: 'Código', value: code, readonly: true });
}

export async function changeMasterPassword(ctx: AppContext) {
  const current = await askText({ title: 'Alterar senha mestra', label: 'Senha mestra atual', inputType: 'password', confirmLabel: 'Continuar' });
  if (!current) return;
  const next = await askText({ title: 'Nova senha mestra', message: `Use ${MIN_MASTER_PASSWORD_LENGTH}+ caracteres. Outros dispositivos vão pedir a nova senha no próximo sync.`, label: 'Nova senha', inputType: 'password', confirmLabel: 'Continuar' });
  if (!next) return;
  if ((await askText({ title: 'Repita a nova senha', label: 'Nova senha', inputType: 'password', confirmLabel: 'Alterar' })) !== next) return ctx.notify('As senhas não conferem.', 'error');
  try {
    await ctx.vault.changeMasterPassword(current, next);
    ctx.notify('Senha mestra alterada. Gere um novo código de recuperação.');
  } catch (e: any) {
    ctx.notify(e?.message === 'WEAK_MASTER_PASSWORD' ? `Use pelo menos ${MIN_MASTER_PASSWORD_LENGTH} caracteres.` : 'Senha mestra atual incorreta.', 'error');
  }
}

export async function exportEmergency(ctx: AppContext) {
  if (!(await ctx.ensureMasterPassword('Confirme a senha mestra para exportar o cofre inteiro.'))) return;
  await exportShare(ctx, visibleItems(ctx.vault.getVault()), 'Cofre de emergência');
}
