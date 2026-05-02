# Phase A Implementation Plan — Director Router Fix

## Objective
Replace Vue Router-based routing in Director app with vanilla JS history API routing, enabling `/timeline` route to load the converted `director.js` application.

---

## Current Problem

`apps/director/frontend/src/router/index.js`:
```javascript
import { createRouter, createWebHistory } from "vue-router";
import DefaultView from "../views/DefaultView.vue";

const routes = [{ path: "/", name: "Default", component: DefaultView }];
const router = createRouter({ history: createWebHistory(), routes });
export default router;
```

 Issues:
1. Imports Vue Router (not installed? removed from package.json)
2. References deleted `DefaultView.vue`
3. `director.js` already contains full application logic; router never actually used

---

## Target Architecture

```
index.html
  └── <div id="app"></div>
      └── director.js mounted here when route = /timeline

router/ (vanilla)
  └── index.js — simple history API router that:
     - Listens to popstate / pushState
     - Routes:
         /timeline → mounts director.js into #app
         /library → loads library page (future)
         /settings → loads settings page (future)
     - Clears #app on route change before remounting
```

`director.js` needs minor adjustment: export an `init()` function that mounts into a provided container, instead of auto-initializing on DOMContentLoaded.

---

## Task Breakdown

### Task A1: Refactor director.js for explicit initialization (2 min)

**File:** `apps/director/frontend/src/director.js`

**Change:**
- Currently auto-initializes on load (lines 486-491)
- Convert to exported `init(container)` function that accepts a DOM element

**Before:**
```javascript
// Auto-initialize when script loads directly (not as module)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDirector);
} else {
  initDirector();
}
```

**After:**
```javascript
function initDirector(container = document.getElementById('app')) {
  // ... existing init logic, but use `container` instead of hardcoded document.querySelector etc.
  // At end, render into container:
  container.appendChild(els.timelineContainer);
  // etc.
}

// Only auto-init if no module system (for backward compatibility)
if (typeof window !== 'undefined' && !window.__DIRECTOR_MODULE__) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initDirector());
  } else {
    initDirector();
  });
}

export { initDirector, state, ... };
```

**Details:**
- `initDirector(container)` parameter default to `#app` if not passed
- Inside `initDirector`, replace any hardcoded `document.body` or `document.getElementById('app')` with `container` or `container.parentNode` as appropriate
- Ensure all DOM append/render operations target `container` or descendants
- Keep exported API unchanged for tests

**Verification:**
- Run Vitest unit tests for director.js (if any) — expect no change
- Manual: `npm run dev` in director app; app should still load (if it was loading before; likely not due to router error)

---

### Task A2: Create vanilla router (5 min)

**File:** `apps/director/frontend/src/router/index.js` (replace)

**Implementation:**
```javascript
/**
 * Vanilla JS Router for Director
 * Supports: /timeline, /library, /settings (stub)
 */

// Route configuration
const routes = {
  '/timeline': {
    init: async () => {
      const { initDirector } = await import('../director.js');
      return initDirector;
    }
  },
  '/library': {
    init: async () => {
      // Placeholder: future library page
      const container = document.getElementById('app');
      container.innerHTML = '<div class="p-8"><h1 class="text-2xl">Media Library</h1><p>Coming soon.</p></div>';
      return () => {}; // no dispose needed
    }
  },
  '/settings': {
    init: async () => {
      const container = document.getElementById('app');
      container.innerHTML = '<div class="p-8"><h1 class="text-2xl">Settings</h1><p>Coming soon.</p></div>';
      return () => {};
    }
  }
};

// Current route dispose function
let currentDispose = null;

// Navigation function
function navigate(path, replace = false) {
  const url = new URL(path, window.location.origin);
  if (replace) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }
  handleRouteChange();
}

// Route change handler
function handleRouteChange() {
  const path = window.location.pathname;

  // Call dispose on previous route if available
  if (currentDispose && typeof currentDispose === 'function') {
    currentDispose();
    currentDispose = null;
  }

  // Find matching route (exact match for now)
  const route = routes[path] || routes['/timeline']; // default to timeline

  // Initialize route
  route.init().then(dispose => {
    currentDispose = dispose;
  });
}

// Popstate listener (back/forward)
window.addEventListener('popstate', handleRouteChange);

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  handleRouteChange();
});

// Export router API
export { navigate, routes };
export default { navigate, routes };
```

**Key Points:**
- Dynamic import of `director.js` only when `/timeline` route accessed (code splitting)
- `dispose` function returned from route init allows cleanup (future)
- Default to `/timeline` for unknown routes (configurable)
- Replaces Vue Router entirely

**Verification:**
- No syntax errors (`node -c` not applicable but can run `npx vite build` to check)
- Unit test: simulate `navigate('/timeline')` and check container content

---

### Task A3: Update index.html mount point (1 min)

**File:** `apps/director/frontend/index.html`

**Ensure body contains:**
```html
<div id="app"></div>
```

**If missing**, add just before closing `</body>` tag.

**Verification:** Open in browser; devtools should show `<div id="app"></div>` present.

---

### Task A4: Remove Vue Router dependency (1 min)

**File:** `apps/director/frontend/package.json`

**Check:** `dependencies` should not include `vue-router`. If present, remove and run `pnpm install` (or npm).

**Current state** already looks clean (no vue-router in earlier read). Confirm.

---

### Task A5: Write unit test for router (5 min)

**File:** `apps/director/frontend/tests/router.test.js` (new)

**Test coverage:**
1. `navigate('/timeline')` loads director into #app
2. `navigate('/library')` shows placeholder
3. Navigation disposes previous route (future-proof)

**Example test:**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { navigate, routes } from '../src/router';

describe('Director Vanilla Router', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="app"></div>';
    // Clear module cache to re-import director fresh each test
    vi.clearAllMocks();
  });

  it('should mount director on /timeline', async () => {
    navigate('/timeline');
    // Wait for dynamic import to resolve
    await new Promise(r => setTimeout(r, 10));
    const app = document.getElementById('app');
    expect(app.children.length).toBeGreaterThan(0);
  });

  it('should show library placeholder on /library', async () => {
    navigate('/library');
    await new Promise(r => setTimeout(r, 10));
    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Media Library');
  });
});
```

**Run test:** `npm run test -- Router.test.js` — expect pass.

---

### Task A6: Manual verification (3 min)

**Steps:**
1. `cd apps/director/frontend`
2. `npm run dev`
3. Navigate to `http://localhost:5174/timeline`
4. Verify timeline editor appears (timeline tracks, playhead, media library)
5. Click around (if nav exists) to /library and /settings — placeholders OK

**Acceptance:**
- No console errors
- Director UI loads
- Router handles back/forward (test manually)

---

## Execution Order

1. A1 → A2 → A3 → A4 → A5 → A6

## Time Estimate

Total: ~15-20 minutes

---

## Rollback Plan

- Vue backup already in `src/vue-backup/`
- All changes isolated to director frontend
- `git checkout` can revert easily

---

## Test Integration

- Add new router tests to CI
- Ensure existing `tests/unit/router.unit.spec.ts` still passes (it tests another router component)

---

## Status Flags

- [ ] A1 complete (director.js refactor)
- [ ] A2 complete (vanilla router written)
- [ ] A3 complete (index.html correct)
- [ ] A4 complete (no vue-router dep)
- [ ] A5 complete (tests pass)
- [ ] A6 complete (manual verification passed)

---

## Next Phase Trigger

When all above checked, Phase A done → proceed to Phase B (ViMax conversion) with separate plan document.
