# Pexels API Integration & Missing Features Implementation Plan

## Executive Summary

This plan implements **Pexels API integration** (images + videos) into the timeline editor and addresses **missing AI features** from the chatvideo-yucut/remix-new-editor repositories. Implementation follows **Test-Driven Development (TDD)** and **Superpowers methodology** with systematic subagent execution.

---

## Phase 1: Pexels API Integration (P0 - Critical Path)

### 1.1 Service Layer: `src/lib/services/PexelsService.js`

**Objective**: Robust API client with production-grade features

**Architecture**:
- Use existing service infrastructure (RateLimiter, CircuitBreaker, CacheService, ErrorBoundary)
- Singleton pattern with environment + localStorage configuration
- Support both images and videos endpoints
- Transform Pexels API response → internal asset format

**Implementation**:
```javascript
export class PexelsService {
  constructor() {
    this.apiKey = localStorage.getItem('pexels_api_key') || 
                  import.meta.env.VITE_PEXELS_API_KEY;
    this.enabled = localStorage.getItem('pexels_enabled') === 'true' ||
                   import.meta.env.VITE_PEXELS_ENABLED === 'true';
    this.rateLimiter = new RateLimiter({ rate: 200, duration: 3600000 });
    this.circuitBreaker = new CircuitBreaker('pexels_api', { failureThreshold: 5 });
    this.cache = new CacheService({ defaultTTL: 3600000 });
    this.errorBoundary = new ErrorBoundary({ service: 'pexels' });
  }
  
  async searchPhotos(query, options = {}) { /* ... */ }
  async searchVideos(query, options = {}) { /* ... */ }
  transformPhotos(photos) { /* ... */ }
  transformVideos(videos) { /* ... */ }
}
export const pexelsService = new PexelsService();
```

**Files**:
- CREATE `src/lib/services/PexelsService.js`

**Unit Tests**: `tests/unit/services/pexelsService.spec.js` (20+ tests)

---

### 1.2 Modal UI: `src/components/modals/PexelsMediaModal.jsx`

**Objective**: Full-featured media browser with search, filters, preview, selection

**Features**:
- Search input with 500ms debounce
- Photos/Videos toggle
- Filters: orientation (landscape/portrait/square), size (large/medium/small), color
- Results grid (responsive, lazy loading)
- Item selection → preview panel (image/video player, metadata)
- Add to Timeline button
- Pagination (Load More)
- Loading, error, empty states
- Keyboard shortcuts (Enter to search, ←→ navigation)
- Responsive design (mobile bottom sheet)

**Files**:
- CREATE `src/components/modals/PexelsMediaModal.jsx`
- CREATE `src/components/modals/pexels-modal-styles.css`

**Unit Tests**: `tests/unit/modals/PexelsMediaModal.spec.js` (15+ tests)

---

### 1.3 SettingsModal Integration

**Objective**: Allow users to configure Pexels API key and preferences

**Changes**:
- Add `'Media'` tab to `TABS` array
- Add `this.mediaSettings` object with pexelsEnabled, pexelsApiKey, useFallback
- Render Media tab panel with toggles and API key input (with visibility toggle)
- Add "Test Connection" button with live API test
- Save to localStorage and dispatch `pexelsSettingsUpdated` event

**Files**:
- MODIFY `src/components/modals/SettingsModal.jsx`
- MODIFY `src/components/modals/settings-modal-styles.css` (if needed)

**Tests**: Extend SettingsModal tests to cover Media tab

---

### 1.4 TimelineEditorPage Integration

**Objective**: Add Pexels button to toolbar

**Implementation**:
- Add Pexels button (🌐 icon) to `topActions` or `topIcons`
- Click handler checks if Pexels enabled, shows toast if not
- Dynamically imports PexelsMediaModal
- Instantiates with `onSelect` callback that calls `pexelsIntegration.addToTimeline(asset, type, state.currentTime)`
- Add keyboard shortcut `Ctrl+Shift+P`

**Files**:
- MODIFY `src/components/TimelineEditorPage.js`

---

### 1.5 Environment Configuration

