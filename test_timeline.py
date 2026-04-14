from playwright.sync_api import sync_playwright
import time

def test_timeline_editor():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # Run in headless mode
        page = browser.new_page()

        try:
            # Navigate to the app first
            print("Navigating to app...")
            page.goto('http://localhost:8080/')
            page.wait_for_load_state('networkidle')

            # Then navigate to timeline using JavaScript
            print("Navigating to timeline editor...")
            page.evaluate("window.location.hash = '#/timeline'")
            page.wait_for_load_state('networkidle')

            print(f"Page title: {page.title()}")
            print(f"URL: {page.url}")

            # Capture console messages and network responses
            messages = []
            responses = []
            page.on("console", lambda msg: messages.append(f"[{msg.type}] {msg.text}"))
            page.on("response", lambda resp: responses.append(resp))
            page.on("pageerror", lambda err: messages.append(f"[PAGEERROR] {err}"))

            print("Page loaded. Taking screenshot...")
            page.screenshot(path='/tmp/timeline-editor.png', full_page=True)

            # Try clicking on the Timeline link in the sidebar
            timeline_link = page.locator('text=Timeline').first
            if timeline_link.count() > 0:
                print("Found Timeline link in sidebar, clicking it...")
                timeline_link.click()
                page.wait_for_timeout(1000)
                page.screenshot(path='/tmp/timeline-editor-after-click.png', full_page=True)

            # Wait a bit for any dynamic content
            page.wait_for_timeout(2000)

            print("Console messages:")
            for msg in messages[-10:]:  # Last 10 messages
                print(f"  {msg}")

            # Check for failed network requests
            failed_requests = []
            for response in responses:
                if response.status >= 400:
                    failed_requests.append(f"{response.status} {response.url}")

            if failed_requests:
                print("Failed network requests:")
                for req in failed_requests[-5:]:  # Last 5 failed
                    print(f"  {req}")
            else:
                print("No failed network requests detected")

            # Print some page content to see what's loaded
            body_content = page.locator('body').text_content()
            body_text = body_content[:500] if body_content else "No content"
            print(f"Page content preview: {body_text}...")

            # Look for timeline editor elements
            print("Looking for timeline editor elements...")

            # Check if timeline container exists
            timeline_container = page.locator('[class*="timeline"]').first
            if timeline_container.count() > 0:
                print("✓ Found timeline container")
            else:
                print("✗ Timeline container not found")

            # Look for drag handles or draggable elements
            drag_elements = page.locator('[draggable="true"], [data-draggable], .draggable, .clip').all()
            print(f"Found {len(drag_elements)} draggable elements")

            # Also look for timeline clips specifically
            clips = page.locator('.clip').all()
            print(f"Found {len(clips)} timeline clips")

            # Look for tooltips (hover elements)
            tooltip_triggers = page.locator('[title], [data-tooltip], [aria-label]').all()
            print(f"Found {len(tooltip_triggers)} elements with potential tooltips")

            # Try to interact with the first draggable element
            draggable_items = drag_elements if drag_elements and len(drag_elements) > 0 else clips
            if draggable_items and len(draggable_items) > 0:
                print("Testing clip selection and drag and drop...")
                first_clip = draggable_items[0]
                try:
                    # First, try clicking on the clip to select it
                    first_clip.click()
                    page.wait_for_timeout(500)
                    print("✓ Clicked on clip - selection appears to work")

                    # Check if clip got selected (look for active class)
                    is_selected = first_clip.locator('.active, [class*="active"]').count() > 0
                    if is_selected:
                        print("✓ Clip selection styling applied")
                    else:
                        print("? Clip selection may not be visually indicated")

                    # Now test drag and drop
                    print("Testing drag and drop...")
                    first_clip.scroll_into_view_if_needed()

                    # Get initial position
                    initial_bbox = first_clip.bounding_box()
                    if initial_bbox:
                        print(f"Initial position: x={initial_bbox['x']}, y={initial_bbox['y']}")

                        # Try a more realistic drag - drag by the handle if it exists
                        handle = first_clip.locator('.clip-handle').first
                        if handle.count() > 0:
                            handle_bbox = handle.bounding_box()
                            if handle_bbox:
                                center_x = handle_bbox['x'] + handle_bbox['width']/2
                                center_y = handle_bbox['y'] + handle_bbox['height']/2
                                print("Found clip handle, dragging by handle")
                            else:
                                center_x = initial_bbox['x'] + initial_bbox['width']/2
                                center_y = initial_bbox['y'] + initial_bbox['height']/2
                        else:
                            center_x = initial_bbox['x'] + initial_bbox['width']/2
                            center_y = initial_bbox['y'] + initial_bbox['height']/2

                        page.mouse.move(center_x, center_y)
                        page.mouse.down()
                        page.mouse.move(center_x + 30, center_y)  # Smaller drag
                        page.mouse.up()

                        # Wait for UI update
                        page.wait_for_timeout(1000)

                        # Check new position
                        new_bbox = first_clip.bounding_box()
                        if new_bbox:
                            print(f"New position: x={new_bbox['x']}, y={new_bbox['y']}")
                            if abs(new_bbox['x'] - initial_bbox['x']) > 5:  # Smaller tolerance
                                print("✓ Drag and drop appears to work")
                            else:
                                print("✗ Drag and drop may not be working (position unchanged)")
                        else:
                            print("Could not get new bounding box")
                    else:
                        print("Could not get bounding box for clip")
                except Exception as e:
                    print(f"Error testing clip interaction: {e}")

            # Test tooltips by hovering
            if tooltip_triggers:
                print("Testing tooltips...")
                first_tooltip = tooltip_triggers[0]
                try:
                    tooltip_title = first_tooltip.get_attribute('title') or first_tooltip.get_attribute('aria-label') or 'unknown'
                    print(f"Hovering over element with tooltip: {tooltip_title}")
                    first_tooltip.hover()
                    page.wait_for_timeout(1000)  # Wait for tooltip to appear

                    # Look for tooltip elements that might have appeared
                    tooltips = page.locator('.tooltip, [role="tooltip"], .hint, .drag-tooltip').all()
                    if tooltips:
                        print("✓ Tooltips appear to be working")
                    else:
                        print("? Could not detect tooltip elements (might be using CSS :hover or title attribute)")
                except Exception as e:
                    print(f"Error testing tooltips: {e}")

            # Check for interactive buttons or controls
            buttons = page.locator('button, [role="button"]').all()
            print(f"Found {len(buttons)} interactive buttons")

            # Try clicking timeline control buttons
            play_button = page.locator('#playBtn').first
            if play_button.count() > 0:
                try:
                    print("Testing play button...")
                    play_button.click()
                    page.wait_for_timeout(500)
                    print("✓ Play button click appears to work")
                except Exception as e:
                    print(f"Error clicking play button: {e}")

            # Try clicking zoom buttons
            zoom_in = page.locator('[data-action="zoom-in"]').first
            if zoom_in.count() > 0:
                try:
                    print("Testing zoom in button...")
                    zoom_in.click()
                    page.wait_for_timeout(500)
                    print("✓ Zoom in button appears to work")
                except Exception as e:
                    print(f"Error clicking zoom in: {e}")

            # Try adding a track
            add_video_track = page.locator('[data-add-track="Video"]').first
            if add_video_track.count() > 0:
                try:
                    print("Testing add video track button...")
                    add_video_track.click()
                    page.wait_for_timeout(500)
                    print("✓ Add video track appears to work")
                except Exception as e:
                    print(f"Error adding video track: {e}")

            print("Timeline editor testing completed")

        except Exception as e:
            print(f"Error during testing: {e}")
            page.screenshot(path='/tmp/error-screenshot.png', full_page=True)

        finally:
            browser.close()

if __name__ == "__main__":
    test_timeline_editor()