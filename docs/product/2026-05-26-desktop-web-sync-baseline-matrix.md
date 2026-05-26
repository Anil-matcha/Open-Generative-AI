# Desktop/Web Sync Baseline and Acceptance Matrix

Date: 2026-05-26
Task: DSK-00
Branch snapshot: `codex/internal-multimodal-lab`
Commit snapshot: `2f28c3d`

## 1. Freeze Notes

This baseline freezes the observable architecture and acceptance targets for the desktop/Web optimization migration.

The working tree was not fully clean at the time of this freeze. `git status --short` reported 53 entries before DSK-00 implementation. Those entries are treated as pre-existing workspace state for this task sequence. This document freezes the product and technical baseline, not a revert point.

Post-migration note: after DSK-70, the active desktop renderer is `src/desktop/main.js` and the old Vanilla `src/main.js` / `src/components/*.js` fallback has been removed. The table below retains the DSK-00 starting baseline and marks the current post-cleanup state where it differs.

## 2. Current Runtime Baseline

| Runtime | Current entry | Technology | Build command | Notes |
|---|---|---|---|---|
| Web | `app/**` | Next.js 15, React 19 | `npm run build` | Optimized product surface lives in Next routes and shared Studio package. |
| Shared Studio | `packages/studio/src/**` | React components and provider helpers | `npm run build -w studio` | Contains Image, Video, Marketing, Workflow, Agent, Apps, API Provider, and API Health surfaces. |
| Desktop main | `electron/main.js` | Electron main process | `npm run electron:dev` | Loads static `dist/index.html`, registers local inference and Wan2GP IPC handlers. |
| Desktop preload | `electron/preload.js` | Electron context bridge | Included in Electron app | Exposes `window.localAI` for sd.cpp and Wan2GP. |
| Desktop renderer | `src/desktop/main.js` | Vite plus React | `npm run vite:build` | Current active renderer after DSK-70; old Vanilla fallback removed. |

## 3. Web API Route Baseline

| Route family | Current Web source | Desktop status | Target desktop behavior |
|---|---|---|---|
| `/api/api/v1/*` | `app/api/api/v1/[[...path]]/route.js` | Missing at static Electron runtime | Local desktop proxy forwards submit, poll, and provider-compatible generation requests. |
| `/api/provider/v1/*` | `app/api/provider/v1/[[...path]]/route.js` | Missing at static Electron runtime | Local desktop proxy forwards provider-specific requests with secure header handling. |
| `/api/provider/upload` | `app/api/provider/upload/route.js` | Missing at static Electron runtime | Desktop upload adapter returns usable remote URLs or normalized errors. |
| `/api/provider/status` | `app/api/provider/status/route.js` | Missing at static Electron runtime | Desktop status endpoint supports API health checks. |
| `/api/workflow/*` | `app/api/workflow/[[...path]]/route.js` | Missing at static Electron runtime | Desktop proxy supports workflow list, detail, and execution flows or capability-aware limitations. |
| `/api/agents/*` | `app/api/agents/[[...path]]/route.js` | Missing at static Electron runtime | Desktop proxy supports agent list, chat, create/edit flows or capability-aware limitations. |
| `/api/app/*` | `app/api/app/[[...path]]/route.js` | Missing at static Electron runtime | Desktop proxy supports app center read/write flows or explicit desktop limitation responses. |
| `/api/yunwu/v1/*` | `app/api/yunwu/v1/[[...path]]/route.js` | Missing at static Electron runtime | Desktop proxy preserves Yunwu/OpenAI-compatible provider behavior. |

## 4. Feature Parity Matrix

| Feature | Current Web source | Current desktop source | Gap | Target acceptance |
|---|---|---|---|---|
| Shell navigation | `components/StandaloneShell.js`, `app/studio/[[...slug]]/page.js` | `src/desktop/DesktopApp.js` | Shared shell now active on desktop | Desktop React shell can navigate the same Studio surfaces without Next router assumptions. |
| Image Studio | `packages/studio/src/components/ImageStudio.jsx` | `packages/studio/src/components/ImageStudio.jsx` through `src/desktop/DesktopApp.js` | Shared implementation active | Desktop renders shared Image Studio and preserves sd.cpp local generation through a runtime adapter. |
| Video Studio | `packages/studio/src/components/VideoStudio.jsx` | `packages/studio/src/components/VideoStudio.jsx` through `src/desktop/DesktopApp.js` | Shared implementation active | Desktop renders shared Video Studio and preserves Wan2GP generation/upload/cancel flows. |
| Marketing Studio | `packages/studio/src/components/MarketingStudio.jsx` | No equivalent active Vanilla module | Web-only optimized surface | Desktop exposes Marketing Studio through shared package and provider proxy. |
| Workflow Studio | `packages/studio/src/components/WorkflowStudio.jsx` | `packages/studio/src/components/WorkflowStudio.jsx` through `src/desktop/DesktopApp.js` | Shared implementation active | Desktop supports workflow list/detail/execution or clear provider limitation states. |
| Agent Studio | `packages/studio/src/components/AgentStudio.jsx` | `packages/studio/src/components/AgentStudio.jsx` through `src/desktop/DesktopApp.js` | Shared implementation active | Desktop supports agent list/chat/create/edit or clear provider limitation states. |
| Apps Studio | `packages/studio/src/components/AppsStudio.jsx` | No equivalent active Vanilla module | Web-only surface | Desktop exposes app center through shared package and desktop API proxy. |
| API Provider Management | `packages/studio/src/components/ApiProviderStudio.jsx`, `packages/studio/src/apiProviders.js` | No equivalent active Vanilla module | Web-only provider management | Desktop can create, edit, switch, export, and persist API provider configs. |
| API Health | `packages/studio/src/components/ApiHealthStudio.jsx` | No equivalent active Vanilla module | Web-only diagnostics | Desktop health page calls desktop status endpoint and reports provider/model readiness. |
| Local model management | `packages/studio/src/components/LocalModelManager.jsx`, `electron/lib/localInference.js` | Desktop-only runtime exposed to shared UI | Shared component with Electron-only capabilities | Shared components receive optional `localRuntime` capabilities only in Electron. |

## 5. Acceptance Smoke Matrix

| Area | Smoke test | Required evidence |
|---|---|---|
| DSK-10 React entry | `npm run vite:build` succeeds after `index.html` points at `src/desktop/main.js` | Build output includes `dist/index.html` and bundled assets. |
| Legacy fallback | Removed in DSK-70 | Shell smoke verifies the `Legacy` action is absent. |
| Desktop load | Electron can load `dist/index.html` | No blank screen; renderer boot failure logs are absent. |
| API proxy design | Decision doc compares local HTTP server, IPC-only, and fetch interception | Chosen approach has security, packaging, and migration notes. |
| Provider secrets | Proxy design redacts credentials and avoids bundling secrets | No API key appears in logs or static assets. |
| Web regression guard | Web build remains a required later gate after shared shell extraction | `npm run build` is reserved for DSK-23/DSK-65 because current tasks only touch Vite desktop entry. |
| Local inference guard | sd.cpp and Wan2GP IPC handlers remain registered | `electron/main.js` still calls `registerLocalInference()` and `registerWan2gp()`. |

## 6. DSK-00 Result

DSK-00 is complete when this matrix exists and subsequent task reports use it as the acceptance reference.

Next tasks:

1. DSK-10: Add React desktop renderer entry under `src/desktop`.
2. DSK-30: Decide desktop proxy transport design.
3. DSK-11: Configure Vite aliases and workspace imports for `packages/studio`.
