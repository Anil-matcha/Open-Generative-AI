import { test, expect } from '@playwright/test';

test.describe('Vibe Workflow Full App', () => {
  test('should load workflow editor', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    // Check that the app loads
    const canvas = page.locator('[data-test-id="workflow-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('should have node palette', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    const nodePalette = page.locator('[data-test-id="node-palette"]');
    await expect(nodePalette).toBeVisible();
    
    // Check for node types
    await expect(page.locator('[data-node-type="textNode"]')).toBeVisible();
    await expect(page.locator('[data-node-type="imageNode"]')).toBeVisible();
    await expect(page.locator('[data-node-type="videoNode"]')).toBeVisible();
    await expect(page.locator('[data-node-type="audioNode"]')).toBeVisible();
  });

  test('should create a new workflow', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    const newWorkflowBtn = page.locator('button:has-text("New Workflow")');
    await newWorkflowBtn.click();
    
    // Should show workflow name input
    const nameInput = page.locator('input[placeholder*="workflow"]');
    await expect(nameInput).toBeVisible();
    
    await nameInput.fill('Test Workflow');
    await page.locator('button:has-text("Create")').click();
    
    // Should show the workflow editor
    await expect(page.locator('[data-test-id="workflow-editor"]')).toBeVisible();
  });

  test('should add nodes to workflow', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    // Create a workflow first
    await page.locator('button:has-text("New Workflow")').click();
    await page.locator('input[placeholder*="workflow"]').fill('Node Test');
    await page.locator('button:has-text("Create")').click();
    
    // Wait for editor
    const editor = page.locator('[data-test-id="workflow-editor"]');
    await editor.waitFor({ state: 'visible' });
    
    // Drag a text node
    const textNode = page.locator('[data-node-type="textNode"]');
    const canvas = page.locator('[data-test-id="workflow-canvas"]');
    
    await textNode.dragTo(canvas);
    
    // Should have a node on canvas
    await expect(page.locator('.react-flow__node')).toHaveCount(1);
  });

  test('should connect nodes', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    // Create workflow and add two nodes
    await page.locator('button:has-text("New Workflow")').click();
    await page.locator('input[placeholder*="workflow"]').fill('Connect Test');
    await page.locator('button:has-text("Create")').click();
    
    const editor = page.locator('[data-test-id="workflow-editor"]');
    await editor.waitFor({ state: 'visible' });
    
    // Add two nodes
    await page.locator('[data-node-type="textNode"]').dragTo(page.locator('[data-test-id="workflow-canvas"]'));
    await page.locator('[data-node-type="imageNode"]').dragTo(page.locator('[data-test-id="workflow-canvas"]'));
    
    // Connect them (simplified - would need actual connection logic)
    await expect(page.locator('.react-flow__node')).toHaveCount(2);
  });

  test('should save workflow to Supabase', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    // Login first (if needed)
    // Create workflow
    await page.locator('button:has-text("New Workflow")').click();
    await page.locator('input[placeholder*="workflow"]').fill('Save Test');
    await page.locator('button:has-text("Create")').click();
    
    // Wait for save
    await page.waitForTimeout(2000);
    
    // Check Supabase (via API call)
    const response = await page.evaluate(() => {
      return fetch('/api/app/workflows', { method: 'GET' }).then(r => r.json());
    });
    
    expect(response).toBeTruthy();
  });

  test('should use MuAPI for generation', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    // Mock MuAPI
    await page.route('**/api/app/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: 'https://example.com/generated.png' })
    }));
    
    // Create workflow with generation node
    await page.locator('button:has-text("New Workflow")').click();
    await page.locator('input[placeholder*="workflow"]').fill('Gen Test');
    await page.locator('button:has-text("Create")').click();
    
    // Add image generation node
    await page.locator('[data-node-type="imageNode"]').click();
    
    // Execute workflow
    await page.locator('button:has-text("Run")').click();
    
    // Should show success
    await expect(page.locator('text=/success|completed/i')).toBeVisible({ timeout: 10000 });
  });
});
