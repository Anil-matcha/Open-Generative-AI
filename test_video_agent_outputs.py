from playwright.sync_api import sync_playwright
import time

def test_video_agent_completed_tasks():
    """Test that completed tasks appear in the outputs section of video agent workspace"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Use headless=False for debugging
        page = browser.new_page()

        try:
            # Navigate to the video agent page
            print("Navigating to video agent page...")
            page.goto('http://localhost:8080/#/video-agent')
            page.wait_for_load_state('networkidle')

            # Wait for the workspace to load
            print("Waiting for workspace to load...")
            page.wait_for_selector('.workspace-grid', timeout=10000)

            # Check if we're on the video agent page
            title_element = page.locator('.font-black.text-lg').first
            if title_element.is_visible():
                title = title_element.text_content()
                print(f"Page title: {title}")
                if "VideoAgent" not in title:
                    print("ERROR: Not on video agent page")
                    return False

            # Look for the outputs tab
            outputs_tab = page.locator('button[data-tab="outputs"]')
            if not outputs_tab.is_visible():
                print("ERROR: Outputs tab not found")
                return False

            print("Found outputs tab")

            # Check initial outputs content
            outputs_content = page.locator('#outputs')
            if outputs_content.is_visible():
                initial_content = outputs_content.text_content()
                print(f"Initial outputs content: {initial_content}")

                # Check if there's a "No outputs yet" message
                if "No outputs yet" in initial_content:
                    print("✓ Initial state shows 'No outputs yet' message")
                else:
                    print("WARNING: Initial state doesn't show expected message")

            # Try to upload a test video (we'll use a small test video)
            upload_zone = page.locator('#upload-zone')
            if upload_zone.is_visible():
                print("Upload zone is visible")

                # Create a small test video file for upload
                # For now, just check if the upload mechanism exists
                video_element = page.locator('#video')
                print(f"Video element exists: {video_element.count() > 0}")

            # Try to run a quick action
            quick_actions = page.locator('#quick-actions button')
            if quick_actions.count() > 0:
                print(f"Found {quick_actions.count()} quick actions")

                # Click the first quick action
                first_action = quick_actions.first
                action_text = first_action.text_content()
                print(f"Clicking action: {action_text}")

                first_action.click()

                # Wait a bit for processing
                time.sleep(2)

                # Check if outputs tab shows any content now
                # First switch to outputs tab
                outputs_tab.click()
                time.sleep(1)

                outputs_content = page.locator('#outputs')
                if outputs_content.is_visible():
                    updated_content = outputs_content.text_content()
                    print(f"Updated outputs content: {updated_content}")

                    # Check if there are any job completion messages
                    if "Job #" in updated_content and "Completed" in updated_content:
                        print("✓ Found completed job in outputs!")
                        return True
                    elif "Failed" in updated_content:
                        print("✗ Job failed - checking error details")
                        return False
                    else:
                        print("WARNING: No job completion status found in outputs")
                        return False
                else:
                    print("ERROR: Outputs content not visible after tab switch")
                    return False
            else:
                print("ERROR: No quick actions found")
                return False

        except Exception as e:
            print(f"ERROR during test: {e}")
            # Take screenshot for debugging
            page.screenshot(path='/tmp/video-agent-debug.png')
            return False
        finally:
            browser.close()

if __name__ == "__main__":
    result = test_video_agent_completed_tasks()
    print(f"Test result: {'PASSED' if result else 'FAILED'}")