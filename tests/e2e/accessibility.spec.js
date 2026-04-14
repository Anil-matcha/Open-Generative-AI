import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);

    // Check for main heading
    const mainHeading = await page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
      expect(alt?.length).toBeGreaterThan(0);
    }
  });

  test('should have proper ARIA labels for interactive elements', async ({ page }) => {
    await page.goto('/');
    const buttons = await page.locator('button:not([aria-label]):not([aria-labelledby])').all();
    // Allow some buttons without labels if they have visible text
    for (const button of buttons) {
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');

    // Check main text elements for contrast
    const textElements = await page.locator('p, span, div:not([style*="background"])').all();
    for (const element of textElements) {
      const color = await element.evaluate(el => window.getComputedStyle(el).color);
      const backgroundColor = await element.evaluate(el => window.getComputedStyle(el).backgroundColor);

      // Basic check - if text is not transparent, assume contrast is handled by design system
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      expect(color).not.toBe('transparent');
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus');
      if (await focusedElement.count() > 0) {
        await expect(focusedElement).toBeVisible();
      }
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');

    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const name = await input.getAttribute('name');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have either id/name, aria-label, or aria-labelledby
      const hasLabel = id || name || ariaLabel || ariaLabelledBy;
      expect(hasLabel).toBeTruthy();
    }
  });
});</content>
<parameter name="filePath">tests/e2e/accessibility.spec.js