namespace Bunker {
  type Source = 'drive' | 'file';

  // O processo principal rejeita com textos em inglês (ou com o prefixo do IPC); aqui viram mensagens em pt-BR.
  const KNOWN_ERRORS: ReadonlyArray<readonly [RegExp, string]> = [
    [/closed/i, 'A janela de login foi fechada antes de concluir.'],
    [/passwords\.csv not found/i, 'O arquivo passwords.csv não foi encontrado no Google Drive.'],
    [/download/i, 'Não foi possível baixar o arquivo do Google Drive.'],
    [/token/i, 'Não foi possível autenticar com o Google.']
  ];

  function describeError(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error);
    console.warn('Falha na sincronização com o Google Drive:', raw);
    const known = KNOWN_ERRORS.find(([pattern]) => pattern.test(raw));
    return known ? known[1] : 'Não foi possível sincronizar com o Google Drive.';
  }

  function markSynced(): void {
    state.sync = 'ok';
    state.syncedAt = new Date();
    setSyncChip();
  }

  // Troca os itens pelo conteúdo do CSV. Se o arquivo não tiver itens, o cofre atual é mantido.
  function applyCsv(text: string, source: Source): boolean {
    const items = toItems(parseFullCSV(text));
    if (items.length === 0) {
      toast('error', 'Nenhum item encontrado. Confira se o arquivo é o passwords.csv.');
      return false;
    }
    state.items = items;
    render(true);
    const from = source === 'drive' ? 'do Google Drive' : 'do CSV';
    const verb = source === 'drive' ? 'sincronizado' : 'importado';
    toast('ok', items.length === 1 ? `1 item ${verb} ${from}.` : `${items.length} itens ${verb}s ${from}.`);
    return true;
  }

  export async function importFile(file: File): Promise<void> {
    try {
      if (applyCsv(await file.text(), 'file')) markSynced();
    } catch {
      toast('error', 'Não foi possível ler o arquivo.');
    }
  }

  // Enquanto sincroniza, os dois botões ficam inativos e o primário mostra o spinner.
  function setBusy(busy: boolean): void {
    document.querySelectorAll<HTMLElement>('[data-action="sync"], [data-action="import"]').forEach(button => {
      button.setAttribute('aria-disabled', String(busy));
      if (button.dataset.action !== 'sync') return;
      button.setAttribute('aria-busy', String(busy));
      const label = button.querySelector('.btn-label');
      if (label) label.textContent = busy ? 'Sincronizando…' : 'Sincronizar Drive';
    });
  }

  export async function syncDrive(): Promise<void> {
    const api = window.electronAPI;
    if (!api?.syncGoogleDrive) {
      toast('error', 'A sincronização com o Google Drive só funciona no app desktop.');
      return;
    }
    state.sync = 'busy';
    setSyncChip();
    setBusy(true);
    try {
      if (applyCsv(await api.syncGoogleDrive(), 'drive')) markSynced();
      else state.sync = 'error';
    } catch (error) {
      state.sync = 'error';
      toast('error', describeError(error));
    }
    setBusy(false);
    setSyncChip();
  }
}
