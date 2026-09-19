import { join } from 'node:path';
import { FIXTURES } from './harness.mjs';

export const MASTER = 'correct horse battery staple';
const settle = page => page.waitForTimeout(450);
const expect = (cond, message) => { if (!cond) throw new Error(message); };
const toast = page => page.locator('#toast').textContent();
const dialog = page => page.locator('dialog.bp-dialog[open]');

export async function openPopup(context, popupUrl, scheme = 'dark') {
  const page = await context.newPage();
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => m.type() === 'error' && page.errors.push(m.text()));
  await page.goto(popupUrl);
  await settle(page);
  return page;
}

export async function createVault({ step, shot }, page) {
  await step('first run shows create vault', async () => {
    await page.waitForFunction(() => document.querySelector('#unlockButton')?.textContent === 'Criar cofre', null, { timeout: 8000 });
    await shot(page, '01-criar-cofre.png');
  });
  await step('weak master password is rejected', async () => {
    await page.fill('#masterPassword', 'short');
    await page.fill('#masterConfirm', 'short');
    await page.click('#unlockButton');
    await settle(page);
    expect((await toast(page)).includes('12'), 'no weak password toast');
    await shot(page, '02-senha-fraca.png');
    await page.evaluate(() => { document.querySelector('#toast').className = 'toast'; });
  });
  await step('vault is created and empty state shown', async () => {
    await page.fill('#masterPassword', MASTER);
    await page.fill('#masterConfirm', MASTER);
    await page.click('#unlockButton');
    await page.waitForSelector('#view-vault:not([hidden])', { timeout: 15000 });
    await settle(page);
    await shot(page, '03-cofre-vazio.png');
  });
}

export async function importLastPass({ step, shot }, page) {
  await step('LastPass CSV import adds 7 items', async () => {
    await page.click('[data-tab=settings]');
    await settle(page);
    await shot(page, '04-ajustes.png');
    await page.setInputFiles('#localCsvInput', join(FIXTURES, 'lastpass_export.csv'));
    await dialog(page).waitFor();
    expect((await dialog(page).textContent()).includes('7 itens novos'), 'import count mismatch');
    await shot(page, '05-importacao.png');
    await dialog(page).locator('button[value=ok]').click();
    await settle(page);
  });
  await step('vault list shows live TOTP codes', async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('.totp span')].some(s => /^\d{3} \d{3}$/.test(s.textContent)));
    expect(await page.locator('#credentialList li.item').count() >= 7, 'items missing');
    await shot(page, '06-lista.png');
  });
  await step('search filters the list', async () => {
    await page.fill('#searchInput', 'git');
    await settle(page);
    expect(await page.locator('#credentialList li.item').count() === 1, 'search did not filter to GitHub');
    await shot(page, '07-busca.png');
  });
  await step('editor opens GitHub with TOTP preview', async () => {
    await page.click('[aria-label="Abrir GitHub"]');
    await settle(page);
    expect(await page.inputValue('#username') !== '', 'username empty');
    await shot(page, '08-editor.png');
    await page.keyboard.press('Escape');
    await page.fill('#searchInput', '');
    await settle(page);
  });
}

export async function createItem({ step, shot }, page) {
  await step('new login with generated password', async () => {
    await page.click('#newItemBtn');
    await settle(page);
    await page.fill('#site', 'https://example.org');
    await page.fill('#username', 'me@example.org');
    await page.click('[aria-label="Gerar senha forte"]');
    await settle(page);
    expect((await page.inputValue('#password')).length >= 16, 'generated password too short');
    await shot(page, '09-novo-item.png');
    await page.click('#credentialForm button[type=submit]');
    await page.waitForSelector('#view-vault:not([hidden])');
    expect(await page.locator('[aria-label="Abrir example.org"]').count() === 1, 'new item not listed');
  });
}

export async function copyAndClear({ step }, page, worker) {
  await step('copied password is cleared after 30 s', async () => {
    await page.click('[aria-label="Copiar senha de example.org"]');
    await settle(page);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.length >= 16, 'password not copied');
    expect(await worker.evaluate(() => chrome.alarms.get('clearClipboard').then(a => !!a)), 'clear alarm missing');
    await page.waitForTimeout(33000);
    expect(await page.evaluate(() => navigator.clipboard.readText()) === '', 'clipboard still holds the password');
  });
}

export async function tourTabs({ step, shot }, page) {
  await step('generator view', async () => {
    await page.click('[data-tab=generator]');
    await settle(page);
    await shot(page, '10-gerador.png');
  });
  await step('security report flags weak and reused', async () => {
    await page.click('[data-tab=security]');
    await settle(page);
    const [weak, reused] = await page.locator('#securityBody .issue .count').allTextContents();
    expect(Number(weak) >= 1 && Number(reused) >= 2, `weak=${weak} reused=${reused}`);
    await page.locator('#securityBody .issue summary').nth(1).click();
    await shot(page, '11-saude.png');
  });
}
