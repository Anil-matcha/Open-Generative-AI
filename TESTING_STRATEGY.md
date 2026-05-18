# Testing Strategy - Verify All Applications & Features

## Objective

Ensure all 40+ applications in the sidebar are functional and loading correctly with all their features.

---

## Table of Contents

1. [Testing Approach](#testing-approach)
2. [Automated E2E Tests](#automated-e2e-tests)
3. [Manual Testing Checklist](#manual-testing-checklist)
4. [Health Checks](#health-checks)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Test Data & Fixtures](#test-data--fixtures)

---

## Testing Approach

### 3-Tier Testing Strategy

1. **Smoke Tests** - Quick sanity check (5 min)
   - All 40 apps load without error
   - No console errors
   - Basic UI renders

2. **Integration Tests** - Feature verification (30 min)
   - Each app's core features work
   - API connections successful
   - Data flows correctly

3. **End-to-End Tests** - User workflows (1-2 hours)
   - Complete user journeys
   - Multi-step operations
   - Error handling

---

## Automated E2E Tests (Playwright)

### Test Structure

```
tests/e2e/
├── apps-smoke.spec.ts       # All 40 apps load
├── timeline-features.spec.ts # Timeline editor features
├── director-features.spec.ts # Director app features
├── vimax-features.spec.ts   # ViMax app features
├── image-studio.spec.ts     # Image studio features
├── video-studio.spec.ts     # Video studio features
└── ...
```

### 1. All Applications Smoke Test

**File**: `tests/e2e/apps-smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

// All 40 sidebar application routes
const sidebarApps = [
  'apps', 'workflows', 'image', 'video', 'cinema',
  'headshots', 'ai-headshot', 'character', 'ai-vfx',
  'influencer', 'storyboard', 'effects', 'vfx', 'edit',
  'upscale', 'audio', 'avatar', 'training', 'videotools',
  'render', 'video-agent', 'video-outreach', 'director',
  'timeline', 'motion', 'tiktok-carousel', 'dubbing',
  'chat', 'commercial', 'templates', 'explore', 'library',
  'community', 'marketing', 'assist', 'remix-go', 'ai-vfx',
  'ai-video-outreach'
];

test.describe('All Applications Smoke Test', () => {
  for (const app of sidebarApps) {
    test(`should load ${app} without errors`, async ({ page }) => {
      // Navigate to app
      await page.goto(`/#/${app}`);
      
      // Wait for page to settle
      await page.waitForTimeout(1000);
      
      // Check for critical errors
      const errors = await page.$$('[class*="error"], [class*="Error"]');
      expect(errors.length).toBeLessThan(2);
      
      // Should have some content
      const hasContent = await page.evaluate(() => {
        return document.body.textContent?.length > 50;
      });
      expect(hasContent).toBe(true);
      
      // Should not show loading spinner permanently
      const loading = await page.$('[class*="loading"]');
      if (loading) {
        await page.waitForTimeout(3000);
        const stillLoading = await page.$('[class*="loading"]');
        expect(stillLoading).toBeNull();
      }
    });
  }
});
```

### 2. Feature Verification Tests

**File**: `tests/e2e/feature-verification.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Verification', () => {
  test('Timeline Editor - All Features Load', async ({ page }) => {
    await page.goto('/#/timeline');
    
    // Check for key elements
    await expect(page.locator('[data-testid="timeline-toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="playhead"]')).toBeVisible();
    
    // Verify AI tools button exists
    await expect(page.locator('[data-action="fill-gap"]')).toBeVisible();
    await expect(page.locator('[data-action="extend"]')).toBeVisible();
    await expect(page.locator('[data-action="sam3-mask"]')).toBeVisible();
    await expect(page.locator('[data-action="music-gen"]')).toBeVisible();
    
    // Verify floating rail actions
    await expect(page.locator('[data-rail-action="generate"]')).toBeVisible();
    await expect(page.locator('[data-rail-action="split"]')).toBeVisible();
    await expect(page.locator('[data-rail-action="scenes"]')).toBeVisible();
    
    // Verify modals can be opened
    await page.click('[data-action="social-publisher"]');
    await expect(page.locator('[data-testid="social-publisher-modal"]')).toBeVisible();
    await page.keyboard.press('Escape');
  });
  
  test('Director App - Agents Available', async ({ page }) => {
    await page.goto('/#/director');
    
    // Check agent panel
    await expect(page.locator('[data-testid="agent-panel"]')).toBeVisible();
    
    // Verify key agents are listed
    const agentNames = await page.$$eval('[data-agent]', els => 
      els.map(e => e.textContent)
    );
    expect(agentNames).toContain('Video Summarizer');
    expect(agentNames).toContain('Scene Detector');
    expect(agentNames).toContain('Object Tracker');
  });
  
  test('Image Studio - Generation Tools', async ({ page }) => {
    await page.goto('/#/image');
    
    // Check generation forms
    await expect(page.locator('[data-testid="text-to-image"]')).toBeVisible();
    await expect(page.locator('[data-testid="image-to-image"]')).toBeVisible();
    
    // Verify prompt input
    await expect(page.locator('[data-testid="prompt-input"]')).toBeVisible();
    
    // Verify model selector
    await expect(page.locator('[data-testid="model-selector"]')).toBeVisible();
  });
});
```

---

## Manual Testing Checklist

### Pre-Testing Setup

- [ ] Development server running (`npm run dev`)
- [ ] Database connected (Supabase)
- [ ] API keys configured (fal.ai, etc.)
- [ ] Browser DevTools open (console monitoring)
- [ ] Network tab monitoring for failed requests

### App-by-App Manual Checklist

#### Timeline Editor
- [ ] Timeline loads without errors
- [ ] Can add video/audio/text tracks
- [ ] Can import media files
- [ ] Can drag and drop clips
- [ ] Can use blade tool to cut
- [ ] Playback works (play/pause/stop)
- [ ] Zoom controls work
- [ ] Fill Gap generates content
- [ ] Extend adds frames
- [ ] SAM3 masking works (test with sample video)
- [ ] Music generation creates audio
- [ ] Undo/Redo works
- [ ] Auto-save saves project
- [ ] All modals open (test 20+ modals)
- [ ] Floating rail actions respond
- [ ] Color panel opens
- [ ] Audio mixer visible
- [ ] Can export video
- [ ] No console errors

#### Director App
- [ ] App loads
- [ ] Agent panel shows 20+ agents
- [ ] Can select agent
- [ ] Can enter task description
- [ ] Execute agent job
- [ ] Job status updates
- [ ] Results displayed
- [ ] Chat interface works
- [ ] VideoDB connection working

#### ViMax App
- [ ] App loads
- [ ] Idea2Video workflow accessible
- [ ] Novel2Video accessible
- [ ] Script2Video accessible
- [ ] AutoCameo accessible
- [ ] Can enter prompts
- [ ] Job queuing works
- [ ] Progress tracking works
- [ ] Results downloadable

#### Image Studio
- [ ] Text-to-image generation works
- [ ] Image-to-image works
- [ ] Filters apply correctly
- [ ] Crop tool functional
- [ ] Can add layers
- [ ] Export options available

#### Video Studio
- [ ] Timeline loads
- [ ] Can import video
- [ ] Trimming works
- [ ] Transitions apply
- [ ] Text overlays add
- [ ] Color correction works
- [ ] Can export video

#### Audio Studio
- [ ] Multi-track mixing works
- [ ] Effects apply (reverb, EQ)
- [ ] Voice cloning works
- [ ] Music generation works
- [ ] Can export audio

#### All Other Apps
Repeat pattern: Load → Core feature test → Export/result

---

## Health Checks

### Application Health Endpoints

Create health check endpoints for each app:

```javascript
// In each app's backend
GET /api/health/:appName

