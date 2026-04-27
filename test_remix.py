from playwright.sync_api import sync_playwright

def log_console(msg):
    print(f"CONSOLE: {msg.type}: {msg.text}")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("console", log_console)
    page.goto('http://localhost:8080/apps/remix-go/')
    page.wait_for_load_state('networkidle')
    title = page.title()
    print(f"Page title: {title}")
    content = page.content()
    print(f"Page content length: {len(content)}")
    if len(content) < 1000:
        print(f"Page content: {content}")
    screenshot = page.screenshot(full_page=True)
    with open('/tmp/remix_screenshot.png', 'wb') as f:
        f.write(screenshot)
    print("Screenshot saved to /tmp/remix_screenshot.png")
    browser.close()
