namespace Bunker {
  export function renderSaasView(): void {
    const render = () => {
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
      const summary = el('summary');
      const count = el('span', 'count good', '3');
      summary.append(icon('shield'), el('span', '', 'Aplicações Monitoradas'), count);
      const list = el('ul');

      ['Slack Workspace', 'Google Workspace', 'AWS SSO'].forEach(appName => {
        const li = el('li');
        li.append(el('span', '', appName));
        list.append(li);
      });
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
