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

---

## 🎬 **Timeline Editor - Complete Feature Documentation**

The Timeline Editor is a professional-grade video editing suite with 39+ integrated features. Below is comprehensive documentation for each feature:

### **Core Timeline Features**

| Feature | Description | Function |
|---------|-------------|----------|
| **Track Management** | Add, remove, and organize video/audio/text/B-roll tracks | `data-add-track` buttons create new tracks with proper configuration |
| **Clip Editing** | Precise positioning, trimming, and manipulation of media clips | Click and drag clips, use blade tool to cut, ripple/roll/slip/slide for fine-tuning |
| **Playhead Control** | Smooth playback with play/pause/stop functionality | Play button toggles playback, stop resets to beginning, rewind moves 10% back |
| **Zoom & Navigation** | Intuitive timeline zooming and navigation controls | Zoom in/out buttons adjust timeline scale, mouse wheel for fine control |
| **Editing Tools** | Select, Blade (cut), Ripple Trim, Roll Trim, Slip, Slide, Music Generation, Fill Gap, Extend, Mask | Toolbar buttons or keyboard shortcuts activate different tools |

### **AI-Powered Editing Tools**

| Feature | Description | Function |
|---------|-------------|----------|
| **Fill Gap** | AI generates footage to bridge clips using adjacent frame context | Analyzes timeline gaps and generates appropriate filler content |
| **Extend** | Lengthen clips before/after using 9 video models with frame extraction | Uses frame interpolation to extend clip duration naturally |
| **SAM3 Masking** | Segment objects from images/videos with text, click, or box prompts | Interactive segmentation with multiple prompt modes |
| **Music Generation** | Genre, mood, style, tempo presets with auto-prompt from video frames | Generates matching soundtrack based on video content analysis |

### **State Management Features**

| Feature | Description | Function |
|---------|-------------|----------|
| **Undo/Redo** | Comprehensive undo/redo stack with state snapshots | Ctrl+Z/Cmd+Z for undo, Ctrl+Y/Cmd+Y for redo |
| **Project Persistence** | Local storage-based project saving | Automatically saves to localStorage, persists across sessions |
| **Snapshot Management** | Point-in-time state capture for undo operations | Creates snapshots before major state changes |
| **Keyboard Shortcuts** | Full keyboard shortcut support for power users | Standard shortcuts (Ctrl+S to save, Ctrl+Z/Y for undo/redo) |

### **Modal Workflows (20+ Modals)**

| Modal | Purpose | Integration |
|-------|---------|---------------|
| **EndScreenModal** | Add end screen elements to timeline | Integrates with `addEndScreenToTimeline()` function |
| **SaveProjectModal** | Project saving and management | Handles project metadata and Supabase integration |
| **SettingsModal** | Editor preferences and configuration | Manages editor settings state |
| **BillingModal** | Subscription and billing management | Connects to payment systems |
| **ConnectModal** | External service connections | Manages API integrations |
| **PreviewMediaModal** | Media preview functionality | Shows media in detail before timeline insertion |
| **VideoPlayerModal** | Video playback in modal context | Full-featured video player overlay |
| **RecorderModal** | Screen/webcam recording | Records media for timeline insertion |
| **EnhancedRecorderModal** | Advanced recording options | Professional recording with multiple sources |
| **TemplateGeneratorModal** | Template-based video creation | Applies templates to timeline structure |
| **TemplatePreviewModal** | Template preview before application | Shows template effects before applying |
| **SocialPublisherModal** | Multi-platform social publishing | Publishes to YouTube, Facebook, Instagram, etc. |
| **EmailCampaignModal** | Email marketing campaign creation | Generates personalized email content |
| **UrlVideoModal** | Import video from URLs | Fetches and imports remote video content |
| **PageShotModal** | Capture webpages as images | Screenshots web pages for use in timeline |
| **ContactImporterModal** | Import contact lists for personalization | CSV/import contacts for personalized video creation |
| **AIVideoCreator** | AI-powered video generation | Generates videos from text prompts |
| **VideoPersonalizationHub** | Personalized video creation workflow | Creates customized videos for different audiences |
| **LandingPageBuilder** | Landing page creation | Builds landing pages for video campaigns |
| **LeadGeneratorModal** | Lead capture and generation | Creates lead capture forms and funnels |
| **GTMPromptModal** | Google Tag Manager prompt enhancement | Optimizes prompts for better results |

