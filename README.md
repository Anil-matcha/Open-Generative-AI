# Open-Higgsfield-AI

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Electron](https://img.shields.io/badge/Electron-35+-47848F?logo=electron&logoColor=white)](https://electronjs.org/)

An open-source alternative to Higgsfield AI — a comprehensive AI-powered cinema studio and image generation platform featuring **50+ advanced models** across image, video, and audio generation, with professional video editing, AI agent frameworks, and complete content creation workflows.

## 📊 **Complete Feature Catalog**

### 🎬 **Core AI Generation Pipeline**
- **50+ AI Models**: FLUX Dev, FLUX 2 Max, Fast SDXL, SD3 Medium, Nano Banana Pro, Flux Kontext, Flux 2 Pro, GPT-4o Image, Kling 3.0, LTX 2.3, Veo 3.1, Runway Gen-4, Sora 2, MiniMax, Wan 2.6 Flash, ElevenLabs Music, Suno Music, and more
- **Multi-Modal Generation**: Text-to-image, image-to-image, text-to-video, image-to-video, video-to-video, audio generation
- **Advanced Effects**: SAM3 segmentation, motion blur, color correction, audio mixing, reverb, voice cloning

### 🎯 **Professional Video Editing Suite**

#### **Timeline Editor** (10+ Tools)
- **Track Management**: Add, remove, and organize video/audio tracks
- **Clip Editing**: Precise positioning, trimming, and manipulation
- **Playhead Control**: Smooth playback with play/pause/stop functionality
- **Zoom & Navigation**: Intuitive timeline zooming and navigation controls
- **Editing Tools**: Select, Blade (cut), Ripple Trim, Roll Trim, Slip, Slide, Music Generation, Fill Gap, Extend, Mask
- **Keyframe Animation**: Opacity and volume curves with per-clip keyframe tracks
- **Transitions**: Dissolve, fade to/from black, custom transitions
- **Audio Tools**: Waveform visualization, music generation, audio sync, batch sync
- **Proxy Playback**: Draft-quality playback for smoother editing

#### **AI-Powered Editing**
- **Fill Gap**: AI generates footage to bridge clips using adjacent frame context
- **Extend**: Lengthen clips before/after using 9 video models with frame extraction
- **SAM3 Masking**: Segment objects from images/videos with text, click, or box prompts
- **Music Generation**: Genre, mood, style, tempo presets with auto-prompt from video frames

### 🧠 **AI Agent Frameworks**

#### **Director App** (Video Agent Framework)
- **20+ Pre-built Video Agents**: Summarize videos, generate movies from scripts, search media library, clip content, dub audio, translate subtitles, and more
- **Reasoning Engine**: Context-aware AI with dynamic agent orchestration
- **Chat-Based Interface**: Conversational media interaction with video playback
- **Multi-Agent Coordination**: Seamless integration of specialized agents
- **LLM Integration**: Claude, GPT-4, Gemini support via fal.ai
- **VideoDB Infrastructure**: Cloud storage, indexing, and streaming
- **Customizable Workflows**: Add new agents and tools to your workflow

#### **ViMax App** (Agentic Video Generation)
- **Idea2Video**: Transform raw ideas into complete video stories through multi-agent workflows
- **Novel2Video**: Convert complete novels into episodic video content with intelligent compression
- **Script2Video**: Create videos from any screenplay with unlimited creative freedom
- **AutoCameo**: Generate videos featuring yourself or pets in custom scripts
- **Multi-Agent Pipeline**: Director, Screenwriter, Producer, and Video Generator orchestration
- **Reference Management**: Automated image selection for character/environment consistency
- **Parallel Processing**: High-efficiency shot generation with consistency validation

#### **Rendiv Module** (Code-First Video Editor)
- **React-First Video Creation**: Write videos as React components with TypeScript
- **AI-Optimized**: Every video is plain React/TS code that LLMs understand perfectly
- **Frame Control**: `useFrame()`, `useCompositionConfig()`, `<Sequence>`, `<Series>`, `<Loop>`, `<Freeze>`
- **Animation Primitives**: `interpolate()`, `spring()`, `blendColors()`, easing functions
- **Media Support**: `<Video>`, `<Audio>`, `<OffthreadVideo>`, `<Img>`, `<AnimatedImage>`
- **Async Control**: Hold/release pattern for external data loading
- **Studio Environment**: Interactive timeline editor, live preview, agent terminal
- **Parallel Rendering**: Headless Chromium with FFmpeg stitching (MP4, WebM, GIF, MP3, WAV, PNG sequences)

### 🎨 **Content Creation & Management**

#### **Elements System** (CineGen)
- **4 Categories**: Characters, Locations, Props, Vehicles
- **7 AI-Generated Reference Panels**: Front, profile, back, detail angles per element
- **Consistency Engine**: Automated visual consistency across shots
- **Hybrid Workflow**: Mix uploaded photos with AI-generated panels
- **Per-Panel Regeneration**: Regenerate individual panels without rebuilding elements
- **Prompt Integration**: `@` mention elements directly in prompts

#### **Spaces Workflow Editor** (CineGen)
- **Node-Based Canvas**: Visual node editor (React Flow) for AI pipelines
- **50+ AI Models**: Image, video, audio, and image-editing categories
- **Utility Nodes**: Prompt, Shot Prompt, Element, Composition Plan, File Picker, Music Prompt, Asset Output
- **Storyboarder Node**: Generate 3-12 sequential shots with camera prompts and dialogue
- **Shot Board Node**: 9-cell camera angle grid for character coverage
- **SAM3 Segmentation**: Text, click, or box prompts with overlay/white-on-black/cutout modes
- **Built-in Timeline**: Preview and arrange clips directly on canvas
- **Workflow Management**: Save/load, history, search, command palette

#### **Asset Library**
- **Organized Media**: Images, videos, templates with search and filtering
- **Generation History**: Local storage of all created content
- **Preview System**: Click-to-preview with full-screen modal
- **Download Support**: Direct download of generated assets
- **Template System**: Reusable templates for quick project setup

### 📱 **Social Media Integration**
- **Multi-Platform Publishing**: YouTube, Facebook, Instagram, Twitter/X, LinkedIn, TikTok
- **Content Types**: Video posts, reels/shorts, stories, carousels
- **Scheduling**: Post now or schedule for later with custom dates
- **Analytics**: Estimated reach, views, optimal posting times
- **Campaign Management**: Email campaigns with templates and personalization
- **Hashtags & Captions**: Automated hashtag suggestions and caption optimization

### 🔧 **Technical Infrastructure**

#### **Frontend Architecture**
- **React 19** with TypeScript 5.9
- **Vite 7** build system with TailwindCSS 4.0
- **State Management**: MobX React Lite
- **UI Components**: Custom component library (112+ components)
- **Icons**: Lucide React
- **HTTP Client**: Custom request utilities with Supabase integration

#### **Backend & APIs**
- **Supabase**: Database and authentication with real-time subscriptions
- **MuAPI**: Enhanced AI API system with batch processing
- **FFmpeg**: Video/audio processing with static binaries
- **Express Server**: Custom backend services (port 3001)
- **WebSocket**: MCP protocol for AI agent communication
- **External APIs**: fal.ai, kie.ai, RunPod, Ollama, Google Gemini, Anthropic Claude

#### **Desktop Applications**
- **Electron 35+**: Cross-platform desktop apps
- **CineGen Desktop**: Professional video editor with AI integration
- **LTX Desktop**: Local video generation with LTX models (NVIDIA GPU support)
- **Native Modules**: Custom AVFoundation bindings (macOS)

#### **Testing Infrastructure**
- **Unit Tests**: Vitest with 50+ test files covering core logic, state management, media processing
- **E2E Tests**: Playwright with cross-browser testing (Chromium, Firefox, WebKit)
- **Integration Tests**: API endpoints, database operations, AI model integrations
- **Performance Tests**: Load time monitoring, bundle analysis, memory leak detection
- **Security Tests**: Authentication hardening, environment validation

#### **Development Tools**
- **ESLint**: Code linting and formatting
- **TypeScript**: Strict type checking with no unused variables/parameters
- **PostCSS**: CSS processing
- **Terser**: JavaScript minification
- **Prettier**: Code formatting
- **Turbo**: Monorepo build orchestration

### 🌐 **Deployment & Hosting**

#### **Web Deployment**
- **Vercel**: Optimized deployment with preview URLs and automatic scaling
- **Manual Static**: Deploy to any web server (Netlify, Cloudflare Pages, etc.)
- **Docker**: Containerized deployment with FFmpeg and AI agents
- **CDN Integration**: Supabase for file storage and global CDN

#### **Desktop Deployment**
- **Electron Builder**: Cross-platform installers (Windows, macOS, Linux)
- **Auto-Updates**: Built-in update mechanism via Electron Updater
- **Code Signing**: Secure distribution with code signing certificates

#### **Cloud Infrastructure**
- **Supabase**: Database, authentication, real-time subscriptions, file storage
- **VideoDB**: Video infrastructure for Director app (indexing, streaming, search)
- **API Gateways**: Secure API access with rate limiting and authentication

### 🔒 **Security & Privacy**

#### **Authentication**
- **Supabase Auth**: User authentication and session management
- **API Key Management**: Secure storage of external API keys
- **Environment Validation**: Runtime security checks
- **HTTPS Enforcement**: Automatic HTTPS redirection

#### **Content Security**
- **CSP Headers**: Strict Content Security Policy
- **XSS Protection**: Input sanitization and HTML escaping
- **File Upload Security**: Type validation and size limits
- **Safe Media Rendering**: XSS prevention for user-provided URLs

#### **Privacy Protection**
- **Local Storage**: API keys stored locally, never transmitted
- **Input Validation**: Comprehensive validation for all user inputs
- **Error Handling**: Safe error messages without information disclosure
- **Telemetry**: Optional anonymous usage analytics (can be disabled)

### 📊 **Performance Optimizations**

#### **Frontend Performance**
- **Lazy Loading**: Route-based code splitting and dynamic imports
- **Bundle Optimization**: Manual chunking for vendor libraries
- **Image Optimization**: Responsive images and modern formats (WebP, AVIF)
- **Caching**: Service worker for offline support
- **GPU Acceleration**: Hardware-accelerated video playback (macOS)

#### **Runtime Performance**
- **Memory Management**: Leak detection and cleanup
- **Worker Threads**: Background processing for media operations
- **Parallel Rendering**: Multi-threaded frame capture and processing
- **Database Optimization**: Indexed queries and connection pooling

#### **Build Performance**
- **Vite 7**: Lightning-fast HMR and optimized production builds
- **Turbo**: Monorepo orchestration for parallel builds
- **Tree Shaking**: Automatic dead code elimination
- **Asset Optimization**: Font loading, CSS purging, bundle analysis

### 🤖 **AI Integration & Automation**

#### **LLM Chat Assistants**
- **Context-Aware AI**: Full knowledge of projects, timelines, transcripts, elements
- **Multiple Modes**: Ask, Search, Cut planning, Timeline analysis
- **Inline Citations**: Clickable references to source materials
- **Cost Tracking**: Token usage and API cost monitoring
- **Provider Support**: Google Gemini, OpenAI, Anthropic via fal.ai, local Ollama

#### **Agent Skills & MCP**
- **Agent Skills**: Pre-trained skills for Claude Code, Cursor, Codex
- **MCP Protocol**: WebSocket-based AI IDE integration
- **Workflow Automation**: End-to-end video creation pipelines
- **Multi-Model Support**: Orchestration across different AI providers

#### **Automated Workflows**
- **Idea to Video**: Complete pipeline from concept to final video
- **Novel Adaptation**: Intelligent narrative compression and scene generation
- **Script Execution**: Automated production from screenplays
- **Consistency Validation**: Automated quality control and character tracking

### 🎨 **Design System & UI**

#### **Theme Variants**
- **4 Theme Options**: Default (neon yellow-green), Cinematic (warm amber), Electric (blue), Violet
- **CSS Variables**: Comprehensive color palette with dark/light modes
- **Responsive Design**: Mobile-first with breakpoints (1024px desktop threshold)
- **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support

#### **Layout System**
- **AppShell**: Full-page container with sticky header and collapsible sidebar
- **Navigation**: Full-width header with dropdown menus and mobile hamburger
- **Content Areas**: Flexible main content with scroll management
- **Framework Agnostic**: React, Vue, Vanilla JS support

### 📦 **Package Ecosystem**

#### **Core Packages**
- **@rendiv/core**: React-first video creation runtime
- **@rendiv/cli**: CLI for studio, render, and composition management
- **@rendiv/player**: Embeddable React player component
- **@rendiv/renderer**: Node.js/Bun server-side rendering API

#### **Specialized Packages**
- **@rendiv/transitions**: Transition primitives (fade, slide, wipe, flip, clockWipe)
- **@rendiv/shapes**: SVG shape helpers and path animation
- **@rendiv/noise**: Perlin noise for organic animations
- **@rendiv/motion-blur**: Trail and camera motion blur effects
- **@rendiv/lottie**: Lottie animation support
- **@rendiv/three**: Three.js 3D scene integration
- **@rendiv/fonts**: Custom font loading utilities

### 🚀 **Advanced Features**

#### **Video Processing**
- **Scene Detection**: Automatic video scene boundary detection
- **Semantic Search**: CLIP-based similarity search
- **Speech Transcription**: Whisper-powered audio transcription
- **Video Analytics**: Automated content analysis and insights

#### **Multi-Camera Editing**
- **PIP Mode**: Picture-in-picture layouts
- **Split Screen**: Multi-camera angle switching
- **Camera Angle Management**: Automated camera work generation

#### **Color Correction & Scopes**
- **Color Panel**: Professional color grading interface
- **Brightness Adjustment**: Real-time color correction
- **Waveform Scope**: Professional video scopes and monitoring

#### **Audio Mixing**
- **Audio Mixer**: Professional mixing controls
- **Level Adjustment**: Precise audio level management
- **Effect Application**: Reverb, EQ, compression, and more

---

## 🛠️ **Tech Stack**

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Frontend** | React | 19+ | UI framework with hooks and concurrent features |
| **Language** | TypeScript | 5.9+ | Type-safe development with strict mode |
| **Build** | Vite | 7+ | Lightning-fast development and optimized builds |
| **Styling** | TailwindCSS | 4.0+ | Utility-first CSS with custom design tokens |
| **State** | MobX React Lite | Latest | Reactive state management |
| **Desktop** | Electron | 35+ | Cross-platform desktop applications |
| **Database** | Supabase | Latest | Backend-as-a-Service with real-time features |
| **Video Processing** | FFmpeg | Latest | Audio/video processing with static binaries |
| **AI APIs** | MuAPI, fal.ai, OpenAI | Latest | AI model inference and generation |
| **Testing** | Vitest, Playwright | Latest | Unit and E2E testing frameworks |
| **Monorepo** | pnpm workspaces | Latest | Package management and orchestration |

---

## 📋 **Prerequisites**

- **Node.js** >= 18.0.0
- **npm** or **pnpm** package manager
- **Git** for version control
- **Python 3.10+** (optional - for local AI model runners)
- **FFmpeg** (automatically included in desktop builds)

---

## 🚀 **Quick Start**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/open-higgsfield-ai.git
   cd open-higgsfield-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_MUAPI_URL=https://api.muapi.ai
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Desktop Applications

#### CineGen Desktop
```bash
cd modules/CineGen
npm run dev
```

#### LTX Desktop
```bash
cd modules/LTX-Desktop
pnpm setup:dev
pnpm dev
```

#### Director App
```bash
cd apps/director
npm run dev
```

#### ViMax App
```bash
cd apps/vimax
uv sync
python main_idea2video.py
```

---

## 🏗️ **Project Structure**

```
open-higgsfield-ai/
├── apps/                    # Sub-applications
│   ├── director/           # Video agent framework (20+ agents)
│   ├── vimax/              # Agentic video generation (Idea2Video, Novel2Video, Script2Video, AutoCameo)
│   └── remix-go/           # Remix-based web application
├── modules/                 # Specialized modules
│   ├── CineGen/            # Professional video editor with 50+ AI models
│   ├── LTX-Desktop/        # Local video generation desktop app
│   ├── rendiv/             # Code-first video editor for AI agents
│   ├── chatvideo-yucut/    # Video processing utilities
│   └── CutAI-backend/      # AI video cutting backend
├── packages/                # Shared packages
│   ├── layout/             # Unified layout system (AppShell, Header, Sidebar)
│   ├── navigation/         # Navigation utilities and routing
│   ├── tokens/             # Design tokens and theming
│   └── shared/             # Common utilities and components
├── src/                     # Main application source
│   ├── components/         # React components (112+ components)
│   │   ├── modals/         # Modal dialogs (SocialPublisher, VideoPlayer, etc.)
│   │   ├── templates/      # Template system (TemplateBrowser, TemplateCard)
│   │   ├── publisher/      # Social media publishing (Facebook, LinkedIn, Email)
│   │   └── LibraryPage.js  # Asset library with search/filtering
│   ├── lib/                # Utilities and services
│   ├── pages/              # Application routes
│   └── hooks/              # Custom React hooks
├── tests/                   # Test suites
│   ├── e2e/                # Playwright E2E tests
│   └── unit/               # Vitest unit tests (50+ test files)
├── backend/                 # API services and integrations
├── public/                  # Static assets
└── package.json            # Project configuration
```

---

## 🧪 **Testing**

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run with UI
npm run test:ui

# Run specific test file
npx vitest run tests/unit/timeline-editor.unit.spec.ts
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run navigation tests specifically
npm run test:e2e -- --grep "Comprehensive Navigation"
```

### Performance Tests
```bash
# Run media processing unit tests
npm run test:media-processing:unit

# Run media processing integration tests
npm run test:media-processing:integration

# Run media processing E2E tests
npm run test:media-processing:e2e
```

---

## 🚀 **Deployment**

### Vercel Deployment
The platform is optimized for Vercel deployment:
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build the application
npm run build

# The dist/ folder contains the production build
# Deploy the contents of dist/ to your web server
```

### Docker Deployment
```bash
# Build Docker image
docker build -t open-higgsfield-ai .

# Run container
docker run -p 8080:80 open-higgsfield-ai
```

### Desktop Deployment
```bash
# CineGen Desktop
cd modules/CineGen
npm run package

# LTX Desktop
cd modules/LTX-Desktop
pnpm build
```

---

## 📊 **Performance**

The platform is optimized for performance with:
- **Load times under 5 seconds**
- **Efficient bundle splitting**
- **Lazy loading of modules**
- **Caching strategies**
- **Responsive images and media**
- **GPU acceleration** (macOS)
- **Parallel rendering** (up to 16 concurrent tabs)

---

## 🔧 **Configuration**

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | - |
| `VITE_MUAPI_URL` | AI API endpoint | `https://api.muapi.ai` |
| `VITE_FAL_KEY` | fal.ai API key | - |
| `VITE_OPENAI_KEY` | OpenAI API key | - |
| `VITE_ANTHROPIC_KEY` | Anthropic API key | - |

### Build Configuration
The build system supports:
- **Multiple output formats**
- **Custom optimizations**
- **Asset optimization**
- **Bundle analysis**
- **Security headers**

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Run ESLint |
| `npm run clean` | Clean build artifacts |

---

## 🏗️ **Modules & Apps**

### Core Applications
- **Director**: Video agent framework with 20+ specialized agents for video processing
- **ViMax**: Agentic video generation with Idea2Video, Novel2Video, Script2Video, AutoCameo
- **Remix-Go**: Remix-based web application framework

### Specialized Modules
- **CineGen**: Professional video editor with 50+ AI models, node-based workflows, LLM assistant
- **LTX-Desktop**: Local video generation desktop app with LTX models and video editor
- **Rendiv**: Code-first video editor designed for AI agents (React + TypeScript)
- **ChatVideo-YuCut**: Video processing utilities and AI cutting tools
- **CutAI-Backend**: AI-powered video cutting and editing backend

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- Built on top of cutting-edge AI models and video processing technologies
- Inspired by professional cinema studio workflows and AI agent frameworks
- Community contributions and open-source ecosystem
- Special thanks to the teams behind React, TypeScript, Vite, Electron, and Supabase

---

## 📞 **Support**

- [Issues](https://github.com/your-org/open-higgsfield-ai/issues)
- [Discussions](https://github.com/your-org/open-higgsfield-ai/discussions)
- [Documentation](https://docs.open-higgsfield-ai.com)

---

**Made with ❤️ for creators and filmmakers worldwide**
