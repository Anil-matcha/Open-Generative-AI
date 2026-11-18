# Open Generative AI: Technical Documentation & Context

> **Last updated:** 2026-11-19
> **Version:** 2.0.0
> **Architecture:** Next.js 15 + React 19 + npm workspaces monorepo

This document serves as the authoritative knowledge base for the Open Generative AI project. It details the architecture, key components, API integration patterns, state management strategies, and contribution guidelines.

## 1. Project Vision & Overview

**Open Generative AI** is a free, open-source AI media generation studio — an alternative to paid platforms like Midjourney, Runway, Kling, and Luma.

- **Core Goal:** Provide unrestricted access to 579 AI models across 17 studios through a unified, self-hostable interface.
- **Current State:** v2.0.0 — fully operational with Image, Video, Audio, Lip Sync, Cinema, Workflow, Agent, Design Agent, and 10 additional studios. Desktop app available for macOS, Windows, and Linux.
- **Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v3, npm workspaces, Electron 33.
- **Repository:** `https://github.com/Anil-matcha/Open-Generative-AI`
- **Primary Branch:** `main`

## 2. Architecture & File Structure

The project is a **Next.js monorepo** with three git submodules and a shared component library.

```
Open-Generative-AI/
├── app/                              # Next.js App Router (v15)
│   ├── layout.js                     # Root layout (Tailwind, fonts, providers)
│   ├── page.js                       # Redirects → /studio
│   ├── studio/[[...slug]]/page.js    # Dynamic studio route
│   ├── agents/                       # Agent create/edit/chat pages
│   ├── workflow/[id]/                # Workflow builder pages
│   └── api/                          # API proxy routes
│       ├── api/v1/[[...path]]/       # Muapi API proxy
│       ├── workflow/[[...path]]/     # Workflow backend proxy
│       ├── agents/[[...path]]/       # Agent backend proxy
│       ├── v1/creative-agent/        # Design agent proxy
│       └── v1/upload-binary/         # Binary upload handler
│
├── components/                       # Next.js shell components
│   ├── StandaloneShell.js            # Tab navigation, API key, studio routing
│   └── ApiKeyModal.js                # API key entry modal
│
├── packages/
│   └── studio/                       # Shared React component library (MAIN PACKAGE)
│       └── src/
│           ├── index.js              # Exports all 17 studio components
│           ├── models.js             # 579 model definitions (34,971 lines)
│           ├── modelFamilies.js      # Model family groupings
│           ├── modelCapabilities.js  # Media capability detection
│           ├── modelParameters.js    # Supplemental parameter building
│           ├── muapi.js              # API client (fetch-based, submit+poll)
│           ├── imageSizing.js        # Image dimension calculations
│           ├── imageInputContracts.js # Multi-image input validation
│           ├── videoWorkflows.js     # Video workflow definitions
│           ├── videoToolCapabilities.js # Video tool parameter building
│           ├── groupedVideoModels.js # Grouped video model registry
│           ├── i18nUtils.js          # Locale resolution utilities
│           ├── persistKey.js         # API key persistence helpers
│           ├── vendor/               # Per-provider model definitions
│           │   ├── seedanceModels.js, seedanceParameters.js
│           │   ├── minimaxModels.js, minimaxParameters.js
│           │   ├── klingModels.js, klingParameters.js
│           │   ├── alibabaModels.js, alibabaParameters.js
│           │   ├── ltxModels.js, ltxParameters.js
│           │   ├── pixverseModels.js, pixverseParameters.js
│           │   ├── soraModels.js, soraParameters.js
│           │   ├── veoModels.js, veoParameters.js
│           │   ├── viduModels.js, viduParameters.js
│           │   ├── xaiModels.js, xaiParameters.js
│           │   └── happyHorseModels.js, happyHorseParameters.js
│           ├── components/           # 17 studio React components
│           │   ├── ImageStudio.jsx       (1,945 lines)
│           │   ├── VideoStudio.jsx       (3,458 lines)
│           │   ├── LayersStudio.jsx      (4,104 lines)
│           │   ├── LipSyncStudio.jsx     (1,225 lines)
│           │   ├── CinemaStudio.jsx      (1,313 lines)
│           │   ├── AudioStudio.jsx       (1,185 lines)
│           │   ├── ClippingStudio.jsx    (1,209 lines)
│           │   ├── MotionControlStudio.jsx (1,442 lines)
│           │   ├── VibeMotionStudio.jsx  (721 lines)
│           │   ├── RecastStudio.jsx      (1,297 lines)
│           │   ├── MarketingStudio.jsx   (1,011 lines)
│           │   ├── WorkflowStudio.jsx    (1,012 lines)
│           │   ├── AgentStudio.jsx       (643 lines)
│           │   ├── DesignAgentStudio.jsx (77 lines — thin wrapper)
│           │   ├── AiInfluencerStudio.jsx (793 lines)
│           │   ├── AppsStudio.jsx        (370 lines)
│           │   ├── McpCliStudio.jsx      (166 lines)
│           │   ├── DrawModal.jsx         (1,894 lines)
│           │   └── StudioErrorBoundary.jsx (Error isolation)
│           ├── components/prompt/    # Prompt composer sub-components
│           ├── messages/             # i18n JSON (en/ and zh/ — 32 files)
│           └── utils/                # Shared utilities
│
├── packages/Vibe-Workflow/           # Git submodule — workflow builder
├── packages/Open-Poe-AI/             # Git submodule — AI agents
├── packages/Open-AI-Design-Agent/    # Git submodule — design agent
│
├── electron/                         # Electron desktop app
│   ├── main.js                       # Main process (window, IPC)
│   ├── preload.js                    # Context bridge
│   └── lib/                          # Local inference engines
│       ├── localInference.js         # sd.cpp engine management
│       ├── wan2gpProvider.js         # Wan2GP provider registry
│       ├── wan2gpLocal.js            # Local Wan2GP execution
│       ├── wan2gpMcp.js              # Remote Wan2GP via MCP
│       └── modelCatalog.js           # Local model catalog
│
├── src/                              # LEGACY: Vanilla JS (Electron Vite SPA)
│   └── ...                           # Being phased out in favor of React
│
├── tests/                            # Test suite
│   ├── unit/                         # Unit tests (Vitest)
│   │   ├── models.test.js            # Model catalog integrity (83 tests)
│   │   └── muapi.test.js             # API client tests (9 tests)
│   ├── components/                   # Component tests (React Testing Library)
│   ├── fixtures/                     # Test fixtures
│   └── *.test.js                     # Electron Node.js tests (9 files)
│
├── .github/workflows/ci.yml          # CI/CD pipeline
├── middleware.js                      # Security headers, API proxy, locale
├── next.config.mjs                    # transpilePackages config
├── vitest.config.js                   # Test configuration
├── vite.config.mjs                    # Vite config (Electron SPA build)
└── package.json                       # Workspace root
```

