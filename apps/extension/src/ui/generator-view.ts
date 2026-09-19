import type { AppContext } from './context.js';
import { byId, button, el } from './dom.js';
import { icon } from './icons.js';
import { copySecret, CLIPBOARD_SECONDS } from './clipboard.js';
import { generateWith, loadGeneratorSettings, saveGeneratorSettings, type GeneratorSettings } from './generator-settings.js';
import { passwordStrength } from '../utils/password-strength.js';
import { generateUsername } from '../utils/username-generator.js';

const OPTIONS: [keyof GeneratorSettings, string][] = [['uppercase', 'Maiúsculas'], ['lowercase', 'Minúsculas'], ['numbers', 'Números'], ['symbols', 'Símbolos']];

export function initGeneratorView(ctx: AppContext) {
  const body = byId('generatorBody');
  const modeBar = el('div', 'segmented');
  const modes = { password: button('Senha', ''), username: button('Usuário', '') };
  modeBar.append(modes.password, modes.username);
  const output = el('output', 'gen-output');
  output.setAttribute('aria-live', 'polite');
  const strength = el('span', 'meter-text');
  const copy = button('Copiar', 'btn primary');
  copy.prepend(icon('copy'));
  const again = button('Gerar outra', 'btn ghost');
  again.prepend(icon('refresh'));
  const actions = el('div', 'row');
  actions.append(copy, again);
  copy.style.flex = '1';

  const lengthLabel = el('label', 'field-label');
  const lengthValue = el('span');
  const range = Object.assign(el('input'), { type: 'range', min: '8', max: '64' });
  lengthLabel.append(lengthValue, range);
  const options = el('div', 'gen-options');
  const boxes = new Map<keyof GeneratorSettings, HTMLInputElement>();
  OPTIONS.forEach(([key, label]) => {
    const box = Object.assign(el('input'), { type: 'checkbox' });
    boxes.set(key, box);
    const wrap = el('label');
    wrap.append(box, document.createTextNode(label));
    options.append(wrap);
  });
  const passwordOptions = el('div', 'stack');
  passwordOptions.append(lengthLabel, options);
  body.append(modeBar, output, strength, actions, passwordOptions);

  let mode: 'password' | 'username' = 'password';
  let settings: GeneratorSettings;

  const readSettings = (): GeneratorSettings => {
    const next = { ...settings, length: Number(range.value) };
    boxes.forEach((box, key) => { (next as any)[key] = box.checked; });
    if (!next.uppercase && !next.lowercase && !next.numbers && !next.symbols) next.lowercase = true;
    return next;
  };

  const generate = () => {
    const value = mode === 'password' ? generateWith(settings) : generateUsername({ useWords: true, length: 10 });
    output.textContent = value;
    strength.textContent = mode === 'password' ? `${settings.length} caracteres, força: ${passwordStrength(value).label.toLowerCase()}` : '';
    modes.password.setAttribute('aria-pressed', String(mode === 'password'));
    modes.username.setAttribute('aria-pressed', String(mode === 'username'));
    passwordOptions.hidden = mode !== 'password';
  };

  const onChange = async () => {
    settings = readSettings();
    lengthValue.textContent = `Tamanho: ${settings.length}`;
    boxes.forEach((box, key) => { box.checked = !!(settings as any)[key]; });
    await saveGeneratorSettings(settings);
    generate();
  };

  range.addEventListener('input', onChange);
  boxes.forEach(box => box.addEventListener('change', onChange));
  modes.password.addEventListener('click', () => { mode = 'password'; generate(); });
  modes.username.addEventListener('click', () => { mode = 'username'; generate(); });
  again.addEventListener('click', generate);
  copy.addEventListener('click', async () => {
    await copySecret(output.textContent || '');
    ctx.notify(`Copiado. Some da área de transferência em ${CLIPBOARD_SECONDS} s.`);
  });

  return {
    async show() {
      settings = await loadGeneratorSettings();
      range.value = String(settings.length);
      lengthValue.textContent = `Tamanho: ${settings.length}`;
      boxes.forEach((box, key) => { box.checked = !!(settings as any)[key]; });
      generate();
    }
  };
}
