# Remix Go Conversion Plan (React → Vanilla JS)

## Superpowers Systematic Workflow

### Phase 1: Design - Current State Analysis

**Framework:** React 18 + Vite + React Router + Zustand  
**Type:** Full React SPA with modals, state, routing  
**Source:** deangilmorememix/remix-go  
**Current Integration:** iframe-loaded in main app at `/apps/remix-go/`

#### Current Architecture:
```
remix-go/
├── src/
│   ├── App.jsx                    # Main React app with Router
│   ├── main.jsx                  # React entry point
│   ├── components/
│   │   ├── Header.jsx            # App header
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── ModalProvider.jsx     # Modal context
│   │   └── modals/               # 11 modal components
│   │       ├── ScriptWriter.jsx
│   │       ├── VoiceClone.jsx
│   │       ├── AvatarGenerator.jsx
│   │       ├── TextOverlayEditor.jsx
│   │       ├── ImageOverlayEditor.jsx
│   │       ├── AIGeneratePanel.jsx
│   │       ├── DynamicBackground.jsx
│   │       ├── Teleprompter.jsx
│   │       └── VideoUpload.jsx
│   ├── pages/
│   │   ├── Editor.jsx            # Main editor page
│   │   ├── Publisher.jsx         # Publishing page
│   │   └── Settings.jsx          # Settings page
│   ├── lib/
│   │   └── supabase.js           # Supabase client
│   └── App.css / index.css       # Styling
├── package.json
└── vite.config.js
```

#### UI/UX Components to Preserve:
- Header with sidebar toggle
- Sidebar navigation (all 11 modal triggers)
- Modal system (open/close, stacking)
- Editor page with media timeline
- Publisher page with social sharing
- Settings page with API config
- All TailwindCSS styling
- Zustand state management patterns
- Supabase integration (if used)

#### React Patterns to Convert:
- `useState` → vanilla JS state objects
- `useEffect` → event listeners / DOM mutation observers
- `React Router` → vanilla JS hash/router
- `Context API` → global state singleton
- `JSX` → DOM API (createElement/templating)
- `onClick handlers` → addEventListener
- `Component lifecycle` → init/render functions

### Phase 2: Plan - Step-by-Step Conversion

#### Conversion Strategy: Component → Vanilla JS Class

**Pattern:**
```javascript
// Before (React):
function Header({ onMenuClick, sidebarOpen }) {
  return <header className="...">...</header>
}

// After (Vanilla JS):
class Header {
  constructor({ onMenuClick, sidebarOpen }) {
    this.onMenuClick = onMenuClick;
    this.sidebarOpen = sidebarOpen;
    this.element = this.render();
  }
  
  render() {
    const header = document.createElement('header');
    header.className = '...';
    // ... build DOM
    return header;
  }
}
```

#### Task 1: Core Infrastructure (5 min)
- Create `src/core/StateManager.js` (replaces Zustand)
- Create `src/core/EventBus.js` (replaces context)
- Create `src/core/Router.js` (replaces React Router)
- Create `src/core/Component.js` (base class)

#### Task 2: Convert Layout Components (10 min)
- `Header.jsx` → `components/Header.js`
- `Sidebar.jsx` → `components/Sidebar.js`
- `ModalProvider.jsx` → `components/ModalManager.js`

#### Task 3: Convert Modals (25 min - 3 min each)
- All 11 modal components → vanilla JS classes
- Preserve all form inputs and validation
- Keep all Tailwind classes identical

#### Task 4: Convert Pages (15 min)
- `Editor.jsx` → `pages/Editor.js`
- `Publisher.jsx` → `pages/Publisher.js`
- `Settings.jsx` → `pages/Settings.js`

#### Task 5: Update Entry Point (3 min)
- `main.jsx` → `main.js` (vanilla JS initialization)
- Remove ReactDOM.render, use manual mount

#### Task 6: Build & Dependencies (4 min)
- Update `vite.config.js` for vanilla JS
- Remove React/zustand dependencies
- Keep TailwindCSS setup

**Total Estimated Time:** 62 minutes

### Phase 3: TDD - Test Plan

#### Test Structure:
```
tests/
├── e2e/
│   └── remix-go.e2e.spec.ts       # Playwright tests
└── unit/
    ├── core/
    │   ├── StateManager.test.js
    │   ├── EventBus.test.js
    │   └── Router.test.js
    ├── components/
    │   ├── Header.test.js
    │   ├── Sidebar.test.js
    │   └── ModalManager.test.js
    └── pages/
        ├── Editor.test.js
        ├── Publisher.test.js
        └── Settings.test.js
```

#### Test Coverage:
- Component rendering (matches React output)
- State management (identical behavior)
- Modal open/close/stacking
- Navigation/routing
- Form submissions
- Supabase integration (mocked)

### Phase 4: Execute - Implementation Order

**Week 1 - Foundation:**
1. Day 1: Core infrastructure (StateManager, EventBus, Router)
2. Day 2: Header + Sidebar conversion
3. Day 3: ModalManager + 2 modals (ScriptWriter, VoiceClone)

**Week 2 - Features:**
4. Day 4: Remaining 7 modals
5. Day 5: Editor page conversion
6. Day 6: Publisher + Settings pages

**Week 3 - Polish:**
7. Day 7: Integration testing + bug fixes
8. Day 8: Build optimization
9. Day 9: Performance testing
10. Day 10: Documentation + final validation

### Phase 5: Review - Quality Gates

- [ ] All 11 modals functional with identical UI
- [ ] Sidebar navigation works
- [ ] Editor timeline loads correctly
- [ ] Publisher social sharing functional
- [ ] Settings saves/loads properly
- [ ] No React dependencies remain
- [ ] Build succeeds with vanilla JS
- [ ] Dev server operates normally
- [ ] Iframe integration works in main app
- [ ] Visual regression tests pass

### Critical Considerations

#### 1. State Management Migration
- Map all Zustand store states to StateManager
- Preserve subscription patterns
- Maintain reactivity without React

#### 2. Modal System Complexity
- ModalProvider context → EventBus events
- Stack management → array-based stack
- Portal mounting → direct DOM attachment

#### 3. Supabase Integration
- Keep supabase.js unchanged (framework-agnostic)
- Ensure auth state handling works without React

#### 4. Build System
- Vite already configured for vanilla JS support
- Need to update entry points and output

### Risk Assessment

**Medium Risk:** 11 modals + complex state  
**Mitigation:** Convert one modal fully first as proof-of-concept  
**Rollback:** Keep React version in `src/react-backup/`

---

## Status: Ready for Implementation  
**Priority:** HIGH (most complex conversion)  
**Estimated Effort:** 10 hours  
**Confidence:** 85%