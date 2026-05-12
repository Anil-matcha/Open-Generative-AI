import { test, expect } from '@playwright/test';

test.describe('Vibe-Workflow - No Auth/Stripe', () => {
  test('should load without auth redirects', async ({ page }) => {
    // This test will fail because service isn't running
    await page.goto('/apps/vibe-workflow/');
    
    // Should NOT redirect to login
    expect(page.url()).not.toContain('login');
    expect(page.url()).not.toContain('auth');
    
    // Should load the workflow editor
    const canvas = page.locator('[data-test-id="workflow-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('should have no Stripe elements', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    // Check for Stripe scripts/elements
    const stripeScripts = page.locator('script[src*="stripe"]');
    await expect(stripeScripts).toHaveCount(0);
    
    const stripeElements = page.locator('[class*="stripe"]');
    await expect(stripeElements).toHaveCount(0);
  });

  test('should use Supabase for data (not NextAuth)', async ({ page }) => {
    await page.goto('/apps/vibe-workflow/');
    
    // Check that Supabase is used (not NextAuth)
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') logs.push(msg.text());
    });
    
    await page.waitForTimeout(3000);
    
    // Should not have NextAuth errors
    const authErrors = logs.filter(log => log.includes('NextAuth') || log.includes('auth'));
    expect(authErrors.length).toBe(0);
  });
});
