namespace Bunker {
  type Child = Node | string | null | undefined | false;

  // Todo DOM é montado com createElement/append: dados do cofre nunca passam por innerHTML.
  export function el<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = '',
    ...children: Child[]
  ): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const child of children) if (child) node.append(child);
    return node;
  }

  export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error(`Elemento #${id} não encontrado.`);
    return node as T;
  }

  export const isMac = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);

  export function reducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Duração (ms) da transição CSS do elemento: o CSS continua sendo a única fonte dos tempos.
  export function transitionMs(node: Element): number {
    const first = getComputedStyle(node).transitionDuration.split(',')[0] ?? '0s';
    return first.trim().endsWith('ms') ? parseFloat(first) : parseFloat(first) * 1000;
  }

  export function keycaps(keys: string[]): HTMLElement[] {
    return keys.map(key => el('kbd', '', key));
  }

  export function iconButton(name: IconName, label: string, onClick: () => void): HTMLButtonElement {
    const button = el('button', 'icon-btn', icon(name));
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    button.addEventListener('click', onClick);
    return button;
  }
}
