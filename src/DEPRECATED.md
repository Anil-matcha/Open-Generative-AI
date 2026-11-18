# ⚠️ DEPRECATED — Legacy Vanilla JS Implementation

This directory contains an **older vanilla JavaScript implementation** of the Open
Generative AI studio, used exclusively by the **Electron desktop app's Vite build**.

## Status

- **Active for:** Electron desktop app (Vite → `dist/index.html` → Electron window)
- **Not used by:** Next.js web app (uses `packages/studio/` React components instead)

## Migration Plan

The `src/` vanilla JS code is being phased out in favor of the shared React component
library at `packages/studio/`. The migration path is:

1. ✅ React components built in `packages/studio/src/components/`
2. ✅ Next.js web app fully migrated to React components
3. 🔄 Electron app to be migrated to use React components (remove Vite build step)
4. ⏳ Delete `src/` directory once Electron migration is complete

## What Still Works Here

| Component | Status | Notes |
|-----------|--------|-------|
| ImageStudio.js | ✅ Functional | Full vanilla JS implementation |
| VideoStudio.js | ✅ Functional | Full vanilla JS implementation |
| LipSyncStudio.js | ✅ Functional | Full vanilla JS implementation |
| CinemaStudio.js | ✅ Functional | Full vanilla JS implementation |
| AgentStudio.js | ⚠️ Placeholder | Shows "Web Only" — use Next.js version |
| WorkflowStudio.js | ⚠️ Placeholder | Shows "Web Only" — use Next.js version |
| McpCliStudio.js | ✅ Functional | Documentation page |

## Why Two Implementations Exist

The project started as a vanilla JS SPA (Vite + no framework). As complexity grew,
it was migrated to Next.js + React for the web version. The Electron app still uses
the original Vite build pipeline. Unifying them is tracked as a future milestone.

## Adding Features

**Do not add new features here.** All new development should target
`packages/studio/src/components/`. The `src/` directory is in maintenance-only mode.

## Related

- Canonical React components: `packages/studio/src/components/`
- Electron main process: `electron/main.js`
- Vite config: `vite.config.mjs`
- Architecture docs: `project_knowledge.md`
