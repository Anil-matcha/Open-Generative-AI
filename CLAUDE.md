# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Open Generative AI is a self-hosted AI image/video/audio/lip-sync generation studio. It ships two ways from the same codebase: a hosted Next.js web app and an Electron desktop app (Vite-bundled renderer). Both are thin UI shells around a shared component library (`packages/studio`) that talks to the Muapi.ai model API gateway.

## Repo layout — two apps, one shared library

- `app/`, `components/`, `middleware.js`, `next.config.mjs` — the **Next.js web app** (App Router). `components/StandaloneShell.js` is the tab-nav shell that renders studio components and handles the BYOK API key flow (localStorage). `middleware.js` rewrites `/api/v1/*` (except routes with dedicated handlers under `app/api/v1/`) to `https://api.muapi.ai` and adds security headers to every response.
- `src/`, `electron/`, `vite.config.mjs` — the **Electron desktop app**. `src/main.js` is the Vite renderer entry point; `electron/main.js`/`electron/preload.js` are the main process. `electron/lib/` contains local-inference engine glue (sd.cpp and Wan2GP — see below).
- `packages/studio/` — an npm workspace, the **shared React component library** consumed by both apps (and by the hosted muapi.ai site). This is where most feature work happens.
  - `src/models.js` — single source of truth for all 400+ model definitions (also the largest file in the repo — grep rather than read it whole).
  - `src/muapi.js` — the API client (named exports, `apiKey` passed as first param to each function).
  - `src/modelFamilies.js`, `src/modelCapabilities.js`, `src/modelParameters.js`, `src/imageInputContracts.js`, `src/videoToolCapabilities.js`, `src/videoWorkflows.js` — model metadata/capability tables consumed by the studio components to decide which controls to render.
  - `src/components/*Studio.jsx` — one component per creative mode (Image, Video, Audio, LipSync, Cinema, Clipping, Workflow, Agent, DesignAgent, Marketing, VibeMotion, Recast, AiInfluencer, Apps, McpCli).
- `packages/Vibe-Workflow`, `packages/Open-Poe-AI`, `packages/Open-AI-Design-Agent` — **git submodules**, each its own repo (workflow-builder, ai-agent, design-agent packages respectively). Consumed via `file:` deps and Next's `transpilePackages`. Don't expect these to be present unless the repo was cloned with `--recurse-submodules` / `git submodule update --init --recursive`.

Model updates in `packages/studio/src/models.js` propagate to both the self-hosted app and the hosted muapi.ai site — treat that file as a shared contract, not local-only.

## Commands

```bash
# First-time setup (submodules + install + build workspace packages) — required before either dev script works
npm run setup

# Web app (Next.js) → http://localhost:3000
npm run dev

# Desktop app (Electron + Vite)
npm run electron:dev

# Production web build
npm run build && npm run start

# Lint
npm run lint

# Tests (Node's built-in test runner, not Jest)
npm test
node --test tests/localInferencePaths.test.js   # single file

# Build one workspace package after editing it (studio/workflow/agent/design)
npm run build:studio
npm run build:packages   # all of them, in dependency order
```

If `npm run dev` fails with `Couldn't find a 'pages' directory`, it means the submodules weren't cloned/built — re-run `npm run setup`. Likewise, `npm run build` will fail with `Module not found: Can't resolve 'ai-agent/dist/tailwind.css'` (and similar) if `npm install` was run without `npm run build:packages` afterward — the workspace packages need their `dist/` built before Next can resolve them.

Tests live under `tests/` and target `electron/lib/*` (local inference path resolution, model availability, progress parsing) using `node:test` + `node:assert/strict`. The root `test` script runs `node --test tests/*.test.js` (a glob) rather than `node --test tests/` (the bare directory) — the directory form reproducibly fails with `MODULE_NOT_FOUND` on Node 26/Windows in this repo, so use the glob form (or `npm test`) rather than pointing bare at the directory.

## Architecture notes

**Two-step API pattern.** Every generation flow (image, video, lip sync) follows submit → poll: `POST /api/v1/{model-endpoint}` returns a `request_id`, then `GET/POST /api/v1/predictions/{request_id}/result` is polled until `status` is `completed`/`succeeded`/`failed`. `muapi.js` normalizes the varying response shapes so callers always get a populated `url`. Auth is the `x-api-key` header, not `Authorization: Bearer`.

**Two independent local inference engines** (desktop app only, see `electron/lib/`):
- **sd.cpp** — bundled C++ engine, runs in-process on the user's machine (Metal on Apple Silicon, CUDA/Vulkan/ROCm elsewhere). Image models only.
- **Wan2GP** — the app is only an HTTP client; the user runs their own Wan2GP Python server on a CUDA/ROCm GPU box and points the app at its URL. Handles video models and larger image models that sd.cpp can't.

Local-ai data (engine binaries, model weights, tmp downloads) resolves via `electron/lib/localInferencePaths.js` under the Electron user-data dir by default, overridable with the `OPEN_GENERATIVE_AI_LOCAL_AI_DIR` env var — this is what `tests/localInferencePaths.test.js` exercises.

**Web app API routing.** `middleware.js` transparently proxies `/api/v1/*` to `api.muapi.ai` except paths with a dedicated route handler (`app/api/v1/creative-agent`, `get_upload_url`, `upload-binary`) — check there before assuming a new `/api/v1/...` path needs a custom route. `app/api/{agents,app,workflow}/[[...path]]` are catch-all proxy routes for the other API surfaces.

**Dev-mode CORS.** The Vite (Electron) build proxies `/api` to `https://api.muapi.ai` via `vite.config.mjs`; `muapi.js` branches on `import.meta.env.DEV` to pick the proxied relative path vs. the full production URL.

**Path aliases** (`jsconfig.json`): `@/*` → repo root, plus explicit aliases for `ai-agent`, `workflow-builder`, `design-agent` pointing at the submodules' built `src/index.js`.
