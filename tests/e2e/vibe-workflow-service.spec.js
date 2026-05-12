import { test, expect } from '@playwright/test';

test.describe('Vibe-Workflow as Service (No Auth/Stripe)', () => {
  test('should be accessible on port 5174', async ({ request }) => {
    // RED phase: service not running yet
    const response = await request.get('http://localhost:5174');
    // Will fail - service not running
    expect(response.status()).toBe(200);
  });

  test('should NOT redirect to auth/login', async ({ page }) => {
    // RED phase: service not running
    await page.goto('http://localhost:5174/workflow');
    // Should NOT have NextAuth redirect
    expect(page.url()).not.toContain('login');
    expect(page.url()).not.toContain('auth');
  });

  test('should NOT have Stripe elements', async ({ page }) => {
    await page.goto('http://localhost:5174/workflow');
    
    // Should NOT have Stripe scripts
    const stripeScripts = await page.locator('script[src*="stripe"]').count();
    expect(stripeScripts).toBe(0);
    
    // Should NOT have Stripe components
    const stripeElements = await page.locator('[class*="stripe"]').count();
    expect(stripeElements).toBe(0);
  });

  test('should load workflow editor', async ({ page }) => {
    await page.goto('http://localhost:5174/workflow');
    
    // Wait for workflow editor to load
    const editor = page.locator('[data-test-id="workflow-editor"]');
    await expect(editor).toBeVisible({ timeout: 10000 });
  });

  test('should use Supabase (not NextAuth)', async ({ page }) => {
    await page.goto('http://localhost:5174/workflow');
    
    // Check console for auth errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push(msg.text());
    });
    
    await page.waitForTimeout(3000);
    
    const authErrors = logs.filter(log => 
      log.includes('NextAuth') || log.includes('auth') || log.includes('Stripe')
    );
    expect(authErrors.length).toBe(0);
  });
});
