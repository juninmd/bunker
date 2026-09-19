import { VaultService } from './services/vault-service.js';
import { SyncService } from './services/sync-service.js';
import type { AppContext, Tone, ViewName } from './ui/context.js';
import { byId } from './ui/dom.js';
import { askText } from './ui/dialog.js';
import { initNav, previousView, showView } from './ui/nav.js';
import { initLockView, prepareLockView } from './ui/lock-view.js';
import { initVaultList, renderVaultList } from './ui/vault-list.js';
import { initEditor } from './ui/item-editor.js';
import { initGeneratorView } from './ui/generator-view.js';
import { initSecurityView } from './ui/security-view.js';
import { initSettingsView } from './ui/settings-view.js';

const vault = new VaultService();
const sync = new SyncService(vault);
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let lastActivity = 0;

function touch() {
  if (!vault.isUnlocked || Date.now() - lastActivity < 30000) return;
  lastActivity = Date.now();
  chrome.runtime.sendMessage({ type: 'ACTIVITY' }).catch(() => undefined);
}

function notify(message: string, tone: Tone = 'info') {
  const toast = byId('toast');
  toast.textContent = message;
  toast.className = `toast show${tone === 'error' ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, tone === 'error' ? 5000 : 3200);
}

const onShow: Partial<Record<ViewName, () => void>> = {};

const ctx: AppContext = {
  vault,
  sync,
  notify,
  go(view) {
    showView(view);
    onShow[view]?.();
  },
  refresh: () => renderVaultList(ctx),
  openEditor: id => editor.open(id),
  openPanel(title, build) {
    byId('panelTitle').textContent = title;
    const body = byId('panelBody');
    body.replaceChildren();
    build(body);
    ctx.go('panel');
  },
  async persist(items) {
    await vault.save(items);
    renderVaultList(ctx);
    touch();
    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }).catch(() => undefined);
  },
  async ensureMasterPassword(reason) {
    if (vault.masterPassword) return vault.masterPassword;
    const password = await askText({ title: 'Confirme a senha mestra', message: reason, label: 'Senha mestra', inputType: 'password' });
    if (!password) return null;
    try {
      await vault.unlock(password);
      return password;
    } catch {
      notify('Senha mestra incorreta.', 'error');
      return null;
    }
  },
  lockNow(message) {
    vault.lock();
    ctx.go('lock');
    if (message) notify(message);
  }
};

const editor = initEditor(ctx);
const generator = initGeneratorView(ctx);
const security = initSecurityView(ctx);
const settings = initSettingsView(ctx);
onShow.lock = () => { prepareLockView(ctx); };
onShow.vault = () => renderVaultList(ctx);
onShow.generator = () => { generator.show(); };
onShow.security = security.show;
onShow.settings = () => { settings.show(); };

async function enterVault() {
  lastActivity = 0;
  touch();
  byId('toast').className = 'toast';
  ctx.go('vault');
  byId<HTMLInputElement>('searchInput').focus();
}

initNav(view => ctx.go(view), () => ctx.go(previousView()));
initLockView(ctx, enterVault);
initVaultList(ctx);

document.addEventListener('click', touch, { capture: true });
document.addEventListener('keydown', event => {
  const view = byId('app').dataset.view;
  if (event.key === 'Escape' && (view === 'editor' || view === 'panel') && !document.querySelector('dialog[open]')) {
    event.preventDefault();
    ctx.go(previousView());
  }
});

// The background drops the session key on auto-lock or OS lock; mirror it here so a stale popup closes the vault.
chrome.storage.session.onChanged.addListener(changes => {
  if (changes.sessionKey && !changes.sessionKey.newValue && vault.isUnlocked) ctx.lockNow('Cofre bloqueado automaticamente.');
});

(async () => {
  if (await vault.restoreSession()) await enterVault();
  else ctx.go('lock');
})();
