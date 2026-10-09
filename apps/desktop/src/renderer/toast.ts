namespace Bunker {
  const MAX_VISIBLE = 3;
  const LIFETIME_MS = { ok: 3800, error: 6000 } as const;

  // Pílula de vidro na região aria-live="polite" do HTML; substitui alert() e console.log().
  export function toast(kind: 'ok' | 'error', message: string): void {
    const host = byId('toasts');
    const node = el('div', 'toast', el('span', 'toast-ico', icon(kind === 'ok' ? 'check' : 'alert')), el('span', 'toast-msg', message));
    node.dataset.kind = kind;
    host.append(node);
    while (host.children.length > MAX_VISIBLE) host.firstElementChild?.remove();
    window.setTimeout(() => dismiss(node), LIFETIME_MS[kind]);
  }

  function dismiss(node: HTMLElement): void {
    node.classList.add('leaving');
    window.setTimeout(() => node.remove(), transitionMs(node));
  }
}