**Files**:
- UPDATE `.env.example` with Pexels vars
- UPDATE `.env` (add provided API key: `L6Vhaw8i53EfBfusSom366jkwGkz0rtTR0C5TI6wJVueOQrNl6B7u3oA`)

---

### 1.6 E2E Testing (Playwright)

**File**: `tests/e2e/pexels-browser.e2e.spec.ts`

**Test Coverage**:
- Open modal from toolbar
- Search for photos
- Switch to video search
- Apply orientation filter
- Select item → preview panel
- Add to timeline → modal closes, clip appears
- Pagination (Load More)
- Cancel button
- API key error handling
- Settings Modal integration (add key, test connection)

---

## Phase 2: Missing AI Features Implementation

### 2.1 Scene Detection with TransNet V2

**Objective**: One-click scene boundary detection on timeline

**Components**:
- `SceneDetector` service using TransNet V2 (via muapi or local WebAssembly)
- `SceneDetectorModal` or inline panel with:
  - Sensitivity threshold slider (0.1 - 0.9)
  - "Detect Scenes" button
  - Scene thumbnail preview grid
  - Merge scenes option (min duration)
  - "Add Scene Markers" button

**Implementation**:
- Create `src/lib/sceneDetection/transnetDetector.js` (wrap TransNet V2 model)
- Create `src/components/modals/SceneDetectionModal.jsx`
- Integrate into TimelineEditorPage (button in left sidebar or top toolbar)
- Add scene markers to timeline (vertical lines with thumbnails on hover)
- Dispatch sceneDetected events

**Files**:
- CREATE `src/lib/sceneDetection/transnetDetector.js`
- CREATE `src/components/modals/SceneDetectionModal.jsx`
- MODIFY TimelineEditorPage (button)

**Tests**:
- Unit: `tests/unit/sceneDetection/transnetDetector.spec.js`
- E2E: `tests/e2e/scene-detection.e2e.spec.ts`

---

### 2.2 Subtitle Generation with Whisper

**Objective**: Auto-generate subtitles from audio/video clips

**Components**:
- `SubtitleGenerator` service using Whisper API (via MuAPI or local)
- `SubtitleEditorModal` with:
  - Waveform display
  - Editable subtitle text (per segment)
  - Timing adjustment (start/end drag)
  - Style customization (font, size, color, background, position)
  - Export SRT/VTT

**Implementation**:
- Create `src/lib/subtitles/whisperTranscriber.js` (wraps MuAPI /transcribe endpoint or local Whisper.cpp)
- Create `src/components/modals/SubtitleEditor.jsx`
- Integrate: Right-click clip → "Generate Subtitles"
- Show progress during transcription
- Render subtitles on video preview

**Files**:
- CREATE `src/lib/subtitles/whisperTranscriber.js`
- CREATE `src/components/modals/SubtitleEditor.jsx`
- MODIFY `src/lib/editor/mediaLibrary.js` or clip context menu

**Tests**:
- Unit: `tests/unit/subtitles/whisperTranscriber.spec.js`
- E2E: `tests/e2e/subtitles.e2e.spec.ts`

---

### 2.3 3D Camera Effects

**Objective**: Simulate camera movements on clips

**Effects**:
- **Shake**: Random jitter (intensity, duration)
- **Hitchcock**: Zoom while panning
- **Orbit**: Circular camera path
- **Pan Left/Right/Up/Down**: Horizontal/vertical movement

**Implementation**:
- Extend keyframe animation system (already exists in `src/lib/editor/keyframeSystem.js`)
- Add `CameraEffects` module: `src/lib/editor/cameraEffects.js`
- Create `src/components/modals/CameraEffectsModal.jsx`
- UI: Effect selector, parameter sliders (intensity, duration, speed, radius), duration control, preview button
- Apply as keyframes on selected clip

**Files**:
- CREATE `src/lib/editor/cameraEffects.js`
- CREATE `src/components/modals/CameraEffectsModal.jsx`

**Tests**:
- Unit: `tests/unit/editor/cameraEffects.spec.js`
- E2E: `tests/e2e/camera-effects.e2e.spec.ts`

---

### 2.4 AI Chat Commands

