# ViMax Conversion Plan (RED-GREEN-REFACTOR)

## Sprint 1: Foundation & Store (Tasks 1-5)
**Goal**: Testable state management core

### Task 1: Store Implementation (RED)
**File**: `apps/vimax/frontend/src/store/ViMaxStore.js`
**Test**: `apps/vimax/frontend/tests/store/ViMaxStore.test.js`
```javascript
// Test expectations:
- createStore(initialState) returns store object
- store.state returns current state
- store.subscribe(callback) registers listener
- store.update(newState) notifies all listeners
- store.update(partial) merges partial state
- Multiple subscribers receive updates
```

### Task 2: Wizard Step State (RED)
**Test**: `apps/vimax/frontend/tests/store/wizardState.test.js`
```javascript
// Test expectations:
- STEP_INTAKE, STEP_CONTENT, etc constants defined
- canProceedFromContent(formData) validation logic
- formData state updates (updateForm function)
- Step navigation (next/back) logic
```

### Task 3: Store Initial State & Actions (GREEN)
**Implement** store with full ViMax state shape:
```javascript
{
  activeView: 'wizard',
  currentStep: 0,
  formData: { pipeline, idea, script, requirement, style, quality, resolution, format, imageGenerator, videoGenerator, ... },
  apiKey: '',
  userId: '',
  userHistory: [],
  userStats: {},
  userBatches: [],
  showAIAssistant: false,
  isEnhancing: false,
  jobId: null,
  jobStatus: null,
  wsStatus: 'disconnected',
  scenes: []
}
```

### Task 4: Action Creators (GREEN)
**File**: `apps/vimax/frontend/src/store/actions.js`
- `updateForm(updates)`
- `setCurrentStep(step)`
- `setActiveView(view)`
- `setJobId(id)`
- `setJobStatus(status)`
- `setScenes(scenes)`
- `setApiKey(key)`
- `setShowAIAssistant(show)`
- `setIsEnhancing(enhancing)`
- `setUserId(id)`
- `setUserHistory(history)`
- `setUserStats(stats)`
- `setUserBatches(batches)`
- `setWsStatus(status)`
- `handleNewVideo()` - resets to initial state

### Task 5: Store REFACTOR
- Ensure all actions use immutable updates
- Add middleware support for logging/validation
- Document state shape and actions

---

## Sprint 2: Core Services (Tasks 6-9)
**Goal**: External service abstraction

### Task 6: Supabase Service (RED)
**File**: `apps/vimax/frontend/src/services/supabaseService.js`
**Test**: `apps/vimax/frontend/tests/services/supabaseService.test.js`
```javascript
// Test expectations:
- upsertUser(uid) calls supabase correctly
- getUserJobs(uid, limit) returns jobs array
- getUserBatches(uid) returns batches
- insertJob(jobData) succeeds
- insertFeedback(feedbackData) succeeds
- incrementTemplateUsage(templateId) succeeds
- trackPipelineSelection({ userId, pipelineType, source }) succeeds
- Errors handled gracefully
```

### Task 7: Supabase Service Implementation (GREEN)
**Implement** all supabase functions as service methods
**Mock** supabase client in tests

### Task 8: API Service (RED)
**File**: `apps/vimax/frontend/src/services/apiService.js`
**Test**: `apps/vimax/frontend/tests/services/apiService.test.js`
```javascript
// Test expectations:
- getApiBaseUrl() returns env var or default
- getGenerateVideoUrl() returns correct URL
- getEnhanceTextUrl() returns correct URL
- enhanceText(text, pipeline) POSTs and returns enhanced text
- generateVideo(formData) POSTs FormData and returns jobId
- getJobStatus(jobId) fetches job status
- Handle API errors properly
```

### Task 9: API Service Implementation (GREEN)
**Implement** API service with axios/fetch wrappers

---

## Sprint 3: Toast & Theme Systems (Tasks 10-13)
**Goal**: UI state management services

### Task 10: Toast Service (RED)
**File**: `apps/vimax/frontend/src/services/toastService.js`
**Test**: `apps/vimax/frontend/tests/services/toastService.test.js`
```javascript
// Test expectations:
- showSuccess(message, duration) adds success toast
- showError(message, duration) adds error toast
- showInfo(message, duration) adds info toast
- Toasts auto-dismiss after duration
- Toasts removable manually
- Maximum toast limit enforced
```

### Task 11: Toast Service Implementation (GREEN)
**Implement** singleton toast service with pub/sub

### Task 12: Theme Service (RED)
**File**: `apps/vimax/frontend/src/services/themeService.js`
**Test**: `apps/vimax/frontend/tests/services/themeService.test.js`
```javascript
// Test expectations:
- getCurrentTheme() returns 'light' or 'dark'
- setTheme('dark') updates and persists
- Theme changes broadcast to subscribers
- Persists to localStorage
```

### Task 13: Theme Service Implementation (GREEN)

---

## Sprint 4: Component Base Classes (Tasks 14-17)
**Goal**: Reusable component infrastructure

### Task 14: Base Component Class (RED)
**File**: `apps/vimax/frontend/src/components/BaseComponent.js`
**Test**: `apps/vimax/frontend/tests/components/BaseComponent.test.js`
```javascript
// Test expectations:
- BaseComponent extends HTMLElement
- setState(partial) updates internal state and triggers render
- props accessible via this.props
- Lifecycle hooks: constructor, connectedCallback, disconnectedCallback, render()
- Event binding automatic
```

### Task 15: Base Component Implementation (GREEN)
**Implement** reusable base class with state management

