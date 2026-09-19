import type { AppContext } from './context.js';
import { byId, el } from './dom.js';
import { icon, type IconName } from './icons.js';
import { importShare } from './share-actions.js';
import { openDigitalWill, openPolicies, openFolderShare } from './business-panels.js';
import * as actions from './settings-actions.js';
import { hasPin } from '../services/pin-lock.js';
import { hasPasswordless } from '../services/passwordless.js';
import { hasRecoveryCode } from '../services/recovery-key.js';

interface Row {
  icon: IconName;
  label: string;
  hint?: string;
  run: () => void;
  danger?: boolean;
}

function row(r: Row): HTMLButtonElement {
  const node = el('button', `settings-row${r.danger ? ' danger' : ''}`);
  node.type = 'button';
  const text = el('span', 'settings-text');
  text.append(el('span', 'settings-label', r.label));
  if (r.hint) text.append(el('span', 'settings-hint', r.hint));
  node.append(icon(r.icon), text, icon('chevron'));
  node.addEventListener('click', r.run);
  return node;
}

function section(title: string, rows: Row[]): HTMLElement {
  const box = el('section', 'settings-group');
  box.append(el('h3', '', title), ...rows.map(row));
  return box;
}

export function initSettingsView(ctx: AppContext) {
  const file = Object.assign(el('input', 'file-input'), { type: 'file', accept: '.csv,text/csv' });
  file.id = 'localCsvInput';
  file.addEventListener('change', () => {
    const chosen = file.files?.[0];
    if (chosen) actions.importLastPassFile(ctx, chosen);
    file.value = '';
  });

  const render = async () => {
    const [pinOn, bioOn, recoveryOn, lastSync] = await Promise.all([hasPin(), hasPasswordless(), hasRecoveryCode(), actions.lastSyncLabel()]);
    byId('settingsBody').replaceChildren(file,
      section('Sincronização', [
        { icon: 'cloud', label: 'Sincronizar com o Google Drive', hint: actions.driveConfigured() ? lastSync : 'Precisa configurar o Client ID', run: () => actions.syncNow(ctx) }
      ]),
      section('Migrar do LastPass', [
        { icon: 'upload', label: 'Importar CSV do LastPass', hint: 'Inclui códigos 2FA, notas e pastas', run: () => file.click() },
        { icon: 'download', label: 'Exportar CSV', hint: 'Sem criptografia; só para migração', run: () => actions.exportCsv(ctx) }
      ]),
      section('Desbloqueio', [
        { icon: 'key', label: 'PIN rápido', hint: pinOn ? 'Ativo até fechar o navegador' : 'Desativado', run: () => actions.setupPin(ctx).then(render) },
        { icon: 'fingerprint', label: 'Biometria', hint: bioOn ? 'Ativa neste dispositivo' : 'Windows Hello, Touch ID ou chave de segurança', run: () => actions.setupBiometrics(ctx).then(render) },
        { icon: 'lifebuoy', label: 'Código de recuperação', hint: recoveryOn ? 'Gerado; gerar outro invalida o anterior' : 'Recomendado: ainda não gerado', run: () => actions.createRecoveryCode(ctx).then(render) },
        { icon: 'lock', label: 'Alterar senha mestra', run: () => actions.changeMasterPassword(ctx).then(render) }
      ]),
      section('Compartilhar', [
        { icon: 'download', label: 'Receber item compartilhado', run: () => importShare(ctx, 'item', false) },
        { icon: 'share', label: 'Compartilhar uma pasta', run: () => openFolderShare(ctx) },
        { icon: 'download', label: 'Receber pasta compartilhada', run: () => importShare(ctx, 'pasta', true) }
      ]),
      section('Emergência', [
        { icon: 'users', label: 'Exportar cofre de emergência', hint: 'Cópia cifrada para uma pessoa de confiança', run: () => actions.exportEmergency(ctx) },
        { icon: 'download', label: 'Receber cofre de emergência', run: () => importShare(ctx, 'cofre de emergência', true) },
        { icon: 'note', label: 'Testamento digital', hint: 'Contato e instruções guardados no cofre', run: () => openDigitalWill(ctx) }
      ]),
      section('Empresa', [
        { icon: 'briefcase', label: 'Políticas e sites bloqueados', run: () => openPolicies(ctx) }
      ]),
      section('Sessão', [
        { icon: 'clock', label: 'Bloqueio automático', hint: 'Após 15 min sem uso e quando o computador bloqueia', run: () => ctx.notify('O bloqueio automático está sempre ativo.') },
        { icon: 'lock', label: 'Bloquear agora', run: () => ctx.lockNow('Cofre bloqueado.'), danger: true }
      ])
    );
  };

  return { show: render };
}
