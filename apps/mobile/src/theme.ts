import { Platform, type TextStyle } from 'react-native';

/**
 * Bunker Midnight design tokens. Names match docs/DESIGN.md and the copies kept by the
 * extension and desktop apps (each app owns its own copy: monorepo isolation rule).
 */
export const colors = {
  bg: '#07080c',
  bg2: '#0b0d13',
  surface: '#10131a',
  surface2: '#161a23',
  surface3: '#1d222d',
  line: 'rgba(255, 255, 255, 0.07)',
  line2: 'rgba(255, 255, 255, 0.13)',
  text: '#edeff5',
  muted: '#8d95a6',
  faint: '#5d6475',
  accent: '#f3bc4e',
  accentHi: '#ffe3a0',
  accentLo: '#cf8e20',
  accentInk: '#1b1304',
  ok: '#4ade9e',
  warn: '#ffa04d',
  danger: '#ff6b7a',
  info: '#7aa7ff',
} as const;

/** `#rrggbb` plus an opacity (0..1) as an `rgba()` string; the one place tints are derived. */
export function alpha(hex: string, opacity: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

export const gradients = {
  /** Gold button, top to bottom: `linear-gradient(180deg, #fbd57f, #f0b543)`. */
  primary: ['#fbd57f', '#f0b543'],
  primaryPressed: ['#f1bb52', '#e2a437'],
  /** Card sheen: `rgba(255,255,255,.05)` fading to `.025`. */
  card: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.025)'],
} as const;

export const fills = {
  /** Text field background. */
  field: 'rgba(255, 255, 255, 0.04)',
  /** Overlay while a card or ghost button is pressed. */
  pressed: 'rgba(255, 255, 255, 0.06)',
  /** 1 px specular edge along the top of gold surfaces. */
  highlight: 'rgba(255, 255, 255, 0.35)',
  /** Light edge on the top of a card (the "inset 0 1px" of the card shadow). */
  cardEdge: 'rgba(255, 255, 255, 0.10)',
} as const;

/** CSS-syntax `boxShadow` strings (React Native parses them natively; react-native-web passes them through). */
export const shadows = {
  glow: '0 10px 28px -10px rgba(243, 188, 78, 0.55)',
  focus: '0 0 0 3px rgba(243, 188, 78, 0.28)',
} as const;

/** "Selo de tipo" colours of docs/DESIGN.md, reused for the type avatars. */
export const typeColors = {
  note: colors.accent,
  card: '#a78bfa',
  address: '#5eead4',
  passkey: '#f472b6',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 } as const;

/** Multiples of 4. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/** docs/DESIGN.md scale: 12 · 13 · 14.5 · 17 · 22 · 32. */
export const fontSize = { caption: 12, label: 13, body: 14.5, title: 17, heading: 22, display: 32 } as const;

export const fontWeight = { medium: '500', semibold: '600', bold: '700' } as const;

/** Inter is not bundled on mobile: text uses the system face (SF Pro / Roboto). */
export const fontFamily = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

/** `font-variant-numeric: tabular-nums` for counts, lengths and passwords. */
export const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/** Minimum touch target, in points. */
export const minTouch = 44;
