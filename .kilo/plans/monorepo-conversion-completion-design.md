# Monorepo Conversion Completion — Superpowers Design Document

## 1. Overview

**Project:** Open Higgsfield AI — multi-app monorepo converting React/Vue/Next.js apps to Vanilla JS + Vite  
**Goal:** Complete all in-progress conversions, fix broken functionality, and achieve green test suite.  
**Scope:** Director, ViMax, AI Storyboarder, AI-VFX, SendSpark apps.  
**Constraints:** Preserve all UI/UX, keep TailwindCSS styling, maintain API compatibility with existing backend.

---

## 2. Current State Analysis

### 2.1 Director (Vue 3 → Vanilla JS) — 95% Complete

**Status:** Vue files deleted, monolithic `director.js` (494 lines) created, but **router broken**.

**What's Done:**
- Vue components backed up to `src/vue-backup/`
- `director.js` contains converted logic (state, rendering, event handlers)
- Vite config ✓, dependencies stripped of Vue ✓
- CSS files present: `styles.css`, `style.css` (need consolidation)

**Critical Issue:**
- `src/router/index.js` still references Vue Router and `DefaultView.vue` (deleted):
  ```js
  import { createRouter, createWebHistory } from "vue-router";
  import DefaultView from "../views/DefaultView.vue";
  ```
  This causes runtime errors when navigating to `/timeline`.

**Missing:**
- Vanilla router that integrates with `director.js`'s internal rendering
- Potential separation of concerns (director.js is monolithic; acceptable if functional)

**Blockers:** None beyond router integration.

---

### 2.2 ViMax (React 19 → Vanilla JS) — 5% Complete

**Status:** Still fully React-based; some React files deleted but replacements not implemented.

**Current State:**
- `App.js` still uses React hooks (`useState`, ` useEffect`), JSX, React components
- `package.json` has React 19, react-scripts, Zustand
- Some files deleted: `WizardProgress.js` (old React) but `WizardProgress.jsx` still present
- Test infrastructure added: `vitest.config.js`, test-setup.ts, tests/ directory
- No vanilla implementation yet

**What Needs to Happen:**
- Convert entire wizard flow to vanilla JS (WizardEngine class)
- Convert all step components (PipelineSelectStep, IntakeStep, ContentStep, StyleStep, GenerationStep, ResultStep)
- Replace Zustand stores with observable StateManager
- Migrate from CRA to Vite build system
- Remove all React dependencies

**Complexity:** Medium (wizard pattern is straightforward; UI composition needs careful DOM manipulation)

---

### 2.3 AI Storyboarder (React 19 + React Flow + DnD Kit + Zustand) — 0% Complete

**Status:** Fully React; conversion not started.

**Current State:**
- React app with Vite, React Router, Zustand stores
- Complex dependencies: React Flow (graph canvas), DnD Kit (drag-drop), Framer Motion (animations), Recharts (analytics)
- Multi-tab interface (Script, Scenes, Images, Analysis, Settings)
- No vanilla JS files created

**Challenges:**
- React Flow replacement: need minimal graph canvas implementation
- DnD Kit: native HTML5 drag-drop may suffice with polyfills
- State management: custom observable StateManager
- High interactivity: canvas panning, node editing, drag-drop reordering

**Strategy:** Extract store logic first, then build minimal UI replacements, then iterate.

---

### 2.4 AI-VFX (Next.js 15 → Vanilla JS) — 0% Complete

**Status:** Complete Next.js app exists in `apps/ai-vfx/` (from source), but not yet converted.

**Current State:**
- Next.js 15.3.4 with App Router + Pages Router hybrid
- Tailwind v4, React, NextAuth, Prisma, Redis, MuAPI integration
- Source code present under `apps/ai-vfx/` (page.js, layout.js, generate/page.js, [slug]/route.js)
- `CONVERSION_PLAN.md` defines extraction strategy: ignore SSR, convert to Vite SPA

**Key Tasks:**
- Extract client-side components (BottomInputBar, video preview, status indicators)
- Replace Next.js API routes with direct MuAPI calls or backend proxy
- Migrate build from Next to Vite
- Remove Next.js/React server component complexities

**Dependencies:** Need MuAPI endpoint working (currently 404 in tests)

---

### 2.5 AI Video Outreach — 0% Complete (Missing Source)

**Status:** Directory exists but no frontend source; requires extraction from `remix-new-editor` repo.

