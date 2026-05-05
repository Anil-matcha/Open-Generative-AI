# Open Generative AI — Uncensored Open-Source Alternative to Higgsfield AI, Freepik AI, Krea AI, Openart AI

> **The free, open-source, unrestricted alternative to Higgsfield AI, Freepik, Krea, Openart AI.** Generate AI images and videos using 200+ state-of-the-art models — no content filters, no closed ecosystem, no subscription fees.

**Community:** Join [Reddit](reddit.com/r/muapi) & [Discord](https://discord.gg/s7KW4fsqXK) for discussions and support

> 🤖 **Automate Higgsfield, Freepik, Krea, Openart & more with AI coding agents:** [Generative-Media-Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) — a library of skills that let agents like **Claude Code**, **Codex**, and other coding assistants drive 200+ image/video models end-to-end (prompt → generate → edit → stitch) directly from your terminal. Perfect for building automated media pipelines without touching a UI.

### Related projects

> **Open-source Weavy, Flora Fauna Freepik Spaces, Krea nodes alternative** -> https://github.com/SamurAIGPT/Vibe-Workflow

> **Open-source Opus Clip alternative — turn any long-form YouTube video into viral-ready vertical shorts** -> https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator

> **Open-source multi-modal chatbot and Poe alternative** -> https://github.com/Anil-matcha/Open-Poe-AI

## 🌐 Try it Online — No Install Required

**Hosted version:** [https://dev.muapi.ai/open-generative-ai](https://dev.muapi.ai/open-generative-ai)

Use all four studios (Image, Video, Lip Sync, Cinema) directly in your browser — no Node.js, no setup. Sign up for a free account to start generating. The hosted version is always up to date with the latest models.

**Follow** the [creator](https://x.com/matchaman11) for updates

---

## ⬇️ Download Desktop App

One-click installers — no Node.js or terminal required.

| Platform | Download |
|---|---|
| macOS Apple Silicon (M1/M2/M3/M4) | [Open Generative AI-1.0.9-arm64.dmg](https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.9/Open.Generative.AI-1.0.9-arm64.dmg) |
| macOS Intel (x64) | [Open Generative AI-1.0.9.dmg](https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.9/Open.Generative.AI-1.0.9.dmg) |
| Windows (x64) | [Open Generative AI Setup 1.0.9.exe](https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.9/Open.Generative.AI.Setup.1.0.9.exe) |
| Linux (Ubuntu x64) | [v1.0.9 release](https://github.com/Anil-matcha/Open-Generative-AI/releases/tag/v1.0.9) (`.AppImage` / `.deb`), or build locally with `npm run electron:build:linux`. |

All releases: [github.com/Anil-matcha/Open-Generative-AI/releases](https://github.com/Anil-matcha/Open-Generative-AI/releases)

### macOS Installation Guide

Because the app is not notarized by Apple, macOS Gatekeeper will block it on first launch. Follow these steps:

**Step 1** — Mount the DMG and drag the app to `/Applications`

**Step 2** — Open Terminal and run:
```bash
xattr -cr "/Applications/Open Generative AI.app"
```

**Step 3** — Right-click the app in `/Applications` → click **Open** → click **Open** again on the dialog

> You only need to do this once. After that, the app opens normally.

**Alternative (no Terminal):**
1. Try to open the app — macOS will block it
2. Go to **System Settings → Privacy & Security**
3. Scroll down to find _"Open Generative AI was blocked"_
4. Click **Open Anyway** → **Open**

### Windows Installation — SmartScreen warning fix

Windows SmartScreen may show a warning because the installer is not code-signed:

1. Click **More info** on the SmartScreen dialog
2. Click **Run anyway**

The app will install silently to `%LocalAppData%` with a Start Menu shortcut.

### Ubuntu / Linux Installation

Linux artifacts are available when building with Electron Builder:

```bash
# Build Linux installers (AppImage + .deb)
npm run electron:build:linux
```

Generated files are written to the `release/` folder:
- **AppImage** — portable, run directly after making executable:
  ```bash
  chmod +x "release/Open Generative AI-*.AppImage"
  ./release/Open\ Generative\ AI-*.AppImage
  ```
- **.deb** — install on Debian/Ubuntu:
  ```bash
  sudo apt install ./release/open-generative-ai_*_amd64.deb
  ```

If AppImage fails to start on older systems, install `libfuse2`:

```bash
sudo apt install libfuse2
```

#### Ubuntu 24.04+ / AppArmor sandbox restriction

Ubuntu 24.04 and later enable a kernel security policy (`apparmor_restrict_unprivileged_userns`) that blocks Chromium's user-namespace sandbox. If the app fails to start silently or crashes immediately, you have two options:

**Option A — Recommended: install the `.deb` instead.**
The `.deb` package ships an AppArmor profile that grants the required permission automatically on install with no system-wide changes.

**Option B — Temporary system fix (AppImage users):**
```bash
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
```
This lasts until next reboot. To make it permanent:
```bash
echo 'kernel.apparmor_restrict_unprivileged_userns=0' | sudo tee /etc/sysctl.d/99-userns.conf
```

---

Open Generative AI is a free, uncensored, open-source AI image, video, cinema, and lip sync studio that brings unrestricted creative workflows to everyone. No content filters, no prompt rejections, no guardrails — just full creative freedom. Powered by [Muapi.ai](https://muapi.ai), it supports text-to-image, image-to-image, text-to-video, image-to-video, and audio-driven lip sync generation across models like Flux, Nano Banana, Midjourney, Kling, Sora, Veo, Seedream, Infinite Talk, LTX Lipsync, Wan 2.2, and more — all from a sleek, modern interface you can self-host and customize.

**Why Open Generative AI instead of Higgsfield AI, Freepik, Krea AI, Openart AI?**
- **Uncensored & unrestricted** — no content filters, no nanny guardrails, no prompt rejections
- **Free & open-source** — no subscription, no vendor lock-in
- **Self-hosted** — your data stays on your machine, full creative control
- **200+ models** — text-to-image, image-to-image, text-to-video, image-to-video, lip sync
- **Multi-image input** — feed up to 14 reference images into compatible models
- **Lip Sync Studio** — animate portraits or sync lips to any audio with 9 dedicated models
- **Extensible** — add your own models, modify the UI, build on top of it

For a deep dive into the technical architecture and the philosophy behind the "Infinite Budget" cinema workflow, see our [comprehensive guide and roadmap](https://medium.com/@anilmatcha/).

![Studio Demo](docs/assets/studio_demo.webp)

## ⚡ Local Model Inference (Desktop App Only)

The desktop app supports **two independent local engines**. Pick whichever fits the machine you actually run on:

| Engine | What it is | Best for |
|---|---|---|
| **sd.cpp** (bundled) | C++ engine from [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp), runs on the same machine as the app. Metal GPU on Apple Silicon, CUDA/Vulkan/ROCm on Linux/Windows. | Image-only models. Works on Mac M-series. |
| **Wan2GP** (BYO server) | HTTP client to a user-run [Wan2GP](https://github.com/deepbeepmeep/Wan2GP) server. The server runs Python + PyTorch on a CUDA/ROCm GPU; the desktop app only sends prompts and receives results. | Video models (Wan 2.2, Hunyuan, LTX) and large image models (Flux, Qwen-Image). NVIDIA/AMD GPU required on the *server*; the desktop app itself can run on a Mac. |

Both engines share the same UI: open **Settings → Local Models** to configure each.

### Engine 1 — sd.cpp (bundled)

| Model | Type | Size | Notes |
|---|---|---|---|
| **Z-Image Turbo** ⚡ | Diffusion Transformer | 2.5 GB + 2.7 GB aux | 8-step turbo. Heavy on memory. |
| **Z-Image Base** ⚡ | Diffusion Transformer | 3.5 GB + 2.7 GB aux | 50-step high-quality. Heavy on memory. |
| **Dreamshaper 8** | SD 1.5 | 2.1 GB | 20-step versatile. Lightest tested option on Mac. |
| **Realistic Vision v5.1** | SD 1.5 | 2.1 GB | 25-step photorealistic |
| **Anything v5** | SD 1.5 | 2.1 GB | 20-step anime/illustration |
| **SDXL Base 1.0** | SDXL | 6.9 GB | 30-step high-res |

> **Z-Image models** require two shared auxiliary files (downloaded once, shared across both models):
> - **Qwen3-4B Text Encoder** — 2.4 GB
> - **FLUX VAE** — 335 MB

**How to use:**
1. Open **Settings → Local Models** in the desktop app
2. Install the **sd.cpp inference engine** (one click — auto-downloaded)
3. Download your chosen model (and auxiliary files for Z-Image)
4. In **Image Studio**, click the **⚡ Local** toggle next to the model selector
5. Select your local model and generate — no API key needed

All downloads happen inside the app. Nothing is installed system-wide.

### Engine 2 — Wan2GP (remote Gradio server)

The app does **not** bundle Python or model weights for Wan2GP. You run Wan2GP yourself on a machine with a CUDA or ROCm GPU and point the desktop app at its URL.

```bash
# On your GPU machine
git clone https://github.com/deepbeepmeep/Wan2GP
cd Wan2GP
./install.sh                          # or install.bat on Windows
python wgp.py --listen --server-name 0.0.0.0   # binds to all interfaces
```

Then in the desktop app: **Settings → Local Models → Wan2GP server**, paste the URL (e.g. `http://192.168.1.42:7860`), click **Test**, then **Save**. The Wan2GP models become available — image models in **Image Studio**, video models reachable via the same generation API (Image Studio rejects video output explicitly; full Video Studio wiring is on the roadmap).

| Model | Type | Notes |
|---|---|---|
| **Flux.1 Dev** | Image | 1024px, 28 steps |
| **Qwen Image** | Image | 1024px, 30 steps |
| **Wan 2.2 (T2V / I2V)** | Video | Slow on consumer GPUs |
| **Hunyuan Video** | Video | High-quality T2V |
| **LTX Video** | Video | Fastest video option |

> **Why a separate server?** Wan2GP's runtime (Sage attention, flash-attn, AWQ/GGUF kernels) is CUDA-only — there is no MPS / Apple Silicon path. Treating it as a remote server lets a Mac-only user keep the desktop app while offloading inference to a Linux/Windows GPU box, a gaming PC on the LAN, or a rented RunPod/vast.ai instance.

> **Local inference is only available in the desktop app.** The hosted web version always uses cloud APIs.

### Hardware Notes

- **sd.cpp** runs on CPU (all platforms) and **Metal GPU** on Apple Silicon (M1/M2/M3/M4); CUDA/Vulkan/ROCm on Linux/Windows.
- Metal GPU acceleration is built into the macOS desktop binary — significantly faster than CPU-only.
- Recommended for sd.cpp Z-Image: 16 GB RAM (7.4 GB weights + 2.4 GB compute buffer). On a base 8 GB M-series Mac, **Z-Image is known to hang the system** — stick to SD 1.5 there.
- For SD 1.5 on M2: expect ~1–2 s/step with the Metal dylib active. If you see ~10 s/step instead, the binary may have fallen back to CPU — see verification below.

### Verifying the SD 1.5 path (the fastest sanity test on Mac)

If you want to confirm sd.cpp is installed correctly without going through the UI, you can drive `sd-cli` directly. This is the same binary the app uses.

```bash
# 1. App data layout (created on first app launch)
APP_DATA="$HOME/Library/Application Support/open-generative-ai/local-ai"
ls "$APP_DATA/bin"     # sd-cli, libstable-diffusion.dylib
ls "$APP_DATA/models"  # whatever you've downloaded

# 2. Grab a small SD 1.5 model directly (Dreamshaper 8, ~2 GB)
curl -L --fail --progress-bar \
  -o "$APP_DATA/models/DreamShaper_8_pruned.safetensors" \
  "https://huggingface.co/Lykon/DreamShaper/resolve/main/DreamShaper_8_pruned.safetensors"

# 3. Run a single 512x512 / 12-step inference
DYLD_LIBRARY_PATH="$APP_DATA/bin" "$APP_DATA/bin/sd-cli" \
  -m "$APP_DATA/models/DreamShaper_8_pruned.safetensors" \
  -p "a serene mountain lake at sunrise, oil painting" \
  -o /tmp/sd15-test.png \
  --steps 12 -H 512 -W 512 --cfg-scale 7.5 --seed 42 \
  --sampling-method euler_a
```

A healthy run on Apple Silicon prints `total params memory size = 1969.78MB (VRAM 1969.78MB, RAM 0.00MB)` (Metal-backed) and produces a coherent 512×512 PNG. If `VRAM` is `0.00MB` instead, the dylib is CPU-only — check `otool -L "$APP_DATA/bin/libstable-diffusion.dylib" | grep -i metal` and reinstall the engine from **Settings → Local Models** if Metal is missing.

---

## ✨ Features

- **Image Studio** — Generate images from text prompts (50+ text-to-image models) or transform existing images (55+ image-to-image models). Switches model set automatically based on whether a reference image is provided. Quality and resolution controls visible for models that support them.
- **Local Inference** — Two engines: **sd.cpp** (bundled, runs on Mac/Win/Linux with Metal/CUDA/Vulkan/ROCm) for SD 1.5, SDXL, and Z-Image; and **Wan2GP** (BYO Gradio server) for Flux, Qwen-Image, and video models (Wan 2.2, Hunyuan, LTX). Configure both in Settings → Local Models.
- **Multi-Image Input** — Upload up to 14 reference images for compatible edit models (Nano Banana 2 Edit, Flux Kontext Dev, GPT-4o Edit, and more). Multi-select picker with order badges, batch upload, and a "Use Selected" confirmation flow.
- **Video Studio** — Generate videos from text prompts (40+ text-to-video models) or animate a start-frame image (60+ image-to-video models). Same intelligent mode switching as Image Studio.
- **Lip Sync Studio** — Animate portrait images or sync lips on existing videos using audio. 9 dedicated models across two modes: portrait image + audio → talking video, and video + audio → lipsync video.
- **Cinema Studio** — Interface for photorealistic cinematic shots with pro camera controls (Lens, Focal Length, Aperture)
- **Workflow Studio** — Build and run multi-step AI pipelines visually. Chain image, video, and audio models into automated flows. Browse community templates, create your own with a node-based editor, and run them via an interactive playground.
- **Upload History** — Reference images are uploaded once and stored locally. A picker panel lets you reuse any previously uploaded image across sessions — no re-uploading.
- **Smart Controls** — Dynamic aspect ratio, resolution/quality, and duration pickers that adapt to each model's capabilities (including t2i models with resolution or quality options)
- **Generation History** — Browse, revisit, and download all past generations (persisted in browser storage)
- **Image & Video Download** — One-click download of generated outputs in full resolution
- **API Key Management** — Secure API key storage in browser localStorage (never sent to any server except Muapi)
- **Responsive Design** — Works seamlessly on desktop and mobile with dark glassmorphism UI

### 🖼️ Image Studio — Dual Mode

The Image Studio automatically switches between two model sets:

| Mode | Trigger | Models | Prompt |
| :--- | :--- | :--- | :--- |
| **Text-to-Image** | Default (no image) | 50+ t2i models (Flux, Nano Banana 2, Seedream 5.0, Ideogram, GPT-4o, Midjourney…) | Required |
| **Image-to-Image** | Reference image uploaded | 55+ i2i models (Kontext, Nano Banana 2 Edit, Seedream 5.0 Edit, Seededit, Upscaler…) | Optional |

#### Newly Added Models

| Model | Type | Key Features |
| :--- | :--- | :--- |
| **Nano Banana 2** | Text-to-Image | Google Gemini 3.1 Flash Image · Resolution 1K/2K/4K · Google Search enhancement · aspect ratio `auto` |
| **Nano Banana 2 Edit** | Image-to-Image | Up to **14 reference images** · Resolution 1K/2K/4K · Google Search enhancement |
| **Seedream 5.0** | Text-to-Image | ByteDance · Quality basic/high · 8 aspect ratios · up to 4K |
| **Seedream 5.0 Edit** | Image-to-Image | ByteDance · Natural language style transfer · Quality basic/high |
| **MiniMax Image 01** | Text-to-Image | MiniMax · 8 aspect ratios · up to 4 images per request · 1500 char prompt |

#### Multi-Image Input

Models that accept multiple reference images expose a multi-select picker when active:

| Model | Max Images |
| :--- | :--- |
| Nano Banana 2 Edit | 14 |
| Nano Banana Edit | 10 |
| Flux Kontext Dev I2I | 10 |
| Kling O1 Edit Image | 10 |
| GPT-4o Edit / GPT Image 1.5 Edit | 10 |
| Bytedance Seedream Edit v4 / v4.5 | 10 |
| Vidu Q2 Reference to Image | 7 |
| Flux 2 Flex/Pro Edit | 8 |
| Nano Banana Pro Edit | 8 |
| Flux Kontext Pro/Max I2I | 2 |
| Wan 2.5/2.6 Image Edit | 2–3 |
| Qwen Image Edit Plus / 2511 | 3 |
| GPT-4o Image to Image | 5 |
| Flux 2 Klein 4b/9b Edit | 4 |

When a multi-image model is selected the upload trigger switches to multi-select mode:
- **Checkboxes with order numbers** — images are sent to the model in the order you select them
- **Batch upload** — pick multiple files at once from your file dialog
- **Count badge** on the trigger shows how many images are active; a `+` badge appears when more slots are available
- **"Use Selected" button** confirms and closes the picker

### 🎬 Video Studio — Dual Mode

The Video Studio follows the same pattern:

| Mode | Trigger | Models | Prompt |
| :--- | :--- | :--- | :--- |
| **Text-to-Video** | Default (no image) | 40+ t2v models (Kling, Sora, Veo, Wan, Seedance 2.0, Hailuo, Runway…) | Required |
| **Image-to-Video** | Start frame uploaded | 60+ i2v models (Kling I2V, Veo3 I2V, Runway I2V, Wan I2V, Seedance 2.0 I2V, Midjourney I2V…) | Optional |

#### Newly Added Models

| Model | Type | Key Features |
| :--- | :--- | :--- |
| **Seedance 2.0** | Text-to-Video | ByteDance · Aspect ratios 16:9 / 9:16 / 4:3 / 3:4 · Duration 5 / 10 / 15s · Quality basic/high |
| **Seedance 2.0 I2V** | Image-to-Video | ByteDance · Animate images into video · Up to 9 reference images · Aspect ratios 16:9 / 9:16 / 4:3 / 3:4 · Duration 5 / 10 / 15s · Quality basic/high |
| **Seedance 2.0 Extend** | Video Extension | ByteDance · Seamlessly continue any Seedance 2.0 generation · Preserves style, motion & audio · Optional continuation prompt · Duration 5 / 10 / 15s · Quality basic/high |
| **Grok Imagine T2V** | Text-to-Video | xAI · Duration 6 / 10 / **15s** · Modes: fun / normal / spicy · Aspect ratios 9:16 / 16:9 / 2:3 / 3:2 / 1:1 |
| **Grok Imagine I2V** | Image-to-Video | xAI · Duration 6 / 10 / **15s** · Modes: fun / normal / spicy · Cinematic motion from still images |
| **MiniMax Hailuo 02 / 2.3 Standard & Pro** | Text-to-Video / Image-to-Video | MiniMax · Full HD video · Multiple aspect ratios · Fast variant included |

### 🎙️ Lip Sync Studio

The **Lip Sync Studio** generates audio-driven talking videos using 9 models across two input modes:

| Mode | Trigger | Description |
| :--- | :--- | :--- |
| **Portrait Image** | Default | Upload a portrait image + audio file → animated talking video |
| **Video** | Switch to Video mode | Upload an existing video + audio file → lipsync video |

#### Image-based Models (Portrait Image + Audio → Video)

| Model | Endpoint | Resolutions | Prompt |
| :--- | :--- | :--- | :--- |
| **Infinite Talk** | `infinitetalk-image-to-video` | 480p, 720p | Optional |
| **Wan 2.2 Speech to Video** | `wan2.2-speech-to-video` | 480p, 720p | Optional |
| **LTX 2.3 Lipsync** | `ltx-2.3-lipsync` | 480p, 720p, 1080p | Optional |
| **LTX 2 19B Lipsync** | `ltx-2-19b-lipsync` | 480p, 720p, 1080p | Optional |

#### Video-based Models (Video + Audio → Lipsync Video)

| Model | Endpoint | Resolutions | Prompt |
| :--- | :--- | :--- | :--- |
| **Sync Lipsync** | `sync-lipsync` | — | — |
| **LatentSync** | `latentsync-video` | — | — |
| **Creatify Lipsync** | `creatify-lipsync` | — | — |
| **Veed Lipsync** | `veed-lipsync` | — | — |
| **Infinite Talk V2V** | `infinitetalk-video-to-video` | 480p, 720p | Optional |

**How it works:**
1. Select **Portrait Image** or **Video** mode using the toggle
2. Upload your portrait image (or video) using the image/video upload button
3. Upload your audio file using the audio upload button
4. Optionally enter a prompt to guide the motion style
5. Select a model and resolution (where supported), then click **Generate**

Generation history is saved separately in `lipsync_history` and pending jobs resume automatically on page reload.

### 🔀 Workflow Studio

The **Workflow Studio** lets you build and run multi-step AI pipelines without writing code.

**Key capabilities:**
- **Templates** — Start from pre-built workflows (image chains, video pipelines, and more)
- **My Workflows** — Save and manage your own custom pipelines
- **Community** — Browse and run workflows published by other users
- **Node-based Builder** — Drag-and-drop visual editor to connect models and route outputs between steps
- **Playground** — Run any workflow interactively with a form UI; results render inline
- **API execution** — Every workflow is also callable via the Muapi API

> 💡 **Want to add workflows to your own app?** Check out **[Vibe Workflow](https://github.com/SamurAIGPT/Vibe-Workflow)** — the open-source workflow engine powering this feature. Drop it into any project.

### 🎥 Cinema Studio Controls

The **Cinema Studio** offers precise control over the virtual camera, translating your choices into optimized prompt modifiers:

| Category | Available Options |
| :--- | :--- |
| **Cameras** | Modular 8K Digital, Full-Frame Cine Digital, Grand Format 70mm Film, Studio Digital S35, Classic 16mm Film, Premium Large Format Digital |
| **Lenses** | Creative Tilt, Compact Anamorphic, Extreme Macro, 70s Cinema Prime, Classic Anamorphic, Premium Modern Prime, Warm Cinema Prime, Swirl Bokeh Portrait, Vintage Prime, Halation Diffusion, Clinical Sharp Prime |
| **Focal Lengths** | 8mm (Ultra-Wide), 14mm, 24mm, 35mm (Human Eye), 50mm (Portrait), 85mm (Tight Portrait) |
| **Apertures** | f/1.4 (Shallow DoF), f/4 (Balanced), f/11 (Deep Focus) |

### 📁 Upload History & Picker

Every image you upload is saved locally (URL + thumbnail) so you never upload the same file twice:

- Click the upload button to open the **reference image picker**
- Previously uploaded images appear in a 3-column grid with thumbnails
- **Single-image models** — click a thumbnail to instantly select and close
- **Multi-image models** — toggle multiple thumbnails (shown with order numbers), then click **Use Selected**
- Upload new images with the **Upload files** button (supports multi-file selection in multi-image mode)
- Remove individual images from history with the ✕ button
- History persists across browser sessions (stored in `localStorage`)

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- A [Muapi.ai](https://muapi.ai) API key

### Setup

> **Most users want the desktop app, not this dev path.** If you just want to run Open Generative AI on your machine, [download a prebuilt installer](#-download-desktop-app) instead — no Node.js required. The instructions below are for contributors building from source.

Pick the entry point that matches your goal:

- **Desktop app (Electron)** → `npm run electron:dev`
- **Hosted web version (Next.js)** → `npm run dev`

```bash
# Clone the repository (with submodules — required for the workflow + agent packages)
git clone --recurse-submodules https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI

# If you already cloned without --recurse-submodules, run this once:
# git submodule update --init --recursive

# Install dependencies + build workspace packages (studio, workflow, agents).
# This step is REQUIRED — `npm install` alone is not enough; the workspaces
# need to be built before either dev script will work.
npm run setup

# Then start ONE of:
npm run electron:dev   # Desktop app (Electron + Vite) — recommended
npm run dev            # Hosted web version (Next.js) → http://localhost:3000
```

You'll be prompted to enter your Muapi API key on first use (skip the key if you only plan to use local models).

> **Troubleshooting — `Couldn't find a 'pages' directory`**: this means Next.js can't see the `app/` folder. Confirm you're running `npm run dev` from the repo root (the directory that contains `app/`, `package.json`, and `next.config.mjs`), and that you cloned with submodules. Re-run `npm run setup` if `packages/Vibe-Workflow` or `packages/Open-Poe-AI` are empty.

### Production Build

```bash
npm run build
npm run start
```

### Desktop App Build

Build native desktop apps with Electron:

```bash
# macOS (DMG — Intel + Apple Silicon)
npm run electron:build

# Windows (NSIS installer — x64 + ARM64)
npm run electron:build:win

# Linux (AppImage + DEB — x64)
npm run electron:build:linux

# Both platforms in one pass
npm run electron:build:all
```

Installers are output to the `release/` folder. Pre-built binaries are also available on the [Releases page](https://github.com/Anil-matcha/Open-Generative-AI/releases).

## 🏗️ Architecture

The app is a **Next.js monorepo** with a shared `packages/studio` component library.

```
Open-Generative-AI/
├── app/                        # Next.js App Router
│   ├── layout.js               # Root layout (Tailwind, fonts)
│   ├── page.js                 # Redirects → /studio
│   └── studio/
│       └── page.js             # Studio page — renders StandaloneShell
├── components/
│   ├── StandaloneShell.js      # Tab nav + BYOK (API key from localStorage)
│   └── ApiKeyModal.js          # API key entry modal
├── packages/
│   └── studio/                 # Shared React component library
│       └── src/
│           ├── index.js        # Exports: ImageStudio, VideoStudio, LipSyncStudio, CinemaStudio, WorkflowStudio
│           ├── models.js       # 200+ model definitions (single source of truth)
│           ├── muapi.js        # API client (named exports, apiKey as first param)
│           └── components/
│               ├── ImageStudio.jsx    # Dual-mode t2i/i2i studio
│               ├── VideoStudio.jsx    # Dual-mode t2v/i2v studio
│               ├── LipSyncStudio.jsx  # Portrait/video + audio → talking video
│               ├── CinemaStudio.jsx   # Pro studio with camera controls
│               └── WorkflowStudio.jsx # Multi-step pipeline builder & playground
├── next.config.mjs             # transpilePackages: ['studio']
├── tailwind.config.js
└── package.json                # workspaces: ["packages/studio"]
```

The `packages/studio` library is also consumed by the hosted version on [muapi.ai](https://muapi.ai) — model updates made in `packages/studio/src/models.js` apply to both the self-hosted app and the hosted version automatically.

## 🔌 API Integration

The app communicates with [Muapi.ai](https://muapi.ai) using a two-step pattern:

1. **Submit** — `POST /api/v1/{model-endpoint}` with prompt and parameters
2. **Poll** — `GET /api/v1/predictions/{request_id}/result` until status is `completed`

Authentication uses the `x-api-key` header. During development, a Vite proxy handles CORS by routing `/api` requests to `https://api.muapi.ai`.

File uploads use `POST /api/v1/upload_file` (multipart/form-data) and return a hosted URL that is passed to image-conditioned models. For multi-image models the full `images_list` array is forwarded to the API in one request.

Lip sync jobs use the same two-step pattern: a dedicated `processLipSync()` method accepts `image_url` or `video_url` alongside `audio_url`, dispatches to the model's endpoint, and polls until the output video URL is available.

## 🎨 Supported Model Categories

| Category | Count | Examples |
|---|---|---|
| **Text-to-Image** | 50+ | Flux Dev, Nano Banana 2, Seedream 5.0, Ideogram v3, Midjourney v7, GPT-4o, SDXL |
| **Image-to-Image** | 55+ | Nano Banana 2 Edit (×14), Flux Kontext Pro, GPT-4o Edit, Seededit v3, Upscaler, Background Remover |
| **Text-to-Video** | 40+ | Kling v3, Sora 2, Veo 3, Wan 2.6, Seedance 2.0, Seedance 2.0 Extend, Seedance Pro, Hailuo 2.3, Runway Gen-3 |
| **Image-to-Video** | 60+ | Kling v2.1 I2V, Veo3 I2V, Runway I2V, Seedance 2.0 I2V, Midjourney v7 I2V, Hunyuan I2V, Wan2.2 I2V |
| **Lip Sync** | 9 | Infinite Talk I2V, Wan 2.2 Speech to Video, LTX 2.3 Lipsync, LTX 2 19B Lipsync, Sync, LatentSync, Creatify, Veed, Infinite Talk V2V |

## 🛠️ Tech Stack

- **Next.js 14** — App Router, server components, fast dev server
- **React 18** — Studio UI components
- **Tailwind CSS v3** — Utility-first styling
- **npm workspaces** — Monorepo with shared `packages/studio` library
- **Muapi.ai** — AI model API gateway

## 🤔 How is this different from Higgsfield AI, Freepik, Krea, Openart AI?

**Open Generative AI** is a community-driven, open-source alternative that provides similar creative capabilities without the closed ecosystem:

| | Other providers | Open Generative AI |
| :--- | :--- | :--- |
| **Cost** | Subscription-based | Free (open-source) |
| **Content filters** | Yes — prompts blocked or altered | None — fully uncensored |
| **Restrictions** | Platform guardrails enforced | Unrestricted creative freedom |
| **Models** | Proprietary | 200+ open & commercial models |
| **Multi-image input** | Limited | Up to 14 images per request |
| **Lip sync** | No | 9 models, image & video modes |
| **Hosted version** | Subscription | Free at [muapi.ai/open-generative-ai](https://muapi.ai/open-generative-ai) |
| **Self-hosting** | No | Yes |
| **Customizable** | No | Fully hackable |
| **Data privacy** | Cloud-based | Your data stays local |
| **Source code** | Closed | MIT licensed |

## 📄 License

MIT

## 🙏 Credits

Built with [Muapi.ai](https://muapi.ai) — the unified API for AI image and video generation models.

---
**Deep Dive**: For more details on the "AI Influencer" engine, upcoming "Popcorn" storyboarding features, and the future of this project, read the [full technical overview](https://medium.com/@anilmatcha/).

---
*Looking for a free, uncensored Higgsfield AI, Freepik, Krea, Openart AI alternative? Open Generative AI is an open-source, unrestricted AI image and video generation studio — a Higgsfield AI, Freepik, Krea, Openart AI replacement with no content filters that you can self-host, customize, and extend.*

This project is an independent, experimental, and open-source initiative and is not affiliated with, endorsed by, or associated with Higgsfield Inc., Freepik, Krea AI, OpenArt AI, or any of their respective companies, products, or services. Any references to third-party platforms, models, or technologies are made solely for interoperability, benchmarking, research, or educational purposes. All trademarks, logos, and brand names are the property of their respective owners. If any content in this repository creates confusion or raises concerns, please contact us and we will promptly review and address it.
