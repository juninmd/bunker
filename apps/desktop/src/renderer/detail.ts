namespace Bunker {
  const MASK = '••••••••••';

  interface Field {
    label: string;
    value: string;
    copied: string;
    secret?: boolean;
    mono?: boolean;
    multi?: boolean;
  }

  // Só aparecem os campos que o item realmente tem. Senha e notas ficam mascaradas até o usuário revelar.
  function fieldsOf(item: Item): Field[] {
    const fields: Field[] = [];
    if (item.kind === 'password' && item.name) fields.push({ label: 'Site', value: item.url, copied: 'Site copiado.' });
    if (item.username) fields.push({ label: 'Usuário', value: item.username, copied: 'Usuário copiado.' });
    if (item.password) fields.push({ label: 'Senha', value: item.password, copied: 'Senha copiada.', secret: true, mono: true });
    if (item.notes) fields.push({ label: 'Notas', value: item.notes, copied: 'Notas copiadas.', secret: true, multi: true });
    return fields;
  }

  function flashDone(button: HTMLButtonElement): void {
    button.classList.add('done');
    button.replaceChildren(icon('check'));
    window.setTimeout(() => {
      button.classList.remove('done');
      button.replaceChildren(icon('copy'));
    }, 1200);
  }

  function buildField(data: Field): HTMLElement {
    const lower = data.label.toLowerCase();
    const value = el('div', 'fld-val');
    const actions = el('div', 'fld-actions');
    let shown = !data.secret;

    // O segredo só entra no DOM enquanto estiver revelado; mascarado, o leitor de tela também o ignora.
    const paint = (): void => {
      value.className = 'fld-val';
      if (data.mono) value.classList.add('mono');
      if (!shown) value.classList.add('masked');
      else if (data.multi) value.classList.add('multi');
      value.textContent = shown ? data.value : MASK;
      if (data.secret) value.setAttribute('aria-hidden', String(!shown));
    };

    if (data.secret) {
      const toggle = iconButton('eye', `Mostrar ${lower}`, () => {
        shown = !shown;
        toggle.setAttribute('aria-pressed', String(shown));
        toggle.title = `${shown ? 'Ocultar' : 'Mostrar'} ${lower}`;
        toggle.replaceChildren(icon(shown ? 'eyeOff' : 'eye'));
        paint();
      });
      toggle.setAttribute('aria-pressed', 'false');
      actions.append(toggle);
    }

    const copy = iconButton('copy', `Copiar ${lower}`, () => {
      void copyToClipboard(data.value, data.copied).then(copied => copied && flashDone(copy));
    });
    actions.append(copy);

    paint();
    return el('div', data.multi ? 'fld wide' : 'fld', el('span', 'fld-label', data.label), el('div', 'fld-box', value, actions));
  }

  // Painel inline; a altura anima por CSS ao receber data-open="true". Os valores só são criados ao expandir.
  export function buildDetails(item: Item): HTMLElement {
    const fields = fieldsOf(item).map(buildField);
    const grid = el('div', 'fields', ...(fields.length ? fields : [el('p', 'empty-fields', 'Nenhum dado salvo neste item.')]));
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', `Detalhes de ${item.title}`);
    const panel = el('div', 'details', el('div', 'details-inner', grid));
    panel.dataset.open = 'false';
    return panel;
  }
}
