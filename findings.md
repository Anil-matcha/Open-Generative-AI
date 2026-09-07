# Open Generative AI: Research Findings Report

**Date:** August 31, 2026  
**Repository:** Anil-matcha/Open-Generative-AI  
**License:** MIT  
**Version:** 2.0.0

---

## Executive Summary

Open Generative AI is an open-source, web-based (Vite + Next.js) and desktop (Electron) studio for AI-powered generative workflows. The project provides a multi-studio interface with image generation, video generation, lip sync, cinema tools, and workflow automation capabilities, all powered by the MuAPI backend (with optional local inference support via sd.cpp and Wan2GP).

**Key Strengths:**
- Modular, multi-studio architecture with shared component library
- Desktop + web deployment support
- Local model inference integration (offline-capable)
- Comprehensive model ecosystem (400+ models via MuAPI)
- MIT licensed, actively maintained

**Key Risks:**
- Heavy dependency on external MuAPI service (primary inference backend)
- Limited test coverage (only 4 test files)
- No CI/CD pipelines configured
- Complex monorepo with 3 git submodules requiring careful setup

---

## Repository Structure

### High-Level Layout
```
open-generative-ai/
├── src/                    # Main Vite frontend
│   ├── components/         # Studio components (14 .js files)
│   ├── lib/                # API clients, model definitions, utilities
│   └── main.js             # Entry point
├── packages/               # Monorepo workspaces (4 packages)
│   ├── studio/             # React component library (published to npm)
│   ├── Vibe-Workflow/      # Workflow builder submodule
│   ├── Open-Poe-AI/        # AI agent framework submodule
│   └── Open-AI-Design-Agent/ # Design agent submodule
├── electron/               # Desktop app shell (Electron main + preload)
├── build/                  # Build artifacts (includes local-ai binary staging)
├── docker-compose.yml      # Docker deployment config
├── vite.config.mjs         # Vite build configuration with MuAPI proxy
└── [next.config.mjs, package.json, Dockerfile]
```

### Core Package Count & Dependencies
- **Main workspace:** Next.js 15, React 19, Vite 5.4, Tailwind 3.4
- **Studio package:** Transpiles to Babel-compatible CommonJS, includes XyFlow (flowchart UI) and Reactflow
- **4 npm workspace packages** (including 3 git submodules)
- **~20 node_modules dependencies** in root package.json

---

## Key Components & Modules

### Frontend Studios (src/components/)

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **ImageStudio.js** | Text-to-Image & Image-to-Image generation UI | Model picker, prompt bar, history sidebar, generation loop |
| **VideoStudio.js** | Video generation (T2V, I2V, V2V) | Duration controls, aspect ratio picker, video queue |
| **CinemaStudio.js** | Professional video with camera/lens controls | Camera builder overlay, prompt engineering |
| **LipSyncStudio.js** | Audio-driven lip-sync animation | Upload picker for video/audio inputs |
| **WorkflowStudio.js** | Workflow/node-based automation | Integration with Vibe-Workflow package |
| **AgentStudio.js** | AI agent orchestration | Integration with Open-Poe-AI package |
| **McpCliStudio.js** | MCP CLI integration | Model execution via CLI |
| **LocalModelManager.js** | sd.cpp binary management UI | Download/delete model weights |
| **AuthModal.js** | API key capture & validation | localStorage persistence |
| **Header.js** | Navigation & studio picker | Auth status, settings access |

### API/Inference Layers (src/lib/)

| Module | Purpose | Dependencies |
|--------|---------|---|
| **muapi.js** | MuAPI backend client | Base URL routing, poll-based generation flow, image/video normalization |
| **models.js** | Model catalog & metadata | Re-exports from `packages/studio/src/models.js` |
| **localInferenceClient.js** | Local AI runtime wrapper | Wraps `window.localAI` (Electron IPC), supports sd.cpp & Wan2GP |
| **localModels.js** | Local model catalog (Z-Image, Dreamshaper, etc.) | Mirrors electron/lib/modelCatalog.js |
| **pendingJobs.js** | Job queue & localStorage sync | Persistent retry on app reload |
| **promptUtils.js** | Prompt augmentation & tagging | ENHANCE_TAGS, camera/lens presets |
| **i18n.js** | Internationalization | Text lookup via `t()` function |
| **uploadHistory.js** | Upload tracking | Meta about uploaded images |
| **uploadProxyTarget.js** | Multi-upload support | Proxies uploads to backend |

