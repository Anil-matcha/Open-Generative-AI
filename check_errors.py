from playwright.sync_api import sync_playwright
import time

def check_console_errors():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        console_messages = []
        page.on("console", lambda msg: console_messages.append({
            'type': msg.type,
            'text': msg.text,
            'location': msg.location
        }))

        try:
            page.goto('http://localhost:8080')
            page.wait_for_load_state('networkidle')
            time.sleep(2)  # Wait a bit for any initialization errors

            # Check for errors
            errors = [msg for msg in console_messages if msg['type'] == 'error']

            if errors:
                print("Found console errors:")
                for error in errors:
                    print(f"- {error['text']}")
            else:
                print("No console errors found!")

            # Also check for the specific errors we fixed
            process_errors = [msg for msg in console_messages if 'process is not defined' in msg['text']]
            perf_errors = [msg for msg in console_messages if 'trackMetric is not a function' in msg['text']]

            if process_errors:
                print("❌ process undefined error still present")
            else:
                print("✅ process undefined error fixed")

            if perf_errors:
                print("❌ perfMonitor.trackMetric error still present")
            else:
                print("✅ perfMonitor.trackMetric error fixed")

        except Exception as e:
            print(f"Error during test: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    check_console_errors()