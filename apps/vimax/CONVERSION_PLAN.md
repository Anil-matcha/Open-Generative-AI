# ViMax Conversion Plan (React → Vanilla JS)

## Superpowers Systematic Workflow

### Phase 1: Design - Current State Analysis

**Framework:** React 19 + Create React App (CRA)  
**Type:** Wizard/step-based React application  
**Source:** deangilmoreremix/ViMax  
**Structure:** Monorepo-style with frontend/ subdirectory

#### Current Architecture:
```
vimax/
├── frontend/
│   ├── package.json              # React 19, react-scripts
│   ├── public/
│   │   └── manifest.json
│   ├── src/
│   │   ├── App.js               # ???
│   │   ├── layout/
│   │   │   └── ViMaxLayout.jsx  # Main layout
│   │   ├── components/          # Wizard components
│   │   ├── pages/              # Page components
│   │   └── stores/             # Zustand stores
│   └── package-lock.json
└── package.json                 # Parent orchestrator
```

**Note:** ViMax uses Higgsfield design tokens (`@higgsfield/layout`, `@higgsfield/tokens`, `@higgsfield/navigation`) via local file: dependencies.

#### UI/UX Components to Preserve:
- ViMaxLayout structure
- Wizard stepper interface
- Form inputs and validation
- Step navigation (next/prev)
- Progress indicators
- All styling (likely Tailwind or custom CSS)
- Design token integration

### Phase 2: Plan - Step-by-Step Conversion

#### Pre-Conversion Tasks:
1. **Audit ViMax frontend/src/** - discover all components
2. **Document wizard flow** - steps, validation, data structure
3. **Extract design tokens** - copy from packages/ directory
4. **Map React patterns** - useState, useEffect, context

#### Conversion Tasks:

**Task 1: Setup Vanilla JS Foundation (10 min)**
- Create `frontend/vanilla/` directory
- Copy all assets (images, fonts) from `public/`
- Extract and copy design system CSS
- Setup Vite config for vanilla JS

**Task 2: Convert Layout (15 min)**
- `ViMaxLayout.jsx` → `VanillaLayout.js`
- Convert React slot pattern to DOM mounting
- Preserve header/footer/sidebar structure

**Task 3: Convert Wizard Engine (20 min)**
- Create `WizardEngine.js` class
- State: currentStep, formData, validation
- Methods: next(), prev(), goTo(step), validate()
- Event system for step changes

**Task 4: Convert Each Wizard Step (5-10 min each)**
- Identify all step components
- Convert each to vanilla JS class
- Preserve form fields and validation logic
- Keep all styling identical

**Task 5: Convert State Management (15 min)**
- Map Zustand stores to StateManager
- Extract all store logic
- Create observable state pattern

**Task 6: Update Entry Point (5 min)**
- Replace `index.js` React render
- Mount VanillaLayout to #root
- Initialize WizardEngine

**Task 7: Build Configuration (10 min)**
- Migrate from CRA to Vite
- Update scripts in package.json
- Remove react-scripts dependency

**Total Estimated Time:** 90-120 minutes

### Phase 3: TDD - Test Plan

#### Key Test Scenarios:
1. Wizard multi-step navigation
2. Form validation at each step
3. State persistence across steps
4. Back/next button functionality
5. Completion/submission flow
6. Error handling

#### Test Files:
```
frontend/vanilla/tests/
├── WizardEngine.test.js
├── Layout.test.js
├── Steps/
│   ├── Step1.test.js
│   ├── Step2.test.js
│   └── ...
└── StateManager.test.js
```

### Phase 4: Execute - Implementation Order

**Day 1 - Foundation:**
1. Clone ViMax source fully to understand structure
2. Document all components and data flow
3. Setup vanilla JS project structure
4. Build WizardEngine core

**Day 2 - UI Conversion:**
5. Convert ViMaxLayout
6. Convert first 3 wizard steps
7. Test basic flow

**Day 3 - Completion:**
8. Convert remaining wizard steps
9. Integrate state management
10. Full integration testing

### Phase 5: Review - Quality Gates

- [ ] Wizard flows identically to React version
- [ ] All form fields present and functional
- [ ] Validation works per step
- [ ] Progress indicator accurate
- [ ] No React dependencies in build
- [ ] Vite build succeeds
- [ ] All tests passing

### Special Considerations

#### Design Tokens:
ViMax uses local file: dependencies to Higgsfield packages. Need to:
- Extract actual token values (colors, spacing, fonts)
- Convert to CSS custom properties or static CSS
- Ensure design consistency is preserved

#### CRA to Vite Migration:
- Update import paths
- Replace CRA-specific config
- Verify all dependencies Vite-compatible

---

## Status: Awaiting Detailed Component Audit  
**Priority:** MEDIUM  
**Estimated Effort:** 3 hours  
**Confidence:** 80% (needs component discovery first)