### **AI Agents & Analysis Features**

| Feature | Description | Function |
|---------|-------------|----------|
| **AI Agents Panel** | Central hub for AI-powered editing tools | Opens modal with agent selection UI |
| **Timeline Analysis** | Analyzes timeline for gaps, scenes, and suggestions | `openTimelineAnalysisPanel()` shows analysis results |
| **Character Tracking** | Maintains character consistency across shots | `openCharacterTrackingPanel()` manages character data |
| **B-Roll Suggestions** | Gets relevant b-roll recommendations | `suggestBRoll()` analyzes timeline for context |
| **Audio Sync** | Fixes audio timing and levels | `generateSubtitles()` and related functions |

### **Floating Rail Actions (25+ Actions)**

| Action | Purpose | Function |
|--------|---------|----------|
| **Generate** | Generate new content with AI | Triggers `generateClip()` with current prompt |
| **Split** | Split clip at playhead position | `splitClipAtPlayhead()` divides selected clip |
| **Scenes** | Detect and extract scene changes | `detectScenes()` runs scene detection |
| **Subtitle** | Add subtitles to video | `generateSubtitles()` creates subtitle tracks |
| **B-Roll** | Suggest B-roll footage | `suggestBRoll()` provides contextual suggestions |
| **Speed** | Adjust playback speed | `adjustSpeed()` modifies clip speed |
| **Stabilize** | Stabilize shaky footage | `stabilizeFootage()` smooths camera shake |
| **Text** | Add text overlay | `addTextOverlay()` creates text elements |
| **Transitions** | Add transition effects | `showTransitionSettings()` opens transition editor |
| **AI Video** | Create video with AI generation | `openAIVideoCreatorModal()` launches AI creator |
| **Recorder** | Record screen or webcam | `openRecorderModal()` starts recording |
| **Enhanced Recorder** | Advanced recording options | `openEnhancedRecorderModal()` for pro recording |
| **Templates** | Browse video templates | `openTemplateGeneratorModal()` shows templates |
| **Preview Template** | Preview template before use | `openTemplatePreviewModal()` shows effects |
| **Social** | Share to social media | `openSocialPublisherModal()` opens publisher |
| **Email Campaign** | Create email campaign | `openEmailCampaignModal()` creates campaigns |
| **URL Video** | Import video from URL | `openUrlVideoModal()` fetches remote videos |
| **Page Shot** | Capture webpage as image | `openPageShotModal()` screenshots pages |
| **Contacts** | Import contact lists | `openContactImporterModal()` imports contacts |
| **Canvas** | Open canvas editor | `showCanvasPanel()` for visual composition |
| **Token Editor** | Edit personalization tokens | `showTokenEditorPanel()` manages merge fields |
| **Batch Generator** | Generate multiple videos | `showBatchGeneratorPanel()` for bulk creation |
| **Workflow** | Automate video workflows | `showWorkflowPanel()` for automation |
| **Personalization** | Personalize video content | `showPersonalizationPanel()` adds dynamic content |
| **Personalization Editor** | Advanced personalization settings | `showPersonalizationEditorPanel()` for customization |
| **Personalization Suite** | Complete video personalization workflow | `openVideoPersonalizationHubModal()` launches suite |
| **Landing Pages** | Create personalized landing pages | `openLandingPageBuilderModal()` builds pages |
| **Lead Generator** | Generate and capture leads | `openLeadGeneratorModal()` creates lead forms |

### **Color Correction & Scopes**

| Feature | Description | Function |
|---------|-------------|----------|
| **Color Panel** | Professional color grading interface | `showColorCorrectionPanel()` opens color tools |
| **Brightness Adjustment** | Real-time color correction | Integrated sliders for exposure, contrast, highlights, shadows |
| **Waveform Scope** | Professional video scopes and monitoring | Visualizes luminance and color information |

### **Audio Mixing Features**

