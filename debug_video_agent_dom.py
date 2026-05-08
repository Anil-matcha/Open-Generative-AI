from playwright.sync_api import sync_playwright
import time

def debug_video_agent_dom():
    """Debug the DOM structure of video agent workspace"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to video agent page...")
            page.goto('http://localhost:8080/#/video-agent')
            page.wait_for_load_state('networkidle')

            # Wait for workspace to load
            page.wait_for_selector('.workspace-grid', timeout=10000)

            # Check if outputs element exists
            outputs_element = page.locator('#outputs')
            outputs_exists = outputs_element.count() > 0
            print(f"Outputs element exists: {outputs_exists}")

            if outputs_exists:
                outputs_visible = outputs_element.is_visible()
                print(f"Outputs element visible: {outputs_visible}")

                # Check initial content
                initial_content = outputs_element.text_content()
                print(f"Initial outputs content: '{initial_content}'")

                # Check if it's supposed to be hidden initially
                style_attr = outputs_element.get_attribute('style')
                print(f"Outputs style attribute: '{style_attr}'")

            # Check for outputs tab button
            outputs_tab = page.locator('button[data-tab="outputs"]')
            tab_exists = outputs_tab.count() > 0
            print(f"Outputs tab button exists: {tab_exists}")

            if tab_exists:
                tab_visible = outputs_tab.is_visible()
                print(f"Outputs tab visible: {tab_visible}")

                # Check if it's active
                has_active_class = outputs_tab.locator('.active').count() > 0
                print(f"Outputs tab is active: {has_active_class}")

            # Check for workspace grid
            workspace_grid = page.locator('.workspace-grid')
            grid_exists = workspace_grid.count() > 0
            print(f"Workspace grid exists: {grid_exists}")

            # Take a screenshot for debugging
            page.screenshot(path='/tmp/video-agent-dom-debug.png')
            print("Screenshot saved to /tmp/video-agent-dom-debug.png")

            # Try to find any job-related elements
            job_list = page.locator('#job-list')
            job_list_exists = job_list.count() > 0
            print(f"Job list exists: {job_list_exists}")

            if job_list_exists:
                job_content = job_list.text_content()
                print(f"Job list content: '{job_content}'")

            return True

        except Exception as e:
            print(f"ERROR during DOM debug: {e}")
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    result = debug_video_agent_dom()
    print(f"DOM debug completed: {'SUCCESS' if result else 'FAILED'}")