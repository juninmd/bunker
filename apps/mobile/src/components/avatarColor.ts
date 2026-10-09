const WHITE_CONTRAST = 4.5;
const SATURATION = 0.62;

/** Host part of a title ("https://www.github.com/x" -> "github.com"): same site, same colour. */
function normalize(title: string): string {
  return title.trim().toLowerCase().replace(/^[a-z]+:\/\//, '').replace(/^www\./, '').split('/')[0];
}

/**
 * Hues 26-103 (amber, olive, lime) turn muddy once darkened to keep white text legible, so they are skipped.
 */
const SKIP_FROM = 26;
const SKIP_TO = 104;

/** FNV-1a of the normalised title, folded to a hue in degrees. */
export function hueOf(title: string): number {
  let hash = 0x811c9dc5;
  for (const char of normalize(title)) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  const slot = hash % (360 - (SKIP_TO - SKIP_FROM));
  return slot < SKIP_FROM ? slot : slot + (SKIP_TO - SKIP_FROM);
}

/** First letter or digit of the normalised title, upper-cased. */
export function initialOf(title: string): string {
  const match = normalize(title).match(/[\p{L}\p{N}]/u);
  return match ? match[0].toUpperCase() : '#';
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)];
}

function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
}

/** WCAG contrast of white text over the colour. */
function whiteContrast(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05);
}

/**
 * Two-stop gradient for the avatar of a title, in the spirit of docs/DESIGN.md
 * (`hsl(H 72% 64%)` -> `hsl(H+28 66% 46%)`). Lightness is lowered per hue just enough that the white
 * initial keeps 4.5:1 on the lighter stop, so yellows and greens become deep olives instead of pastels.
 */
export function avatarColors(title: string): readonly [string, string] {
  const hue = hueOf(title);
  let light = 0.5;
  while (light > 0.22 && whiteContrast(hslToRgb(hue, SATURATION, light)) < WHITE_CONTRAST) light -= 0.01;
  let second = (hue + 28) % 360;
  if (second >= SKIP_FROM && second < SKIP_TO) second = (hue + 332) % 360;
  return [toHex(hslToRgb(hue, SATURATION, light)), toHex(hslToRgb(second, SATURATION - 0.04, light - 0.12))];
}
