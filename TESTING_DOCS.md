# Testing Documentation

## Overview

This document provides comprehensive documentation for the testing infrastructure in the Open-Higgsfield-AI platform, including E2E tests, unit tests, integration tests, and performance tests.

---

## Table of Contents

1. [Testing Frameworks](#testing-frameworks)
2. [Directory Structure](#directory-structure)
3. [E2E Testing (Playwright)](#e2e-testing-playwright)
4. [Unit Testing (Vitest)](#unit-testing-vitest)
5. [Test Configuration](#test-configuration)
6. [Running Tests](#running-tests)
7. [Test Coverage](#test-coverage)
8. [Best Practices](#best-practices)

---

## Testing Frameworks

### E2E Testing (Playwright)

- **Framework**: Playwright Test
- **Browser Coverage**: Chromium, Firefox, WebKit
- **Device Emulation**: Desktop, Mobile (Pixel 5), Tablet
- **Configuration**: `playwright.config.js`, `tests/e2e/setup.config.ts`

### Unit Testing (Vitest)

- **Framework**: Vitest
- **Coverage**: Core logic, state management, media processing
- **Configuration**: `vitest.config.js`, `tests/unit/setup.config.ts`

---

## Directory Structure

```
tests/
├── e2e/              # Playwright E2E tests
│   ├── timeline-editor.e2e.spec.ts
│   ├── navigation-routing.e2e.spec.ts
│   ├── setup.config.ts
│   └── ...
├── unit/              # Vitest unit tests
│   ├── timeline-editor.unit.spec.ts
│   ├── router.unit.spec.ts
│   ├── route-events.unit.spec.ts
│   ├── setup.config.ts
│   └── src/
│       ├── test-setup.ts
│       └── test-teardown.ts
└── integration/       # Integration tests
    ├── ai-agent-integration.test.js
    ├── effects-template-integration.test.js
    └── ...
```

---

## E2E Testing (Playwright)

### Test Files

| File | Description |
|------|-------------|
| `timeline-editor.e2e.spec.ts` | Timeline editor feature tests |
| `navigation-routing.e2e.spec.ts` | Comprehensive navigation tests |
| `basic-app.spec.ts` | Basic application smoke tests |
| `video-generation.spec.js` | Video generation workflow tests |
| `image-generation.spec.js` | Image generation workflow tests |
| `audio-production.spec.js` | Audio production tests |
| `apps-integration.spec.js` | Multi-app integration tests |
| `accessibility.spec.js` | Accessibility compliance tests |
| `performance-baseline.spec.js` | Performance baseline tests |
| `load-testing.spec.js` | Load and stress tests |

### Navigation Routing Tests

The navigation routing tests cover 17 major feature areas:

#### Core Routes (17 routes)
- `explore`, `image`, `video`, `storyboard`, `edit`, `character`
- `effects`, `cinema`, `influencer`, `apps`, `templates`, `assist`
- `community`, `avatar`, `audio`, `library`, `timeline`, `headshots`

#### Extended Routes (12 routes)
- `upscale`, `training`, `videotools`, `chat`, `lipsync`, `commercial`
- `render`, `video-agent`, `director`, `remix-go`, `runway-motion`
- `tiktok-carousel`, `advanced-dubbing`

#### Template Routes (6 routes)
- `text-to-image`, `image-to-image`, `text-to-video`
- `image-to-video`, `video-to-video`, `video-watermark`

#### Page Routes (6 routes)
- `character-page`, `effects-page`, `cinema-page`
- `influencer-page`, `commercial-page`, `upscale-page`

### Test Categories

#### Core Route Navigation
```typescript
test.describe('Core Route Navigation', () => {
  for (const route of coreRoutes) {
    test(`should navigate to ${route} page`, async ({ page }) => {
      await page.goto(`#/${route}`);
      await expect(page).toHaveURL(new RegExp(`.*#/${route}`));
      await page.waitForTimeout(1000);
      
      const errorElements = await page.$$('[class*="error"], [class*="Error"]');
      expect(errorElements.length).toBeLessThan(2);
    });
  }
});
```

#### URL Parameter Handling
```typescript
test.describe('URL Parameter Handling', () => {
  test('should handle route with query parameters', async ({ page }) => {
    const params = 'param1=value1&param2=value2';
    await page.goto(`?${params}#/timeline`);
    
    await expect(page).toHaveURL(new RegExp(`.*${params}.*#\\/timeline`));
  });
});
```

#### Browser History Navigation
```typescript
test.describe('Browser History Navigation', () => {
  test('should handle browser back navigation', async ({ page }) => {
    const routes = ['timeline', 'library', 'settings', 'explore'];
    
    for (const route of routes) {
      await page.goto(`#/${route}`);
    }
    
    for (let i = routes.length - 2; i >= 0; i--) {
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`.*#/${routes[i]}`));
    }
  });
});
```

#### Navigation Edge Cases
```typescript
test.describe('Navigation Edge Cases', () => {
  test('should handle invalid route gracefully', async ({ page }) => {
    await page.goto('/#/invalid-route-that-does-not-exist');
    await page.waitForTimeout(1000);
    
    const hasContent = await page.evaluate(() => {
      return document.body.children.length > 0;
    });
    expect(hasContent).toBe(true);
  });
});
```

#### Performance Tests
```typescript
test.describe('Navigation Performance', () => {
  test('should navigate within performance budget', async ({ page }) => {
    const timings: number[] = [];
    
    for (const route of routes) {
      const start = Date.now();
      await page.goto(`#/${route}`);
      await page.waitForTimeout(500);
      timings.push(Date.now() - start);
    }
    
    const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    expect(averageTime).toBeLessThan(2000);
  });
});
```

---

## Unit Testing (Vitest)

### Test Files

| File | Description |
|------|-------------|
| `router.unit.spec.ts` | Router initialization, navigation, route mapping |
| `route-events.unit.spec.ts` | Event dispatching, listening, error handling |
| `aiMuapi.test.js` | AI API integration tests |
| `ai-integration.test.js` | AI service integration tests |
| `tooltipSystem.test.js` | Tooltip functionality tests |
| `animationControls.test.js` | Animation primitive tests |

### Router Unit Tests

```typescript
// Router initialization tests
describe('Router Initialization', () => {
  test('should initialize with correct container and callback', () => {
    const container = document.createElement('div');
    const callback = jest.fn();
    
    const router = new Router(container, callback);
    
    expect(router.container).toBe(container);
    expect(router.callback).toBe(callback);
  });
});

// Route navigation tests
describe('Route Navigation', () => {
  test('should navigate to valid routes', async () => {
    const router = createRouter();
    await router.navigate('timeline');
    
    expect(window.location.hash).toBe('#/timeline');
  });
  
  test('should prevent concurrent navigation', async () => {
    const router = createRouter();
    const navPromise = router.navigate('timeline');
    router.navigate('library');
    await navPromise;
    
    expect(window.location.hash).toBe('#/timeline');
  });
});
```

### Route Events Unit Tests

```typescript
// Event dispatching tests
describe('Event Dispatching', () => {
  test('should dispatch route change events with parameters', () => {
    const router = createRouter();
    const listener = jest.fn();
    document.addEventListener('route-changed', listener);
    
    router.navigate('timeline', { tab: 'settings' });
    
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].detail).toEqual({
      page: 'timeline',
      params: { tab: 'settings' }
    });
  });
});

