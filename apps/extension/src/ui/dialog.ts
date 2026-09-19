// Native <dialog> keeps focus trapped and Esc-to-cancel for free; content is set via textContent only.
interface DialogOptions {
  title: string;
  message?: string;
  label?: string;
  inputType?: 'text' | 'password';
  value?: string;
  readonly?: boolean;
  confirmLabel?: string;
  cancelLabel?: string | null;
  danger?: boolean;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function openDialog(opts: DialogOptions, withInput: boolean): Promise<string | null> {
  return new Promise(resolve => {
    const dialog = el('dialog', 'bp-dialog');
    dialog.setAttribute('aria-labelledby', 'bp-dialog-title');
    const form = el('form');
    form.method = 'dialog';
    const title = el('h2', 'bp-dialog-title', opts.title);
    title.id = 'bp-dialog-title';
    form.append(title);
    if (opts.message) form.append(el('p', 'bp-dialog-message', opts.message));

    let input: HTMLInputElement | null = null;
    if (withInput) {
      const label = el('label', 'field-label', opts.label ?? '');
      input = el('input', opts.readonly ? 'mono' : '');
      input.type = opts.inputType ?? 'text';
      input.value = opts.value ?? '';
      input.readOnly = !!opts.readonly;
      input.autocomplete = 'off';
      label.append(input);
      form.append(label);
    }

    const actions = el('div', 'bp-dialog-actions');
    if (opts.cancelLabel !== null) {
      const cancel = el('button', 'btn ghost', opts.cancelLabel ?? 'Cancelar');
      cancel.type = 'button';
      cancel.addEventListener('click', () => dialog.close('cancel'));
      actions.append(cancel);
    }
    const confirm = el('button', `btn ${opts.danger ? 'danger' : 'primary'}`, opts.confirmLabel ?? 'Confirmar');
    confirm.value = 'ok';
    actions.append(confirm);
    form.append(actions);
    dialog.append(form);

    dialog.addEventListener('close', () => {
      const ok = dialog.returnValue === 'ok';
      resolve(ok ? (input ? input.value : 'ok') : null);
      dialog.remove();
    });
    document.body.append(dialog);
    dialog.showModal();
    if (input && opts.readonly) input.select();
    (input && !opts.readonly ? input : confirm).focus();
  });
}

export function askText(opts: DialogOptions): Promise<string | null> {
  return openDialog(opts, true);
}

export async function confirmAction(opts: DialogOptions): Promise<boolean> {
  return (await openDialog(opts, false)) !== null;
}

export async function showInfo(opts: DialogOptions): Promise<void> {
  await openDialog({ confirmLabel: 'Entendi', cancelLabel: null, ...opts }, opts.value !== undefined);
}