## 3. Key Components & Logic

### `StandaloneShell.js` (The Shell)
- **Tab navigation:** 17 studios organized into 4 categories (Images, Video, Audio, Agents & Automation)
- **API key management:** localStorage-based, cookie sync, Axios interceptor
- **Balance polling:** 30-second interval balance refresh
- **Drag and drop:** Global file drop overlay for quick image/video upload
- **Error isolation:** Each studio wrapped in `StudioErrorBoundary` — a crash in one studio does not affect others
- **Generation notifications:** Toast-style success/error notifications with tab switching
- **Sidebar:** Collapsible, mobile-responsive drawer with category grouping
- **Routing:** Next.js App Router with `/studio/[tab]` dynamic segments, i18n support for `/zh/studio/[tab]`

### `models.js` (The Data — 34,971 lines)
- **Source of truth** for 579 AI models across 9 categories:
  - `t2iModels` (83 text-to-image models)
  - `t2vModels` (111 text-to-video models)
  - `i2iModels` (88 image-to-image models)
  - `i2vModels` (184 image-to-video models)
  - `v2vModels` (75 video-to-video models)
  - `lipsyncModels` (15 lip sync models)
  - `recastModels` (3 body swap/recast models)
  - `motionControlModels` (2 motion control models)
  - `audioModels` (18 audio/music models)
- Each model defines: `id`, `name`, `endpoint`, `inputs` schema (prompt, aspect_ratio, resolution, duration, etc.), `provider`, `provider_name`
- Some models use alternative field schemas (`videoField`, `imageField`, `hasPrompt`, `promptRequired`) instead of the standard `inputs` object
- Model lookup functions: `getModelById`, `getVideoModelById`, `getI2IModelById`, etc.

