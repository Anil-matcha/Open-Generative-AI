# Application Integration Documentation

## Overview

This document provides comprehensive integration documentation for all applications in the Open-Higgsfield-AI platform, using the exact application names from the side menu.

---

## Table of Contents

1. [Side Menu Applications](#side-menu-applications)
2. [Required Repositories](#required-repositories)
3. [Required APIs and Servers](#required-apis-and-servers)

---

## Side Menu Applications

### Main Navigation Items (42 Applications)

| Application | Description | Required Repository | Required APIs |
|-------------|-------------|---------------------|---------------|
| **Apps** | Application hub | Main app | fal.ai, Supabase |
| **Workflows** | Workflow management | Main app | fal.ai, Supabase |
| **Image** | Image generation & editing | Main app | fal.ai, MuAPI, Supabase |
| **Video** | Video editing & creation | Main app | fal.ai, MuAPI, FFmpeg, Supabase |
| **Cinema** | Cinematic templates & effects | Main app | fal.ai, Supabase |
| **Headshots** | AI headshot generation | apps/ai-headshot-generator | fal.ai, Supabase |
| **AI Headshot** | AI-powered headshot studio | apps/ai-headshot-generator | fal.ai, Supabase |
| **Character** | Character creation & management | Main app | fal.ai, Supabase |
| **AI-VFX** | AI visual effects studio | Main app | fal.ai, MuAPI, Supabase |
| **Influencer** | Influencer content creation | Main app | fal.ai, Supabase |
| **Storyboard** | Visual storytelling tools | Main app | fal.ai, Supabase |
| **Effects** | Visual effects application | Main app | fal.ai, MuAPI, Supabase |
| **VFX** | Visual effects tools | Main app | fal.ai, MuAPI, Supabase |
| **Edit** | Professional video editor | Main app | fal.ai, MuAPI, FFmpeg, Supabase |
| **Upscale** | Image/video upscaling | Main app | fal.ai, MuAPI, Supabase |
| **Audio** | Audio production suite | Main app | fal.ai, ElevenLabs, MuAPI, Supabase |
| **Avatar** | Avatar creation studio | Main app | fal.ai, Supabase |
| **Training** | Model training interface | Main app | fal.ai, Supabase |
| **Video Tools** | Video processing tools | Main app | fal.ai, FFmpeg, Supabase |
| **Render** | Video rendering & export | Main app | fal.ai, FFmpeg, Supabase |
| **Video Agent** | Video agent workflows | apps/vimax | fal.ai, RunPod, Ollama |
| **Outreach** | Video outreach tools | Main app | fal.ai, Supabase |
| **Director** | Video agent framework | apps/director | fal.ai, VideoDB, Supabase, MuAPI |
| **Timeline** | Professional timeline editor | Main app | fal.ai, MuAPI, FFmpeg, Whisper, Supabase |
| **Motion** | Motion graphics studio | Main app | fal.ai, MuAPI, Supabase |
| **TikTok** | TikTok content creation | Main app | fal.ai, TikTok API, Supabase |
| **Dubbing** | Professional dubbing | Main app | fal.ai, ElevenLabs, MuAPI, Supabase |
| **Chat** | AI chat assistant | Main app | fal.ai, OpenAI, Anthropic, Google Gemini |
| **Commercial** | Commercial content creation | Main app | fal.ai, Supabase |
| **Templates** | Template browser | Main app | fal.ai, Supabase |
| **Explore** | Content discovery | Main app | fal.ai, Supabase |
| **Library** | Media library management | Main app | Supabase |
| **Community** | Community content sharing | Main app | Supabase |
| **Marketing** | Marketing automation | Main app | fal.ai, Social APIs, Supabase |
| **Assist** | AI assistant interface | Main app | fal.ai, OpenAI, Anthropic, Google Gemini |
| **Commits** | Version control | Main app | Git integration |
| **Remix Go** | Remix-based application | apps/remix-go | fal.ai, Supabase |
| **AI Video Outreach** | AI Video Outreach platform | Main app | fal.ai, Supabase |
| **Settings** | Application settings | Main app | Local storage |

### Bottom Navigation Items

| Application | Description |
|-------------|-------------|
| **Settings** | Application configuration |

---

## Required Repositories

| Repository | Purpose | Location |
|------------|---------|----------|
| Higgsfield | Main application | Root directory |
| director | Director app | `apps/director` |
| vimax | ViMax app | `apps/vimax` |
| ai-headshot-generator | Headshot studio | `apps/ai-headshot-generator` |
| CineGen | Professional video editor | `modules/CineGen` |
| rendiv | Code-first video editor | `modules/rendiv` |
| LTX-Desktop | Local video generation | `modules/LTX-Desktop` |
| remix-go | Remix-based application | `apps/remix-go` |
| ai-video-outreach | AI Video Outreach platform | `apps/ai-video-outreach` |

---

## Required APIs and Servers

### Essential APIs

| API | Purpose | Required For |
|-----|---------|--------------|
| **fal.ai** | AI model inference and generation | All AI features |
| **Supabase** | Database, auth, storage | All applications |
| **MuAPI** | Enhanced AI API system | AI processing |

### Optional APIs

| API | Purpose | Required For |
|-----|---------|--------------|
| **ElevenLabs** | Voice cloning and TTS | Audio, Dubbing |
| **OpenAI** | GPT models | Chat, Assist |
| **Anthropic** | Claude models | Chat, Assist |
| **Google Gemini** | Multimodal AI | Chat, Assist |
| **RunPod** | GPU compute | Video Agent |
| **Ollama** | Local LLMs | Video Agent |

### External Services

| Service | Purpose | Required For |
|---------|---------|--------------|
| **VideoDB** | Video infrastructure | Director |
| **FFmpeg** | Video/audio processing | Video, Edit, Render, Upscale |
| **Pexels** | Stock media | Library |
| **YouTube/TikTok APIs** | Social publishing | Marketing |
| **Whisper** | Speech transcription | Timeline |

---

## Application Categories

### AI Generation & Editing
- Image, Video, AI-VFX, AI Headshot
- Headshots, Commercial, Templates

### Video Production
- Timeline, Edit, Video Tools, Render
- Dubbing, Outreach, Motion, TikTok

### Content Creation
- Cinema, Storyboard, Character
- Influencer, Effects, VFX

### AI Agents & Workflows
- Director, Video Agent, Workflows
- Assist, Chat, Commits

### Media Management
- Library, Community, Explore
- Training, Upscale, Audio

### Marketing & Distribution
- Marketing, Apps, Remix Go
- AI Video Outreach, Templates

### Utilities
- Avatar, Settings

---

## Integration Patterns

### Frontend Integration

```javascript
// Example: Integrating with fal.ai
import { HiggsfieldClient } from '@higgsfield/sdk';

const client = new HiggsfieldClient({
  apiKey: process.env.HIGGSFIELD_API_KEY,
  falKey: process.env.FAL_KEY
});

// Generate image
const result = await client.image.generate({
  prompt: "A cinematic video of a robot painting in space",
  model: "flux-dev"
});
```

### Backend Integration

```python
# Example: Video Agent integration
from vimax import ViMaxClient

client = ViMaxClient(api_key="your-key")

# Create video from idea
result = client.idea_to_video(
    idea="A robot learns to paint",
    style="cyberpunk",
    duration=30
)
```

### Desktop Application Integration

```javascript
// Example: CineGen integration
const { ipcRenderer } = require('electron');

// Request AI generation
ipcRenderer.invoke('ai-generate', {
  prompt: "Cinematic shot of a sunset",
  model: "kling-3.0"
}).then(result => {
  // Handle result
});
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HIGGSFIELD_API_KEY` | Main API key | Yes |
| `FAL_KEY` | fal.ai API key | For AI features |
| `SUPABASE_URL` | Supabase project URL | For database |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | For auth |
| `ELEVENLABS_KEY` | ElevenLabs API key | For voice |
| `RUNPod_API_KEY` | RunPod API key | For GPU compute |

### Model Configuration

```json
{
  "models": {
    "text_to_video": {
      "primary": "kling-3.0",
      "fallback": ["ltx-2.3", "veo-3.1"],
      "timeout": 300
    },
    "text_to_image": {
      "primary": "flux-dev",
      "fallback": ["flux-2-max", "gptimage"],
      "timeout": 60
    }
  }
}
```

---

## Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `400` | Bad Request | Check input parameters |
| `401` | Unauthorized | Verify API key |
| `403` | Forbidden | Check permissions |
| `429` | Rate Limited | Implement backoff |
| `500` | Server Error | Retry or contact support |
| `503` | Service Unavailable | Try later |

### Retry Logic

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## Performance Optimization

### Best Practices

1. **Batch Operations**: Combine multiple requests
2. **Cache Results**: Store frequently accessed data
3. **Use CDN**: Serve assets from CDN
4. **Compress Media**: Optimize before upload
5. **Parallel Processing**: Use concurrent requests
6. **Preload Critical Routes**: Load essential data early
7. **Use Proxy Playback**: Enable for high-resolution media
8. **Clear Cache Regularly**: Maintain optimal performance

### Resource Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Video Length | 60 seconds | Free tier |
| Resolution | 1080p | Pro tier available |
| Concurrent Jobs | 5 | Scale with plan |
| Storage | 10GB | Per project |
| API Calls | 1000/hr | Rate limited |
