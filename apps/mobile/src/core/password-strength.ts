export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
}

const LABELS = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
// A word followed by a short number or symbol is the first thing cracking rules try (netflix123, Senha2024!).
const WORD_SUFFIX = /^[A-Za-z]+[0-9]{0,4}[^A-Za-z0-9]?$/;
const COMMON = /^(123456|password|senha|qwerty|abc123|111111|iloveyou|admin|letmein|welcome)/i;

// Entropy estimate from length and character pools, penalised for common prefixes and long repeats.
export function passwordStrength(password: string): Strength {
  if (!password) return { score: 0, label: LABELS[0] as string };
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;
  let bits = password.length * Math.log2(Math.max(pool, 1));
  if (COMMON.test(password)) bits = Math.min(bits, 20);
  else if (password.length <= 14 && WORD_SUFFIX.test(password)) bits = Math.min(bits, 34);
  if (/(.)\1{3,}/.test(password)) bits *= 0.6;
  const score = bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4;
  return { score: score as Strength['score'], label: LABELS[score] as string };
}