### `muapi.js` (The API Client — 1,045 lines)
- **Base URL:** `/api` (browser, proxied through Next.js) or `https://api.muapi.ai` (SSR/Electron)
- **Pattern:** Submit → Poll
  1. `POST /api/v1/{endpoint}` with prompt, params, and `x-api-key` header
  2. `GET /api/v1/predictions/{request_id}/result` every 2 seconds
  3. Stop when status is `completed`, `succeeded`, or `failed`
- **Functions:** `generateImage`, `generateI2I`, `generateVideo`, `generateI2V`, `processV2V`, `processRecast`, `processLipSync`, `generateAudio`, `runClipping`, `uploadFile` (XHR-based), `getUserBalance`, and 30+ more
- **File upload:** Uses XMLHttpRequest with progress tracking (not fetch)
- **Auth:** `x-api-key` header; 401/403 responses dispatch `muapi:auth-required` custom event

### Studio Components (17 total)
Each studio follows a consistent pattern:
1. Model selection (filtered by mode: t2i/i2i, t2v/i2v)
2. Parameter controls (aspect ratio, resolution, duration, quality — dynamic per model)
3. Media upload (image, video, audio — single or multi)
4. Prompt input (with model-specific examples)
5. Generate button → API call → Poll → Display result
6. History panel (localStorage-persisted, with download/revisit)

### `StudioErrorBoundary.jsx` (Error Isolation)
- React class component error boundary
- Catches render errors in individual studio tabs
- Shows user-friendly fallback with "Try Again" button
- Logs error details to console with studio identifier
- Prevents single-studio crash from white-screening the entire app

## 4. API Integration Details

### Authentication
- API key stored in `localStorage` under key `muapi_key`
- Passed as `x-api-key` header (NOT `Authorization: Bearer`)
- Synced to cookie `muapi_key` for server-side proxy requests
- Axios interceptor injects key into all relative/proxied requests

### Submit → Poll Lifecycle
```
User clicks Generate
  → submitGeneration(endpoint, payload, apiKey)
    → POST /api/v1/{endpoint}
    → Response: { request_id: "...", status: "pending" }
  → pollPrediction(requestId, apiKey)
    → GET /api/v1/predictions/{request_id}/result
    → Poll every 2s, max 60-900 attempts depending on model
    → Response: { status: "completed", output: { url: "..." } }
  → Display result, add to history
```

### File Upload
```
User selects file
  → uploadFile(apiKey, file, onProgress)
    → XHR POST /api/v1/upload_file (multipart/form-data)
    → onProgress(percent) called during upload
    → Response: { url: "https://cdn.muapi.ai/uploads/..." }
  → Pass returned URL to generation endpoint as image_url/video_url
```

### Multi-Image Input
For models supporting multiple reference images (up to 14):
- `images_list` array in payload instead of single `image_url`
- Upload picker supports multi-select with order badges
- `normalizePrimaryImageUrls()` handles both `images_list` and single `image_url` params

## 5. Local Inference (Desktop App Only)

### Engine 1: sd.cpp (bundled)
- C++ inference engine from stable-diffusion.cpp
- Supports: Z-Image Turbo, Z-Image Base, Dreamshaper 8, Realistic Vision v5.1, Anything v5, SDXL Base 1.0
- Metal GPU on Apple Silicon, CUDA/Vulkan/ROCm on Linux/Windows
- Stored in Electron's app data directory

### Engine 2: Wan2GP (BYO install)
- User-installed Python + PyTorch inference
- Supports: Wan 2.1/2.2, Hunyuan Video 1.5, LTX-2 Distilled, Flux.1 Dev, Qwen Image
- Can run on same machine or remote via MCP server
- Configured in Settings → Local Models

## 6. i18n / Localization

- **Supported languages:** English (`en`), Chinese (`zh`)
- **Message files:** 32 JSON files per language in `packages/studio/src/messages/{locale}/`
- **Resolution:** `resolveCopy(en, zh, locale)` returns the appropriate message bundle
- **Locale detection:** Middleware sets `x-locale` header based on URL path (`/zh/...` prefix)
- **Studio paths:** `localizeStudioPath(locale, tabId)` generates locale-aware URLs

## 7. Security