| Feature | Description | Function |
|---------|-------------|----------|
| **Audio Mixer** | Professional mixing controls | Adjust levels, panning, and effects |
| **Level Adjustment** | Precise audio level management | Clip-specific volume controls |
| **Effects Application** | Apply reverb, EQ, compression | Real-time audio processing |

### **Animation System**

| Feature | Description | Function |
|---------|-------------|----------|
| **Spring Animation** | Physics-based spring animations | `runSpringDemo()` demonstrates spring physics |
| **Noise Animation** | Perlin noise organic movement | `runNoiseDemo()` shows procedural animation |
| **Interpolate Demo** | Linear, ease-out, bounce, color interpolation | `runInterpolateDemo()` demonstrates easing functions |

### **Multi-Camera Editing**

| Feature | Description | Function |
|---------|-------------|----------|
| **PIP Mode** | Picture-in-Picture layouts | `renderPipControls()` manages PIP positioning |
| **Split Screen** | Multi-camera angle switching | `renderSplitScreenControls()` for angle selection |
| **Camera Angle Management** | Automated camera work generation | `renderMultiCameraToolbar()` for angle switching |

### **Media Ingest Features**

| Feature | Description | Function |
|---------|-------------|----------|
| **Video Gallery** | Browse and insert stock videos | `VideoGallery()` component |
| **Stickers Library** | Add stickers and overlays | `StickersLibrary()` component |
| **Lower Thirds** | Add name/title graphics | `LowerThirds()` component |
| **Animations List** | Browse and insert animations | `AnimationList()` component |


---

## 🎞️ **Director App - Video Agent Framework**

The Director App is an AI-powered video agent framework with 20+ specialized agents for automated video processing.

### **Core Agents**

| Agent | Purpose | Capabilities |
|-------|---------|----------------|
| **Video Summarizer** | Automatically summarize video content | Extracts key moments, generates summaries |
| **Movie Generator** | Create movies from scripts | Transforms screenplays into video productions |
| **Media Library Searcher** | Search media library by content | Semantic search across all assets |
| **Video Clipper** | Cut and trim video segments | Precise clip extraction with timing |
| **Audio Dubber** | Dub audio tracks onto videos | Lip-sync and voice replacement |
| **Subtitle Translator** | Translate and burn subtitles | Multi-language subtitle support |
| **Scene Detector** | Detect scene changes automatically | Identifies shot boundaries |
| **Object Tracker** | Track objects across frames | Follow subjects through video |
| **Motion Analyzer** | Analyze camera movement | Detects pan, zoom, tilt, dolly |
| **Content Classifier** | Classify video content | Tags scenes, objects, actions |
| **Quality Enhancer** | Improve video quality | Upscaling, denoising, stabilization |
| **Format Converter** | Convert between formats | MP4, WebM, MOV, AVI support |
| **Thumbnail Generator** | Generate video thumbnails | Auto-select best frames |
| **Metadata Extractor** | Extract video metadata | Duration, bitrate, codecs |
| **Shot Analyzer** | Analyze shot composition | Rule of thirds, framing analysis |
| **Color Corrector** | Automatic color correction | White balance, exposure adjustment |
| **Audio Extractor** | Extract audio tracks | Separate audio from video |
| **Frame Extractor** | Extract individual frames | JPEG/PNG output |
| **Loop Detector** | Detect looping sections | Find repetitive content |
| **Script Parser** | Parse screenplay format | Converts scripts to shot lists |

### **Director App Features**

- **Reasoning Engine**: Context-aware AI with dynamic agent orchestration
- **Chat-Based Interface**: Conversational media interaction with video playback
- **Multi-Agent Coordination**: Seamless integration of specialized agents
- **LLM Integration**: Claude, GPT-4, Gemini support via fal.ai
- **VideoDB Infrastructure**: Cloud storage, indexing, and streaming
- **Customizable Workflows**: Add new agents and tools to your workflow

---

## 🎬 **ViMax App - Agentic Video Generation**

ViMax is an agentic video generation platform with multi-agent workflows.

### **Video Generation Modes**

