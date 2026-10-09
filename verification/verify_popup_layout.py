"""Static layout check of the extension popup (no extension APIs needed).

Renders apps/extension/src/popup.html from disk at the real popup size (380x580), asserts that the dark identity,
bundled fonts and stylesheets load and that nothing overflows, then forces the vault view visible to check the
toolbar and tab bar geometry. The popup's module script cannot run from file://, so this covers markup + CSS only;
the full behavior suite is `cd apps/extension && npm test && npm run e2e`.

Run from the repository root: python3 verification/verify_popup_layout.py
"""
import os
import sys

from playwright.sync_api import sync_playwright

WIDTH, HEIGHT = 380, 580
POPUP = os.path.abspath("apps/extension/src/popup.html")
failures = []


def check(name, ok, detail=""):
    print(f"{'PASS' if ok else 'FAIL'}  {name}{('  -> ' + str(detail)) if detail else ''}")
    if not ok:
        failures.append(name)


def inside_viewport(box):
    return box and box["x"] >= 0 and box["y"] >= 0 and box["x"] + box["width"] <= WIDTH and box["y"] + box["height"] <= HEIGHT


def run(playwright):
    # file:// pages are cross-origin to each other; the flag lets the stylesheets, fonts and module graph load as in the extension.
    browser = playwright.chromium.launch(headless=True, args=["--allow-file-access-from-files"])
    page = browser.new_page(viewport={"width": WIDTH, "height": HEIGHT})
    page.emulate_media(color_scheme="light", reduced_motion="reduce")  # the popup must stay dark even on a light OS
    failed_assets = []
    page.on("requestfailed", lambda r: failed_assets.append(r.url) if r.url.endswith((".css", ".woff2", ".png")) else None)
    page.goto(f"file://{POPUP}")
    page.evaluate("document.fonts.ready")

    check("stylesheets and fonts load", not failed_assets, failed_assets)
    check("popup stays dark when the OS prefers light", page.evaluate("getComputedStyle(document.body).backgroundColor") == "rgb(7, 8, 12)")
    # fonts.load() resolves with the matching @font-face objects, so 1 proves the bundled file was fetched and decoded.
    check("Inter @font-face loads", page.evaluate("document.fonts.load('13px Inter').then(f => f.length)") == 1)
    check("JetBrains Mono @font-face loads", page.evaluate("document.fonts.load('13px \"JetBrains Mono\"').then(f => f.length)") == 1)
    check("no horizontal overflow", page.evaluate("document.documentElement.scrollWidth") <= WIDTH)

    check("lock view is visible", page.locator("#view-lock").is_visible())
    check("vault dial is drawn", page.locator("svg.dial #dialGold").count() == 1)
    check("unlock button is inside the popup", inside_viewport(page.locator("#unlockButton").bounding_box()))
    page.screenshot(path="verification/popup_locked.png")
    print("Screenshot saved to verification/popup_locked.png")

    # Without the popup script nothing switches views, so show the vault view and the tab bar by hand.
    page.evaluate(
        "() => { document.getElementById('view-lock').hidden = true;"
        " document.getElementById('view-vault').hidden = false;"
        " document.getElementById('tabbar').hidden = false; }"
    )
    check("search field is visible", page.locator("#searchInput").is_visible())
    check("new item button is 44x44", (page.locator("#newItemBtn").bounding_box() or {}).get("width") == 44)
    tabs = page.locator("#tabbar button")
    check("tab bar has the four sections", tabs.count() == 4, tabs.all_text_contents())
    bar = page.locator("#tabbar").bounding_box()
    check("tab bar is pinned to the bottom edge", bar is not None and abs(bar["y"] + bar["height"] - HEIGHT) <= 1, bar)
    page.screenshot(path="verification/popup_vault_layout.png")
    print("Screenshot saved to verification/popup_vault_layout.png")

    browser.close()


if __name__ == "__main__":
    with sync_playwright() as p:
        run(p)
    print(f"\n{'All checks passed' if not failures else str(len(failures)) + ' check(s) failed: ' + ', '.join(failures)}")
    sys.exit(1 if failures else 0)