### Middleware Security Headers
- `X-Content-Type-Options: nosniff` — prevent MIME type sniffing
- `X-Frame-Options: DENY` — prevent clickjacking
- `X-XSS-Protection: 1; mode=block` — legacy XSS filter
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` — restricts script/style/image/media/font/connect sources

### API Key Handling
- Never sent to third-party domains (Axios interceptor checks URL)
- Stored in localStorage only (client-side)
- Synced to cookie for server-side proxy requests only
- Clear on logout: removes from localStorage and expires cookie

## 8. Desktop App (Electron)

- **Entry:** `electron/main.js` → loads Vite-built `dist/index.html`
- **Window:** 1440×900 default, min 1024×640, macOS hiddenInset titlebar
- **IPC:** `contextBridge` exposes local inference APIs to renderer
- **Local inference handlers:** Registered on app ready (`registerLocalInference()`, `registerWan2gp()`)
- **Build targets:** macOS (DMG, x64+arm64), Windows (NSIS, x64), Linux (AppImage+DEB, x64)
- **AppArmor:** DEB package ships AppArmor profile for Ubuntu 24.04+ sandbox compatibility

## 9. Testing

### Test Infrastructure
- **Framework:** Vitest v4 with jsdom environment
- **Component testing:** React Testing Library + user-event
- **Electron tests:** Node.js built-in test runner (`node --test`)
- **E2E:** Playwright (configured, tests in progress)
- **CI:** GitHub Actions workflow (`.github/workflows/ci.yml`)

### Test Categories
| Category | Location | Count | Status |
|----------|----------|-------|--------|
| Model catalog integrity | `tests/unit/models.test.js` | 83 tests | ✅ Passing |
| API client (muapi.js) | `tests/unit/muapi.test.js` | 9 tests | ✅ Passing |
| Electron local inference | `tests/*.test.js` | 9 files | ✅ Passing |
| Component tests | `tests/components/` | In progress | 🟡 |
| E2E tests | `tests/e2e/` | Planned | 🔴 |

### Running Tests
```bash
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:electron # Electron-specific tests
```

## 10. Known Gotchas & Fixes

- **Model ID collisions:** Some models intentionally appear in multiple categories (e.g., `flux-pulid` in both t2i and i2i). The test suite tracks these as known exceptions.
- **Enum defaults:** Some model input enums have default values not present in the enum list (e.g., ElevenLabs voice IDs). These are upstream data quality issues tracked by the test suite.
- **Alternative input schemas:** Not all models use the standard `inputs` object. Some use `videoField`, `imageField`, `hasPrompt`, etc. The model lookup functions handle both patterns.
- **`uploadFile` uses XHR:** Unlike other API functions that use `fetch`, file upload uses `XMLHttpRequest` for progress tracking.
- **Legacy `src/` directory:** Contains an older vanilla JS implementation used by the Vite/Electron build path. Being phased out.
- **Submodule initialization:** Must run `git submodule update --init --recursive` or `npm run setup` before first build.

## 11. Contribution Guidelines

### Adding a New Model
1. Add model definition to the appropriate array in `packages/studio/src/models.js`
2. Follow existing patterns for `id`, `name`, `endpoint`, `inputs`, `provider`
3. Run `npm test` to validate model catalog integrity
4. If the model requires new input types, add support in `modelParameters.js` or `imageSizing.js`

### Adding a New Studio
1. Create component in `packages/studio/src/components/`
2. Export from `packages/studio/src/index.js`
3. Add tab definition in `components/StandaloneShell.js` (TABS array)
4. Add to navigation category (NAVIGATION_CATEGORIES array)
5. Add i18n messages in `packages/studio/src/messages/en/` and `zh/`
6. Add error boundary wrapper in the render section

### Running Locally
```bash
git clone --recurse-submodules https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI
npm run setup     # Install deps + build workspace packages
npm run dev       # Next.js dev server → http://localhost:3000
# OR
npm run electron:dev  # Electron desktop app
```

## 12. Future Roadmap

- **Streaming API:** Replace polling with SSE/WebSocket for real-time generation progress
- **TypeScript migration:** Incremental migration starting with core types and API client
- **PWA support:** Service worker for offline generation queuing
- **Legacy code removal:** Phase out `src/` vanilla JS in favor of unified React implementation
- **Additional i18n:** Japanese, Korean, Spanish, French
- **Performance:** Model catalog tree-shaking, lazy-loaded studios, virtual scrolling
- **Accessibility:** WCAG 2.1 AA compliance audit and remediation
