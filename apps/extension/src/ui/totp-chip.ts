import { generateTotp, parseTotp, type TotpConfig } from '../utils/totp.js';

interface LiveChip {
  node: HTMLButtonElement;
  label: HTMLSpanElement;
  ring: SVGCircleElement;
  config: TotpConfig;
  code: string;
  mounted: boolean;
}

const RADIUS = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const live = new Set<LiveChip>();
let timer: ReturnType<typeof setInterval> | null = null;

async function tick(chip: LiveChip) {
  // A chip is created before it is attached; only drop it once it has been shown and then removed.
  if (!chip.node.isConnected) {
    if (chip.mounted) live.delete(chip);
    return;
  }
  chip.mounted = true;
  const { code, remaining } = await generateTotp(chip.config);
  chip.code = code;
  const half = Math.ceil(code.length / 2);
  chip.label.textContent = `${code.slice(0, half)} ${code.slice(half)}`;
  chip.ring.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - remaining / chip.config.period));
  chip.node.classList.toggle('expiring', remaining <= 5);
  chip.node.setAttribute('aria-label', `Copiar código 2FA ${code}, expira em ${remaining} segundos`);
}

function ringSvg(): { svg: SVGSVGElement; ring: SVGCircleElement } {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('aria-hidden', 'true');
  const circle = (cls: string) => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', '8');
    c.setAttribute('cy', '8');
    c.setAttribute('r', String(RADIUS));
    c.setAttribute('class', cls);
    svg.append(c);
    return c;
  };
  circle('ring-track');
  const ring = circle('ring');
  ring.style.strokeDasharray = String(CIRCUMFERENCE);
  return { svg, ring };
}

// One shared 1s ticker drives every visible code; detached chips drop out on their next tick.
export function totpChip(secret: string, onCopy: (code: string, node: HTMLButtonElement) => void): HTMLButtonElement | null {
  let config: TotpConfig;
  try {
    config = parseTotp(secret);
  } catch {
    return null;
  }
  const node = document.createElement('button');
  node.type = 'button';
  node.className = 'totp';
  const { svg, ring } = ringSvg();
  const label = document.createElement('span');
  label.textContent = '··· ···';
  node.append(svg, label);
  const chip: LiveChip = { node, label, ring, config, code: '', mounted: false };
  node.addEventListener('click', event => {
    event.stopPropagation();
    if (chip.code) onCopy(chip.code, node);
  });
  live.add(chip);
  requestAnimationFrame(() => tick(chip));
  if (!timer) timer = setInterval(() => live.forEach(tick), 1000);
  return node;
}