Response:
{
  "app": "timeline",
  "status": "healthy",
  "features": [
    { "name": "fill-gap", "status": "ok" },
    { "name": "extend", "status": "ok" },
    { "name": "sam3-mask", "status": "ok" }
  ],
  "dependencies": {
    "fal.ai": "connected",
    "supabase": "connected",
    "ffmpeg": "available"
  },
  "timestamp": "2026-05-14T..."
}
```

### Frontend Health Monitor

```javascript
// Global app health check
async function checkAllAppsHealth() {
  const apps = ['timeline', 'image', 'video', 'director', 'vimax', /* ... */];
  
  for (const app of apps) {
    try {
      const response = await fetch(`/api/health/${app}`);
      const data = await response.json();
      
      if (data.status !== 'healthy') {
        console.error(`App ${app} is unhealthy:`, data);
      }
    } catch (error) {
      console.error(`Failed to check ${app}:`, error);
    }
  }
}
```

### Automated Health Monitoring

```bash
# Cron job to check all apps
*/5 * * * * curl -s https://yourapp.com/api/health/check-all
```

---

## Monitoring & Alerts

### Metrics to Track

1. **Application Load Success Rate**
   - % of apps that load without error
   - Target: 100%

2. **Feature Availability**
   - % of features that work
   - API call success rates

3. **API Dependencies**
   - fal.ai availability
   - Supabase connectivity
   - FFmpeg presence

4. **Error Rates**
   - Console errors per app
   - Failed network requests
   - User-reported issues

### Alert Conditions

```javascript
const alerts = {
  appLoadFailure: {
    condition: 'app_load_success_rate < 100%',
    severity: 'critical',
    notification: 'Slack/Email'
  },
  featureDown: {
    condition: 'feature_availability < 95%',
    severity: 'high',
    notification: 'Slack'
  },
  apiDisconnected: {
    condition: 'fal_ai_success_rate < 90%',
    severity: 'critical',
    notification: 'PagerDuty'
  }
};
```

---

## Test Data & Fixtures

### Required Test Assets

```
tests/fixtures/
├── media/
│   ├── sample-video.mp4 (10MB test video)
│   ├── sample-image.jpg (test image)
│   ├── sample-audio.mp3 (test audio)
│   └── sample-gif.gif (animated)
├── mocks/
│   ├── fal-api-response.json
│   ├── supabase-data.json
│   └── user-subscription.json
└── snapshots/
    ├── timeline-load.png
    ├── director-ui.png
    └── error-states.png
