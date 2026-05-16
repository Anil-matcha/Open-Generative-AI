# Timeline Editor Testing Documentation

## Overview
This document provides comprehensive testing coverage for the timeline editor application, including 17 major feature areas.

## Test Structure

### Directory Structure
```
tests/
├── e2e/              # Playwright E2E tests
│   ├── timeline-editor.e2e.spec.ts
│   ├── navigation-routing.e2e.spec.ts
│   └── setup.config.ts
└── unit/              # Vitest unit tests
    ├── timeline-editor.unit.spec.ts
    ├── router.unit.spec.ts
    ├── route-events.unit.spec.ts
    ├── setup.config.ts
    └── src/
        ├── test-setup.ts
        └── test-teardown.ts
```

## Testing Frameworks

### E2E Testing (Playwright)
- **Framework**: Playwright Test
- **Browser Coverage**: Chromium, Firefox, WebKit
- **Device Emulation**: Desktop, Mobile (Pixel 5), Tablet
- **Configuration**: `playwright.config.js`

### Unit Testing (Vitest)
- **Framework**: Vitest
- **Coverage**: Core logic, state management, media processing
- **Configuration**: `vitest.config.js`

## Progress Summary

### Completed
- ✅ Added test IDs to `ImageStudio.js` (20+ test IDs)
- ✅ Added test IDs to `VideoStudio.js` (15+ test IDs)
- ✅ Added test IDs to `LibraryPage.js` (`saved-image`, `saved-video`)
- ✅ Added test IDs to `Hero.jsx` (`hero-section`)
- ✅ Added test IDs to `AppsGridSection.jsx` (`apps-grid-section`, `app-card`)
- ✅ Added test IDs to `Header.jsx` (`landing-header`)
- ✅ Added test IDs to `PlaceholderPage.js` (`placeholder-page`)
- ✅ Fixed `ImageStudio.js` syntax error (unclosed if block)
- ✅ Updated `landing-page.spec.ts` to match actual implementation
- ✅ Updated `smoke-test.spec.ts` to handle landing page correctly

### Test IDs Added

| Component | Test IDs |
|-----------|----------|
| ImageStudio.js | `image-studio`, `prompt-input`, `generate-btn`, `aspect-ratio-select`, `style-select`, `negative-prompt-input`, `negative-prompt-toggle`, `batch-count-input`, `seed-input`, `guidance-scale-input`, `advanced-settings-btn`, `advanced-panel`, `generated-image`, `save-image-btn`, `error-message`, `generated-images-grid`, `create-variations-btn`, `inpainting-mode-btn`, `inpainting-tools`, `variation-images`, `variation-image` |
| VideoStudio.js | `video-studio`, `video-prompt-input`, `generate-video-btn`, `generated-video`, `video-aspect-ratio-select`, `duration-select`, `quality-select`, `advanced-settings-btn`, `advanced-panel`, `seed-input`, `negative-prompt-input`, `negative-prompt-toggle`, `guidance-scale-input`, `reference-video-input` |
| LibraryPage.js | `saved-image`, `saved-video` |
| Hero.jsx | `hero-section` |
| AppsGridSection.jsx | `apps-grid-section`, `app-card` |
| Header.jsx | `landing-header` |
| PlaceholderPage.js | `placeholder-page` |

## Running Tests

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run landing page tests specifically
npm run test:e2e -- --grep "Landing Page"

# Run with UI
npm run test:e2e:ui
```

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run with UI
npm run test:ui
```

## Route Coverage

### Core Routes
- timeline, library, settings, explore, image, video, storyboard, edit, character, effects, vfx, ai-vfx, cinema, influencer, apps, templates, assist, community, avatar, audio, headshots

### Extended Routes
- upscale, training, videotools, chat, lipsync, video-agent, director, tiktok-carousel, runway-motion, advanced-dubbing, commercial, render, remix-go

### Template Routes
- text-to-image, image-to-image, text-to-video, image-to-video, video-to-video, video-watermark

### Page Routes
- character-page, effects-page, cinema-page, influencer-page, commercial-page, upscale-page, training-page, video-tools-page, chat-page, lipsync-page, video-agent-page, director-page, tiktok-carousel-page, runway-motion-page, advanced-dubbing-page

### Special Routes
- landing (full-page without app shell)
- signin, signup (authentication pages)

## Next Steps
1. Run full E2E test suite to verify all tests pass
2. Add test IDs to any remaining components
3. Review and expand test coverage for edge cases
4. Set up CI integration for automated testing

## Notes
- Landing page is rendered as a full-page component without the app shell (no header/sidebar)
- Some routes use `PlaceholderPage.js` as a fallback
- Build passes successfully with 308 modules transformed
