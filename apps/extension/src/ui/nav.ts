import type { ViewName } from './context.js';
import { byId } from './dom.js';
import { icon, type IconName } from './icons.js';

const TAB_ICONS: Record<string, IconName> = { vault: 'vault', generator: 'sliders', security: 'shield', settings: 'gear' };
const TABBED: ViewName[] = ['vault', 'generator', 'security', 'settings'];
let history: ViewName[] = [];

export function initNav(onTab: (view: ViewName) => void, onBack: () => void) {
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(tab => {
    tab.prepend(icon(TAB_ICONS[tab.dataset.tab as string] as IconName));
    tab.addEventListener('click', () => onTab(tab.dataset.tab as ViewName));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-back]').forEach(btn => {
    btn.append(icon('back'));
    btn.addEventListener('click', onBack);
  });
}

export function showView(view: ViewName) {
  const app = byId('app');
  const previous = app.dataset.view as ViewName;
  if (previous !== view) history = TABBED.includes(view) ? [view] : [...history, previous];
  app.dataset.view = view;
  document.querySelectorAll<HTMLElement>('.view').forEach(section => {
    section.hidden = section.id !== `view-${view}`;
  });
  byId('tabbar').hidden = view === 'lock';
  const current = TABBED.includes(view) ? view : history.find(v => TABBED.includes(v)) ?? 'vault';
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(tab => {
    if (tab.dataset.tab === current) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  byId(`view-${view}`).scrollTop = 0;
}

export function previousView(): ViewName {
  const last = history.pop();
  return last && last !== 'lock' ? last : 'vault';
}