**Current State:**
- `apps/ai-video-outreach/` has backend/ and some configs but no `src/`
- CONVERSION_PLAN.md specifies cloning `deangilmoredemix/remix-new-editor` and copying `apps/ai-video-outreach/`
- Backend appears to be Python/Node hybrid with uploads/

**Critical Path:** Must extract source before conversion can begin.

---

## 3. Test Suite Baseline

**Status:** Mostly failing due to missing backend (MuAPI 404) and incomplete conversions.

**Passing:**
- `tests/unit/router.unit.spec.ts`: 5 tests pass ✓

**Failing:**
- `tests/unit/media-processing.test.js`: 32/39 fail (MuAPI 404, missing functions)
- `tests/unit/media-processing-integration.test.js`: all 22 fail (same)
- `tests/unit/route-events.unit.spec.ts`: import error (TypeScript `.ts` vs `.js` mismatch)

**E2E Tests:**
- `tests/e2e/main-app/timeline-editor.e2e.spec.ts`: 0 tests collected (likely broken config)
- `tests/e2e/advanced-video-features.e2e.spec.ts`: 0 tests

**Baseline Assessment:** Test suite requires stabilization before conversion work can be validated. We'll adopt a "tests-as-we-go" approach: fix tests that block our work, defer unrelated test fixes.

---

## 4. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Director router still Vue-based | High (app fails to load) | Replace with vanilla router; minimal risk due to backup |
| ViMax complexity (wizard + stores) | Medium | Break into small tasks; use TDD per step |
| AI Storyboarder Graph Canvas (React Flow) | High | Implement simplified custom canvas; preserve node UI |
| MuAPI backend unavailable | Medium (tests fail) | Mock MuAPI in tests; use env var to point to staging if available |
| SendSpark source missing | Low-Medium | Clone external repo; fallback: build from scratch using spec |
| Test suite instability | Medium | Fix broken test imports first; isolate integration tests |

---

## 5. Conversion Principles

1. **Preserve UI/UX exactly** — all Tailwind classes, layout, colors, interactions.
2. **Vanilla JS only** — no React, Vue, or framework runtime in converted apps.
3. **Modular structure** — separate state, rendering, events, services.
4. **TDD per task** — write test → implement → refactor (RED-GREEN-REFACTOR).
5. **Incremental commits** — each atomic task committed individually.
6. **No framework remnants** — remove all JSX/TSX/Vue SFC syntax.

---

## 6. Implementation Phases (Priority Order)

### Phase A: Critical Path — Fix Director Router (1-2 hours)

Director is 95% done; router is the only blocker. Fix this first to have a working reference app and unload mental burden.

**Tasks:**
1. Audit `director.js` to understand current navigation approach
2. Implement vanilla router that mounts `director.js`'s main container on route changes
3. Remove Vue Router dependency completely
4. Update `index.html` to mount point
5. Write minimal navigation tests (extend existing router.unit.spec.ts)
6. Manual verification via dev server

**Deliverable:** `/timeline` route loads director editor without errors.

---

### Phase B: ViMax Conversion (4-6 hours)

Convert wizard-based React app to Vanilla JS.

**Day 1 — Foundation:**
- Task B1: Create `apps/vimax/frontend/src/vanilla/` structure, Vite config, entry point
- Task B2: Implement `WizardEngine` class (state, navigation, validation)
- Task B3: Convert `ViMaxLayout.jsx` → `VanillaLayout.js` (header, sidebar, main content area)
- Task B4: Convert first 2 wizard steps (PipelineSelectStep, IntakeStep)

**Day 2 — Remaining Steps & Integration:**
- Task B5: Convert remaining steps (Content, Style, Generation, Result)
- Task B6: Convert Zustand stores → `Store` classes (observable pattern)
- Task B7: Wire up WizardEngine with layout and steps
- Task B8: Update build scripts (remove react-scripts, use Vite)
- Task B9: Write/update tests for wizard flow

**Deliverable:** ViMax wizard fully functional in vanilla JS; all steps navigable; data persists across steps.

---

### Phase C: AI Storyboarder Conversion (6-8 hours)

Most complex due to React Flow + DnD Kit.

**Day 1 — Core Infrastructure:**
- Task C1: Audit stores (useProjectStore, useUIStore) and document state shape
- Task C2: Implement `StateManager` (observable with subscribers)
- Task C3: Implement `EventBus` (pub/sub for cross-component communication)
- Task C4: Implement simplified `GraphCanvas` — absolute positioned nodes, SVG edges, drag to reposition
- Task C5: Implement `DragDropManager` using HTML5 DnD API

