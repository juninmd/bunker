import type { AppContext } from './context.js';
import { byId } from './dom.js';
import { icon } from './icons.js';
import { MIN_MASTER_PASSWORD_LENGTH } from '../services/vault-service.js';
import { hasPin } from '../services/pin-lock.js';
import { hasPasswordless, recoverWithPasswordless } from '../services/passwordless.js';

let creating = false;

function drawDial() {
  const ticks = byId('dialTicks');
  const ns = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 40; i++) {
    const major = i % 5 === 0;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', '60');
    line.setAttribute('x2', '60');
    line.setAttribute('y1', '17');
    line.setAttribute('y2', major ? '25' : '21');
    line.setAttribute('class', major ? 'dial-tick major' : 'dial-tick');
    line.setAttribute('transform', `rotate(${i * 9} 60 60)`);
    ticks.append(line);
  }
}

export function wireReveal(button: HTMLButtonElement, target: HTMLInputElement) {
  const render = () => {
    const hidden = target.type === 'password';
    button.replaceChildren(icon(hidden ? 'eye' : 'eyeOff'));
    button.setAttribute('aria-label', hidden ? 'Mostrar senha' : 'Ocultar senha');
  };
  button.addEventListener('click', () => {
    target.type = target.type === 'password' ? 'text' : 'password';
    render();
  });
  render();
}

function deny(message: string, ctx: AppContext) {
  const view = byId('view-lock');
  view.classList.remove('shake');
  void view.offsetWidth;
  view.classList.add('shake');
  ctx.notify(message, 'error');
}

// Runs one unlock attempt; the dial turns before the vault appears so success reads at a glance.
async function attempt(ctx: AppContext, onUnlocked: () => Promise<void>, run: () => Promise<unknown>, failure: string) {
  const buttons = byId('view-lock').querySelectorAll('button');
  buttons.forEach(b => (b.disabled = true));
  try {
    await run();
    await ctx.vault.exportSessionKey();
    byId('view-lock').classList.add('opening');
    await new Promise(r => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 420));
    await onUnlocked();
  } catch (e: any) {
    deny(e?.message === 'WEAK_MASTER_PASSWORD' ? `Use pelo menos ${MIN_MASTER_PASSWORD_LENGTH} caracteres.` : failure, ctx);
  } finally {
    buttons.forEach(b => (b.disabled = false));
  }
}

export async function prepareLockView(ctx: AppContext) {
  byId('view-lock').classList.remove('opening', 'shake');
  creating = !(await ctx.vault.hasVault());
  byId('lockHint').textContent = creating
    ? `Crie uma senha mestra com ${MIN_MASTER_PASSWORD_LENGTH}+ caracteres. Só ela abre o cofre, então guarde-a bem.`
    : 'Digite a senha mestra para abrir o cofre.';
  byId('unlockButton').textContent = creating ? 'Criar cofre' : 'Abrir cofre';
  byId('confirmRow').hidden = !creating;
  byId<HTMLInputElement>('masterPassword').autocomplete = creating ? 'new-password' : 'current-password';
  byId('pinForm').hidden = creating || !(await hasPin());
  byId('unlockBiometricsBtn').hidden = creating || !(await hasPasswordless());
  byId('recoveryBox').hidden = creating;
  (byId('pinForm').hidden ? byId('masterPassword') : byId('pinInput')).focus();
}

export function initLockView(ctx: AppContext, onUnlocked: () => Promise<void>) {
  drawDial();
  const master = byId<HTMLInputElement>('masterPassword');
  wireReveal(document.querySelector('[data-reveal="masterPassword"]') as HTMLButtonElement, master);

  byId('unlockForm').addEventListener('submit', event => {
    event.preventDefault();
    const password = master.value;
    if (!password) return deny('Digite a senha mestra.', ctx);
    if (creating && password !== byId<HTMLInputElement>('masterConfirm').value) return deny('As senhas não conferem.', ctx);
    attempt(ctx, onUnlocked, () => ctx.vault.unlock(password), 'Senha mestra incorreta.').then(() => {
      master.value = '';
      byId<HTMLInputElement>('masterConfirm').value = '';
    });
  });

  byId('pinForm').addEventListener('submit', event => {
    event.preventDefault();
    const pin = byId<HTMLInputElement>('pinInput');
    attempt(ctx, onUnlocked, () => ctx.vault.unlockWithPin(pin.value), 'PIN incorreto. Após 5 erros ele é apagado.')
      .then(() => { pin.value = ''; prepareLockView(ctx); });
  });

  byId('unlockBiometricsBtn').addEventListener('click', () => {
    attempt(ctx, onUnlocked, async () => ctx.vault.unlock(await recoverWithPasswordless()), 'A biometria não foi confirmada.');
  });

  byId('recoveryForm').addEventListener('submit', event => {
    event.preventDefault();
    const code = byId<HTMLInputElement>('recoveryInput');
    attempt(ctx, onUnlocked, () => ctx.vault.unlockWithRecoveryKey(code.value), 'Código de recuperação inválido.')
      .then(() => { code.value = ''; });
  });
}