```

### Mock Data Setup

```javascript
// Mock API responses for offline testing
import { setupMockAPIs } from './test-utils';

beforeEach(() => {
  setupMockAPIs({
    'POST /api/generate': { jobId: 'test-123' },
    'GET /api/status/:id': { status: 'completed', result: 'url' },
    'GET /api/user/subscription': { tier: 'pro' }
  });
});
```

---

## CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
name: App Functionality Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-apps:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Start dev server
        run: npm run dev &
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          FAL_KEY: ${{ secrets.FAL_KEY }}
          
      - name: Wait for server
        run: npx wait-on http://localhost:8080
        
      - name: Run smoke tests
        run: npx playwright test tests/e2e/apps-smoke.spec.ts
        
      - name: Run feature tests
        run: npx playwright test tests/e2e/feature-verification/
        
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: playwright-report/
```

---

## Regression Testing

### Before Deploy
- [ ] All 40 apps load
- [ ] All AI features respond
- [ ] No console errors
- [ ] Network requests succeed
- [ ] Database connections work

### After Deploy
- [ ] Smoke test all apps
- [ ] Check error monitoring
- [ ] Verify API integrations
- [ ] Monitor user feedback

---

## Common Issues & Solutions

### Issue: App fails to load
**Check**:
- Route exists in router
- Component file exists
- No import errors
- Dependencies installed

### Issue: Features not appearing
**Check**:
- Conditional rendering logic
- Feature flag configuration
- User subscription tier
- Browser compatibility

### Issue: API calls failing
**Check**:
- API keys configured
- Environment variables set
- Network connectivity
- Rate limits not exceeded

### Issue: Slow loading
**Check**:
- Large assets
- Missing lazy loading
- Blocking renders
- Database query performance

---

## Quick Start Testing Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run all E2E tests
npm run test:e2e

# Run specific app test
npx playwright test tests/e2e/timeline-features.spec.ts

# Run with UI for debugging
npm run test:e2e:ui

# Check for console errors
npm run lint

# Build and test production
npm run build
npm run preview
```

---

## Success Criteria

- **All 40 apps load** without JavaScript errors
- **Core features work** for each application
- **No broken routes** or 404s
- **API integrations functional** (fal.ai, Supabase, etc.)
- **Zero console errors** in normal operation
- **Performance acceptable** (<3s load time per app)
- **Mobile responsive** where applicable

---

## Reporting Issues

When reporting app issues, include:
1. App name and route
2. Browser and version
3. Console errors (DevTools → Console)
4. Network failures (DevTools → Network)
5. Steps to reproduce
6. Screenshot/video if possible

---

## Maintenance

### Daily
- Check error monitoring dashboards
- Review user feedback
- Verify health endpoints

### Weekly
- Run full test suite
- Review performance metrics
- Check API quota usage

### Monthly
- Audit feature usage
- Review error trends
- Update test coverage

---

## Resources

- Playwright Docs: https://playwright.dev/docs/intro
- E2E Testing Guide: /tests/e2e/
- Feature Inventory: FEATURE_GATING_INDEX.md
- API Documentation: API_ROUTES_VERIFICATION.md