**Day 2 — Layout & Tabs:**
- Task C6: Convert layout components: Header, Sidebar, MainCanvas
- Task C7: Convert tab container (MainCanvas tabs)
- Task C8: Convert ScriptTab (text editing, formatting)
- Task C9: Convert ScenesTab (scene cards with DnD reordering)

**Day 3 — Remaining Tabs & Pages:**
- Task C10: Convert ImagesTab (image grid, upload, preview)
- Task C11: Convert AnalysisTab (simplify charts to basic stats or static)
- Task C12: Convert SettingsTab (form inputs)
- Task C13: Convert pages: HomePage, ProjectPage
- Task C14: Integrate all with StateManager; verify data flow

**Day 4 — Polish & Testing:**
- Task C15: Replace Framer Motion animations with CSS transitions
- Task C16: Verify React Flow functionality replaced adequately
- Task C17: Test all interactions; fix bugs
- Task C18: Remove React dependencies; confirm Vite build

**Deliverable:** Full storyboarder app working in vanilla; all tabs functional; canvas nodes draggable; data persists.

---

### Phase D: AI-VFX Conversion (3-4 hours)

**Assumption:** Source code in `apps/ai-vfx/` is a faithful extraction; convert client-side only.

**Tasks:**
- Task D1: Audit components (app/page.js, app/generate/page.js, app/[slug]/route.js, components/BottomInputBar.js)
- Task D2: Create vanilla structure: `src/main.js`, `src/router.js`, `src/components/`
- Task D3: Convert BottomInputBar → vanilla component
- Task D4: Convert pages: Home, Generate, Project
- Task D5: Replace Next.js API routes with direct MuAPI service calls (reuse existing MuAPI client from main app?)
- Task D6: Update Vite config; remove Next.js deps
- Task D7: Test end-to-end video generation flow (requires MuAPI key)

**Deliverable:** AI-VFX SPA with video generation UI; builds with Vite; no Next.js dependency.

---

### Phase E: AI Video Outreach Extraction & Conversion (2-3 hours)

**Precondition:** Git access to `deangilmoredemix/remix-new-editor` repo.

**Tasks:**
- Task E1: Clone remix-new-editor to temp location
- Task E2: Copy complete `apps/ai-video-outreach/` into Open-Higgsfield-AI
- Task E3: If already React/Vue, begin conversion to vanilla; if vanilla, just integrate
- Task E4: Update backend URLs to main app's endpoints
- Task E5: Add route to main router for `/ai-video-outreach`
- Task E6: Test workflow creation and publishing (mocked if needed)

**Deliverable:** AI Video Outreach accessible via main app; workflow automation functional.

---

### Phase F: Test Stabilization & Coverage (ongoing)

**Parallel tasks across all phases:**
- Fix broken test imports (e.g., route-events .ts/.js mismatch)
- Mock MuAPI calls in unit tests to avoid 404 dependencies
- Ensure each converted app has basic unit tests (at least render + navigation)
- Add integration tests for critical user flows
- Run E2E tests periodically to catch regressions

**Goal:** Achieve >70% pass rate on unit tests, all E2E tests stable.

---

## 7. Git Workflow (Superpowers)

For each phase:
1. Create worktree: `git worktree add -b feature/director-router-fix worktrees/director-router`
2. Implement changes with TDD
3. Run targeted tests; ensure pass
4. Commit with descriptive message
5. Push worktree to origin (optional)
6. Merge back to main after review (or keep as feature branch until all phases complete)

---

## 8. Success Criteria

- All apps run in dev mode (`npm run dev` in each app directory)
- Director: `/timeline` loads editor; navigation works
- ViMax: wizard completes all steps; data persists
- AI Storyboarder: all 5 tabs open; canvas nodes movable; scenes reorderable
- AI-VFX: generate page loads; video creation flow works (with valid MuAPI creds)
- SendSpark: accessible; workflow builder functional
- No framework (React/Vue/Next) dependencies in any converted app's `node_modules` or `package.json`
- Vite builds succeed for all apps
- Unit test suite: >80% passing
- E2E suite: all tests collected and majority passing

---

## 9. Immediate Next Action

**Start Phase A: Fix Director Router**

Create worktree, then:
1. Examine `director.js` initialization and render logic
2. Design vanilla router integration (likely simple history.pushState + container swap)
3. Implement router, write test, verify via dev server
