// Shared by the editor and the generator so both strength bars use the same scale and colors.
const COLORS = ['var(--danger)', 'var(--danger)', 'var(--warn)', 'var(--ok)', 'var(--ok)'];

export function paintMeter(fill: HTMLElement, score: number, active: boolean) {
  fill.style.width = active ? `${(score + 1) * 20}%` : '0';
  fill.style.background = COLORS[score] as string;
}
