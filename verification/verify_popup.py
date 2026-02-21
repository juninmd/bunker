from playwright.sync_api import sync_playwright
import os

def test_popup_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock chrome object
        page.add_init_script("""
            window.chrome = {
                storage: {
                    local: { get: () => {}, set: () => {} },
                    session: { get: () => {}, set: () => {} }
                },
                runtime: {
                    sendMessage: () => {},
                    lastError: null
                },
                identity: { getAuthToken: () => {} }
            };
        """)

        # Load the file
        cwd = os.getcwd()
        filepath = f"file://{cwd}/apps/extension/src/popup.html"
        page.goto(filepath)

        # Manually show the vault section (bypass unlock)
        page.evaluate("""
            document.getElementById('unlock-section').classList.add('hidden');
            document.getElementById('vault-section').classList.remove('hidden');
        """)

        # Check if the notes textarea exists and is visible
        textarea = page.locator("#notes")
        if textarea.is_visible():
            print("SUCCESS: Notes textarea is visible.")
        else:
            print("FAILURE: Notes textarea is not visible.")

        # Take screenshot
        page.screenshot(path="verification/popup_ui.png")
        browser.close()

if __name__ == "__main__":
    test_popup_ui()
