# Timeline Editor Testing Documentation

## Overview
This document provides comprehensive testing coverage for the timeline editor application, including 17 major feature areas.

## Test Structure

### Directory Structure
```
tests/
├── e2e/              # Playwright E2E tests
│   ├── timeline-editor.e2e.spec.ts
│   ├── navigation-routing.e2e.spec.ts    # NEW: Comprehensive navigation tests
│   └── setup.config.ts
└── unit/              # Vitest unit tests
    ├── timeline-editor.unit.spec.ts
    ├── router.unit.spec.ts               # NEW: Router unit tests
    ├── route-events.unit.spec.ts         # NEW: Route events unit tests
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
- **Configuration**: `playwright.config.js`, `tests/e2e/setup.config.ts`

### Unit Testing (Vitest)
- **Framework**: Vitest
- **Coverage**: Core logic, state management, media processing
- **Configuration**: `vitest.config.js`, `tests/unit/setup.config.ts`

## Feature Test Coverage

### 1. Runtime & App Setup
- Vite configuration validation
- Security headers verification
- Performance metrics (load time < 5s)

### 2. Route Navigation & URL Handling
- **Core Routes**: Timeline, library, settings, explore, image, video, storyboard, edit, character
- **Extended Routes**: Effects, cinema, influencer, apps, templates, assist, community, avatar, audio
- **Template Routes**: Text-to-image, image-to-image, text-to-video, image-to-video, video-to-video
- **Page Routes**: Character pages, effects pages, cinema pages, influencer pages
- **URL Parameter Handling**: Query parameters, hash parameters, parameter encoding
- **Browser History Navigation**: Back/forward navigation, history state management
- **Navigation Edge Cases**: Invalid routes, malformed URLs, concurrent navigation
- **Page Transitions**: Loading states, component cleanup, transition animations
- **Route Events**: Custom event system, event bubbling, listener management
- **Performance**: Navigation timing, memory management, concurrent request handling

### 3. App Shell Components
- Header, sidebar, layout rendering
- Responsive design (mobile/tablet)
- Component visibility

### 4. Timeline Engine
- Track rendering and management
- Clip addition and positioning
- Playhead movement control
- Playback controls (play/pause/stop)

### 5. State Management
- Undo/redo stack operations
- Project state persistence
- Snapshot management

### 6. Toolbar & Editing Controls
- Tool selection (select, move, edit)
- Zoom level controls
- Track management (add/remove)

### 7. Media Ingest
- File upload functionality
- Drag-and-drop support
- Media library integration

### 8. Library & Asset Browsing
- Media grid display
- Search functionality
- Type filtering

### 9. Settings & Inspector
- Clip settings panel
- Video/text parameter adjustment
- Real-time preview updates

### 10. Modals & Workflows
- Social publisher modal
- Image editor modal
- Video player modal

### 11. Image Creative Editing
- Advanced filter editor
- Crop tool functionality
- Effects application

### 12. Publisher & Distribution
- Email campaign configuration
- Social media posting
- Scheduling system

### 13. Animation System
- Animation library browser
- Rendiv animation application
- Keyframe creation and management

### 14. Multi-Camera Editing
- PIP (Picture-in-Picture) mode
- Split screen layouts
- Camera angle switching

### 15. Transition System
- Transition library browsing
- Preview functionality
- Clip application

### 16. Color Correction & Scopes
- Color panel interface
- Brightness adjustment
- Waveform scope visualization

### 17. Audio Mixing & Effects
- Audio mixer controls
- Level adjustment
- Effect application (reverb, etc.)

## Running Tests

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run navigation tests specifically
npm run test:e2e -- --grep "Comprehensive Navigation"

# Run with UI
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

## Test Data and Assets
- Sample media files should be placed in `tests/` directory
- Test fixtures should use mock data for consistent results
- All test data should be version controlled

## Best Practices

### Test Design
- Use descriptive test names
- Include comprehensive assertions
- Test both success and failure cases
- Mock external dependencies appropriately

### Performance
- Keep unit tests fast (< 100ms per test)
- Use parallel execution where possible
- Clean up resources after each test

### Maintainability
- Update tests when features change
- Keep test code DRY
- Use page object patterns for complex UI interactions

## Navigation & Routing Test Coverage

### Comprehensive Navigation Testing (`tests/e2e/navigation-routing.e2e.spec.ts`)
- **Core Route Navigation**: Tests all primary routes (timeline, library, settings, explore, image, video, etc.)
- **Extended Route Navigation**: Tests additional feature routes (effects, cinema, influencer, apps, templates, etc.)
- **Template Route Navigation**: Tests AI generation routes (text-to-image, image-to-image, text-to-video, etc.)
- **Page Route Navigation**: Tests dedicated page routes (character-page, effects-page, cinema-page, etc.)
- **URL Parameter Handling**: Query parameters, hash parameters, special character encoding
- **Browser History Navigation**: Back/forward navigation, rapid navigation changes
- **Navigation Edge Cases**: Invalid routes, empty routes, long routes, special characters
- **Page Transition Behavior**: Loading states, component cleanup, concurrent navigation
- **Route Event System**: Custom events, event bubbling, error handling
- **Navigation Performance**: Performance budgets, memory pressure handling
- **Cross-browser Compatibility**: Hash changes, page refresh handling

### Router Unit Testing (`tests/unit/router.unit.spec.ts`)
- **Router Initialization**: Container and callback setup
- **Route Navigation**: Valid routes, parameter handling, concurrent navigation prevention
- **Route Map and URL Generation**: Item-to-route mapping, URL construction
- **Content Area Management**: Cleanup, loading states, component management
- **Current Page Tracking**: Page state management, navigation interruption
- **Error Handling**: Page loader errors, graceful error recovery
- **Route Parameters**: Empty params, special characters, array parameters
- **Navigation State Management**: Loop prevention, rapid navigation, state reset

### Route Events Unit Testing (`tests/unit/route-events.unit.spec.ts`)
- **Event Dispatching**: Route change events with/without parameters
- **Event Listening**: Callback registration, parameter handling, unsubscription
- **Event Bubbling**: DOM event propagation, parent-child relationships
- **Error Handling**: Malformed events, callback errors
- **Memory Management**: Listener cleanup, multiple unsubscription safety

## Coverage Metrics
- Target: 80% code coverage
- Include all feature areas in test suite
- Monitor coverage trends over time

## CI Integration
Tests are configured to run in CI environments with:
- Retries: 2 attempts for flaky tests
- Headless execution
- HTML test reports in `playwright-report/`
- Coverage reports in `coverage/`