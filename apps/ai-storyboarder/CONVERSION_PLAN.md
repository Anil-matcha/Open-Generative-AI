# AI Storyboarder Conversion Plan (React → Vanilla JS)

## Superpowers Systematic Workflow

### Phase 1: Design - Current State Analysis

**Framework:** React 19 + Vite + TailwindCSS v4  
**Type:** Multi-tab storyboard creation studio  
**Source:** deangilmoredemix/ai-storyboarder  
**Complexity:** High (canvas, drag-drop, stateful stores)

#### Current Architecture:
```
ai-storyboarder/
├── frontend/
│   ├── package.json              # React 19, Vite 7, Tailwind 4
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx               # Routes + shell
│       ├── main.js               # Entry point
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── MainCanvas.jsx
│       │   ├── tabs/
│       │   │   ├── ScriptTab.jsx
│       │   │   ├── ScenesTab.jsx
│       │   │   ├── ImagesTab.jsx
│       │   │   ├── AnalysisTab.jsx
│       │   │   └── SettingsTab.jsx
│       │   └── ??? (more components)
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   └── ProjectPage.jsx
│       ├── stores/
│       │   ├── useProjectStore.js  # Zustand project state
│       │   └── useUIStore.js       # Zustand UI state
│       ├── services/
│       │   └── api.js             # Backend API client
│       ├── styles.css
│       └── index.css              # Tailwind imports
```

#### Key Technologies:
- **React Flow** (`reactflow`): Node-based storyboard canvas
- **DnD Kit** (`@dnd-kit`): Drag-and-drop for scenes/images
- **Zustand**: Global state (project + UI stores)
- **Recharts**: Analytics/charts in Analysis tab
- **Framer Motion**: Animations
- **Supabase**: Backend storage

#### UI/UX Components to Preserve:
- Header with navigation
- Sidebar with project tree/scene list
- MainCanvas with tabbed interface (5 tabs)
- React Flow canvas (graph-based storyboarding)
- DnD drag-drop interactions
- All tab content and forms
- Tailwind v4 styling
- Dark theme aesthetic

### Phase 2: Plan - Step-by-Step Conversion

#### Conversion Challenges:
1. **React Flow** → vanilla canvas/graph library or custom implementation
2. **DnD Kit** → native HTML5 drag-drop or custom
3. **Zustand** → StateManager (our custom solution)
4. **Framer Motion** → CSS transitions or vanilla animation
5. **Recharts** → Chart.js or custom SVG charts

#### Task 1: Audit & Extract (30 min)
- Catalog all store state and actions
- Document React Flow node/edge structure
- List all DnD drop zones and drag sources
- Extract API service calls (keep backend-compatible)

#### Task 2: Create Vanilla Infrastructure (45 min)
- `core/StateManager.js` - observable state
- `core/EventBus.js` - pub/sub for cross-component
- `core/GraphCanvas.js` - React Flow replacement (minimal)
- `core/DragDrop.js` - HTML5 DnD wrapper
- `ui/Animate.js` - simple animation helper

#### Task 3: Convert Layout Components (30 min)
- Header.jsx → Header.js
- Sidebar.jsx → Sidebar.js (with DnD)
- MainCanvas.jsx → MainCanvas.js (tab container)

#### Task 4: Convert Tabs (90 min - 18 min each)
- **ScriptTab**: Text editor, formatting
- **ScenesTab**: Scene cards with DnD reordering
- **ImagesTab**: Image grid with upload/preview
- **AnalysisTab**: Charts (simplify to basic stats)
- **SettingsTab**: Form inputs

#### Task 5: Convert Pages (30 min)
- HomePage.jsx → HomePage.js
- ProjectPage.jsx → ProjectPage.js (orchestrates tabs)

#### Task 6: State Migration (45 min)
- useProjectStore → ProjectStore class
- useUIStore → UIStore class
- Ensure all components subscribe correctly

#### Task 7: Build & Dependencies (15 min)
- Remove React/React Flow/DnD Kit
- Keep Tailwind v4 (already vanilla-compatible)
- Update Vite config

**Total Estimated Time:** 5-6 hours

### Phase 3: TDD - Test Plan

#### Critical Test Areas:
1. **Graph Canvas**: Node creation, edge connections, pan/zoom
2. **Drag-Drop**: Scene reordering, image uploading
3. **State**: Project data persistence, UI state sync
4. **Tabs**: Switching, content preservation
5. **API**: Service calls to backend

#### Test Files:
```
tests/unit/
├── core/
│   ├── StateManager.test.js
│   ├── EventBus.test.js
│   ├── GraphCanvas.test.js
│   └── DragDrop.test.js
├── components/
│   ├── Header.test.js
│   ├── Sidebar.test.js
│   ├── MainCanvas.test.js
│   └── tabs/
│       ├── ScriptTab.test.js
│       ├── ScenesTab.test.js
│       ├── ImagesTab.test.js
│       ├── AnalysisTab.test.js
│       └── SettingsTab.test.js
└── stores/
    ├── ProjectStore.test.js
    └── UIStore.test.js
```

### Phase 4: Execute - Implementation Order

#### Week 1 - Foundation:
- **Day 1**: Audit + StateManager + EventBus
- **Day 2**: GraphCanvas (simplified React Flow replacement)
- **Day 3**: DragDrop system + Header/Sidebar

#### Week 2 - Tabs:
- **Day 4**: ScriptTab + ScenesTab
- **Day 5**: ImagesTab + AnalysisTab
- **Day 6**: SettingsTab + MainCanvas integration

#### Week 3 - Polish:
- **Day 7**: Pages (Home + Project)
- **Day 8**: State migration + integration
- **Day 9**: Testing + bug fixes
- **Day 10**: Build + documentation

### Phase 5: Review - Quality Gates

- [ ] All 5 tabs functional with identical UI
- [ ] Graph canvas displays storyboard nodes
- [ ] Drag-drop works for scenes/images
- [ ] Project state persists correctly
- [ ] API calls work (mocked in tests)
- [ ] No React dependencies
- [ ] Vite builds successfully
- [ ] All tests passing
- [ ] Performance acceptable (<100ms interactions)

### Simplification Strategy

If React Flow/DnD Kit prove too complex to replicate:

**Option A - Simplified Canvas:**
- Use HTML/CSS for nodes (absolute positioning)
- Basic SVG for edges
- Manual drag events for repositioning

**Option B - Static Alternative:**
- Replace graph with list/sequence view
- Keep drag-drop for simpler interactions
- Degrade gracefully to basic storyboard UI

**Priority:** Functional parity > exact feature parity

---

## Status: Requires Detailed Component Discovery  
**Priority:** MEDIUM-HIGH (complex but complete app)  
**Estimated Effort:** 15-20 hours  
**Confidence:** 75% (depends on React Flow/DnD complexity)