import { MASTER, openPopup } from './popup-steps.mjs';

const settle = page => page.waitForTimeout(450);
const expect = (cond, message) => { if (!cond) throw new Error(message); };
const dialog = page => page.locator('dialog.bp-dialog[open]');

export async function sessionPersists({ step }, context, popupUrl) {
  let page;
  await step('reopened popup keeps the session', async () => {
    page = await openPopup(context, popupUrl);
    await page.waitForSelector('#view-vault:not([hidden])', { timeout: 5000 });
  });
  return page;
}

export async function autofill({ step, shot }, context, siteUrl) {
  const page = await context.newPage();
  await step('autofill fills the loopback login', async () => {
    await page.goto(siteUrl);
    const iconNode = page.locator('.bunkerpass-icon');
    await iconNode.waitFor({ timeout: 8000 });
    await iconNode.click();
    await page.locator('.bunkerpass-dropdown').waitFor();
    await shot(page, '12-autofill-menu.png');
    await page.locator('.bunkerpass-dropdown button').first().click();
    expect(await page.inputValue('#user') === 'ana@acme.test', 'username not filled');
    expect(await page.inputValue('#pass') === 'Acme-Pa55!phrase', 'password not filled');
    await shot(page, '12-autofill-preenchido.png');
  });
  await step('new password on submit is offered for saving', async () => {
    await page.goto(siteUrl);
    await page.fill('#user', 'new@acme.test');
    await page.fill('#pass', 'Brand-new-Pa55!');
    const prompted = page.waitForEvent('dialog', { timeout: 8000 }).then(async d => { const m = d.message(); await d.accept(); return m; });
    await page.click('button[type=submit]');
    expect((await prompted).length > 0, 'no save prompt');
  });
  await page.close();
}

export async function pinAndLock({ step, shot }, page) {
  await step('PIN unlock after locking', async () => {
    await page.click('[data-tab=settings]');
    await settle(page);
    await page.getByRole('button', { name: /PIN rápido/ }).click();
    await dialog(page).locator('input').fill('482193');
    await dialog(page).locator('button[value=ok]').click();
    await settle(page);
    await page.getByRole('button', { name: /Bloquear agora/ }).click();
    await page.waitForSelector('#pinForm:not([hidden])');
    await settle(page);
    await shot(page, '13-desbloqueio-pin.png');
    await page.fill('#pinInput', '482193');
    await page.press('#pinInput', 'Enter');
    await page.waitForSelector('#view-vault:not([hidden])', { timeout: 8000 });
  });
  await step('wrong master password is denied', async () => {
    await page.getByRole('button', { name: 'Ajustes' }).click();
    await page.getByRole('button', { name: /Bloquear agora/ }).click();
    await page.fill('#masterPassword', 'wrong password here');
    await page.press('#masterPassword', 'Enter');
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent?.includes('incorreta'), null, { timeout: 15000 });
    await shot(page, '14-senha-errada.png');
    await page.fill('#masterPassword', MASTER);
    await page.press('#masterPassword', 'Enter');
    await page.waitForSelector('#view-vault:not([hidden])', { timeout: 15000 });
  });
}

export async function autoLock({ step }, page, worker) {
  await step('auto-lock closes an open popup', async () => {
    await worker.evaluate(() => chrome.storage.session.remove('sessionKey'));
    await page.waitForSelector('#view-lock:not([hidden])', { timeout: 5000 });
  });
}

export async function lightTheme({ step, shot }, context, popupUrl) {
  await step('light theme renders', async () => {
    const page = await openPopup(context, popupUrl, 'light');
    await shot(page, '15-tema-claro-bloqueio.png');
    await page.fill('#masterPassword', MASTER);
    await page.press('#masterPassword', 'Enter');
    await page.waitForSelector('#view-vault:not([hidden])', { timeout: 15000 });
    await settle(page);
    await shot(page, '16-tema-claro-lista.png');
    await page.close();
  });
}

export async function accessibility({ step }, page) {
  await step('every button has an accessible name', async () => {
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('button')]
      .filter(b => b.offsetParent && !(b.getAttribute('aria-label') || b.textContent.trim()))
      .map(b => b.outerHTML.slice(0, 80)));
    expect(unnamed.length === 0, `unnamed: ${unnamed.join(' | ')}`);
  });
  await step('keyboard reaches search then the new item button', async () => {
    await page.focus('#searchInput');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.id) === 'newItemBtn', 'tab order broken');
  });
}
