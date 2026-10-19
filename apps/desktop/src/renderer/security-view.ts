namespace Bunker {
  const RADIUS = 37;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  function gauge(score: number): SVGSVGElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 88 88');
    svg.setAttribute('aria-hidden', 'true');
    ['ring-track', 'ring'].forEach(cls => {
      const c = document.createElementNS(ns, 'circle');
      Object.entries({ cx: '44', cy: '44', r: String(RADIUS), class: cls }).forEach(([k, v]) => c.setAttribute(k, v));
      if (cls === 'ring') {
        c.style.strokeDasharray = String(CIRCUMFERENCE);
        c.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - score / 100));
      }
      svg.append(c);
    });
    return svg;
  }

  function issue(name: IconName, label: string, items: any[] | null, hint: string): HTMLDetailsElement {
    const box = el('details', 'issue') as HTMLDetailsElement;
    const summary = el('summary');
    const count = el('span', `count ${items === null ? '' : items.length ? 'bad' : 'good'}`, items === null ? '—' : String(items.length));
    summary.append(icon(name), el('span', '', label), count);
    const list = el('ul');
    if (items === null) list.append(el('li', 'muted', hint));
    else if (items.length === 0) list.append(el('li', 'muted', 'Tudo certo aqui.'));
    else items.slice(0, 50).forEach(item => {
      const li = el('li');
      li.append(el('span', '', item.title || item.url || item.username));
      list.append(li);
    });
    box.append(summary, list);
    return box;
  }

  export function renderSecurityView(items: Item[]): void {
    let leaked: any[] | null = null;

    const render = () => {
      const report = buildSecurityReport(items);
      const score = el('div', 'score');
      const level = report.score >= 80 ? 'good' : report.score >= 50 ? '' : 'bad';
      const title = !report.total ? 'Sem dados ainda' : report.score >= 80 ? 'Cofre saudável' : report.score >= 50 ? 'Pode melhorar' : 'Atenção necessária';
      const ring = el('div', report.total ? `score-ring ${level}`.trim() : 'score-ring');
      ring.append(gauge(report.total ? report.score : 0), el('span', 'score-num', report.total ? String(report.score) : '—'));
      const text = el('div', 'score-text');
      text.append(el('span', 'score-title', title), el('span', 'muted', report.total
        ? `${report.total} logins analisados. ${report.withoutTotp} ainda sem 2FA no cofre.`
        : 'Adicione logins para ver a saúde do cofre.'));
      score.append(ring, text);

      const issues = el('div', 'issues');
      issues.append(
        issue('alert', 'Senhas fracas', report.weak, ''),
        issue('copy', 'Senhas repetidas', report.reused, ''),
        issue('clock', 'Sem troca há mais de um ano', report.old, ''),
        issue('shield', 'Encontradas em vazamentos', leaked, 'Toque em "Verificar vazamentos" para consultar.')
      );

      const check = el('button', 'btn ghost block') as HTMLButtonElement;
      check.type = 'button';
      check.textContent = leaked === null ? 'Verificar vazamentos' : 'Verificar de novo';
      check.prepend(icon('refresh'));
      const note = el('p', 'meter-text', 'Só os 5 primeiros caracteres do hash de cada senha são enviados ao Have I Been Pwned. A senha nunca sai do dispositivo.');
      check.addEventListener('click', async () => {
        check.disabled = true;
        check.textContent = 'Verificando…';
        try {
          leaked = await findLeaked(items);
          toast(leaked.length ? 'error' : 'ok', leaked.length ? `${leaked.length} senha(s) apareceram em vazamentos. Troque-as.` : 'Nenhuma senha encontrada em vazamentos.');
        } catch {
          toast('error', 'Não foi possível consultar agora. Verifique a conexão.');
        }
        render();
      });
      byId('securityView').replaceChildren(score, issues, check, note);
    };

    render();
  }
}
