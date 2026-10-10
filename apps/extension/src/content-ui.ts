// Classic content script loaded before content.js; draws the in-field lock and the account picker.

const BP_THEME = { panel: '#10131a', line: 'rgba(255,255,255,.13)', text: '#edeff5', muted: '#8d95a6', accent: '#f3bc4e', hover: 'rgba(255,255,255,.08)' };
const BP_FONT = '13px/1.35 Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
const BP_ICON = 26;

function hueOf(text: string): number {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 360;
}

function lockGlyph(color: string): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
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

// Page scripts can .click() anything in the DOM; only a real, visible, unobscured user click may reveal or fill.
function genuineClick(event: MouseEvent, target: HTMLElement): boolean {
  if (!event.isTrusted) return false;
  // Shrunk or clipped icons (scale(0), 1px boxes) are hidden from the user even when fully opaque.
  const box = target.getBoundingClientRect();
  if (box.width < 16 || box.height < 16) return false;
  for (let node: Element | null = target; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (Number(style.opacity) < 1 || style.visibility !== 'visible' || style.clipPath !== 'none') return false;
  }
  // Keyboard activation reports no pointer position (detail 0); a pointer click must land on the target itself.
  if (event.detail === 0) return true;
  const hit = document.elementFromPoint(event.clientX, event.clientY);
  return !!hit && target.contains(hit);
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
  icon.style.cssText = `position:absolute;z-index:2147483647;width:${BP_ICON}px;height:${BP_ICON}px;margin:0;padding:0;display:flex;align-items:center;justify-content:center;
    cursor:pointer;border-radius:8px;border:1px solid ${BP_THEME.line};background:linear-gradient(180deg,#1a1e28,#0f1218);
    box-shadow:0 2px 10px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.06);`;
  icon.append(lockGlyph(locked ? BP_THEME.muted : BP_THEME.accent));
  document.body.appendChild(icon);

  const position = () => {
    const rect = passInput.getBoundingClientRect();
    icon.style.display = rect.width && rect.height ? 'flex' : 'none';
    icon.style.top = `${rect.top + window.scrollY + (rect.height - BP_ICON) / 2}px`;
    icon.style.left = `${rect.right + window.scrollX - BP_ICON - 6}px`;
  };
  position();
  window.addEventListener('resize', position);
  document.addEventListener('scroll', position, true);
  icon.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (genuineClick(event, icon)) onClick(icon);
  });
}

function pickerItem(cred: { username?: string }, onPick: () => void): HTMLButtonElement {
  const item = document.createElement('button');
  item.type = 'button';
  item.style.cssText = `display:flex;align-items:center;gap:10px;width:100%;margin:0;padding:8px 10px;border:0;border-radius:10px;
    background:transparent;color:${BP_THEME.text};font:${BP_FONT};text-align:left;cursor:pointer;`;
  const hue = hueOf(cred.username || '?');
  const badge = document.createElement('span');
  badge.textContent = (cred.username || '?').charAt(0).toUpperCase();
  badge.style.cssText = `flex:none;width:28px;height:28px;border-radius:9px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:12.5px;
    background:linear-gradient(145deg,hsl(${hue} 72% 62%),hsl(${hue + 28} 66% 44%));box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);`;
  const name = document.createElement('span');
  name.textContent = cred.username || '(sem usuário)';
  name.style.cssText = 'min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  item.append(badge, name);
  const highlight = (on: boolean) => { item.style.background = on ? BP_THEME.hover : 'transparent'; };
  item.addEventListener('mouseenter', () => highlight(true));
  item.addEventListener('mouseleave', () => highlight(false));
  item.addEventListener('focus', () => highlight(true));
  item.addEventListener('blur', () => highlight(false));
  item.addEventListener('click', event => {
    event.stopPropagation();
    if (genuineClick(event, item)) onPick();
  });
  return item;
}

function showPicker(icon: HTMLElement, credentials: { username?: string }[], onPick: (index: number) => void) {
  document.querySelectorAll('.bunkerpass-dropdown').forEach(d => d.remove());
  const picker = document.createElement('div');
  picker.className = 'bunkerpass-dropdown';
  picker.setAttribute('role', 'group');
  picker.setAttribute('aria-label', 'Contas salvas no Bunker');
  picker.style.cssText = `position:absolute;z-index:2147483647;min-width:240px;max-width:320px;max-height:260px;overflow-y:auto;padding:6px;box-sizing:border-box;color-scheme:dark;
    background:${BP_THEME.panel};border:1px solid ${BP_THEME.line};border-radius:14px;box-shadow:0 24px 56px -12px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.35);`;
  const heading = document.createElement('div');
  heading.textContent = 'Bunker';
  heading.style.cssText = `padding:6px 10px 6px;color:${BP_THEME.muted};font:${BP_FONT};font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;`;
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
  picker.style.left = `${Math.max(8, rect.right + window.scrollX - 240)}px`;
  document.addEventListener('click', outside);
  (picker.querySelector('button') as HTMLButtonElement | null)?.focus();
}