| Mode | Description | Features |
|------|-------------|----------|
| **Idea2Video** | Transform raw ideas into complete video stories | Multi-agent pipeline: Director → Screenwriter → Producer → Video Generator |
| **Novel2Video** | Convert novels into episodic video content | Intelligent narrative compression, scene generation |
| **Script2Video** | Create videos from any screenplay | Unlimited creative freedom, automatic shot listing |
| **AutoCameo** | Generate videos featuring yourself or pets | Uses uploaded photos for character consistency |

### **ViMax Features**

- **Reference Management**: Automated image selection for character/environment consistency
- **Parallel Processing**: High-efficiency shot generation with consistency validation
- **Multi-Agent Pipeline**: Director, Screenwriter, Producer, and Video Generator orchestration
- **Consistency Validation**: Automated quality control and character tracking

---

## 🎨 **CineGen - Professional Video Editor**

CineGen is a professional video editor with 50+ AI models and node-based workflows.

### **AI Models (50+ Models)**

| Category | Models |
|----------|--------|
| **Text-to-Video** | Kling 3.0, LTX 2.3, Veo 3.1, Runway Gen-4, Sora 2, MiniMax, Wan 2.6 Flash |
| **Image-to-Video** | MakeFrame, Luma, Pika, SKYWIRE |
| **Video-to-Video** | Style transfer, upscaling, interpolation |
| **Text-to-Image** | FLUX Dev, FLUX 2 Max, Fast SDXL, SD3 Medium, Nano Banana Pro, Flux Kontext, Flux 2 Pro, GPT-4o Image |
| **Image-to-Image** | Inpainting, outpainting, style transfer |
| **Audio** | ElevenLabs Music, Suno Music, TTS models |
| **Editing** | SAM3 segmentation, motion blur, color correction |

### **Elements System (CineGen)**

- **4 Categories**: Characters, Locations, Props, Vehicles
- **7 AI-Generated Reference Panels**: Front, profile, back, detail angles per element
- **Consistency Engine**: Automated visual consistency across shots
- **Hybrid Workflow**: Mix uploaded photos with AI-generated panels
- **Per-Panel Regeneration**: Regenerate individual panels without rebuilding elements
- **Prompt Integration**: `@` mention elements directly in prompts

### **Spaces Workflow Editor (CineGen)**

- **Node-Based Canvas**: Visual node editor (React Flow) for AI pipelines
- **50+ AI Models**: Image, video, audio, and image-editing categories
- **Utility Nodes**: Prompt, Shot Prompt, Element, Composition Plan, File Picker, Music Prompt, Asset Output
- **Storyboarder Node**: Generate 3-12 sequential shots with camera prompts and dialogue
- **Shot Board Node**: 9-cell camera angle grid for character coverage
- **SAM3 Segmentation**: Text, click, or box prompts with overlay/white-on-black/cutout modes
- **Built-in Timeline**: Preview and arrange clips directly on canvas
- **Workflow Management**: Save/load, history, search, command palette

---

## 🎥 **Rendiv - Code-First Video Editor**

Rendiv is a code-first video editor designed for AI agents using React and TypeScript.

### **Core Features**

| Feature | Description |
|---------|-------------|
| **React-First Video Creation** | Write videos as React components with TypeScript |
| **AI-Optimized** | Every video is plain React/TS code that LLMs understand perfectly |
| **Frame Control** | `useFrame()`, `useCompositionConfig()`, `<Sequence>`, `<Series>`, `<Loop>`, `<Freeze>` |
| **Animation Primitives** | `interpolate()`, `spring()`, `blendColors()`, easing functions |
| **Media Support** | `<Video>`, `<Audio>`, `<OffthreadVideo>`, `<Img>`, `<AnimatedImage>` |
| **Async Control** | Hold/release pattern for external data loading |
| **Studio Environment** | Interactive timeline editor, live preview, agent terminal |
| **Parallel Rendering** | Headless Chromium with FFmpeg stitching (MP4, WebM, GIF, MP3, WAV, PNG sequences) |

### **Animation Primitives**

| Primitive | Purpose |
|-----------|---------|
| **interpolate()** | Map values from one range to another |
| **spring()** | Physics-based spring animation |
| **blendColors()** | Interpolate between colors |
| **noise2D()** | Generate 2D Perlin noise |
| **useSequence()** | Sequence multiple animations |
| **useSeries()** | Run animations in series |

