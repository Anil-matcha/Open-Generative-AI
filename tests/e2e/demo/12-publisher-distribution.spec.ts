import { test, expect } from '@playwright/test';

test.describe('Demo Video: Publisher & Distribution', () => {
  test('should demonstrate publishing and distribution features', async ({ page }) => {
    await page.goto('/publish', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="publisher"], .publisher', { timeout: 10000 });

    // Screenshot publisher interface
    await page.screenshot({ path: 'demo-screenshots/publisher-interface.png' });

    // Demonstrate email campaign configuration
    const emailTab = page.locator('[data-testid="email-tab"], button:has-text("Email")').first();
    if (await emailTab.isVisible()) {
      await emailTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/publisher-email-config.png' });

      // Fill email campaign details
      const subjectInput = page.locator('input[placeholder*="subject"], [data-testid="email-subject"]').first();
      if (await subjectInput.isVisible()) {
        await subjectInput.fill('Amazing AI Video Agency Demo');
      }

      const contentInput = page.locator('textarea[placeholder*="content"], [data-testid="email-content"]').first();
      if (await contentInput.isVisible()) {
        await contentInput.fill('Check out this incredible AI-powered video creation tool!');
      }

      await page.screenshot({ path: 'demo-screenshots/publisher-email-filled.png' });
    }

    // Demonstrate social media posting
    const socialTab = page.locator('[data-testid="social-tab"], button:has-text("Social")').first();
    if (await socialTab.isVisible()) {
      await socialTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'demo-screenshots/publisher-social-posting.png' });

      // Select platforms
      const platforms = ['facebook', 'twitter', 'instagram', 'linkedin'];
      for (const platform of platforms) {
        const checkbox = page.locator(`input[value="${platform}"], [data-testid="${platform}-checkbox"]`).first();
        if (await checkbox.isVisible()) {
          await checkbox.check();
        }
      }

      // Fill post content
      const postInput = page.locator('textarea[placeholder*="post"], [data-testid="social-content"]').first();
      if (await postInput.isVisible()) {
        await postInput.fill('🚀 Just created an amazing video with AI Video Agency! #AI #VideoCreation');
      }

      await page.screenshot({ path: 'demo-screenshots/publisher-social-filled.png' });
    }

    // Demonstrate scheduling system
    const scheduleButton = page.locator('[data-testid="schedule-btn"], button:has-text("Schedule")').first();
    if (await scheduleButton.isVisible()) {
      await scheduleButton.click();
      await page.waitForTimeout(500);

      // Set schedule date/time
      const dateInput = page.locator('input[type="date"], [data-testid="schedule-date"]').first();
      if (await dateInput.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await dateInput.fill(tomorrow.toISOString().split('T')[0]);
      }

      const timeInput = page.locator('input[type="time"], [data-testid="schedule-time"]').first();
      if (await timeInput.isVisible()) {
        await timeInput.fill('10:00');
      }

      await page.screenshot({ path: 'demo-screenshots/publisher-scheduling.png' });
    }

    // Verify publisher functionality
    await expect(page.locator('[data-testid="publisher"]')).toBeVisible();
  });
});