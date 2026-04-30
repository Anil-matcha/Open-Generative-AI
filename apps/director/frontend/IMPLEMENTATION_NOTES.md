# Director Vanilla JS Conversion - Implementation

## Phase 1: Design (✓ Complete)
- Framework: Vue 3 → Vanilla JS
- Source: `deangilmoreremix/Director`
- Strategy: Extract and convert Vue wrappers, keep main.js logic

## Phase 2: Plan (✓ Complete - See CONVERSION_PLAN.md)

## Phase 3: TDD - RED Phase (Current)
- [x] Test suite created
- [ ] Tests currently FAILING (expected)
- Next: Implement to make tests pass (GREEN)

### Core Tests:
1. UI structure matches original
2. State management preserved
3. All timeline rendering functional
4. Playback controls working
5. Media insertion functional
6. Chat interface operational
7. Generation workflow intact

## Phase 4: Execute - Implementation Structure

```
director/frontend/ (converted)
├── src/
│   ├── main.js              # Entry point (already vanilla - keep)
│   ├── styles.css           # Global variables (keep)
│   ├── styles.css (rename)  # Timeline CSS (rename)
│   ├── components/
│   │   ├── AppShell.js      # New - replaces Vue component
│   │   ├── Header.js        # New - replaces Vue component
│   │   ├── Sidebar.js       # New - replaces Vue component
│   │   ├── ContentArea.js   # New - replaces Vue component
│   │   └── ChatInterface.js # Third-party - keep as-is
│   ├── layout/
│   │   └── DirectorLayout.js # New - combines layout components
│   ├── views/
│   │   └── DefaultView.js   # New - combines view + main logic
│   ├── router/
│   │   └── index.js         # Updated - vanilla router
│   └── state/
│       └── Store.js         # New - centralized state
├── index.html               # Entry HTML
├── vite.config.js           # Updated - vanilla config
├── package.json             # Updated - remove Vue deps
└── tests/                   # Test suite
```

## Phase 5: Validation - Green/Refactor

- [ ] All tests pass
- [ ] Visual regression test (screenshot comparison)
- [ ] Build succeeds
- [ ] Integration with main app works