---

## 🎙️ **Audio Production Features**

### **Audio Studio**

| Feature | Description |
|---------|-------------|
| **Multi-track Mixing** | Mix multiple audio tracks with precision |
| **Waveform Visualization** | Visual representation of audio waves |
| **Real-time Effects** | Apply reverb, EQ, compression in real-time |
| **Voice Cloning** | Clone voices for narration |
| **Lip Sync** | Automatic lip synchronization |
| **Music Generation** | Generate background music with genre/mood controls |

---

## 🎭 **Character & Influencer Studio**

### **Character Studio**

| Feature | Description |
|---------|-------------|
| **Character Generation** | Generate characters from text prompts |
| **Multi-angle Rendering** | Front, profile, back views |
| **Consistency Engine** | Maintain character across shots |
| **Pose Control** | Control character poses and expressions |

### **Influencer Studio**

| Feature | Description |
|---------|-------------|
| **Influencer Content Generation** | Create content for social media influencers |
| **Style Transfer** | Apply influencer's style to content |
| **Audience Targeting** | Tailor content to specific demographics |

---

## 📱 **Social Media Integration**

### **Publisher Features**

| Platform | Capabilities |
|----------|--------------|
| **YouTube** | Video posts, reels, stories, scheduling |
| **Facebook** | Video posts, reels, stories, carousels |
| **Instagram** | Reels, stories, posts, IGTV |
| **Twitter/X** | Video tweets, thread integration |
| **LinkedIn** | Professional content, articles |
| **TikTok** | Short-form video, trends |

### **Campaign Management**

- **Email Campaigns**: Templates and personalization
- **Hashtag Suggestions**: Automated hashtag generation
- **Caption Optimization**: AI-powered caption writing
- **Analytics**: Estimated reach and optimal posting times
- **Scheduling**: Post now or schedule for later

---

## 🔧 **Technical Infrastructure**

### **Frontend Architecture**

| Component | Purpose |
|-----------|---------|
| **React 19** | UI framework with hooks and concurrent features |
| **TypeScript 5.9** | Type-safe development with strict mode |
| **Vite 7** | Lightning-fast development and optimized builds |
| **TailwindCSS 4.0** | Utility-first CSS with custom design tokens |
| **MobX React Lite** | Reactive state management |
| **Lucide React** | Icon library |

### **Backend Services**

| Service | Purpose |
|---------|---------|
| **Supabase** | Database, authentication, real-time subscriptions |
| **MuAPI** | Enhanced AI API system with batch processing |
| **FFmpeg** | Video/audio processing with static binaries |
| **fal.ai** | LLM and AI model integration |
| **VideoDB** | Video infrastructure for Director app |

### **Desktop Applications**

| App | Description |
|-----|-------------|
| **CineGen Desktop** | Professional video editor with AI integration |
| **LTX Desktop** | Local video generation with LTX models |
| **Native Modules** | Custom AVFoundation bindings (macOS) |

---

## 📊 **Testing Infrastructure**

| Test Type | Coverage |
|-----------|----------|
| **Unit Tests** | Vitest with 50+ test files covering core logic, state management, media processing |
| **E2E Tests** | Playwright with cross-browser testing (Chromium, Firefox, WebKit) |
| **Integration Tests** | API endpoints, database operations, AI model integrations |
| **Performance Tests** | Load time monitoring, bundle analysis, memory leak detection |
| **Security Tests** | Authentication hardening, environment validation |

---

## 🚀 **Deployment Options**

| Platform | Configuration |
|----------|---------------|
| **Vercel** | Optimized deployment with preview URLs |
| **Netlify** | Static hosting with CDN |
| **Docker** | Containerized deployment |
| **Electron** | Desktop applications for Windows/macOS/Linux |
| **Static Hosting** | Deploy dist/ to any web server |

---

## 📞 **Support & Community**

- **Issues**: https://github.com/your-org/open-higgsfield-ai/issues
- **Discussions**: https://github.com/your-org/open-higgsfield-ai/discussions
- **Documentation**: https://docs.open-higgsfield-ai.com

**Made with ❤️ for creators and filmmakers worldwide**
