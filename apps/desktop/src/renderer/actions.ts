namespace Bunker {
  // Botões com data-action (barra superior e estados vazios) compartilham os mesmos manipuladores.
  export function initActions(): void {
    const file = byId<HTMLInputElement>('csvFileInput');

    document.addEventListener('click', event => {
      const origin = event.target instanceof Element ? event.target : null;
      const button = origin?.closest<HTMLElement>('[data-action]');
      if (!button || button.getAttribute('aria-disabled') === 'true') return;
      if (button.dataset.action === 'import') file.click();
      else if (button.dataset.action === 'sync') void syncDrive();
      else if (button.dataset.action === 'reset') resetFilters();
    });

    file.addEventListener('change', () => {
      const picked = file.files?.[0];
      file.value = '';
      if (picked) void importFile(picked);
    });
  }
}
