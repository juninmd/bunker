/** Same site cleanup as the extension's `itemTitle` (src/ui/context.ts), so one site hashes the same everywhere. */
function normalize(title: string): string {
  return title.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '') || title;
}

/** Hue of an avatar: the hash of the extension's avatar (src/ui/item-row.ts), so a title wears one colour on every app. */
export function hueOf(title: string): number {
  let hash = 0;
  for (const char of normalize(title)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

/** First letter or digit of the cleaned title, upper-cased. */
export function initialOf(title: string): string {
  const match = normalize(title).match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : '#';
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + (h % 360) / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** `linear-gradient(145deg, hsl(H 72% 62%), hsl(H+28 66% 44%))`: the extension's `.avatar` background. */
export function avatarColors(title: string): readonly [string, string] {
  const hue = hueOf(title);
  return [toHex(hslToRgb(hue, 0.72, 0.62)), toHex(hslToRgb(hue + 28, 0.66, 0.44))];
}

/** Coloured drop shadow under the tile: `0 6px 14px -6px hsl(H 70% 40% / .7)`. */
export function avatarGlow(title: string): string {
  const [r, g, b] = hslToRgb(hueOf(title), 0.7, 0.4).map((c) => Math.round(c * 255));
  return `0 6px 14px -6px rgba(${r}, ${g}, ${b}, 0.7)`;
}
