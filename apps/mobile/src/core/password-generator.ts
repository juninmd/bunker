export const MIN_LENGTH = 4;
export const MAX_LENGTH = 64;
export const DEFAULT_LENGTH = 16;

export interface GeneratorOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

/** Source of uniformly random 32-bit values (crypto-backed in the app, injectable in tests). */
export type RandomU32 = () => number;

const SETS: Record<keyof GeneratorOptions, string> = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
};

/** The length field accepts any text: clamp it so empty, negative or huge values cannot break generation. */
export function clampLength(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return DEFAULT_LENGTH;
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, n));
}

// Rejection sampling avoids the modulo bias of `value % size`.
function pick(size: number, random: RandomU32): number {
  const limit = 0x100000000 - (0x100000000 % size);
  let v = random();
  while (v >= limit) v = random();
  return v % size;
}

export function generatePassword(length: number, options: GeneratorOptions, random: RandomU32): string {
  const sets = (Object.keys(SETS) as (keyof GeneratorOptions)[]).filter((k) => options[k]).map((k) => SETS[k]);
  if (sets.length === 0) return '';
  const all = sets.join('');
  // One char from each selected set first, so every enabled option is really present.
  const chars = sets.map((s) => s[pick(s.length, random)]);
  while (chars.length < length) chars.push(all[pick(all.length, random)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = pick(i + 1, random);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
