namespace Bunker {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Ícones de traço em grade 24 px. Cada valor é um único caminho; todo subcaminho começa com "M" absoluto.
  const PATHS = {
    vault: 'M5 3h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M12 7.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z M12 9.2v1.6 M7 19v2 M17 19v2',
    key: 'M8 11a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M11 12l9-9 M16 7l3 3 M14 9l2 2',
    note: 'M6 3h8l5 5v13H6z M14 3v5h5 M9 13h6 M9 17h6',
    card: 'M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z M3 10h18 M7 15h3',
    pin: 'M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z M12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z',
    fingerprint: 'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4 M14 13.12c0 2.38 0 6.38-1 8.88 M17.29 21.02c.12-.6.43-2.3.5-3.02 M2 12a10 10 0 0 1 18-6 M21.8 16c.2-2 .131-5.354 0-6 M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2 M8.65 22c.21-.66.45-1.32.57-2 M9 6.8a6 6 0 0 1 9 5.2v2',
    shield: 'M12 3l8 3v6c0 4.8-3.2 8.2-8 9.5C7.2 20.2 4 16.8 4 12V6z M9 12l2 2 4-4',
    sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z M19 16v4 M17 18h4',
    share: 'M18 9a3 3 0 1 0 0-6a3 3 0 1 0 0 6z M6 15a3 3 0 1 0 0-6a3 3 0 1 0 0 6z M18 21a3 3 0 1 0 0-6a3 3 0 1 0 0 6z M8.7 13.3l6.6 3.4 M8.7 10.7l6.6-3.4',
    globe: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M3 12h18 M12 3c2.6 2.5 3.9 5.5 3.9 9s-1.3 6.5-3.9 9c-2.6-2.5-3.9-5.5-3.9-9S9.4 5.5 12 3z',
    cloud: 'M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z',
    hourglass: 'M5 22h14 M5 2h14 M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22 M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2',
    search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M16.5 16.5L21 21',
    upload: 'M12 15V4 M7.5 8.5L12 4l4.5 4.5 M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
    refresh: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16 M8 16H3v5',
    eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
    eyeOff: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49 M14.084 14.158a3 3 0 0 1-4.242-4.242 M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143 M2 2l20 20',
    copy: 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    chevron: 'M6 9l6 6 6-6',
    x: 'M6 6l12 12 M18 6L6 18',
    alert: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7.5v5 M12 16.2v.1',
    lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z M8 11V8a4 4 0 0 1 8 0v3'
  } as const;

  export type IconName = keyof typeof PATHS;

  export function icon(name: IconName, className = ''): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', className ? `ico ${className}` : 'ico');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', PATHS[name]);
    svg.append(path);
    return svg;
  }

  // Troca cada <span data-icon="nome"> do HTML pelo SVG correspondente, herdando as classes do marcador.
  export function hydrateIcons(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('[data-icon]').forEach(slot => {
      const name = slot.dataset.icon;
      if (name && name in PATHS) slot.replaceWith(icon(name as IconName, slot.className));
    });
  }
}