// Event listening tests
describe('Event Listening', () => {
  test('should register callback', () => {
    const router = createRouter();
    const callback = jest.fn();
    router.onRouteChange(callback);
    router.navigate('timeline');
    
    expect(callback).toHaveBeenCalledWith({
      page: 'timeline',
      params: {}
    });
  });
});
```

---

## Test Configuration

### Playwright Configuration (`playwright.config.js`)

```javascript
module.exports = {
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  retries: 2,
  reporter: [['html', { open: 'never' }]],
};
```

### Vitest Configuration (`vitest.config.js`)

```javascript
export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
};
```

---

## Running Tests

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run navigation tests specifically
npm run test:e2e -- --grep "Comprehensive Navigation"

# Run with UI mode
npm run test:e2e:ui

# Start dev server and run tests
npm run dev & npx playwright test
```

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run router tests specifically
npm run test -- --run tests/unit/router.unit.spec.ts

# Run route events tests specifically
npm run test -- --run tests/unit/route-events.unit.spec.ts

# Run with UI
npm run test:ui

# Run specific file
npx vitest run tests/unit/timeline-editor.unit.spec.ts
```

### Performance Tests

```bash
# Run media processing unit tests
npm run test:media-processing:unit

# Run media processing integration tests
npm run test:media-processing:integration