### Task 16: WizardProgress Component (RED+GREEN)
**File**: `apps/vimax/frontend/src/components/WizardProgress.js` (vanilla version)
**Test**: `apps/vimax/frontend/tests/components/WizardProgress.test.js`
```javascript
// Test expectations:
- Renders 5 step circles with labels
- Active step highlighted
- Completed steps show checkmark
- Connector lines between steps
- Completed steps clickable if onStepClick provided
- Clicks call onStepClick with step index
```

### Task 17: WizardProgress Implementation (GREEN)
**Convert** JSX to vanilla DOM manipulation

---

## Sprint 5: Wizard Step Components (Tasks 18-22)
**Goal**: All wizard step conversions

### Task 18: PipelineSelectStep (RED)
**File**: `apps/vimax/frontend/src/steps/PipelineSelectStep.js`
**Test**: `apps/vimax/frontend/tests/steps/PipelineSelectStep.test.js`
```javascript
// Test expectations:
- Renders pipeline type cards (idea2video, script2video, novel2video, cameo)
- Pipeline selection triggers onSelect callback
- AI assistant toggle renders
- Card visuals match React version exactly
```

### Task 19: PipelineSelectStep Implementation (GREEN)

### Task 20: IntakeStep (RED+GREEN)
**File**: `apps/vimax/frontend/src/steps/IntakeStep.js`

### Task 21: ContentStep (RED+GREEN)
**File**: `apps/vimax/frontend/src/steps/ContentStep.js`
- Handles file uploads (ModernFileUpload component integration)
- Text enhancement button integration
- Form validation UI

### Task 22: StyleStep (RED+GREEN)
**File**: `apps/vimax/frontend/src/steps/StyleStep.js`

### Task 23: GenerationStep (RED+GREEN)
**File**: `apps/vimax/frontend/src/steps/GenerationStep.js`
- Progress display
- Scene thumbnails list
- Cancel button

### Task 24: ResultStep (RED+GREEN)
**File**: `apps/vimax/frontend/src/steps/ResultStep.js`
- Video preview
- Feedback form
- Start new video button

---

## Sprint 6: Supporting Components (Tasks 25-30)
**Goal**: Layout, navigation, utility components

### Task 25: Sidebar Component (RED+GREEN)
**File**: `apps/vimax/frontend/src/components/Sidebar.js`

### Task 26: TemplateLibrary Component (RED+GREEN)
**File**: `apps/vimax/frontend/src/components/TemplateLibrary.js`

### Task 27: HistoryView Component (RED+GREEN)
**File**: `apps/vimax/frontend/src/components/HistoryView.js`

### Task 28: ViMaxLayout (RED+GREEN)
**File**: `apps/vimax/frontend/src/layout/ViMaxLayout.jsx`

### Task 29: ThemeToggle Component (RED+GREEN)
**File**: `apps/vimax/frontend/src/ThemeToggle.js`

### Task 30: Toast Component (RED+GREEN)
**File**: `apps/vimax/frontend/src/Toast.js`

---

## Sprint 7: App Orchestration (Tasks 31-33)
**Goal**: Main app integration

### Task 31: Main App Orchestrator (RED)
**File**: `apps/vimax/frontend/src/vimax.js`
**Test**: `apps/vimax/frontend/tests/vimax.test.js`
```javascript
// Test expectations:
- App initializes with default state
- Store subscriptions trigger UI updates
- All handlers wired correctly
- Lifecycle (init, cleanup) works
```

### Task 32: App Implementation (GREEN)
**Convert** App.js logic to vanilla using store + services

### Task 33: Entry Point (GREEN)
**File**: `apps/vimax/frontend/src/main.js`
- Initialize store
- Mount app
- Set up global error handlers

---

## Sprint 8: Build & Configuration (Tasks 34-37)
**Goal**: Production-ready build setup

### Task 34: Vite Configuration
**File**: `apps/vimax/frontend/vite.config.js`
- Align with Director config
- Set build output
- Configure dev server

### Task 35: Package.json Update
**Update**: `apps/vimax/frontend/package.json`
- Replace react-scripts with Vite
- Add vitest dependencies
- Update scripts: dev, build, test, preview
- Remove react, react-dom dependencies

### Task 36: Index.html
**File**: `apps/vimax/frontend/index.html`
- Modernize template
- Add mount point

### Task 37: CSS Migration
**Ensure**: `apps/vimax/frontend/src/App.css` copied unchanged

---

## Sprint 9: Test Completion & Polish (Tasks 38-40)
**Goal**: Full coverage and bug fixes

### Task 38-40: Comprehensive Testing
- Run all tests, fix failures
- Add missing unit tests
- Manual browser testing check
- Performance validation

---

## Sprint 10: AI-VFX Extraction (Tasks 41-45)
**Goal**: Extract AI-VFX from Next.js source

### Task 41: AI-VFX Source Analysis
**Location**: `apps/ai-vfx-source/`
**Analyze**: Next.js app structure, components, pages, API routes

### Task 42: AI-VFX Extraction Plan
**Document**: Extraction strategy, component dependencies, state management

### Task 43: AI-VFX Component Extraction (RED+TESTS)
**Target**: `apps/ai-vfx/` vanilla application

### Task 44: AI-VFX Implementation (GREEN)

### Task 45: AI-VFX Verification

---

## Terminal Tasks
- Code review of completed conversions
- Update workspaces documentation
- Cleanup temporary branches if using git worktrees

---

## Notes
- All tests written BEFORE implementation (TDD RED-GREEN-REFACTOR)
- Use Director as reference pattern
- Preserve UI/UX exactly - compare side-by-side
- Target 80%+ test coverage
- Each task 2-5 minutes, commit after each GREEN phase
