from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8000/popup.html")

        # Unlock vault
        page.fill("#masterPassword", "masterpass")
        page.click("#unlockButton")

        # Wait for vault section
        page.wait_for_selector("#vault-section", state="visible")

        # Click Generate Button
        page.click("#generateBtn")

        # Check password field
        password_value = page.input_value("#password")
        print(f"Generated Password: {password_value}")
        if not password_value:
            raise Exception("Password was not generated")

        # Check options visibility
        options_visible = page.is_visible("#generatorOptions")
        print(f"Options Visible: {options_visible}")
        if not options_visible:
            raise Exception("Generator options are not visible")

        # Take screenshot
        page.screenshot(path="verification_popup.png")
        browser.close()

if __name__ == "__main__":
    run()
