namespace Bunker {
  // Funcionalidades ainda não implementadas: aparecem desabilitadas, sob o grupo "Em breve".
  const SOON: ReadonlyArray<{ label: string; icon: IconName }> = [
    { label: 'Gerador de Senhas', icon: 'sparkles' },
    { label: 'Compartilhamento', icon: 'share' },
    { label: 'Dark Web', icon: 'globe' },
    { label: 'Testamento Digital', icon: 'hourglass' }
  ];

  const CHIP_TEXT: Record<SyncStatus, string> = {
    idle: 'Aguardando sincronização',
    busy: 'Sincronizando…',
    ok: 'Sincronizado',
    error: 'Falha na sincronização'
  };

  export function buildSidebar(onFilter: (filter: Filter) => void): void {
    const setupBiometricsBtn = byId<HTMLButtonElement>('setupBiometricsBtn');
    setupBiometricsBtn.addEventListener('click', async () => {
      try {
        if (!state.masterPassword) throw new Error('Cofre bloqueado.');
        setupBiometricsBtn.disabled = true;
        await setupPasswordless(state.masterPassword);
        toast('ok', 'Biometria configurada com sucesso.');
      } catch (error) {
        toast('error', error instanceof Error ? error.message : 'Falha ao configurar biometria.');
      } finally {
        setupBiometricsBtn.disabled = false;
      }
    });

    byId('nav').replaceChildren(
      ...CATEGORIES.map(category => {
        const button = el('button', 'nav-item', icon(category.icon), el('span', 'nav-label', category.label), el('span', 'nav-count', '0'));
        button.type = 'button';
        button.dataset.filter = category.id;
        button.addEventListener('click', () => onFilter(category.id));
        return button;
      }),
      ((): HTMLButtonElement => {
        const button = el('button', 'nav-item', icon('shield'), el('span', 'nav-label', 'Painel de Segurança'));
        button.type = 'button';
        button.dataset.filter = 'security';
        button.addEventListener('click', () => onFilter('security'));
        return button as HTMLButtonElement;
      })(),
      ((): HTMLButtonElement => {
        const button = el('button', 'nav-item', icon('shield'), el('span', 'nav-label', 'SaaS Protect'));
        button.type = 'button';
        button.dataset.filter = 'saas';
        button.addEventListener('click', () => onFilter('saas'));
        return button as HTMLButtonElement;
      })()
    );
    byId('soonGroup').append(
      ...SOON.map(entry => {
        const button = el('button', 'nav-item', icon(entry.icon), el('span', 'nav-label', entry.label));
        button.type = 'button';
        button.disabled = true;
        button.title = 'Em breve';
        return button;
      })
    );
  }

  // Contagens ao vivo e o filtro ativo (aria-current).
  export function updateNav(counts: Record<Filter, number>, active: Filter): void {
    byId('nav').querySelectorAll<HTMLButtonElement>('.nav-item').forEach(button => {
      const id = button.dataset.filter as Filter;
      const count = button.querySelector('.nav-count');
      if (count) count.textContent = String(counts[id]);
      if (id === active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  }

  // O chip mostra o estado real: só vira "Sincronizado às HH:MM" depois de uma sincronização ou importação concluída.
  export function setSyncChip(): void {
    const { sync, syncedAt } = state;
    const chip = byId('syncChip');
    const clock = syncedAt ? timeLabel(syncedAt) : '';
    chip.dataset.state = sync;
    chip.title = sync === 'error' && clock ? `Última sincronização às ${clock}` : '';
    byId('syncText').textContent = sync === 'ok' && clock ? `${CHIP_TEXT.ok} às ${clock}` : CHIP_TEXT[sync];
  }
}