### Desktop/Electron Layer (electron/)

| Module | Purpose | IPC Bindings |
|--------|---------|---|
| **main.js** | Electron main process | App lifecycle, window creation, IPC setup |
| **preload.js** | IPC bridge to renderer | Exposes `window.localAI` for frontend |
| **localInference.js** | Coordinates sd.cpp spawning & communication | Stream parsing, progress events |
| **localInferenceRuntime.js** | Runtime process control & output parsing | Step parsing, ANSI stripping |
| **localInferencePaths.js** | Binary & model path resolution | Cross-platform paths (macOS/Windows/Linux) |
| **localInferenceAssets.js** | Asset download & staging | Mirrors to build/local-ai/ |
| **wan2gpProvider.js** | Wan2GP Gradio server integration | HTTP client to user-managed server |
| **wan2gpModelAvailability.js** | Model discovery for Wan2GP | Probing remote Gradio instances |
| **modelCatalog.js** | sd.cpp model definitions | Persistent state of installed weights |

---

## Setup & Run Instructions

### Prerequisites
- **Node.js:** 20.x LTS (required by Dockerfile)
- **npm:** 10.x+ (bundled with Node 20)
- **Git:** For submodule initialization
- **Optional:** Docker 24+, Electron dev tools (macOS Xcode, Windows Visual Studio Build Tools for native modules)

### Web Development Setup

**1. Clone and initialize submodules:**
```bash
git clone https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI
git submodule update --init --recursive
```

**2. Install dependencies and build sub-packages:**
```bash
npm install
npm run setup  # Installs + builds all workspace packages
# OR manually:
npm run build:packages
```

**3. Local dev server (Vite proxy to MuAPI):**
```bash
npm run dev
# Starts Vite on http://localhost:5173
# Proxy routes /api/* → https://api.muapi.ai
```

**4. Production build:**
```bash
npm run build
npm run start
# Runs Next.js production server on http://localhost:3000
```

### API Key & Environment

**MuAPI API Key Setup:**
1. Sign up at https://muapi.ai/
2. Get API key from dashboard
3. Open app → Settings → paste key
4. Key persists in `localStorage.muapi_key` (browser) or `window.__MUAPI_KEY__` (Electron)

**Optional Environment Variables:**
- `NODE_ENV=production` (set automatically in Docker/Electron builds)
- `MUAPI_BASE_URL` (computed at runtime in muapi.js; defaults to api.muapi.ai for production, localhost proxy for dev)

### Desktop App Setup (Electron)

**1. Build Vite app:**
```bash
npm run vite:build
```

**2. Run development mode:**
```bash
npm run electron:dev
# Opens Electron window with Vite output + IPC bridge
```

**3. Package installers:**
```bash
# macOS
npm run electron:build

# Windows
npm run electron:build:win

# Linux (AppImage + .deb)
npm run electron:build:linux
npm run package:linux:deb

# All platforms
npm run electron:build:all
```

**4. Stage local-ai binary:**
```bash
npm run stage-local-ai  # Downloads sd.cpp binary to build/local-ai/
```

**Binary Requirements:**
- sd.cpp binary (for local inference) is ~100-200 MB depending on arch
- Downloads on-demand; models (~2-5 GB each) download per-selection

### Docker Deployment

**Build & run:**
```bash
docker-compose up -d
# Container runs on http://localhost:3001
# NODE_ENV=production automatically set
```

**Dockerfile flow:**
1. Node 20 Alpine base
2. Copy package.json files (main + workspace packages)
3. `npm install` dependencies
4. `npm run build:packages` (builds all workspaces)
5. `npm run build` (Next.js build)
6. Production image copies `.next/`, `public/`, and `node_modules/`

---

## API Entry Points & Integration Patterns

### Generation Flow (Unified Pattern)

All studios follow **Poll-based request/result**:
```javascript
1. User submits prompt + model + params
2. POST /api/v1/{endpoint}  → { request_id, status: 'submitted' }
3. Loop: GET /api/v1/predictions/{id}/result every 2-5s
4. Until: status in ['completed', 'succeeded', 'failed']
5. Return: { url, ... } or error
```

### MuAPI Integration Points

