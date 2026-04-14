import { test, expect } from '@playwright/test';

// Performance baseline test
test.describe('Performance Baseline', () => {
  test('page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000); // 3s baseline
  });
  
  test('bundle size check', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check that main bundles are loaded
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.name.includes('.js'))
        .map(r => ({ name: r.name, size: r.transferSize }));
    });
    
    console.log('Bundle sizes:', resources);
    
    // Assert main bundle is under 100kB gzipped
    const mainBundle = resources.find(r => r.name.includes('index-'));
    expect(mainBundle?.size).toBeLessThan(100000);
  });
});