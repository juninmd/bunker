from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load the popup HTML file directly
        popup_path = os.path.abspath("apps/extension/src/popup.html")
        page.goto(f"file://{popup_path}")

        # Take a screenshot of the initial state (locked)
        page.screenshot(path="verification/popup_locked.png")
        print("Screenshot saved to verification/popup_locked.png")

        # Simulate unlocking (this might fail if crypto isn't available in file:// context without https/extension context,
        # but let's try to inspect the DOM elements at least)

        # Check if the folder input exists (it should be hidden initially in the vault section)
        # We need to unlock to see it.
        # Since standard Web Crypto API might not work perfectly in file:// for `deriveKey` without secure context,
        # we might need to mock the vault service or just inspect the HTML structure.

        # However, for visual verification of the input existence in the DOM:
        folder_input = page.locator("#folder")
        if folder_input.count() > 0:
            print("Folder input found in DOM.")
        else:
            print("Folder input NOT found.")

        # Let's try to force show the vault section to see the layout
        page.evaluate("document.getElementById('unlock-section').classList.add('hidden')")
        page.evaluate("document.getElementById('vault-section').classList.remove('hidden')")

        # Take a screenshot of the vault view with folder input
        page.screenshot(path="verification/popup_vault_layout.png")
        print("Screenshot saved to verification/popup_vault_layout.png")

        browser.close()

if __name__ == "__main__":
    run()
