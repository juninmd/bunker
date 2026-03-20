from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True, args=['--allow-file-access-from-files']) # Allow modules
    page = browser.new_page()

    # Listen to console
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

    cwd = os.getcwd()
    popup_path = os.path.join(cwd, 'apps/extension/src/popup.html')
    url = f'file://{popup_path}'

    print(f"Loading {url}")
    try:
        page.goto(url)
    except Exception as e:
        print(f"Error loading: {e}")
        return

    # Check if module loaded
    # Wait a bit
    page.wait_for_timeout(1000)

    # Bypass unlock manually to show UI
    print("Forcing UI visibility...")
    page.evaluate("""
        document.getElementById('unlock-section').classList.add('hidden');
        document.getElementById('vault-section').classList.remove('hidden');
    """)

    # 1. Test Default (Password)
    try:
        # Verify event listener works (requires module loaded)
        # Toggle to Note
        print("Clicking Note radio...")
        page.click('input[value="note"]')
        page.wait_for_timeout(500)

        # Check UI update
        placeholder = page.get_attribute('#site', 'placeholder')
        print(f"Placeholder after clicking Note: {placeholder}")

        if placeholder == 'Título da Nota':
            print("SUCCESS: UI updated correctly for Note.")
        else:
             print("FAILURE: UI did not update (JS module probably not loaded).")

        page.screenshot(path='apps/extension/tests/screenshot_note.png')

        # Test Password Strength
        print("Clicking Password radio...")
        page.click('input[value="password"]')

        print("Typing password '123'...")
        page.fill('#password', '123')
        page.wait_for_selector('#password-strength-bar.strength-weak', state='visible')
        page.screenshot(path='apps/extension/tests/screenshot_weak_password.png')

        print("Typing password 'StrongP@ssw0rd!123'...")
        page.fill('#password', 'StrongP@ssw0rd!123')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        page.wait_for_selector('#password-strength-bar.strength-strong', state='visible')
        statTotal = page.inner_text('#statTotal')
        assert statTotal == '0'
        assert page.inner_text('#statWeak') == '0'
        assert page.inner_text('#statReused') == '0'
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")
        print(f"Total Passwords in Dashboard: {statTotal}")

        page.screenshot(path='apps/extension/tests/screenshot_security_dashboard.png')

    except Exception as e:
        print(f"Test failed: {e}")
        page.screenshot(path='apps/extension/tests/screenshot_fail.png')

    browser.close()

with sync_playwright() as p:
    run(p)