**Objective**: Natural language editing via chat interface

**Commands to support**:
- `"detect scenes"` → scene detection
- `"split at current time"` → split clip at playhead
- `"trim clip"` → trim selected clip
- `"add fade transition"` → add fade between clips
- `"add text"` → add text overlay
- `"generate subtitles"` → run Whisper
- `"remove filler words"` → clean speech
- `"add B-roll"` → find and insert complementary footage
- `"speed up/down"` → speed ramp
- `"stabilize"` → stabilize shaky video
- `"find related footage"` → semantic search

**Implementation**:
- `src/lib/agent/timelineAgent.js` (uses LLM via MuAPI /text endpoint)
- `src/components/panels/AIChatPanel.jsx` (existing? check)
- Command parser → execute timeline operations
- Show progress and results

**Files**:
- CREATE `src/lib/agent/timelineAgent.js`
- CREATE/UPDATE `src/components/panels/AIChatPanel.jsx`

**Tests**:
- Unit: `tests/unit/agent/timelineAgent.spec.js`
- E2E: `tests/e2e/ai-chat.e2e.spec.ts`

---

## Phase 3: Supporting Work

### 3.1 RateLimiter, CircuitBreaker, CacheService

**Status**: Already exists in `src/lib/services/` (assumed—verify)

If missing, implement based on standard patterns:
- RateLimiter: Token bucket algorithm
- CircuitBreaker: Failure counting with open/half-open/closed states
- CacheService: Simple Map with TTL expiration

---

### 3.2 Design System Compliance

All new components must:
- Use CSS variables: `var(--bg)`, `var(--border)`, `var(--cyan)`, `var(--emerald)`, `var(--text)`
- Border radius: `12px` (cards), `8px` (buttons), `24px` (surfaces)
- Shadows: `0 20px 60px rgba(0,0,0,0.35)`
- Typography: Inter, 11px-16px
- Transitions: `all 0.15s ease`

---

## Implementation Order (Critical Path)

1. **Week 1**:
   - PexelsService + unit tests ✅
   - PexelsMediaModal + unit tests ✅
   - CSS styling ✅
   - SettingsModal integration ✅

2. **Week 2**:
   - TimelineEditorPage integration ✅
   - E2E tests for Pexels ✅
   - Bug fixes & polish ✅

3. **Week 3**:
   - Scene Detection feature
   - Unit + E2E tests

4. **Week 4**:
   - Subtitle Generator
   - 3D Camera Effects

5. **Week 5**:
   - AI Chat Commands
   - Integration testing

6. **Week 6**:
   - Documentation updates (README, inline comments)
   - Final QA
   - Performance optimization

---

## Success Criteria

### Pexels Integration
- ✅ Users can search photos/videos by keyword
- ✅ Filters work (orientation, size, color)
- ✅ Preview shows before adding
- ✅ "Add to Timeline" creates clip with correct properties
- ✅ Pexels attribution preserved in clip metadata
- ✅ API key configurable in Settings → Media tab
- ✅ Graceful error handling (quota exceeded, invalid key)
- ✅ 80%+ test coverage (unit + integration)

### Scene Detection
- ✅ TransNet V2 detects scene boundaries
- ✅ Sensitivity slider affects detection threshold
- ✅ Scene markers appear on timeline
- ✅ Can add all scenes as clips or markers

### Subtitle Generation
- ✅ Transcription completes with timestamps
- ✅ Subtitles editable in UI
- ✅ Style customization applies
- ✅ Export to SRT/VTT works

### Camera Effects
- ✅ All 5 effects apply via keyframes
- ✅ Parameters (intensity, duration) respected
- ✅ Preview shows effect in real-time
- ✅ Can be combined with other keyframes

### AI Chat
- ✅ Commands parse and execute correctly
- ✅ Confirmation prompts for destructive actions
- ✅ History preserved
- ✅ Undo/redo compatible

---

## Files to Modify (Summary)

