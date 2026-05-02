# Director App Conversion Plan (Vue → Vanilla JS)

## Superpowers Systematic Workflow

### Phase 1: Design - Current State Analysis

**Framework:** Vue 3 + Vite + TailwindCSS  
**Type:** Mixed vanilla/Vue (partially converted already)  
**Source:** deangilmoreremix/Director

#### Current Architecture:
```
director/
├── frontend/
│   ├── src/
│   │   ├── App.vue                  # Main app (minimal)
│   │   ├── layout/
│   │   │   └── DirectorLayout.vue   # Layout wrapper
│   │   ├── views/
│   │   │   └── DefaultView.vue      # Main editor view
│   │   ├── router/
│   │   │   └── index.js            # Vue Router config
│   │   ├── styles.css              # Tailwind imports
│   │   └── main.js                 # Entry point
│   └── package.json
└── backend/                         # Python backend (unchanged)
```

#### UI/UX Components to Preserve:
- DirectorLayout with sidebar navigation
- DefaultView with timeline/media controls
- TailwindCSS styling (no design changes)
- Router-based navigation
- All Vue template bindings and reactivity

### Phase 2: Plan - Step-by-Step Conversion

#### Task 1: Convert App.vue (1 min)
**File:** `director/frontend/src/App.js` (new)
```javascript
// Replace App.vue with vanilla JS entry
import './style.css';
import { initRouter } from './router';
import { DirectorLayout } from './layout/DirectorLayout';

initRouter(DirectorLayout);
```

#### Task 2: Convert DirectorLayout.vue (3 min)
**File:** `director/frontend/src/layout/DirectorLayout.js`
- Convert `<template>` to DOM creation
- Preserve all Tailwind classes exactly
- Keep slot mechanism for router-view

#### Task 3: Convert DefaultView.vue (5 min)
**File:** `director/frontend/src/views/DefaultView.js`
- Extract all template HTML
- Convert Vue reactivity to vanilla state
- Preserve all event handlers

#### Task 4: Convert Router (2 min)
**File:** `director/frontend/src/router/index.js` (update)
- Replace Vue Router with vanilla history API
- Keep same route structure
- Add component lazy loading

#### Task 5: Update Build Config (1 min)
**File:** `director/frontend/vite.config.js`
- Remove Vue plugin
- Add vanilla JS config

#### Task 6: Update package.json (1 min)
- Remove Vue dependencies
- Add vanilla JS runtime if needed

**Total Estimated Time:** 13 minutes

### Phase 3: TDD - Test Plan

#### Tests Needed:
1. Router navigation works correctly
2. DirectorLayout renders with children
3. DefaultView displays timeline editor
4. All Vue reactive behavior replicated
5. Styling unchanged (screenshot comparison)

#### Test Files:
- `director/frontend/tests/router.test.js`
- `director/frontend/tests/layout.test.js`
- `director/frontend/tests/views.test.js`

### Phase 4: Execute - Implementation Order

1. **Setup:** Create backup of Vue files
2. **Layout First:** DirectorLayout.js (foundation)
3. **Views Second:** DefaultView.js (content)
4. **Router Third:** Update router for vanilla JS
5. **Entry Last:** App.js as new entry point
6. **Build Update:** Vite config + deps
7. **Verification:** Run dev server, check UI

### Phase 5: Review - Quality Gates

- [ ] UI identical to Vue version
- [ ] All routes functional
- [ ] Timeline editor loads
- [ ] No console errors
- [ ] Build succeeds
- [ ] Dev server runs
- [ ] All tests passing

### Risk Mitigation

**Low Risk:** Director already has mixed vanilla/Vue structure  
**Rollback:** Keep Vue files in `src/vue-backup/`  
**Validation:** Visual diff tool for UI comparison

---

## Status: Ready for Implementation
**Priority:** HIGH (easiest conversion)  
**Estimated Effort:** 13 minutes  
**Confidence:** 95%