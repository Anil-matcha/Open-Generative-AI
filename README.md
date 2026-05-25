# MozenAIGC — 面向 AI 影像平台的开源替代方案

> **免费、开源、无约束的 AI 影像平台替代品。** 使用 200+ 个前沿模型生成 AI 图像和视频，没有内容过滤，没有封闭生态，没有订阅费用。

**社区：** 加入 [Reddit](reddit.com/r/muapi) 或 [Discord](https://discord.gg/s7KW4fsqXK) 获取讨论和支持

> 🤖 **用 AI 编码智能体自动化媒体生成：** [Generative-Media-Skills](https://github.com/SamurAIGPT/Generative-Media-Skills) 是一套技能库，能让 **Claude Code**、**Codex** 等编码助手直接驱动 200+ 个图像/视频模型完成端到端流程（提示词 → 生成 → 编辑 → 拼接），适合搭建自动化媒体流水线。

### 相关项目

> **开源 Node 工作流构建器** -> https://github.com/SamurAIGPT/Vibe-Workflow

> **开源 AI 剪辑工具** -> https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator

## 🌐 在线体验 - 无需安装

**托管版本：** [https://dev.muapi.ai/open-generative-ai](https://dev.muapi.ai/open-generative-ai)

可直接在浏览器里使用四个工作台（图像、视频、口型同步、电影），无需 Node.js，也无需额外配置。注册免费账号即可开始生成。托管版会持续同步最新模型。

**关注** [作者](https://x.com/matchaman11) 获取更新

---

## ⬇️ 下载桌面应用

一键安装包，无需 Node.js，也不用开终端。

| Platform | Download |
|---|---|
| macOS Apple Silicon (M1/M2/M3/M4) | [MozenAIGC-1.0.9-arm64.dmg](https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.9/Open.Generative.AI-1.0.9-arm64.dmg) |
| macOS Intel (x64) | [MozenAIGC-1.0.9.dmg](https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.9/Open.Generative.AI-1.0.9.dmg) |
| Windows (x64) | [MozenAIGC Setup 1.0.9.exe](https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.9/Open.Generative.AI.Setup.1.0.9.exe) |
| Linux (Ubuntu x64) | [v1.0.9 release](https://github.com/Anil-matcha/Open-Generative-AI/releases/tag/v1.0.9) (`.AppImage` / `.deb`), or build locally with `npm run electron:build:linux`. |

All releases: [github.com/Anil-matcha/Open-Generative-AI/releases](https://github.com/Anil-matcha/Open-Generative-AI/releases)

### macOS 安装指南

由于应用未经过 Apple 公证，macOS Gatekeeper 会在首次启动时拦截。按下面步骤处理：

**步骤 1** - 挂载 DMG，并把应用拖到 `/Applications`

**步骤 2** - 打开终端并执行：
```bash
xattr -cr "/Applications/MozenAIGC.app"
```

**步骤 3** - 在 `/Applications` 里右键应用 → 点 **打开** → 弹窗里再点一次 **打开**

> 这一步只需要做一次，之后就能正常打开。

**替代方式（不使用终端）：**
1. 先尝试打开应用，macOS 会拦截
2. 进入 **系统设置 → 隐私与安全性**
3. 向下找到 _"MozenAIGC was blocked"_
4. 点击 **仍要打开** → **打开**

### Windows 安装 - SmartScreen 提示处理

由于安装包未做代码签名，Windows SmartScreen 可能会弹出警告：

1. 在 SmartScreen 弹窗里点击 **更多信息**
2. 点击 **仍要运行**

应用会静默安装到 `%LocalAppData%`，并创建开始菜单快捷方式。

### Ubuntu / Linux 安装

使用 Electron Builder 构建时会生成 Linux 安装包：

```bash
# Build Linux installers (AppImage + .deb)
npm run electron:build:linux
```

生成文件会输出到 `release/` 目录：
- **AppImage** - 便携版，赋予可执行权限后即可运行：
  ```bash
  chmod +x "release/MozenAIGC-*.AppImage"
  ./release/Open\ Generative\ AI-*.AppImage
  ```
- **.deb** - Debian / Ubuntu 可直接安装：
  ```bash
  sudo apt install ./release/open-generative-ai_*_amd64.deb
  ```

如果较旧系统上的 AppImage 无法启动，请安装 `libfuse2`：

```bash
sudo apt install libfuse2
```

#### Ubuntu 24.04+ / AppArmor 沙箱限制

Ubuntu 24.04 及以上默认启用内核安全策略（`apparmor_restrict_unprivileged_userns`），会阻止 Chromium 的用户命名空间沙箱。如果应用无法静默启动或一打开就崩溃，可以选择下面两种方式：

**方案 A - 推荐：改装 `.deb`。**
`.deb` 包里已经包含 AppArmor 配置，安装后会自动获得所需权限，不需要改系统全局设置。

**方案 B - 临时系统修复（AppImage 用户）：**
```bash
sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
```
这只会持续到下次重启。若要永久生效：
```bash
echo 'kernel.apparmor_restrict_unprivileged_userns=0' | sudo tee /etc/sysctl.d/99-userns.conf
```

---

MozenAIGC 是一套免费、开源、无内容限制的 AI 图像、视频、电影和口型同步工作台，面向所有想要自由创作的人。没有内容过滤，没有提示词拒绝，没有守门规则，只保留完整的创作自由。项目基于 [Muapi.ai](https://muapi.ai) 提供能力，支持文生图、图生图、文生视频、图生视频，以及音频驱动的口型同步生成，覆盖 Flux、Nano Banana、Midjourney、Kling、Sora、Veo、Seedream、Infinite Talk、LTX Lipsync、Wan 2.2 等模型，并提供可自托管、可定制的现代界面。

**为什么选 MozenAIGC？**
- **无内容限制** - 没有过滤器、没有提示词拒绝、没有额外守门规则
- **免费开源** - 无需订阅，没有厂商锁定
- **可自托管** - 数据留在本机，创作完全可控
- **200+ 模型** - 覆盖文生图、图生图、文生视频、图生视频和口型同步
- **多图输入** - 兼容模型最多可接收 14 张参考图
- **口型同步工作台** - 可用 9 个专用模型驱动人像口型或音频同步
- **可扩展** - 能接入自己的模型，也能继续改 UI 做二次开发

若想深入了解技术架构，以及 “Infinite Budget” 电影工作流背后的理念，可查看我们的 [完整指南和路线图](https://medium.com/@anilmatcha/)。

![Studio Demo](docs/assets/studio_demo.webp)

## ⚡ 本地模型推理（仅桌面应用）

桌面应用支持 **两套独立的本地引擎**。根据实际运行机器选择即可：

| 引擎 | 说明 | 适合场景 |
|---|---|---|
| **sd.cpp**（内置） | 基于 [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp) 的 C++ 引擎，和应用运行在同一台机器上。Apple Silicon 使用 Metal GPU，Linux/Windows 可用 CUDA/Vulkan/ROCm。 | 纯图像模型。适合 Mac M 系列。 |
| **Wan2GP**（自带服务器） | 连接用户自行运行的 [Wan2GP](https://github.com/deepbeepmeep/Wan2GP) 服务。服务器负责 Python + PyTorch + CUDA/ROCm，桌面应用只发送提示词并接收结果。 | 视频模型（Wan 2.2、Hunyuan、LTX）以及大型图像模型（Flux、Qwen-Image）。NVIDIA/AMD GPU 需要在服务器端，桌面应用本身可以跑在 Mac 上。 |

两套引擎共用同一个界面：打开 **设置 → Local Models** 分别配置即可。

### 引擎 1 - sd.cpp（内置）

| 模型 | 类型 | 大小 | 备注 |
|---|---|---|---|
| **Z-Image Turbo** ⚡ | Diffusion Transformer | 2.5 GB + 2.7 GB 辅助文件 | 8 步极速生成，内存占用较高。 |
| **Z-Image Base** ⚡ | Diffusion Transformer | 3.5 GB + 2.7 GB 辅助文件 | 50 步高质量生成，内存占用较高。 |
| **Dreamshaper 8** | SD 1.5 | 2.1 GB | 20 步通用模型，是 Mac 上测试过的最轻量选项。 |
| **Realistic Vision v5.1** | SD 1.5 | 2.1 GB | 25 步写实模型 |
| **Anything v5** | SD 1.5 | 2.1 GB | 20 步动漫/插画模型 |
| **SDXL Base 1.0** | SDXL | 6.9 GB | 30 步高分辨率 |

> **Z-Image 模型**需要两个共享辅助文件（只需下载一次，两款模型共用）：
> - **Qwen3-4B Text Encoder** - 2.4 GB
> - **FLUX VAE** - 335 MB

**使用方式：**
1. 在桌面应用中打开 **设置 → Local Models**
2. 安装 **sd.cpp 推理引擎**（一键自动下载）
3. 下载你选择的模型（Z-Image 还需要辅助文件）
4. 在 **图像创作** 中点击模型选择器旁边的 **⚡ Local** 开关
5. 选择本地模型并生成，无需 API Key

所有下载都在应用内完成，不会把内容安装到系统全局。

### 引擎 2 - Wan2GP（远程 Gradio 服务）

应用本身 **不内置** Wan2GP 的 Python 环境或模型权重。你需要在带 CUDA 或 ROCm GPU 的机器上自行运行 Wan2GP，然后把桌面应用指向它的 URL。

```bash
# On your GPU machine
git clone https://github.com/deepbeepmeep/Wan2GP
cd Wan2GP
./install.sh                          # or install.bat on Windows
python wgp.py --listen --server-name 0.0.0.0   # binds to all interfaces
```

然后在桌面应用中打开：**设置 → Local Models → Wan2GP server**，粘贴 URL（例如 `http://192.168.1.42:7860`），点击 **测试**，再点击 **保存**。之后 Wan2GP 模型即可使用：图像模型会出现在 **图像创作** 中，视频模型也可通过同一生成 API 访问（图像创作会显式拒绝视频输出，完整视频创作接入仍在路线图中）。

| 模型 | 类型 | 备注 |
|---|---|---|
| **Flux.1 Dev** | Image | 1024px, 28 steps |
| **Qwen Image** | Image | 1024px, 30 steps |
| **Wan 2.2 (T2V / I2V)** | Video | 消费级 GPU 上较慢 |
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

## ✨ 功能一览

- **图像创作** — 可直接输入提示词生成图像（50+ 文生图模型），也可以上传参考图把现有图片改成新画面（55+ 图生图模型）。只要上传了参考图，系统就会自动切换模型集合；支持分辨率和质量控制的模型也会同步显示对应选项。
- **本地推理** — 提供两套引擎：**sd.cpp**（内置，支持 Mac / Windows / Linux，覆盖 Metal / CUDA / Vulkan / ROCm）用于 SD 1.5、SDXL 和 Z-Image；**Wan2GP**（自带 Gradio 服务器）用于 Flux、Qwen-Image 以及视频模型（Wan 2.2、Hunyuan、LTX）。两者都可以在“设置 → 本地模型”里配置。
- **多图参考** — 兼容的编辑模型可一次上传最多 14 张参考图（如 Nano Banana 2 Edit、Flux Kontext Dev、GPT-4o Edit 等）。支持按顺序选择、批量上传和“使用已选”确认流程。
- **视频创作** — 可输入提示词直接生成视频（40+ 文生视频模型），也可以上传起始帧把静帧动起来（60+ 图生视频模型）。模式切换逻辑与图像创作保持一致。
- **口型同步工作台** — 用音频驱动人像图或现有视频生成对口型视频。内置 9 个专用模型，覆盖“人像图 + 音频 → 说话视频”和“视频 + 音频 → 口型同步视频”两种模式。
- **电影创作** — 为写实电影镜头准备的界面，提供专业级镜头控制（镜头、焦距、光圈）。
- **工作流工作台** — 可视化搭建并运行多步 AI 流水线，把图像、视频和音频模型串起来自动执行。可以浏览社区模板、自己用节点编辑器搭建流程，也能在交互式 playground 里直接跑。
- **上传历史** — 参考图只需上传一次，就会保存在本地。之后可以在选择器里复用之前上传过的图片，不必重复上传。
- **智能控制** — 画幅、分辨率/质量、时长等选项会根据模型能力动态变化。
- **生成历史** — 可浏览、回看并下载所有历史生成结果，数据保存在浏览器存储中。
- **图像与视频下载** — 一键下载生成结果的原始分辨率文件。
- **API Key 管理** — `API Key` 安全保存在浏览器 `localStorage` 中，不会发送到任何服务器，除 Muapi 外。
- **响应式设计** — 桌面和移动端都能顺畅使用，整体采用深色玻璃拟态 UI。

### 🖼️ 图像创作 - 双模式

图像创作会在两套模型集合之间自动切换：

| 模式 | 触发条件 | 模型 | 提示词 |
| :--- | :--- | :--- | :--- |
| **文生图** | 默认状态（未上传图片） | 50+ 文生图模型（Flux、Nano Banana 2、Seedream 5.0、Ideogram、GPT-4o、Midjourney 等） | 必填 |
| **图生图** | 已上传参考图 | 55+ 图生图模型（Kontext、Nano Banana 2 Edit、Seedream 5.0 Edit、Seededit、Upscaler 等） | 可选 |

#### 新增模型

| 模型 | 类型 | 关键能力 |
| :--- | :--- | :--- |
| **Nano Banana 2** | 文生图 | Google Gemini 3.1 Flash Image · 分辨率 1K / 2K / 4K · 支持 Google Search 增强 · 画幅 `auto` |
| **Nano Banana 2 Edit** | 图生图 | 最多 **14 张参考图** · 分辨率 1K / 2K / 4K · 支持 Google Search 增强 |
| **Seedream 5.0** | 文生图 | ByteDance · 质量 basic / high · 8 种画幅 · 最多 4K |
| **Seedream 5.0 Edit** | 图生图 | ByteDance · 自然语言风格迁移 · 质量 basic / high |
| **MiniMax Image 01** | 文生图 | MiniMax · 8 种画幅 · 每次最多 4 张图 · 1500 字提示词 |

#### 多图参考

支持多图输入的模型在激活时会自动显示多选选择器：

| 模型 | 最多张数 |
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

当选中多图模型后，上传按钮会切换为多选模式：
- **带顺序编号的复选框** — 图片会按你选择的顺序发送给模型
- **批量上传** — 可以在文件选择器里一次选多个文件
- **数量徽标** 会显示当前已选图片数量；还有剩余位置时会出现 `+` 标记
- **“使用已选”按钮** 用于确认并关闭选择器

### 🎬 视频创作 - 双模式

视频创作遵循同样的切换逻辑：

| 模式 | 触发条件 | 模型 | 提示词 |
| :--- | :--- | :--- | :--- |
| **文生视频** | 默认状态（未上传图片） | 40+ 文生视频模型（Kling、Sora、Veo、Wan、Seedance 2.0、Hailuo、Runway 等） | 必填 |
| **图生视频** | 已上传起始帧 | 60+ 图生视频模型（Kling I2V、Veo3 I2V、Runway I2V、Wan I2V、Seedance 2.0 I2V、Midjourney I2V 等） | 可选 |

#### 新增模型

| 模型 | 类型 | 关键能力 |
| :--- | :--- | :--- |
| **Seedance 2.0** | 文生视频 | ByteDance · 画幅 16:9 / 9:16 / 4:3 / 3:4 · 时长 5 / 10 / 15 秒 · 质量 basic / high |
| **Seedance 2.0 I2V** | 图生视频 | ByteDance · 将图片动起来 · 最多 9 张参考图 · 画幅 16:9 / 9:16 / 4:3 / 3:4 · 时长 5 / 10 / 15 秒 · 质量 basic / high |
| **Seedance 2.0 Extend** | 视频续写 | ByteDance · 无缝延续任何 Seedance 2.0 结果 · 保留风格、运动和音频 · 支持续写提示词 · 时长 5 / 10 / 15 秒 · 质量 basic / high |
| **Grok Imagine T2V** | 文生视频 | xAI · 时长 6 / 10 / **15 秒** · 模式：fun / normal / spicy · 画幅 9:16 / 16:9 / 2:3 / 3:2 / 1:1 |
| **Grok Imagine I2V** | 图生视频 | xAI · 时长 6 / 10 / **15 秒** · 模式：fun / normal / spicy · 从静帧生成电影感运动 |
| **MiniMax Hailuo 02 / 2.3 Standard & Pro** | 文生视频 / 图生视频 | MiniMax · Full HD 视频 · 多种画幅 · 包含快速版本 |

### 🎙️ 口型同步工作台

**口型同步工作台**使用 9 个模型和两种输入模式，生成音频驱动的对口型视频：

| 模式 | 触发条件 | 说明 |
| :--- | :--- | :--- |
| **人像图** | 默认 | 上传人像图 + 音频文件 → 生成对口型说话视频 |
| **视频** | 切换到视频模式 | 上传已有视频 + 音频文件 → 生成口型同步视频 |

#### 基于图片的模型（人像图 + 音频 → 视频）

| 模型 | Endpoint | 分辨率 | 提示词 |
| :--- | :--- | :--- | :--- |
| **Infinite Talk** | `infinitetalk-image-to-video` | 480p, 720p | 可选 |
| **Wan 2.2 Speech to Video** | `wan2.2-speech-to-video` | 480p, 720p | 可选 |
| **LTX 2.3 Lipsync** | `ltx-2.3-lipsync` | 480p, 720p, 1080p | 可选 |
| **LTX 2 19B Lipsync** | `ltx-2-19b-lipsync` | 480p, 720p, 1080p | 可选 |

#### 基于视频的模型（视频 + 音频 → 口型同步视频）

| 模型 | Endpoint | 分辨率 | 提示词 |
| :--- | :--- | :--- | :--- |
| **Sync Lipsync** | `sync-lipsync` | — | — |
| **LatentSync** | `latentsync-video` | — | — |
| **Creatify Lipsync** | `creatify-lipsync` | — | — |
| **Veed Lipsync** | `veed-lipsync` | — | — |
| **Infinite Talk V2V** | `infinitetalk-video-to-video` | 480p, 720p | 可选 |

**使用方式：**
1. 用切换按钮选择 **人像图** 或 **视频** 模式
2. 通过图片/视频上传按钮上传人像图（或视频）
3. 通过音频上传按钮上传音频文件
4. 可选输入提示词，用来引导动作风格
5. 选择模型和分辨率（如支持），然后点击 **开始生成**

生成历史会单独保存到 `lipsync_history`，页面刷新后待处理任务会自动恢复。

### 🔀 工作流工作台

**工作流工作台**可以让你不用写代码，就能搭建并运行多步 AI 流水线。

**核心能力：**
- **模板** — 从预置工作流开始（图像链路、视频管线等）
- **我的工作流** — 保存并管理你自己的自定义流程
- **社区** — 浏览并运行其他用户发布的工作流
- **节点式编辑器** — 拖拽式可视化编辑器，用来连接模型和路由步骤输出
- **Playground** — 用表单界面交互运行任意工作流，结果直接内联显示
- **API 执行** — 每个工作流都可以通过 Muapi API 调用

> 💡 想把工作流加进自己的应用里？可以看看 **[Vibe Workflow](https://github.com/SamurAIGPT/Vibe-Workflow)**，这是驱动这个功能的开源工作流引擎，几乎可以直接嵌进任何项目。

### 🎥 电影创作控制

**电影创作**提供对虚拟相机的精细控制，并把你的选择转换成优化后的提示词修饰：

| 类别 | 可选项 |
| :--- | :--- |
| **相机** | Modular 8K Digital、Full-Frame Cine Digital、Grand Format 70mm Film、Studio Digital S35、Classic 16mm Film、Premium Large Format Digital |
| **镜头** | Creative Tilt、Compact Anamorphic、Extreme Macro、70s Cinema Prime、Classic Anamorphic、Premium Modern Prime、Warm Cinema Prime、Swirl Bokeh Portrait、Vintage Prime、Halation Diffusion、Clinical Sharp Prime |
| **焦距** | 8mm（超广角）、14mm、24mm、35mm（人眼视角）、50mm（人像）、85mm（紧人像） |
| **光圈** | f/1.4（浅景深）、f/4（均衡）、f/11（深焦点） |

### 📁 上传历史与选择器

你上传的每张图片都会保存在本地（URL + 缩略图），所以同一文件不用重复上传：

- 点击上传按钮即可打开 **参考图选择器**
- 以前上传过的图片会以三列网格和缩略图显示
- **单图模型** — 点击缩略图即可直接选中并关闭
- **多图模型** — 可切换多张缩略图（带顺序编号），然后点击 **使用已选**
- 用 **上传文件** 按钮继续上传新图片（多图模式下支持一次选多个文件）
- 可以用 ✕ 按钮移除历史中的单张图片
- 历史记录会跨浏览器会话保留（存储在 `localStorage`）

## 🚀 快速开始

### 前置条件

- [Node.js](https://nodejs.org/)（v18+）
- 一个 [Muapi.ai](https://muapi.ai) 的 `API Key`

### 环境准备

> **大多数用户其实更适合直接用桌面应用，不必走开发路径。** 如果你只是想在本机使用 MozenAIGC，直接去 [下载预编译安装包](#-download-desktop-app) 就好，不需要安装 Node.js。下面这些步骤主要给从源码开发的贡献者。

先选择与你目标一致的入口：

- **桌面应用（Electron）** → `npm run electron:dev`
- **托管网页版本（Next.js）** → `npm run dev`

```bash
# 克隆仓库（带子模块 — 工作流和智能体包都依赖它）
git clone --recurse-submodules https://github.com/Anil-matcha/Open-Generative-AI.git
cd Open-Generative-AI

# 如果你之前没带 --recurse-submodules 克隆过，补执行一次：
# git submodule update --init --recursive

# 安装依赖并构建工作区包（studio、workflow、agents）。
# 这一步是必须的 — 只跑 `npm install` 还不够，工作区包在启动任一开发脚本前都要先构建好。
npm run setup

# 然后从下面任选一个启动：
npm run electron:dev   # 桌面应用（Electron + Vite）— 推荐
npm run dev            # 托管网页版本（Next.js）→ http://localhost:3000
```

首次使用时会提示你输入 Muapi `API Key`（如果你只打算使用本地模型，可以先不填）。

> **排错提示 — `Couldn't find a 'pages' directory`**：这说明 Next.js 没有看到 `app/` 目录。请确认你是在仓库根目录运行 `npm run dev`（也就是包含 `app/`、`package.json` 和 `next.config.mjs` 的那个目录），并且克隆时带了子模块。如果 `packages/Vibe-Workflow` 或 `packages/Open-Poe-AI` 还是空的，请重新执行 `npm run setup`。

### 生产构建

```bash
npm run build
npm run start
```

### 桌面端打包

使用 Electron 构建原生桌面应用：

```bash
# macOS（DMG — Intel + Apple Silicon）
npm run electron:build

# Windows（NSIS 安装包 — x64 + ARM64）
npm run electron:build:win

# Linux（AppImage + DEB — x64）
npm run electron:build:linux

# 一次性打包两个平台
npm run electron:build:all
```

安装包会输出到 `release/` 目录。预构建二进制也可以在 [Releases 页面](https://github.com/Anil-matcha/Open-Generative-AI/releases) 找到。

## 🏗️ 架构

这个应用是一个 **Next.js 单体仓库**，共享 `packages/studio` 组件库。

```
Open-Generative-AI/
├── app/                        # Next.js App Router
│   ├── layout.js               # 根布局（Tailwind、字体）
│   ├── page.js                 # 重定向 → /studio
│   └── studio/
│       └── page.js             # 工作台页面 — 渲染 StandaloneShell
├── components/
│   ├── StandaloneShell.js      # 标签导航 + BYOK（从 localStorage 读取 API key）
│   └── ApiKeyModal.js          # API key 输入弹窗
├── packages/
│   └── studio/                 # 共享 React 组件库
│       └── src/
│           ├── index.js        # 导出：ImageStudio、VideoStudio、LipSyncStudio、CinemaStudio、WorkflowStudio
│           ├── models.js       # 200+ 个模型定义（单一事实来源）
│           ├── muapi.js        # API 客户端（命名导出，apiKey 作为第一个参数）
│           └── components/
│               ├── ImageStudio.jsx    # 文生图 / 图生图双模式工作台
│               ├── VideoStudio.jsx    # 文生视频 / 图生视频双模式工作台
│               ├── LipSyncStudio.jsx  # 人像/视频 + 音频 → 对口型视频
│               ├── CinemaStudio.jsx   # 带镜头控制的专业工作台
│               └── WorkflowStudio.jsx # 多步流水线搭建器与 playground
├── next.config.mjs             # transpilePackages: ['studio']
├── tailwind.config.js
└── package.json                # workspaces: ["packages/studio"]
```

`packages/studio` 这套库同样被 [muapi.ai](https://muapi.ai) 上的托管版本使用，因此你在 `packages/studio/src/models.js` 里做的模型更新，会自动同步到自托管版本和托管版本。

## 🔌 API 接入

应用与 [Muapi.ai](https://muapi.ai) 的通信采用两步流程：

1. **提交** — 使用 `POST /api/v1/{model-endpoint}` 提交提示词和参数
2. **轮询** — 反复请求 `GET /api/v1/predictions/{request_id}/result`，直到状态变成 `completed`

认证使用 `x-api-key` 请求头。开发环境下，Vite 代理会把 `/api` 请求转发到 `https://api.muapi.ai`，从而处理 CORS。

文件上传使用 `POST /api/v1/upload_file`（`multipart/form-data`），返回可访问的托管 URL，随后会传给需要图片条件的模型。对于多图模型，整个 `images_list` 数组会一次性转给 API。

口型同步任务也使用同样的两步流程：专门的 `processLipSync()` 方法会接收 `image_url` 或 `video_url` 以及 `audio_url`，发到对应模型的 endpoint，然后轮询直到拿到输出视频 URL。

## 🎨 支持的模型类别

| 类别 | 数量 | 示例 |
|---|---|---|
| **文生图** | 50+ | Flux Dev、Nano Banana 2、Seedream 5.0、Ideogram v3、Midjourney v7、GPT-4o、SDXL |
| **图生图** | 55+ | Nano Banana 2 Edit（×14）、Flux Kontext Pro、GPT-4o Edit、Seededit v3、Upscaler、Background Remover |
| **文生视频** | 40+ | Kling v3、Sora 2、Veo 3、Wan 2.6、Seedance 2.0、Seedance 2.0 Extend、Seedance Pro、Hailuo 2.3、Runway Gen-3 |
| **图生视频** | 60+ | Kling v2.1 I2V、Veo3 I2V、Runway I2V、Seedance 2.0 I2V、Midjourney v7 I2V、Hunyuan I2V、Wan2.2 I2V |
| **口型同步** | 9 | Infinite Talk I2V、Wan 2.2 Speech to Video、LTX 2.3 Lipsync、LTX 2 19B Lipsync、Sync、LatentSync、Creatify、Veed、Infinite Talk V2V |

## 🛠️ 技术栈

- **Next.js 14** — App Router、Server Components、快速开发服务器
- **React 18** — 工作台 UI 组件
- **Tailwind CSS v3** — 原子化样式
- **npm workspaces** — 带共享 `packages/studio` 库的单体仓库
- **Muapi.ai** — AI 模型 API 网关

## 🤔 和其他 AI 视频平台有什么不同？

**MozenAIGC** 是一个社区驱动的开源替代方案，保留相近的创作能力，但不把你锁在封闭生态里：

| | 其他平台 | MozenAIGC |
| :--- | :--- | :--- |
| **费用** | 订阅制 | 免费（开源） |
| **内容过滤** | 有，会拦截或改写提示词 | 无，完全不设过滤 |
| **限制** | 平台规则强约束 | 创作自由度更高 |
| **模型** | 专有 | 200+ 开源与商业模型 |
| **多图输入** | 有限制 | 单次最多 14 张图 |
| **口型同步** | 没有 | 9 个模型，支持图像和视频两种模式 |
| **托管版本** | 订阅制 | 可在 [muapi.ai/open-generative-ai](https://muapi.ai/open-generative-ai) 免费使用 |
| **自托管** | 不支持 | 支持 |
| **可定制性** | 不支持 | 完全可改、可扩展 |
| **数据隐私** | 云端托管 | 数据留在本地 |
| **源代码** | 闭源 | MIT 许可 |

## 📄 许可证

MIT

## 🙏 致谢

由 [Muapi.ai](https://muapi.ai) 提供支持，这是一个统一的 AI 图像和视频生成 API。

---
**深入阅读**：如果你想了解更多关于 “AI Influencer” 引擎、即将推出的 “Popcorn” 分镜功能，以及这个项目的未来方向，可以阅读 [完整技术概览](https://medium.com/@anilmatcha/)。

---
*想找一个免费、无过滤的 AI 视频平台？MozenAIGC 是一个开源、无限制的 AI 图像和视频生成工作台，支持自托管、可定制、可扩展。*
