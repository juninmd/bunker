// Classic content script loaded before content.js; draws the in-field lock and the account picker.

const BP_THEME = { panel: '#1b1f24', line: '#343b45', text: '#e8e6e1', muted: '#9aa3ad', brass: '#d4a24c', hover: '#262c33' };
const BP_FONT = '13px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif';

function lockGlyph(color: string): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', color);
  svg.setAttribute('stroke-width', '2.2');
  svg.setAttribute('stroke-linecap', 'round');
  const body = document.createElementNS(ns, 'rect');
  Object.entries({ x: '4', y: '11', width: '16', height: '10', rx: '2' }).forEach(([k, v]) => body.setAttribute(k, v));
  const shackle = document.createElementNS(ns, 'path');
  shackle.setAttribute('d', 'M8 11V7a4 4 0 0 1 8 0v4');
  svg.append(body, shackle);
  return svg;
}

// One positioned button per password field; follows the field on scroll and resize.
function attachFieldIcon(passInput: HTMLInputElement, locked: boolean, onClick: (icon: HTMLElement) => void) {
  if (passInput.dataset.bunkerpassInjected) return;
  passInput.dataset.bunkerpassInjected = 'true';
  const icon = document.createElement('button');
  icon.type = 'button';
  icon.className = locked ? 'bunkerpass-icon bunkerpass-locked' : 'bunkerpass-icon';
  icon.title = locked ? 'Bunker bloqueado' : 'Preencher com o Bunker';
  icon.setAttribute('aria-label', icon.title);
  icon.style.cssText = `position:absolute;z-index:2147483647;width:24px;height:24px;margin:0;padding:0;display:flex;align-items:center;justify-content:center;
    cursor:pointer;border-radius:6px;border:1px solid ${BP_THEME.line};background:${BP_THEME.panel};box-shadow:0 1px 3px rgba(0,0,0,.25);`;
  icon.append(lockGlyph(locked ? BP_THEME.muted : BP_THEME.brass));
  document.body.appendChild(icon);

  const position = () => {
    const rect = passInput.getBoundingClientRect();
    icon.style.display = rect.width && rect.height ? 'flex' : 'none';
    icon.style.top = `${rect.top + window.scrollY + (rect.height - 24) / 2}px`;
    icon.style.left = `${rect.right + window.scrollX - 30}px`;
  };
  position();
  window.addEventListener('resize', position);
  document.addEventListener('scroll', position, true);
  icon.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    onClick(icon);
  });
}

function pickerItem(cred: { username?: string }, onPick: () => void): HTMLButtonElement {
  const item = document.createElement('button');
  item.type = 'button';
  item.style.cssText = `display:flex;align-items:center;gap:10px;width:100%;margin:0;padding:9px 12px;border:0;border-radius:7px;
    background:transparent;color:${BP_THEME.text};font:${BP_FONT};text-align:left;cursor:pointer;`;
  const badge = document.createElement('span');
  badge.textContent = (cred.username || '?').charAt(0).toUpperCase();
  badge.style.cssText = `flex:none;width:24px;height:24px;border-radius:6px;display:grid;place-items:center;background:${BP_THEME.brass};color:#1a1408;font-weight:700;`;
  const name = document.createElement('span');
  name.textContent = cred.username || '(sem usuário)';
  item.append(badge, name);
  const highlight = (on: boolean) => { item.style.background = on ? BP_THEME.hover : 'transparent'; };
  item.addEventListener('mouseenter', () => highlight(true));
  item.addEventListener('mouseleave', () => highlight(false));
  item.addEventListener('focus', () => highlight(true));
  item.addEventListener('blur', () => highlight(false));
  item.addEventListener('click', event => {
    event.stopPropagation();
    onPick();
  });
  return item;
}

function showPicker(icon: HTMLElement, credentials: { username?: string }[], onPick: (index: number) => void) {
  document.querySelectorAll('.bunkerpass-dropdown').forEach(d => d.remove());
  const picker = document.createElement('div');
  picker.className = 'bunkerpass-dropdown';
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', 'Contas salvas no Bunker');
  picker.style.cssText = `position:absolute;z-index:2147483647;min-width:220px;max-height:240px;overflow-y:auto;padding:5px;box-sizing:border-box;
    background:${BP_THEME.panel};border:1px solid ${BP_THEME.line};border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.35);`;
  const heading = document.createElement('div');
  heading.textContent = 'Bunker';
  heading.style.cssText = `padding:6px 12px 4px;color:${BP_THEME.muted};font:${BP_FONT};font-size:12px;`;
  picker.append(heading);
  const close = () => {
    picker.remove();
    document.removeEventListener('click', outside);
  };
  const outside = (event: Event) => { if (!picker.contains(event.target as Node)) close(); };
  credentials.forEach((cred, index) => picker.append(pickerItem(cred, () => { onPick(index); close(); })));
  picker.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); icon.focus(); } });
  document.body.appendChild(picker);
  const rect = icon.getBoundingClientRect();
  picker.style.top = `${rect.bottom + window.scrollY + 6}px`;
  picker.style.left = `${Math.max(8, rect.right + window.scrollX - 220)}px`;
  document.addEventListener('click', outside);
  (picker.querySelector('button') as HTMLButtonElement | null)?.focus();
}