**Image Generation:**
```javascript
POST /api/v1/flux-schnell             # T2I model endpoint
POST /api/v1/flux-pro                 # Higher-quality T2I
POST /api/v1/nano-banana-pro          # Precision image editing
GET  /api/v1/predictions/{id}/result  # Poll for result
```

**Video Generation:**
```javascript
POST /api/v1/kling-ai-pro             # T2V video model
POST /api/v1/luma-dream-machine        # Video with motion
GET  /api/v1/predictions/{id}/result   # Poll status
```

**Key Header:**
```javascript
'x-api-key': user_api_key  // NOT Bearer token
```

### Local Inference Entry Points

**sd.cpp (Bundled):**
- `window.localAI.getBinaryStatus()` → { exists, version }
- `window.localAI.downloadBinary()` → downloads sd.cpp binary
- `window.localAI.downloadModel(modelId)` → streams GGUF weights
- `window.localAI.generateImage(params)` → spawns subprocess, streams progress

**Wan2GP (User-managed server):**
- `window.localAI.wan2gp.probeServer(url)` → connectivity check
- `window.localAI.wan2gp.uploadFile(file)` → returns Gradio file descriptor
- `window.localAI.wan2gp.generate(params)` → POST to Gradio /api/predict

### Workflow/Agent APIs

**Vibe-Workflow:**
- Exposes node-graph builder UI
- Connects to workflow execution backend (TBD in this repo)

**Open-Poe-AI (Agent Framework):**
- Agent orchestration library
- Plugs into AgentStudio component

---

## Testing Infrastructure

### Test Files (4 total in /tests)

1. **localInferenceProgress.test.js** (66 lines)
   - Tests: ANSI stripping, progress parsing, step deduplication
   - Framework: Node.js built-in `test` module
   - Coverage: `stripAnsiSequences()`, `parseGenerationProgressChunk()`

2. **localInferencePaths.test.js**
   - Tests: Cross-platform path resolution for binaries/models

3. **localInferenceAssets.test.js**
   - Tests: Asset download & staging logic

4. **wan2gpModelAvailability.test.js**
   - Tests: Wan2GP server connectivity & model discovery

### CI/CD Status
- **No GitHub Actions workflows configured** (no `.github/workflows/` directory)
- **No linter configured** (eslint installed but no lint script in package.json)
- **No test runner in package.json** (tests manually runnable via `node tests/...test.js`)

### Running Tests Manually
```bash
node tests/localInferenceProgress.test.js
# Outputs test results; no assertion framework, just assert/strict
```

---

## Dependency Analysis

### Key Production Dependencies

| Dependency | Version | Purpose | Risk Level |
|------------|---------|---------|-----------|
| **next** | ^15.0.0 | React framework (can be optional if using Vite only) | LOW — stable, widely-used |
| **react** | ^19.0.0 | UI library | LOW |
| **vite** | ^5.4.0 | Build tool (primary for desktop) | LOW — modern tooling |
| **tailwindcss** | ^3.4.0 | Styling | LOW |
| **axios** | ^1.7.0 | HTTP client (for MuAPI & uploads) | MEDIUM — used in critical path |
| **@xyflow/react** | ^12.10.2 | Workflow node graph UI | MEDIUM — third-party visual component |
| **react-hot-toast** | ^2.4.1 | Toast notifications | LOW |
| **electron** | ^33.4.11 | Desktop app shell | MEDIUM — native module compilation |
| **electron-builder** | ^25.1.8 | App packaging | MEDIUM — complex config |

### Submodule Dependencies

| Submodule | Purpose | Maintenance Risk |
|-----------|---------|------------------|
| `packages/Vibe-Workflow` | Workflow builder UI | Owned by SamurAIGPT; external maintenance |
| `packages/Open-Poe-AI` | Agent framework | Owned by Anil-matcha; tightly coupled |
| `packages/Open-AI-Design-Agent` | Design automation | Owned by Anil-matcha; new/experimental |

### Known Dependency Issues

1. **Electron native bindings**: Requires compilation of native modules (sqlite3, node-gyp, etc.) on macOS/Windows/Linux.
2. **Tailwind v3 vs v4**: Mixed use — root uses v4, studio package uses v3. Potential CSS collision.
3. **Babel transpilation**: Studio package uses Babel for React compatibility; adds build step.
4. **MuAPI hard-coded**: No fallback inference engine; requires working internet + API key for all T2I/V generation.

### Vulnerability Check

