# MozenAIGC: Technical Documentation & Context

This document is the working knowledge base for the MozenAIGC project. It describes the current shared Web/Desktop architecture, core runtime boundaries, API integration patterns, and known operational constraints.

## 1. Project Vision & Overview

**MozenAIGC** is an open-source AI image, video, workflow, agent, and app studio. The product goal is to keep the optimized Web experience and the local Electron desktop client on the same shared implementation path while preserving desktop-only local inference.

- **Core Goal:** Build a feature-complete, self-hostable creative AI studio with image generation, video generation, workflow orchestration, agent surfaces, app templates, API provider management, and local inference where available.
- **Current State:** The Web app and Electron desktop renderer now share the React `packages/studio` workspace package. The old Vanilla desktop renderer under `src/main.js` and `src/components/*.js` has been removed from the active path.
- **Desktop Scope:** Current active packaging and verification scope is Windows/Linux. macOS packaging, signing, notarization, and clean-account launch validation are deferred until real macOS account/hardware access is available again.
- **Repository:** `https://github.com/Anil-matcha/Open-Generative-AI`
- **Primary Branch:** `main`

## 2. Architecture & File Structure

The repo is a Next.js + Electron monorepo with a shared React Studio package.

```tree
app/
├── api/                         # Next.js API routes for Web runtime
├── codex-lab/                   # Web-only Codex Lab surface
└── studio/[[...slug]]/page.js    # Web Studio route family

components/
├── StandaloneShell.js            # Web shell adapter around shared Studio surfaces
└── ApiKeyModal.js                # Web API key modal

packages/studio/src/
├── components/
│   ├── StudioShell.jsx           # Shared shell layout
│   ├── TaskCenter.jsx            # Shared generation history/task center
│   ├── ImageStudio.jsx
│   ├── VideoStudio.jsx
│   ├── MarketingStudio.jsx
│   ├── WorkflowStudio.jsx
│   ├── AgentStudio.jsx
│   ├── AppsStudio.jsx
│   ├── ApiProviderStudio.jsx
│   ├── ApiHealthStudio.jsx
│   └── LocalModelManager.jsx
├── apiProviders.js               # Provider defaults, normalization, redaction
├── localRuntime.js               # Optional desktop local runtime adapter helpers
├── models.js                     # Model metadata and endpoint source of truth
├── muapi.js                      # Provider API client helpers
└── useApiProviderState.js        # Shared provider persistence hook

src/desktop/
├── main.js                       # Vite React renderer entry
├── DesktopApp.js                 # Electron shell wiring for shared Studio tabs
└── electronStudioAdapter.js      # Electron routing, storage, cookies, API rewrite

electron/
├── main.js                       # Electron main process
├── preload.js                    # contextBridge for localAI and desktopAPI
└── lib/
    ├── desktopApiProxy.js        # Local HTTP proxy for Web-style /api/** calls
    ├── localInference.js         # sd.cpp runtime registration
    └── wan2gpProvider.js         # Wan2GP bridge/probing
```

## 3. Runtime Boundaries

### Web

- Runs on Next.js App Router.
- Uses `components/StandaloneShell.js` as the Web adapter.
- Calls local Next API routes under `app/api/**`.
- Stores provider/task state in browser storage and cookies through the shared adapter contract.

### Desktop

- Runs Electron main/preload plus a Vite React renderer.
- Loads shared Studio components through `src/desktop/DesktopApp.js`.
- Uses `electron/lib/desktopApiProxy.js` to provide local HTTP equivalents for required Web `/api/**` route families.
- Rewrites renderer `/api/**` calls in `src/desktop/electronStudioAdapter.js` and attaches the desktop proxy token header.
- Exposes optional local inference through `window.localAI` and `packages/studio/src/localRuntime.js`.

## 4. API Integration Pattern

Remote provider work still follows the submit/poll model:

1. Submit a provider request through a Web route or desktop proxy route.
2. Receive a `request_id` or normalized task response.
3. Poll until the provider returns `completed`, `succeeded`, or `failed`.
4. Normalize outputs into task records consumed by the shared task center.

Provider secrets must remain in user-controlled storage and request headers. They must not be logged, bundled into static assets, or committed into docs/test fixtures.

## 5. Local Inference

Desktop local inference is optional and capability-driven:

- `sd.cpp` is exposed through the local runtime adapter when installed/configured.
- Wan2GP is treated as a user-managed Gradio server and reached through the Electron bridge.
- Shared Studio components must degrade clearly when `localRuntime` capabilities are unavailable.
- Current active verification priority is Windows/Linux. macOS-specific Metal packaging and launch checks are deferred.

## 6. Development Setup

Common commands:

```powershell
npm run setup
npm run dev
npm run electron:dev
npm run vite:build
npm run build
```

Important verification commands:

```powershell
npm run test:api-providers
npm run test:desktop-api-proxy
npm run test:studio-shell-smoke
npm run test:secrets-audit
```

Packaging commands:

```powershell
npm run electron:build:win
npm run electron:build:linux
npm run electron:build:all
```

`electron:build:all` currently targets Windows and Linux only.

## 7. Known Gotchas & Fixes

- **Desktop API proxy:** The Electron renderer is static, so Web `/api/**` calls require the local proxy and token rewrite.
- **Provider secrets:** Use the secrets audit after Web/Desktop builds and package creation.
- **Workflow package assets:** Packaging CI must build the workflow workspace before Electron packaging so generated assets exist.
- **Linux packaging:** AppImage/DEB verification should be run on Linux or CI. Docker `xvfb` smoke confirms launch survival but a full Ubuntu desktop visual smoke is still useful.
- **Legacy renderer:** The old Vanilla desktop fallback has been removed. New desktop changes should target `packages/studio` plus `src/desktop`.

## 8. Current Roadmap Focus

- Keep Web and desktop UI changes in `packages/studio` by default.
- Keep runtime-specific behavior behind adapters.
- Finish release notes and migration summary for the shared renderer migration.
- Track remaining active-scope release checks in `docs/product/2026-05-26-desktop-web-sync-progress-ledger.md`.
