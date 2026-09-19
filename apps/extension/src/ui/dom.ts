export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function button(label: string, className = 'btn', onClick?: (event: MouseEvent) => void): HTMLButtonElement {
  const node = el('button', className, label);
  node.type = 'button';
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

export function field(labelText: string, control: HTMLElement): HTMLLabelElement {
  const label = el('label', 'field-label', labelText);
  label.append(control);
  return label;
}

export function input(id: string, attrs: Record<string, string> = {}): HTMLInputElement {
  const node = el('input');
  node.id = id;
  node.autocomplete = 'off';
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

export function formatDate(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