# Run media processing E2E tests
npm run test:media-processing:e2e
```

---

## Test Coverage

### Target Coverage

- **Target**: 80% code coverage
- **Unit Tests**: Core logic, state management, media processing
- **E2E Tests**: All user flows and critical paths
- **Integration Tests**: API endpoints, database operations

### Coverage Reports

- HTML reports in `coverage/` directory
- JSON reports for CI integration
- Text summary in terminal output

---

## Best Practices

### Test Design

1. **Use descriptive test names**
   ```typescript
   test('should navigate to timeline page and display content', async () => {
     // Test implementation
   });
   ```

2. **Include comprehensive assertions**
   ```typescript
   expect(page).toHaveURL(/.*#\/timeline/);
   expect(contentArea).not.toBeNull();
   ```

3. **Test both success and failure cases**
   ```typescript
   test('should handle valid route', async () => { /* ... */ });
   test('should handle invalid route gracefully', async () => { /* ... */ });
   ```

4. **Mock external dependencies appropriately**
   ```typescript
   beforeEach(() => {
     page.route('**/api/**', route => route.fulfill({ json: mockData }));
   });
   ```

### Performance

1. **Keep unit tests fast (< 100ms per test)**
2. **Use parallel execution where possible**
3. **Clean up resources after each test**
4. **Use beforeEach/afterEach for setup/teardown**

### Maintainability

1. **Keep test code DRY**
2. **Use page object patterns for complex UI interactions**
3. **Update tests when features change**
4. **Use constants for repeated values**

```typescript
const CORE_ROUTES = ['timeline', 'library', 'settings', 'explore'];

for (const route of CORE_ROUTES) {
  test(`should navigate to ${route}`, async () => {
    // Test implementation
  });
}
```

---

## CI Integration

### Test Execution

Tests are configured to run in CI environments with:

- **Retries**: 2 attempts for flaky tests
- **Headless execution**: No browser UI
- **HTML test reports**: Generated in `playwright-report/`
- **Coverage reports**: Generated in `coverage/`

### Quality Gates

1. All tests must pass
2. Coverage must meet minimum thresholds
3. No critical console errors
4. Performance budgets must be met

---

## Test Data and Assets

- Sample media files should be placed in `tests/` directory
- Test fixtures should use mock data for consistent results
- All test data should be version controlled

---

## Accessibility Testing

```typescript
test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    expect(headings.length).toBeGreaterThan(0);
  });
  
  test('should have alt text for images', async ({ page }) => {
    const images = await page.$$('img');
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });
});
```

---

## Performance Testing

### Load Time Monitoring

```typescript
test.describe('Performance Tests', () => {
  test('should load within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('#/timeline');
    await page.waitForSelector('[data-testid="content-area"]');
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
  });
});
```

### Bundle Analysis

```bash
# Run bundle analysis
npx vite build --mode analyze
```

---

## Memory Leak Detection

Tests include memory leak detection for:

1. Component cleanup between navigations
2. Event listener removal
3. Timer/interval cleanup
4. WebSocket connections

```typescript
test('should cleanup components properly', async () => {
  await page.goto('#/timeline');
  await page.goto('#/library');
  
  // Verify no orphaned elements
  const timelineElements = await page.$$('[data-testid*="timeline"]');
  for (const el of timelineElements) {
    expect(await el.isVisible()).toBe(false);
  }
});
```
