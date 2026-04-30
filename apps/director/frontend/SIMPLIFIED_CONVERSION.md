# Director Conversion - Simplified Approach

## Reality Check

After analyzing the code, **Director is already 95% vanilla JavaScript**:

- `main.js` - Pure vanilla JS (470 lines) with timeline editor, state, rendering
- `index.html` - Already has complete DOM structure
- `styles.css` - Complete Tailwind-based styling
- Vue files (`App.vue`, `DirectorLayout.vue`, `DefaultView.vue`) - Just thin wrappers

## Conversion Plan (Simplified)

### Change 1: Remove Vue Wrappers
```
BEFORE:
src/
├── App.vue                    ❌ Remove
├── layout/
│   └── DirectorLayout.vue     ❌ Remove
├── views/
│   └── DefaultView.vue        ❌ Replace with index.html reference
└── main.js                   ✅ Keep (already vanilla)

index.html                    ✅ Already complete

AFTER:
index.html                    ✅ Entry point (unchanged)
src/
└── director.js               ✅ Rename from main.js, export init()
```

### Change 2: package.json
Remove Vue dependencies:
```json
{
  "dependencies": {
    "@higgsfield/layout": "file:../../../../packages/layout",  // Optional now
    "axios": "^1.7.5",
    "socket.io-client": "^4.7.5"
    // Keep these, remove Vue-specific
  }
}
```

### Change 3: Create Entry Point
```javascript
// src/director.js - NEW
import './styles.css';

// Import the existing main logic
import { initDirector } from './main.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initDirector();
});
```

### Change 4: Update vite.config.js
Remove Vue plugin if present, ensure vanilla JS build

### Change 5: Update index.html
```html
<!-- Change script source -->
<script type="module" src="/src/director.js"></script>
```

## Testing Strategy

1. **Visual Identical**: Compare before/after screenshots
2. **Functional Identical**: Test timeline, playback, chat, generation
3. **No Regression**: Ensure all features work exactly as before

This is essentially a **code reorganization** - moving from Vue-wrapped to direct vanilla JS.
