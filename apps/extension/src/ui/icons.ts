// Hand-drawn 24px stroke icons; built with createElementNS so no markup string is ever parsed.
const PATHS: Record<string, string> = {
  search: 'M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14z M16.5 16.5 21 21',
  plus: 'M12 5v14 M5 12h14',
  lock: 'M6 11h12v9H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  user: 'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8z M4 21a8 8 0 0 1 16 0',
  key: 'M8 11a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M10.8 12.2 20 3 M16 7l3 3 M14 9l2 2',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z',
  eyeOff: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M3 3l18 18',
  back: 'M15 18l-6-6 6-6',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
  share: 'M12 3v12 M8 7l4-4 4 4 M5 13v7h14v-7',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7 M20 4v7h-7',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z M9 12l2 2 4-4',
  sliders: 'M4 7h9 M17 7h3 M15 5v4 M4 12h3 M11 12h9 M9 10v4 M4 17h11 M19 17h1 M17 15v4',
  gear: 'M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9 7 7 M17 17l2.1 2.1 M4.9 19.1 7 17 M17 7l2.1-2.1',
  vault: 'M3 4h18v16H3z M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7z M12 8.5V7 M6 20v1.5 M18 20v1.5',
  note: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h6 M9 17h6',
  card: 'M3 6h18v12H3z M3 10h18 M7 15h3',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z M12 8a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18v.01',
  download: 'M12 4v11 M7 10l5 5 5-5 M5 20h14',
  upload: 'M12 20V9 M7 14l5-5 5 5 M5 4h14',
  cloud: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z',
  fingerprint: 'M8 11a4 4 0 0 1 8 0v2a8 8 0 0 1-1 4 M12 11v3a10 10 0 0 1-2 6 M5 10a7 7 0 0 1 14 0v3 M5 14c0 1.5-.3 3-1 4',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
  check: 'M5 12l4.5 4.5L19 7',
  chevron: 'M9 6l6 6-6 6',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 7v5l3 2',
  lifebuoy: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M5.6 5.6l3.6 3.6 M14.8 14.8l3.6 3.6 M18.4 5.6l-3.6 3.6 M9.2 14.8l-3.6 3.6',
  users: 'M9 11a3.5 3.5 0 1 0 0-7a3.5 3.5 0 1 0 0 7z M2.5 20a6.5 6.5 0 0 1 13 0 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14a6.5 6.5 0 0 1 3.5 6',
  briefcase: 'M3 8h18v12H3z M9 8V5h6v3 M3 13h18'
};

export type IconName = keyof typeof PATHS;

export function icon(name: IconName, label?: string): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icon');
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', PATHS[name] as string);
  svg.append(path);
  return svg;
}

export function iconButton(name: IconName, label: string, onClick: (event: MouseEvent) => void, className = 'icon-btn'): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.setAttribute('aria-label', label);
  node.title = label;
  node.append(icon(name));
  node.addEventListener('click', onClick);
  return node;
}