- No `npm audit` results provided; audit should be run before production deployment
- API key exposure risk: localStorage is XSS-vulnerable; should consider secure storage (e.g., Electron secure storage, or server-side proxy)

---

## CI/CD & Deployment

### Current State
- ❌ **No GitHub Actions workflows**
- ❌ **No automated tests on PR/push**
- ❌ **No linting enforcement**
- ✅ **Docker builds supported** (compose + Dockerfile included)
- ✅ **Electron packaging scripts** (npm run electron:build:*)

### Failure Points

1. **Missing Submodules**
   - Error: `Cannot find module 'studio'`
   - Fix: `git submodule update --init --recursive`

2. **Node Version Mismatch**
   - Error: Native module compilation fails
   - Fix: Use Node 20.x (see Dockerfile)

3. **API Key Missing**
   - Error: "API Key missing. Please set it in Settings."
   - User must provide MuAPI credentials

4. **Wan2GP Server Unavailable**
   - Local model inference silently falls back to MuAPI
   - Error: generation fails if MuAPI also unavailable

5. **Binary Download Failure**
   - sd.cpp binary may not download on first run
   - Fix: Manual retry via "Download Binary" in LocalModelManager

---

## Licensing & Third-Party Services

### Project License
- **MIT License** — permissive, allows commercial use with attribution

### Third-Party Service Dependencies

| Service | Purpose | SLA | Authentication |
|---------|---------|-----|---|
| **MuAPI** | Primary inference backend | No public SLA | API key (header: x-api-key) |
| **Muapi.ai (hosted version)** | Turnkey deployment option | Commercial SLA available | MuAPI key |

### Trademark/Branding Notes
- **"Nano Banana Pro"** is MuAPI-specific model branding
- **"Open Generative AI"** is the project's own branding
- White-label option available via MuAPI (mentioned in README)

### Attribution Requirements
- Include MIT license text in distributions
- Credit "Open Generative AI Contributors" and "MuAPI" in docs/UI

---

## Known Gotchas & Common Issues

### Development

1. **Proxy routing in Vite dev mode**
   - `/api/*` proxies to `https://api.muapi.ai` (see vite.config.mjs)
   - Production (Next.js) disables proxy; uses full URL

2. **Model picker resolution logic**
   - Only shows resolution controls if model has `enum` values in schema
   - Flux models hide resolution (handled server-side)

3. **Textarea auto-grow**
   - Prompt input has max-height cap; scrolls if > 120px
   - Fixed in earlier commit `bf2efdb`

4. **History persistence**
   - Stored in `localStorage['muapi_history']`
   - Shared across browser tabs (single key)
   - No server sync; lost on browser clear

### Deployment

1. **Next.js vs Vite confusion**
   - Root uses Next.js (for web/SSR)
   - Desktop app uses Vite (faster build, simpler)
   - Avoid mixing configs; keep separate

2. **Electron binary staging**
   - `npm run stage-local-ai` must run *before* packaging
   - Otherwise desktop app ships without sd.cpp support

3. **macOS notarization**
   - App is not Apple-notarized; users must remove Gatekeeper blocks manually:
     ```bash
     xattr -cr "/Applications/Open Generative AI.app"
     ```

---

## Prioritized Next Steps (Effort Estimates)

### Priority 1: CI/CD Pipeline & Testing (3–5 days)
**Objective:** Prevent regressions, reduce manual QA burden.

**Tasks:**
1. Set up GitHub Actions workflow (`test.yml`):
   - Run all 4 tests on PR/push
   - Build both web (Next.js) and desktop (Vite + Electron)
   - Run ESLint (create `.eslintrc`)
   
2. Add pre-commit hook for linting:
   - Install `husky` + `lint-staged`
   - Block commits with linting errors

3. Expand test coverage:
   - Add tests for `muapi.js` (mock API calls)
   - Test model picker logic (aspect ratio resolution)
   - Test localStorage persistence in ImageStudio

**Files to create/modify:**
- `.github/workflows/test.yml` (new)
- `.github/workflows/build.yml` (new)
- `.eslintrc.json` (new)
- `.husky/pre-commit` (new)
- `tests/muapi.test.js` (new)
- `tests/imageStudio.test.js` (new)

**Why:** Catch bugs before release; reduce deployment risk. Current manual testing is error-prone.

---

