# Application README Template

## Application: [APP NAME]

### Description
[Brief description of what this application does and its primary purpose]

### Required Repository
- **Repository**: [repo name]
- **Path**: [path to code]

### Required APIs and Servers
- **Essential**: [fal.ai, Supabase, etc.]
- **Optional**: [ElevenLabs, OpenAI, etc.]
- **Services**: [FFmpeg, VideoDB, etc.]

### Key Features
- [Feature 1]
- [Feature 2]
- [Feature 3]
- [Feature 4]
- [Feature 5]

### Target Audience
- [Who uses this application]

### Integration Points
- [How it connects to other applications]

### Technical Requirements
- **Browser**: [Requirements]
- **Hardware**: [GPU, RAM, etc.]
- **Dependencies**: [Key dependencies]

### Workflow Example
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Related Applications
- [Related app 1]
- [Related app 2]

---

## Example: Timeline Application

### Description
Professional video editing suite with 39+ integrated features for creating, editing, and producing high-quality videos with AI-powered tools.

### Required Repository
- **Repository**: Higgsfield (main application)
- **Path**: `src/components/TimelineEditorPage.js`

### Required APIs and Servers
- **Essential**: fal.ai, MuAPI, Supabase, FFmpeg
- **Optional**: Whisper (speech transcription)
- **Services**: FFmpeg (video processing)

### Key Features
- Track management (video, audio, text, B-roll)
- AI-powered editing (Fill Gap, Extend, SAM3 Masking, Music Generation)
- 20+ modal workflows
- 25+ floating rail actions
- Real-time color correction and scopes
- Multi-camera editing (PIP, Split Screen)
- Professional audio mixing
- Animation system (spring, noise, interpolation)
- Media ingest (stock videos, stickers, lower thirds)

### Target Audience
- Video editors and content creators
- Social media managers
- Filmmakers and directors
- Marketing professionals

### Integration Points
- Connects to Library for media assets
- Integrates with Director for AI agents
- Links to SocialPublisher for distribution
- Uses shared editor components

### Technical Requirements
- **Browser**: Chrome, Firefox, Safari (ES2020+)
- **Hardware**: GPU recommended for AI features, 8GB+ RAM
- **Dependencies**: React 19, MobX, FFmpeg

### Workflow Example
1. Import media via Library or Recorder
2. Arrange clips on timeline tracks
3. Apply AI tools (Fill Gap, Extend, Masking)
4. Add transitions and effects
5. Export via Render application

### Related Applications
- Library (media assets)
- Director (AI agents)
- Render (export)
- SocialPublisher (distribution)
