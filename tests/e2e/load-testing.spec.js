import { test, expect } from '@playwright/test';

test.describe('Load Testing', () => {
  test.describe.configure({ mode: 'parallel' });
  
  // Simulate concurrent users
test('concurrent user load', async ({ browser }) => {
    const contexts = [];
    const users = 5; // Simulate 5 concurrent users
    
    // Create multiple browser contexts
    for (let i = 0; i < users; i++) {
      contexts.push(await browser.newContext());
    }
    
    const results = await Promise.all(
      contexts.map(async (context, index) => {
        const page = await context.newPage();
        const startTime = Date.now();
        
        try {
          await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
          const loadTime = Date.now() - startTime;
          
          // Navigate to different pages to simulate usage
          const pages = ['image', 'video', 'timeline', 'templates'];
          for (const pageName of pages) {
            await page.click(`[data-nav="${pageName}"]`);
            await page.waitForTimeout(1000); // Simulate user thinking time
          }
          
          return { user: index + 1, loadTime, success: true };
        } catch (error) {
          return { user: index + 1, error: error.message, success: false };
        } finally {
          await page.close();
          await context.close();
        }
      })
    );
    
    const successfulLoads = results.filter(r => r.success);
    const avgLoadTime = successfulLoads.reduce((sum, r) => sum + r.loadTime, 0) / successfulLoads.length;
    
    console.log('Load test results:', {
      totalUsers: users,
      successfulLoads: successfulLoads.length,
      avgLoadTime: `${avgLoadTime}ms`,
      successRate: `${(successfulLoads.length / users * 100).toFixed(1)}%`
    });
    
    // Assert reasonable performance under load
    expect(successfulLoads.length).toBeGreaterThanOrEqual(users * 0.8); // 80% success rate
    expect(avgLoadTime).toBeLessThan(5000); // 5s average under load
  });
});