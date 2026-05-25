# Desktop Legacy Renderer Archive Readiness

Date: 2026-05-26
Scope: DSK-70 readiness check for removing or archiving old Vanilla JS desktop studios.

## 1. Current State

The React desktop renderer is now the default active path:

- `index.html` loads `/src/desktop/main.js`.
- `src/desktop/DesktopApp.js` imports shared React Studio components from `packages/studio/src/components`.
- `vite.config.mjs` aliases `@studio` to `packages/studio/src`.

The old Vanilla renderer is still reachable as a fallback:

- `src/desktop/main.js` imports `../main.js` when `?renderer=legacy` is present.
- `src/desktop/electronStudioAdapter.js` exposes `openLegacyRenderer()`.
- `src/desktop/DesktopApp.js` renders a `Legacy` button that navigates to that fallback.

Because this fallback is still active, DSK-70 should not delete the old Vanilla implementation until DSK-63 and DSK-67 finish the macOS/CI packaging gates.

## 2. Legacy Files In Scope

These files are only referenced by the legacy renderer path in current source searches:

| File | Role | Proposed DSK-70 action |
|---|---|---|
| `src/main.js` | Vanilla renderer entry and router | Archive or delete after fallback removal |
| `src/components/Header.js` | Vanilla shell header | Archive or delete |
| `src/components/ImageStudio.js` | Duplicated Vanilla image studio | Archive or delete |
| `src/components/VideoStudio.js` | Duplicated Vanilla video studio | Archive or delete |
| `src/components/CinemaStudio.js` | Duplicated Vanilla cinema studio | Archive or delete |
| `src/components/LipSyncStudio.js` | Duplicated Vanilla lip sync studio | Archive or delete |
| `src/components/WorkflowStudio.js` | Vanilla workflow placeholder | Archive or delete |
| `src/components/AgentStudio.js` | Vanilla agent placeholder | Archive or delete |
| `src/components/McpCliStudio.js` | Vanilla MCP CLI studio | Archive or delete |
| `src/components/SettingsModal.js` | Vanilla settings modal | Archive or delete if no non-legacy references remain |
| `src/components/AuthModal.js` | Vanilla auth modal | Archive or delete if no non-legacy references remain |
| `src/components/Sidebar.js` | Vanilla shell sidebar | Archive or delete if no non-legacy references remain |
| `src/components/UploadPicker.js` | Vanilla upload helper | Archive or delete if no non-legacy references remain |
| `src/components/LocalModelManager.js` | Old desktop local model UI | Archive or delete after confirming `packages/studio/src/components/LocalModelManager.jsx` covers the active path |
| `src/components/CameraControls.js` | Old Vanilla UI helper | Archive or delete if no non-legacy references remain |

## 3. Required Code Changes

When the packaging gates pass, DSK-70 should:

1. Remove `?renderer=legacy` handling from `src/desktop/main.js`.
2. Remove `openLegacyRenderer()` from `src/desktop/electronStudioAdapter.js`.
3. Remove the `Legacy` button from `src/desktop/DesktopApp.js`.
4. Move old Vanilla files into an archive directory or delete them outright.
5. Update docs that still describe `src/main.js` and `src/components/*.js` as recoverable fallback paths.

## 4. Verification

Required after DSK-70 edits:

```powershell
npm run vite:build
npm run test:studio-shell-smoke
npm run test:secrets-audit
```

Packaging verification should then be rerun through the Desktop Packaging workflow because removing the fallback changes the packaged renderer bundle.

## 5. Current DSK-70 Decision

DSK-70 is ready to execute but remains gated.

Do not remove the fallback until:

- DSK-67 runs the Desktop Packaging workflow against a remote branch.
- DSK-63 has macOS DMG build evidence.
- The team accepts that the legacy renderer is no longer needed as a rollback path.

