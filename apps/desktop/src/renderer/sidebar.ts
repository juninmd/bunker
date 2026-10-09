namespace Bunker {
  // Funcionalidades ainda não implementadas: aparecem desabilitadas, sob o grupo "Em breve".
  const SOON: ReadonlyArray<{ label: string; icon: IconName }> = [
    { label: 'Painel de Segurança', icon: 'shield' },
    { label: 'Gerador de Senhas', icon: 'sparkles' },
    { label: 'Compartilhamento', icon: 'share' },
    { label: 'Dark Web', icon: 'globe' },
    { label: 'SaaS Protect', icon: 'cloud' },
    { label: 'Testamento Digital', icon: 'hourglass' }
  ];

  const CHIP_TEXT: Record<SyncStatus, string> = {
    idle: 'Aguardando sincronização',
    busy: 'Sincronizando…',
    ok: 'Sincronizado',
    error: 'Falha na sincronização'
  };

  export function buildSidebar(onFilter: (filter: Filter) => void): void {
    byId('nav').replaceChildren(
      ...CATEGORIES.map(category => {
        const button = el('button', 'nav-item', icon(category.icon), el('span', 'nav-label', category.label), el('span', 'nav-count', '0'));
        button.type = 'button';
        button.dataset.filter = category.id;
        button.addEventListener('click', () => onFilter(category.id));
        return button;
      })
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
