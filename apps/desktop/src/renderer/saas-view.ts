namespace Bunker {
  const CORPORATE_DOMAINS = ['slack', 'google', 'aws', 'microsoft', 'okta', 'github'];

  export function renderSaasView(items: Item[]): void {
    const render = () => {
      const corporateApps = Array.from(
        new Set(
          items
            .filter(item => item.url && CORPORATE_DOMAINS.some(domain => item.url.toLowerCase().includes(domain)))
            .map(item => item.title || item.url)
        )
      ).slice(0, 10);

      const score = el('div', 'score');
      const ring = el('div', 'score-ring good');

      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '0 0 88 88');
      svg.setAttribute('aria-hidden', 'true');
      const c = document.createElementNS(ns, 'circle');
      Object.entries({ cx: '44', cy: '44', r: '37', class: 'ring-track' }).forEach(([k, v]) => c.setAttribute(k, v));
      svg.append(c);

      ring.append(svg, el('span', 'score-num', '100'));
      const text = el('div', 'score-text');
      text.append(el('span', 'score-title', 'SaaS Protect Ativo'), el('span', 'muted', 'Monitoramento corporativo funcionando perfeitamente.'));
      score.append(ring, text);

      const issues = el('div', 'issues');

      const box = el('details', 'issue') as HTMLDetailsElement;
      box.open = true;
      const summary = el('summary');
      const count = el('span', 'count good', String(corporateApps.length));
      summary.append(icon('shield'), el('span', '', 'Aplicações Monitoradas'), count);
      const list = el('ul');

      if (corporateApps.length > 0) {
        corporateApps.forEach(appName => {
          const li = el('li');
          li.append(el('span', '', appName));
          list.append(li);
        });
      } else {
        const li = el('li');
        li.append(el('span', '', 'Nenhuma aplicação corporativa detectada.'));
        list.append(li);
      }

      box.append(summary, list);
      issues.append(box);

      const note = el('p', 'meter-text', 'O SaaS Protect monitora o uso de credenciais corporativas no dispositivo.');

      const mainView = byId('saasView');
      if (mainView) {
        mainView.replaceChildren(score, issues, note);
      }
    };

    render();
  }
}
