import { itemTitle, visibleItems, type AppContext } from './context.js';
import { byId, button, el } from './dom.js';
import { icon, type IconName } from './icons.js';
import { buildSecurityReport, findLeaked } from '../utils/security-report.js';

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gauge(score: number): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 76 76');
  svg.setAttribute('aria-hidden', 'true');
  ['ring-track', 'ring'].forEach(cls => {
    const c = document.createElementNS(ns, 'circle');
    Object.entries({ cx: '38', cy: '38', r: String(RADIUS), class: cls }).forEach(([k, v]) => c.setAttribute(k, v));
    if (cls === 'ring') {
      c.style.strokeDasharray = String(CIRCUMFERENCE);
      c.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - score / 100));
    }
    svg.append(c);
  });
  return svg;
}

function issue(ctx: AppContext, name: IconName, label: string, items: any[] | null, hint: string): HTMLDetailsElement {
  const box = el('details', 'issue');
  const summary = el('summary');
  const count = el('span', `count ${items === null ? '' : items.length ? 'bad' : 'good'}`, items === null ? '—' : String(items.length));
  summary.append(icon(name), el('span', '', label), count);
  const list = el('ul');
  if (items === null) list.append(el('li', 'muted', hint));
  else if (items.length === 0) list.append(el('li', 'muted', 'Tudo certo aqui.'));
  else items.slice(0, 50).forEach(item => {
    const li = el('li');
    li.append(button(itemTitle(item), '', () => ctx.openEditor(item.id)));
    list.append(li);
  });
  box.append(summary, list);
  return box;
}

export function initSecurityView(ctx: AppContext) {
  let leaked: any[] | null = null;

  const render = () => {
    const items = visibleItems(ctx.vault.getVault());
    const report = buildSecurityReport(items);
    const score = el('div', 'score');
    const text = el('div', 'stack');
    text.append(el('span', 'score-num', String(report.score)), el('span', 'muted', report.total
      ? `${report.total} logins analisados. ${report.withoutTotp} ainda sem 2FA no cofre.`
      : 'Adicione logins para ver a saúde do cofre.'));
    score.append(gauge(report.score), text);

    const issues = el('div', 'issues');
    issues.append(
      issue(ctx, 'alert', 'Senhas fracas', report.weak, ''),
      issue(ctx, 'copy', 'Senhas repetidas', report.reused, ''),
      issue(ctx, 'clock', 'Sem troca há mais de um ano', report.old, ''),
      issue(ctx, 'shield', 'Encontradas em vazamentos', leaked, 'Toque em "Verificar vazamentos" para consultar.')
    );

    const check = button(leaked === null ? 'Verificar vazamentos' : 'Verificar de novo', 'btn ghost block');
    check.prepend(icon('refresh'));
    const note = el('p', 'meter-text', 'Só os 5 primeiros caracteres do hash de cada senha são enviados ao Have I Been Pwned. A senha nunca sai do dispositivo.');
    check.addEventListener('click', async () => {
      check.disabled = true;
      check.textContent = 'Verificando…';
      try {
        leaked = await findLeaked(items);
        ctx.notify(leaked.length ? `${leaked.length} senha(s) apareceram em vazamentos. Troque-as.` : 'Nenhuma senha encontrada em vazamentos.');
      } catch {
        ctx.notify('Não foi possível consultar agora. Verifique a conexão.', 'error');
      }
      render();
    });
    byId('securityBody').replaceChildren(score, issues, check, note);
  };

  return { show: render };
}
