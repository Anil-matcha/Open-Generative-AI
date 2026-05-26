# Desktop Legacy Renderer Archive Result

Date: 2026-05-26
Scope: DSK-70 execution record for removing old Vanilla JS desktop studios.

## 1. Decision

DSK-70 has been executed for the current active desktop scope.

The previous blocker was the clean macOS account launch check. The user explicitly clarified that there is currently no real macOS account/hardware available and macOS configuration is not needed for this stage, so macOS packaging and launch validation are deferred instead of blocking Windows/Linux/Web desktop cleanup.

## 2. Active Desktop Path

The desktop renderer now has one active path:

- `index.html` loads `/src/desktop/main.js`.
- `src/desktop/main.js` always boots the React renderer.
- `src/desktop/DesktopApp.js` imports shared React Studio components from `packages/studio/src/components`.
- `src/desktop/electronStudioAdapter.js` provides Electron routing, storage, cookie, and API proxy rewrite adapters.
- `vite.config.mjs` aliases `@studio` to `packages/studio/src`.

The old `?renderer=legacy` fallback is removed.

## 3. Removed Fallback Entry Points

Removed from active source:

- `?renderer=legacy` handling in `src/desktop/main.js`
- `openLegacyRenderer()` in `src/desktop/electronStudioAdapter.js`
- `Legacy` button in `src/desktop/DesktopApp.js`

## 4. Deleted Vanilla Files

The following old desktop-only Vanilla files were deleted because no non-legacy references remained:

| File | Previous role |
|---|---|
| `src/main.js` | Vanilla renderer entry and router |
| `src/components/Header.js` | Vanilla shell header |
| `src/components/ImageStudio.js` | Duplicated Vanilla image studio |
| `src/components/VideoStudio.js` | Duplicated Vanilla video studio |
| `src/components/CinemaStudio.js` | Duplicated Vanilla cinema studio |
| `src/components/LipSyncStudio.js` | Duplicated Vanilla lip sync studio |
| `src/components/WorkflowStudio.js` | Vanilla workflow placeholder |
| `src/components/AgentStudio.js` | Vanilla agent placeholder |
| `src/components/McpCliStudio.js` | Vanilla MCP CLI studio |
| `src/components/SettingsModal.js` | Vanilla settings modal |
| `src/components/AuthModal.js` | Vanilla auth modal |
| `src/components/Sidebar.js` | Vanilla shell sidebar |
| `src/components/UploadPicker.js` | Vanilla upload helper |
| `src/components/LocalModelManager.js` | Old desktop local model UI |
| `src/components/CameraControls.js` | Old Vanilla UI helper |

## 5. Verification Requirements

Required after this cleanup:

```powershell
npm run vite:build
npm run test:studio-shell-smoke
npm run test:secrets-audit
```

The shell smoke now verifies that the desktop `Legacy` action is absent.

## 6. Follow-Up

The next closure tasks are:

1. DSK-73: Prepare release notes and migration summary.
2. DSK-62: Capture a final full Ubuntu desktop visual smoke when environment access is available.
3. DSK-69: Watch upstream PR #202 for review/merge or maintainer feedback.
