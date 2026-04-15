from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("file:///app/apps/extension/src/popup.html")
    page.wait_for_timeout(500)

    # We mock vaultService because we are running off the filesystem where vaultService operations (like derived crypto) might fail or require real user input
    # First, let's inject a dummy credentialId so checkBiometrics enables the button
    page.evaluate('''
        window.vaultService = {
            getVault: () => [],
            unlock: () => Promise.resolve([]),
            exportSessionKey: () => Promise.resolve(),
            getStorage: (key) => {
                if (key === 'bunkerpass.passwordless.credentialId') return Promise.resolve('dummy_id');
                return Promise.resolve(null);
            }
        };
        // Trigger DOMContentLoaded manually since we injected late
        document.dispatchEvent(new Event('DOMContentLoaded'));
    ''')
    page.wait_for_timeout(500)

    # Now the "Desbloquear com Biometria" button should be visible
    page.screenshot(path="/home/jules/verification/screenshots/verification_passwordless.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
