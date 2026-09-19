import { generatePassword } from '../utils/password-generator.js';
import { getLocal, setLocalMany } from '../utils/local-storage.js';

const KEY = 'generator.settings';

export interface GeneratorSettings {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export const DEFAULT_SETTINGS: GeneratorSettings = { length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true };

export async function loadGeneratorSettings(): Promise<GeneratorSettings> {
  const stored = (await getLocal(KEY)) || {};
  const length = Math.min(64, Math.max(8, Number(stored.length) || DEFAULT_SETTINGS.length));
  return {
    length,
    uppercase: stored.uppercase !== false,
    lowercase: stored.lowercase !== false,
    numbers: stored.numbers !== false,
    symbols: stored.symbols !== false
  };
}

export async function saveGeneratorSettings(settings: GeneratorSettings): Promise<void> {
  await setLocalMany({ [KEY]: settings });
}

export function generateWith(settings: GeneratorSettings): string {
  return generatePassword(settings.length, settings);
}
