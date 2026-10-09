namespace Bunker {
  const CLEAR_AFTER_MS = 30_000;
  let clearTimer: number | undefined;
  let wipePending = false;

  // Substitui a área de transferência por texto vazio, como a extensão faz depois de 30 s.
  async function wipe(): Promise<void> {
    try {
      await navigator.clipboard.writeText('');
      wipePending = false;
    } catch {
      // O navegador só deixa escrever com a janela em foco: repete quando ela voltar.
      wipePending = true;
    }
  }

  // Copia o valor e agenda a limpeza. Uma nova cópia reinicia a contagem dos 30 s.
  export async function copyToClipboard(value: string, done: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast('error', 'Não foi possível copiar.');
      return false;
    }
    window.clearTimeout(clearTimer);
    wipePending = false;
    clearTimer = window.setTimeout(() => void wipe(), CLEAR_AFTER_MS);
    toast('ok', `${done} Some da área de transferência em ${CLEAR_AFTER_MS / 1000} s.`);
    return true;
  }

  window.addEventListener('focus', () => {
    if (wipePending) void wipe();
  });
}