### Priority 2: API Key Security & Settings Panel (2–3 days)
**Objective:** Reduce XSS/credential leak risk; improve UX for multi-user machines.

**Tasks:**
1. Move API key from `localStorage` to secure storage:
   - Electron: Use `electron-safe-storage` (ipcMain handler)
   - Web: Add server-side credential proxy (optional backend)
   
2. Enhance SettingsModal:
   - Show masked key (***...***) when set
   - "Revoke" button to clear
   - "Test connection" button (ping MuAPI)
   - Toggle for "remember key" (default: false for shared machines)

3. Add environment variable fallback:
   - Support `MUAPI_API_KEY` env var in Electron
   - Useful for automation/CI

**Files to modify:**
- `src/components/SettingsModal.js`
- `src/lib/muapi.js` (add env var fallback)
- `electron/preload.js` (add secure storage IPC)
- `electron/main.js` (add secure storage handler)

**Why:** Security best practice; current localStorage is vulnerable to XSS. Improves multi-user experience.

---

### Priority 3: Documentation & Examples (2–3 days)
**Objective:** Reduce onboarding friction; attract contributors.

**Tasks:**
1. Create CONTRIBUTING.md:
   - Local setup walkthrough
   - Architecture overview
   - Code style guide

2. Add API documentation:
   - MuAPI endpoint reference (image, video, lip sync)
   - Model parameter schema (aspect ratios, resolutions, durations)
   - Error codes & troubleshooting

3. Create example workflows:
   - "Batch image generation" (script that uses muapi.js directly)
   - "Local inference quickstart" (Electron + sd.cpp minimal example)
   - "Custom model addition" (how to add Wan2GP models to catalog)

4. Update README:
   - Add "Architecture" section
   - Link to API docs & CONTRIBUTING.md
   - Add troubleshooting section (common errors)

**Files to create/modify:**
- `CONTRIBUTING.md` (new)
- `docs/API.md` (new)
- `docs/ARCHITECTURE.md` (new)
- `docs/EXAMPLES.md` (new)
- `README.md` (expand)

**Why:** High ROI; enables community contributions and reduces support burden. Minimal code changes.

---

## One-Page Quickstart Guide

### For Web Users (Browser)

```bash
# 1. Clone repo
git clone https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI

# 2. Set up (takes ~3 min)
npm run setup

# 3. Start local server
npm run dev
# → Open http://localhost:5173

# 4. Set API key in app Settings (get key from https://muapi.ai/)

# 5. Generate images! Enter prompt, pick model, click "Generate"
```

**Troubleshooting:**
- "API Key missing" → Settings → paste key from MuAPI dashboard
- Build fails → `rm -rf node_modules && npm install`
- Submodules missing → `git submodule update --init --recursive`

---

### For Desktop Users (Electron)

```bash
# 1. Clone & setup (same as above)
git clone https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI
npm run setup

# 2. Build desktop app
npm run electron:build   # macOS
npm run electron:build:win   # Windows
npm run electron:build:linux  # Linux

# 3. Run installer (.dmg, .exe, .AppImage)
# → Open app, set MuAPI key in Settings

# Optional: Download local model
# → LocalModelManager tab → "Download" → select Z-Image
# → Generate without internet (requires ~5 GB disk space)
```

**System Requirements:**
- macOS 12+, Windows 10+, or Linux (Ubuntu 20.04+)
- 4 GB RAM (8 GB for local models)
- 10 GB disk (for local model weights)

---

### For Docker Deployment

```bash
# 1. Build & start
docker-compose up -d

# 2. Access at http://localhost:3001
# (Configure API key in web UI)

# 3. Logs
docker-compose logs -f

# 4. Stop
docker-compose down
```

---

## Summary

**Open Generative AI** is a well-architected, feature-rich AI creative studio with solid foundations. The monorepo design (Vite + Next.js + Electron), modular studios, and local inference support demonstrate mature engineering. However, the lack of CI/CD, limited test coverage, and hard dependency on MuAPI present risks for production deployments. The three prioritized next steps (CI/CD, security hardening, documentation) address these gaps while building contributor velocity.

**Recommended first action:** Fork/deploy via MuAPI White Label for immediate monetization, then tackle CI/CD in parallel to unblock community PRs.

---

**Report prepared:** August 31, 2026  
**Reviewer:** Copilot CLI Research Agent  
**Repository commit:** [Current HEAD]