### New Files (17)
1. `src/lib/services/PexelsService.js`
2. `src/components/modals/PexelsMediaModal.jsx`
3. `src/components/modals/pexels-modal-styles.css`
4. `tests/unit/services/pexelsService.spec.js`
5. `tests/unit/modals/PexelsMediaModal.spec.js`
6. `tests/e2e/pexels-browser.e2e.spec.ts`
7. `src/lib/sceneDetection/transnetDetector.js`
8. `src/components/modals/SceneDetectorModal.jsx`
9. `tests/unit/sceneDetection/transnetDetector.spec.js`
10. `tests/e2e/scene-detection.e2e.spec.ts`
11. `src/lib/subtitles/whisperTranscriber.js`
12. `src/components/modals/SubtitleEditor.jsx`
13. `tests/unit/subtitles/whisperTranscriber.spec.js`
14. `tests/e2e/subtitles.e2e.spec.ts`
15. `src/lib/editor/cameraEffects.js`
16. `src/components/modals/CameraEffectsModal.jsx`
17. `tests/unit/editor/cameraEffects.spec.js`

### Modified Files (3)
1. `src/components/modals/SettingsModal.jsx` (+ Media tab)
2. `src/components/TimelineEditorPage.js` (+ Pexels button)
3. `.env` (+ Pexels vars)
4. `.env.example` (+ Pexels vars)

---

## Dependencies

**External**:
- Pexels API (free tier: 200 req/hour, 20000 total)
- No new npm packages required

**Internal** (already exist):
- `RateLimiter` service
- `CircuitBreaker` service
- `CacheService` service
- `ErrorBoundary` service
- `BaseModal` class
- `showToast` utility
- `addMediaToTimeline` function
- Timeline state management

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rate limits exceeded | Pexels API returns 429 | Cache aggressively, queue requests, fallback to scraper |
| API key invalid | User cannot search | "Test Connection" button, clear error messages |
| Large video downloads | Memory/time issues | Stream preview, lazy-load full video only on add |
| Circuit breaker trips | Service temporarily disabled | Auto-recovery after 30s, clear user messaging |
| Modal performance | Many search results cause lag | Virtual scrolling, lazy image loading, render 20 at a time |
| Mobile UX | Small screens | Responsive CSS, bottom sheet modal on mobile |

---

## Monitoring & Observability

Add metrics:
```javascript
this.monitoring.record('pexels_search', {
  query,
  resultCount: results.length,
  cached: !!cached,
  duration: Date.now() - startTime
});
```

Track errors:
```javascript
this.monitoring.record('error', {
  service: 'pexels',
  error: error.message,
  type: 'api_error' | 'network_error' | 'rate_limit'
});
```

---

## Post-MVP Enhancements

- [ ] Batch add multiple selected photos
- [ ] Save recent searches to localStorage
- [ ] Collections/favorites system
- [ ] Drag-and-drop from results directly to timeline (advanced)
- [ ] Infinite scroll vs pagination toggle
- [ ] Set default image/video duration in Settings
- [ ] Attribution overlay on exported video
- [ ] Upload to Pexels (reverse integration)
- [ ] Curated collections API (`/collections/featured`)
- [ ] Popular/search suggestions

---

## Validation Checklist

**Pre-Merge**:
- [ ] All unit tests passing (`npm run test`)
- [ ] All E2E tests passing (`npm run test:e2e`)
- [ ] Code coverage ≥ 80% for new files
- [ ] No console errors in dev mode
- [ ] Pexels API key stored securely (not in git)
- [ ] CSS compiles, no style warnings
- [ ] Accessibility audit (keyboard nav, ARIA labels)
- [ ] Mobile responsive (320px - 1920px)
- [ ] Performance budget: < 200kb modal bundle

---

## Rollout Strategy

1. **Feature flag**: `VITE_PEXELS_ENABLED=false` (default)
2. **Internal testing**: Enable for team, monitor logs
3. **Beta**: 10% of users (via localStorage opt-in)
4. **Full rollout**: After 2 weeks, default to `true`
5. **Monitor**: API error rate, cache hit ratio, modal usage

---

**Plan Created**: 2026-05-01  
**Owner**: Kilo (AI Agent)  
**Status**: Ready for Execution  
**Next Step**: Dispatch subagents for each task (TDD cycle per component)
