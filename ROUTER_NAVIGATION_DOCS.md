# Router Navigation Documentation

## Overview

This document provides comprehensive documentation for the routing and navigation system in the Open-Higgsfield-AI platform, including URL handling, browser history, route events, and navigation edge cases.

---

## Table of Contents

1. [Route Definitions](#route-definitions)
2. [URL Parameter Handling](#url-parameter-handling)
3. [Browser History Navigation](#browser-history-navigation)
4. [Navigation Edge Cases](#navigation-edge-cases)
5. [Page Transition Behavior](#page-transition-behavior)
6. [Route Event System](#route-event-system)
7. [Performance Considerations](#performance-considerations)
8. [Cross-Browser Compatibility](#cross-browser-compatibility)
9. [Router Unit Testing](#router-unit-testing)
10. [Route Events Unit Testing](#route-events-unit-testing)

---

## Route Definitions

### Core Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/explore` | ExplorePage | Content discovery and browsing |
| `/image` | ImageStudio | Image generation and editing |
| `/video` | VideoStudio | Video editing and creation |
| `/storyboard` | StoryboardStudio | Visual storytelling tools |
| `/edit` | EditorPage | Professional video editor |
| `/character` | CharacterPage | Character creation and management |
| `/effects` | EffectsStudio | Visual effects application |
| `/cinema` | CinemaPage | Cinematic template browsing |
| `/influencer` | InfluencerPage | Influencer content creation |
| `/apps` | AppsHub | Application hub |
| `/templates` | TemplatesPage | Template browser |
| `/assist` | AssistPage | AI assistant interface |
| `/community` | CommunityPage | Community content sharing |
| `/avatar` | AvatarStudio | Avatar creation studio |
| `/audio` | AudioStudio | Audio production suite |
| `/library` | LibraryPage | Media library management |
| `/timeline` | TimelineEditorPage | Professional timeline editor |
| `/headshots` | HeadshotStudioPage | AI headshot generation |

### Extended Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/upscale` | UpscalePage | Image/video upscaling |
| `/training` | TrainingStudio | Model training interface |
| `/videotools` | VideoToolsStudio | Video processing tools |
| `/chat` | ChatStudio | AI chat interface |
| `/lipsync` | LipSyncStudio | Lip synchronization |
| `/commercial` | CommercialPage | Commercial content creation |
| `/render` | RenderPage | Video rendering and export |
| `/video-agent` | VideoAgentPage | Video agent workflows |
| `/director` | DirectorPage | Director app interface |
| `/remix-go` | RemixGoPage | Remix-based application |
| `/runway-motion` | RunwayMotionStudio | Motion graphics |
| `/tiktok-carousel` | TikTokCarouselStudio | TikTok content creation |
| `/advanced-dubbing` | AdvancedDubbingStudio | Professional dubbing |

### Template Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/text-to-image` | TextToImagePage | Text-to-image generation |
| `/image-to-image` | ImageToImagePage | Image-to-image editing |
| `/text-to-video` | TextToVideoPage | Text-to-video generation |
| `/image-to-video` | ImageToVideoPage | Image-to-video animation |
| `/video-to-video` | VideoToVideoPage | Video-to-video transformation |
| `/video-watermark` | VideoWatermarkPage | Watermark application |

### Page Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/character-page` | CharacterPage | Dedicated character view |
| `/effects-page` | EffectsPage | Dedicated effects view |
| `/cinema-page` | CinemaPage | Dedicated cinema view |
| `/influencer-page` | InfluencerPage | Dedicated influencer view |
| `/commercial-page` | CommercialPage | Dedicated commercial view |
| `/upscale-page` | UpscalePage | Dedicated upscale view |

---

## URL Parameter Handling

### Query Parameters

#### Standard Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `tab` | string | Active tab selection | `?tab=settings` |
| `view` | string | View mode | `?view=advanced` |
| `session` | string | Session identifier | `?session=abc123` |
| `user` | string | User identifier | `?user=test` |
| `template` | string | Template ID | `?template=12345` |
| `model` | string | AI model selection | `?model=flux-dev` |
| `quality` | string | Output quality | `?quality=high` |

#### Parameter Examples

```
# Timeline with settings tab
/# /timeline?tab=settings&view=advanced

# Library with video filter
/# /library?type=video&sort=date

# Template with specific ID
/# /template/12345

# Image generation with parameters
/# /text-to-image?model=flux-dev&quality=high&width=1024&height=1024
```

### Hash Parameters

Hash parameters are used for client-side routing and state management.

```javascript
// Example hash: #/timeline?tab=settings&view=advanced

// Parsing hash parameters
function parseHashParams() {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  
  if (queryIndex > -1) {
    const params = new URLSearchParams(hash.substring(queryIndex));
    return {
      tab: params.get('tab'),
      view: params.get('view')
    };
  }
  return null;
}
```

### Special Character Encoding

Routes with special characters are handled with proper encoding:

```javascript
// Safe route encoding
const route = 'test-route_with.special.chars';
const encodedRoute = encodeURIComponent(route);

// Navigation
window.location.hash = `#/${encodedRoute}`;
```

---

## Browser History Navigation

### Back/Forward Navigation

```javascript
// Test navigation sequence
const routes = ['timeline', 'library', 'settings', 'explore'];

// Navigate forward through routes
for (const route of routes) {
  await page.goto(`/#/${route}`);
}

// Go back through history
for (let i = routes.length - 2; i >= 0; i--) {
  await page.goBack();
  // Verify URL matches expected route
}

// Go forward through history
for (let i = 1; i < routes.length; i++) {
  await page.goForward();
  // Verify URL matches expected route
}
```

### History State Management

```javascript
// Router maintains history state
class Router {
  constructor() {
    this.history = [];
    this.currentIndex = -1;
  }
  
  navigate(path) {
    // Remove future history if navigating backward
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    this.history.push(path);
    this.currentIndex++;
    
    // Update URL
    window.location.hash = `#/${path}`;
  }
  
  back() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      window.location.hash = `#/${this.history[this.currentIndex]}`;
    }
  }
  
  forward() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      window.location.hash = `#/${this.history[this.currentIndex]}`;
    }
  }
}
```

### Rapid Navigation Handling

```javascript
// Handle concurrent navigation requests
async function handleRapidNavigation(routes) {
  // Start multiple navigation requests
  const navigationPromises = routes.map(route => 
    page.goto(`#/${route}`)
  );
  
  // Wait for all to complete
  await Promise.all(navigationPromises);
  
  // Verify final route is last requested
  const finalUrl = await page.url();
  expect(finalUrl).toContain(`#/${routes[routes.length - 1]}`);
}
```

---

## Navigation Edge Cases

### Invalid Routes

```javascript
// Test invalid route handling
test('should handle invalid route gracefully', async () => {
  await page.goto('/#/invalid-route-that-does-not-exist');
  await page.waitForTimeout(1000);
  
  // Should either redirect to default or show placeholder
  const hasContent = await page.evaluate(() => {
    const body = document.body;
    return body.children.length > 0;
  });
  expect(hasContent).toBe(true);
  
  // Should not show error text
  const errorText = await page.evaluate(() => {
    const body = document.body;
    const text = body.textContent || '';
    return text.toLowerCase().includes('failed to load');
  });
  expect(errorText).toBe(false);
});
```

### Empty Routes

```javascript
// Test empty route
test('should handle empty route', async () => {
  await page.goto('/#/');
  await page.waitForTimeout(500);
  
  // Should load default or home page
  const hasContent = await page.evaluate(() => {
    const body = document.body;
    return body.children.length > 0;
  });
  expect(hasContent).toBe(true);
});
```

### Long Routes

```javascript
// Test very long route names
test('should handle very long route names', async () => {
  const longRoute = 'a'.repeat(200); // 200 characters
  await page.goto(`#/${longRoute}`);
  await page.waitForTimeout(500);
  
  // Should handle without crashing
  const hasContent = await page.evaluate(() => {
    const body = document.body;
    return body.children.length > 0;
  });
  expect(hasContent).toBe(true);
});
```

### Special Characters

```javascript
// Test routes with special characters
test('should handle route with special characters', async () => {
  const specialRoute = 'test-route_with.special.chars';
  await page.goto(`#/${specialRoute}`);
  await page.waitForTimeout(500);
  
  // Should handle gracefully
  const currentHash = await page.evaluate(() => window.location.hash);
  expect(currentHash).toContain(specialRoute);
});
```

---

## Page Transition Behavior

### Loading States

```javascript
// Test loading state during navigation
test('should show loading state during navigation', async () => {
  await page.goto('#/timeline');
  
  // Check for loading indicator
  const loadingIndicator = await page.$('[class*="loading"], [class*="spinner"]');
  if (loadingIndicator) {
    await expect(loadingIndicator).toBeVisible();
  }
  
  // Wait for load completion
  await page.waitForTimeout(2000);
  
  // Loading should be gone
  const loadingAfter = await page.$('[class*="loading"], [class*="spinner"]');
  if (loadingAfter) {
    await expect(loadingAfter).not.toBeVisible();
  }
});
```

### Component Cleanup

```javascript
// Test component cleanup between navigations
test('should cleanup previous page components', async () => {
  // Navigate to timeline
  await page.goto('#/timeline');
  await page.waitForTimeout(1000);
  
  // Navigate to library
  await page.goto('#/library');
  await page.waitForTimeout(1000);
  
  // Previous timeline components should be cleaned up
  const timelineElements = await page.$$('[data-testid*="timeline"], [class*="timeline"]');
  for (const element of timelineElements) {
    const isVisible = await element.isVisible();
    if (isVisible) {
      // If visible, they should be library-related, not timeline
      const className = await element.evaluate(el => el.className);
      expect(className).not.toContain('timeline');
    }
  }
});
```

### Concurrent Navigation

```javascript
// Test concurrent navigation requests
test('should handle concurrent navigation requests', async () => {
  // Start multiple navigation requests rapidly
  await Promise.all([
    page.goto('#/timeline'),
    page.goto('#/library'),
    page.goto('#/settings')
  ]);
  
  await page.waitForTimeout(1000);
  
  // Should end up at the last requested route
  await expect(page).toHaveURL(/.*#\/settings/);
  
  // Should not be in a broken state
  const contentArea = await page.$('[data-testid="content-area"]');
  expect(contentArea).not.toBeNull();
});
```

---

## Route Event System

### Event Dispatching

```javascript
// Route change event structure
const eventDetail = {
  page: 'timeline',
  params: { tab: 'settings' },
  timestamp: Date.now()
};

// Dispatch route change event
window.dispatchEvent(new CustomEvent('route-changed', {
  detail: eventDetail
}));
```

### Event Listening

```javascript
// Listen for route change events
window.addEventListener('route-changed', (event) => {
  console.log('Route changed to:', event.detail.page);
  console.log('Parameters:', event.detail.params);
});
```

### Event Bubbling

```javascript
// Test event bubbling
test('should handle route event bubbling', async () => {
  let eventCaptured = false;
  
  await page.exposeFunction('captureEvent', () => {
    eventCaptured = true;
  });
  
  await page.evaluate(() => {
    document.addEventListener('route-changed', () => {
      window.captureEvent();
    }, true); // Use capture phase
  });
  
  await page.goto('#/library');
  await page.waitForTimeout(300);
  
  expect(eventCaptured).toBe(true);
});
```

### Error Handling

```javascript
// Test event error handling
test('should handle malformed events gracefully', async () => {
  await page.evaluate(() => {
    // Dispatch malformed event
    window.dispatchEvent(new CustomEvent('route-changed', {
      detail: 'not an object'
    }));
  });
  
  // Should not crash
  const hasContent = await page.evaluate(() => {
    return document.body.children.length > 0;
  });
  expect(hasContent).toBe(true);
});
```

---

## Performance Considerations

### Navigation Timing

```javascript
// Test navigation performance
test('should navigate within performance budget', async () => {
  const routes = ['timeline', 'library', 'settings', 'explore'];
  const timings = [];
  
  for (const route of routes) {
    const start = Date.now();
    await page.goto(`#/${route}`);
    await page.waitForTimeout(500);
    const end = Date.now();
    timings.push(end - start);
  }
  
  // Average navigation time should be under 2 seconds
  const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
  expect(averageTime).toBeLessThan(2000);
  
  // No navigation should take longer than 5 seconds
  const maxTime = Math.max(...timings);
  expect(maxTime).toBeLessThan(5000);
});
```

### Memory Management

```javascript
// Test memory pressure handling
test('should handle navigation under memory pressure', async () => {
  // Navigate through many routes to simulate memory pressure
  const routes = [
    ...coreRoutes,
    ...extendedRoutes.slice(0, 5),
    ...templateRoutes.slice(0, 3)
  ];
  
  for (const route of routes) {
    await page.goto(`#/${route}`);
    await page.waitForTimeout(300);
    
    // Verify page is still functional
    const contentArea = await page.$('[data-testid="content-area"]');
    expect(contentArea).not.toBeNull();
  }
});
```

---

## Cross-Browser Compatibility

### Hash Changes

```javascript
// Test hash change consistency
test('should handle hash changes consistently', async () => {
  const testHashes = [
    '#/timeline',
    '#/library?tab=videos',
    '#/settings',
    '#/explore'
  ];
  
  for (const hash of testHashes) {
    await page.goto(hash);
    
    // Verify hash is set correctly
    const currentHash = await page.evaluate(() => window.location.hash);
    expect(currentHash).toBe(hash);
    
    await page.waitForTimeout(300);
  }
});
```

### Page Refresh

```javascript
// Test page refresh on current route
test('should handle page refresh on current route', async () => {
  await page.goto('#/timeline');
  await page.waitForTimeout(500);
  
  // Refresh page
  await page.reload();
  
  // Should return to same route after refresh
  await expect(page).toHaveURL(/.*#\/timeline/);
  
  // Content should reload
  const contentArea = await page.$('[data-testid="content-area"]');
  expect(contentArea).not.toBeNull();
});
```

---

## Router Unit Testing

### Initialization Tests

```javascript
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
```

### Navigation Tests

```javascript
// Route navigation tests
describe('Route Navigation', () => {
  test('should navigate to valid routes', async () => {
    const router = createRouter();
    
    await router.navigate('timeline');
    
    expect(window.location.hash).toBe('#/timeline');
    expect(router.callback).toHaveBeenCalledWith({
      page: 'timeline',
      params: {}
    });
  });
  
  test('should prevent concurrent navigation', async () => {
    const router = createRouter();
    
    // Start navigation
    const navPromise = router.navigate('timeline');
    
    // Try to navigate again
    router.navigate('library');
    
    // Wait for first navigation
    await navPromise;
    
    // Should be at first route
    expect(window.location.hash).toBe('#/timeline');
  });
});
```

### Route Map Tests

```javascript
// Route map tests
describe('Route Map', () => {
  test('should map items to correct routes', () => {
    const router = createRouter();
    
    const route = router.getItemRoute({ type: 'video' });
    expect(route).toBe('video');
    
    const route2 = router.getItemRoute({ type: 'image' });
    expect(route2).toBe('image');
  });
  
  test('should generate correct URLs', () => {
    const router = createRouter();
    
    const url = router.createUrl('timeline', { tab: 'settings' });
    expect(url).toBe('#/timeline?tab=settings');
  });
});
```

---

## Route Events Unit Testing

### Event Dispatching Tests

```javascript
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
```

### Event Listening Tests

```javascript
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
  
  test('should unsubscribe correctly', () => {
    const router = createRouter();
    const callback = jest.fn();
    
    const unsubscribe = router.onRouteChange(callback);
    unsubscribe();
    
    router.navigate('timeline');
    
    expect(callback).not.toHaveBeenCalled();
  });
});
```

### Error Handling Tests

```javascript
// Error handling tests
describe('Error Handling', () => {
  test('should handle malformed events gracefully', () => {
    const router = createRouter();
    const callback = jest.fn();
    
    router.onRouteChange(callback);
    
    // Dispatch malformed event
    window.dispatchEvent(new CustomEvent('route-changed', {
      detail: 'not an object'
    }));
    
    // Should not crash
    expect(callback).not.toHaveBeenCalled();
  });
});
```

---

## Best Practices

### Navigation Guidelines

1. **Always use router methods** for navigation, not direct URL manipulation
2. **Handle loading states** during navigation
3. **Clean up components** when navigating away
4. **Preserve important state** in URL parameters
5. **Provide fallback routes** for invalid URLs

### Event Handling Guidelines

1. **Use event delegation** for dynamic content
2. **Clean up event listeners** to prevent memory leaks
3. **Handle errors gracefully** in event callbacks
4. **Use capture phase** for critical events
5. **Throttle frequent events** to prevent performance issues

### Performance Guidelines

1. **Preload critical routes** for faster navigation
2. **Use code splitting** for route components
3. **Cache route data** when appropriate
4. **Implement proper loading states**
5. **Monitor navigation timing** in production
