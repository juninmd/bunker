namespace Bunker {
  // Tela de bloqueio. Comportamento provisório herdado do app: qualquer senha mestra não vazia desbloqueia.
  export function initLock(onUnlock: () => void): void {
    const form = byId<HTMLFormElement>('lockForm');
    const input = byId<HTMLInputElement>('masterPassword');
    const field = byId('lockField');
    const card = byId('lockCard');
    const error = byId('lockError');
    const reveal = byId<HTMLButtonElement>('revealLock');
    const unlockBiometricsBtn = byId<HTMLButtonElement>('unlockBiometricsBtn');

    hasPasswordless().then(has => {
      unlockBiometricsBtn.hidden = !has;
    }).catch(() => {
      unlockBiometricsBtn.hidden = true;
    });

    unlockBiometricsBtn.addEventListener('click', async () => {
      try {
        unlockBiometricsBtn.disabled = true;
        const password = await recoverWithPasswordless();
        state.masterPassword = password;
        onUnlock();
      } catch (err) {
        setError('Falha ao desbloquear com biometria.');
        shake();
      } finally {
        unlockBiometricsBtn.disabled = false;
      }
    });

    const setError = (message: string): void => {
      error.replaceChildren(...(message ? [icon('alert'), message] : []));
      field.dataset.invalid = String(message !== '');
      input.setAttribute('aria-invalid', String(message !== ''));
    };

    const setRevealed = (revealed: boolean): void => {
      input.type = revealed ? 'text' : 'password';
      reveal.setAttribute('aria-pressed', String(revealed));
      reveal.replaceChildren(icon(revealed ? 'eyeOff' : 'eye'));
    };

    const shake = (): void => {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
    };

    reveal.addEventListener('click', () => {
      setRevealed(input.type === 'password');
      input.focus();
    });
    input.addEventListener('input', () => setError(''));
    card.addEventListener('animationend', () => card.classList.remove('shake'));

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (input.value.length === 0) {
        setError('Digite a senha mestra para continuar.');
        shake();
        input.focus();
        return;
      }
      state.masterPassword = input.value;
      input.value = '';
      setRevealed(false);
      onUnlock();
    });
  }
}
