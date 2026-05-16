# Feature Gating Inventory - Stripe & Supabase

## Purpose

This document lists all features and functions that require gating/access control using Stripe and Supabase.

---

## How to Use This Document

Each feature includes:
- **Feature Name**: What needs to be gated
- **Function/Code Reference**: Where it lives in code
- **Gating Type**: How to control access (subscription, usage, purchase)
- **Stripe Integration**: What to track in Stripe
- **Supabase Integration**: What to track in database

---

## Complete Feature Inventory

### Timeline Editor

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Track Management | `data-add-track` buttons | Included in base app | No | User has access (boolean |
| Clip Editing | Drag/drop, blade tool | Included in base app | No | User has access (boolean |
| Playhead Control | Play/pause/stop | Included in base app | No | User has access (boolean |
| Zoom & Navigation | Zoom controls | Included in base app | No | User has access (boolean |
| Editing Tools | Select, Blade, Ripple, Roll, Slip, Slide | Included in base app | No | User has access (boolean |
| Fill Gap AI | `generateGapContent()` | Usage-based | Yes - AI calls | Monthly quota tracking |
| Extend AI | `extendClip()` | Usage-based | Yes - AI calls | Monthly quota tracking |
| SAM3 Masking | `applySAM3Mask()` | Usage-based | Yes - AI calls | Monthly quota tracking |
| Music Generation | `generateMusic()` | Usage-based | Yes - AI calls | Monthly quota tracking |
| Undo/Redo | `undo()`, `redo()` | Included in base app | No | Always available |
| Project Persistence | `saveProjectState()` | Included in base app | No | Storage quota tracked |
| Snapshot Management | `captureSnapshot()` | Included in base app | No | Storage quota tracked |
| Keyboard Shortcuts | Various shortcuts | Included in base app | No | Always available |
| EndScreen Modal | `EndScreenModal` | Included in base app | No | Always available |
| Save Project Modal | `SaveProjectModal` | Included in base app | No | Always available |
| Settings Modal | `SettingsModal` | Included in base app | No | Always available |
| Billing Modal | `BillingModal` | Subscription management | Yes | Subscription status |
| Connect Modal | `ConnectModal` | API key management | No | Always available |
| Preview Media Modal | `PreviewMediaModal` | Included in base app | No | Always available |
| Video Player Modal | `VideoPlayerModal` | Included in base app | No | Always available |
| Recorder Modal | `RecorderModal` | Included in base app | No | Always available |
| Enhanced Recorder Modal | `EnhancedRecorderModal` | Premium feature | Yes | Access boolean |
| Template Generator Modal | `TemplateGeneratorModal` | Usage-based | Yes | Template usage count |
| Template Preview Modal | `TemplatePreviewModal` | Included in base app | No | Always available |
| Social Publisher Modal | `SocialPublisherModal` | Platform-limited | Yes | Platform count |
| Email Campaign Modal | `EmailCampaignModal` | Email quota | Yes | Email count monthly |
| URL Video Modal | `UrlVideoModal` | Included in base app | No | Always available |
| Page Shot Modal | `PageShotModal` | Included in base app | No | Always available |
| Contact Importer Modal | `ContactImporterModal` | Contact quota | Yes | Contact count |
| AI Video Creator | `AIVideoCreator` | Usage-based | Yes | AI calls |
| Video Personalization Hub | `VideoPersonalizationHub` | Usage-based | Yes | AI calls |
| Landing Page Builder | `LandingPageBuilder` | Premium feature | Yes | Access boolean |
| Lead Generator Modal | `LeadGeneratorModal` | Premium feature | Yes | Access boolean |
| GTM Prompt Modal | `GTMPromptModal` | Included in base app | No | Always available |
| Floating Rail Actions | Various actions | Varies by action | Yes/No | Track per action |
| Color Panel | `showColorCorrectionPanel()` | Included in base app | No | Always available |
| Waveform Scope | Waveform display | Premium feature | Yes | Access boolean |
| Audio Mixer | `openAudioMixer()` | Track-limited | Yes | Track count |
| Audio Effects | Reverb, EQ, compression | Track-limited | Yes | Track count |
| Spring Animation Demo | `runSpringDemo()` | Included in base app | No | Always available |
| Noise Animation Demo | `runNoiseDemo()` | Included in base app | No | Always available |
| Interpolate Demo | `runInterpolateDemo()` | Included in base app | No | Always available |
| PIP Mode | `renderPipControls()` | Premium feature | Yes | Access boolean |
| Split Screen | `renderSplitScreenControls()` | Premium feature | Yes | Access boolean |
| Multi-Camera Toolbar | `renderMultiCameraToolbar()` | Premium feature | Yes | Access boolean |
| Video Gallery | `VideoGallery()` | Download-limited | Yes | Download count |
| Stickers Library | `StickersLibrary()` | Included in base app | No | Always available |
| Lower Thirds | `LowerThirds()` | Template-limited | Yes | Template count |
| Animations List | `AnimationList()` | Premium templates | Yes | Template count |

### Director App

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Video Summarizer Agent | `videoSummarizer()` | Usage-based | Yes | Agent call count |
| Movie Generator Agent | `movieGenerator()` | Usage-based | Yes | Agent call count |
| Media Searcher Agent | `mediaSearcher()` | Usage-based | Yes | Agent call count |
| Video Clipper Agent | `videoClipper()` | Usage-based | Yes | Agent call count |
| Audio Dubber Agent | `audioDubber()` | Usage-based | Yes | Agent call count |
| Subtitle Translator Agent | `subtitleTranslator()` | Usage-based | Yes | Agent call count |
| Scene Detector Agent | `sceneDetector()` | Usage-based | Yes | Agent call count |
| Object Tracker Agent | `objectTracker()` | Usage-based | Yes | Agent call count |
| Motion Analyzer Agent | `motionAnalyzer()` | Usage-based | Yes | Agent call count |
| Quality Enhancer Agent | `qualityEnhancer()` | Premium-only | Yes | Access boolean |
| Format Converter Agent | `formatConverter()` | Usage-based | Yes | Agent call count |
| Thumbnail Generator Agent | `thumbnailGenerator()` | Usage-based | Yes | Agent call count |
| Metadata Extractor Agent | `metadataExtractor()` | Usage-based | Yes | Agent call count |
| Shot Analyzer Agent | `shotAnalyzer()` | Usage-based | Yes | Agent call count |
| Color Corrector Agent | `colorCorrector()` | Usage-based | Yes | Agent call count |
| Audio Extractor Agent | `audioExtractor()` | Usage-based | Yes | Agent call count |
| Frame Extractor Agent | `frameExtractor()` | Usage-based | Yes | Agent call count |
| Loop Detector Agent | `loopDetector()` | Usage-based | Yes | Agent call count |
| Script Parser Agent | `scriptParser()` | Usage-based | Yes | Agent call count |
| Custom Agent Builder | Custom agent creation | Team/Enterprise | Yes | Access boolean |

### ViMax App

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Idea2Video | `idea_to_video()` | Tier-based | Yes | Access by tier |
| Novel2Video | `novel_to_video()` | Tier-based | Yes | Access by tier |
| Script2Video | `script_to_video()` | Tier-based | Yes | Access by tier |
| AutoCameo | `auto_cameo()` | Tier-based | Yes | Access by tier |
| Parallel Processing | Parallel job execution | Tier-based | Yes | Concurrent job limit |

### CineGen

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Text-to-Video Models | Kling, LTX, Veo | Usage-based | Yes | Model calls |
| Image-to-Video Models | MakeFrame, Luma, Pika | Usage-based | Yes | Model calls |
| Video-to-Video Models | Style transfer, upscale | Usage-based | Yes | Model calls |
| Text-to-Image Models | FLUX, SDXL, GPT-4o | Usage-based | Yes | Model calls |
| Image-to-Image | Inpainting, outpainting | Usage-based | Yes | Model calls |
| Audio Generation | ElevenLabs, Suno | Usage-based | Yes | Model calls |
| SAM3 Segmentation | Object segmentation | Usage-based | Yes | Model calls |
| Motion Blur | Motion effects | Usage-based | Yes | Model calls |
| Color Correction | Color grading | Included | No | Always |
| Elements System | Character/Location/Prop/Vehicle | Storage-based | Yes | Element count |
| Reference Panels | 7-angle generation | Usage-based | Yes | Panel count |
| Spaces Workflow Editor | Node-based editor | Included | No | Always |
| Storyboarder Node | Shot generation | Usage-based | Yes | Shot count |
| Shot Board Node | Camera angle grid | Usage-based | Yes | Shot count |

### Image Studio

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Text-to-Image | `generateFromText()` | Usage-based | Yes | Generation count |
| Image-to-Image | `generateFromImage()` | Usage-based | Yes | Generation count |
| Advanced Filters | Filter application | Tier-limited | Yes | Access boolean |
| Crop Tool | Cropping functionality | Included | No | Always |
| Effects Application | Real-time effects | Included | No | Always |
| Layer Management | Multi-layer editing | Included | No | Always |
| Export Options | Format/quality selection | Quality-limited | Yes | Max resolution |

### Video Studio

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Timeline Editing | Multi-track editing | Included | No | Always |
| Media Library | Asset organization | Storage-limited | Yes | Storage used |
| Transitions | Transition effects | Count-limited | Yes | Transition count |
| Text Overlays | Text animation | Font-limited | Yes | Font access |
| Color Correction | Color grading tools | Tier-limited | Yes | Access boolean |
| Audio Mixing | Multi-track audio | Track-limited | Yes | Track count |
| Export Presets | Export configurations | Quality-limited | Yes | Max quality |

### Audio Studio

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Multi-track Mixing | Up to 32 tracks | Track-limited | Yes | Track count |
| Waveform Editing | Sample editing | Included | No | Always |
| Effects Library | Reverb, EQ, etc. | Effect-limited | Yes | Effect count |
| Voice Cloning | Voice model creation | Quota-limited | Yes | Voice count |
| Lip Sync | Audio/video sync | Usage-based | Yes | Sync count |
| Music Generation | AI music creation | Usage-based | Yes | Generation count |
| Mastering Tools | Mastering chain | Pro feature | Yes | Access boolean |

### Marketing Studio

| Feature | Function | Gating Type | Stripe | Supabase |
|---------|----------|-------------|--------|----------|
| Email Campaigns | Email creation/sending | Email quota | Yes | Email count |
| Social Publishing | Multi-platform posting | Platform-limited | Yes | Platform count |
| Hashtag Suggestions | AI hashtag generation | Included | No | Always |
| Caption Optimization | AI caption writing | Included | No | Always |
| Analytics Dashboard | Performance metrics | Metric depth | Yes | Metric types |
| A/B Testing | Campaign testing | Limited | Yes | Test count |
| Lead Capture Forms | Form builder | Form-limited | Yes | Form count |
| Landing Pages | Page builder | Page-limited | Yes | Page count |

### Other Applications (Brief)

| App | Main Features | Gating Type | Notes |
|-----|---------------|-------------|-------|
| Headshot Studio | AI headshot generation | Usage-based | 7-angle generation |
| Character Studio | Character creation | Storage-based | Element storage |
| Influencer Studio | Influencer content | Usage-based | Content generation |
| Effects Studio | Visual effects | Usage-based | Effect application |
| Storyboard Studio | Storyboarding | Usage-based | Shot generation |
| Advanced Dubbing | Professional dubbing | Usage-based | Voice + sync |
| Chat Studio | AI chat assistant | Message quota | Monthly messages |
| Commercial Studio | Ad creation | Usage-based | Ad variants |
| Runway Motion | Motion graphics | Usage-based | Render count |
| TikTok Carousel | TikTok content | Usage-based | Post count |
| Upscale Studio | Image/video upscale | Usage-based | Upscale count |
| Training Studio | Model training | Compute time | GPU hours |

---

## Implementation Approach

### Database Schema (Supabase)

```sql
-- User subscriptions
CREATE TABLE user_subscriptions (
  user_id UUID PRIMARY KEY,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  tier VARCHAR(50), -- free, pro, team, enterprise
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status VARCHAR(20)
);

-- Feature access (simple boolean + quota)
CREATE TABLE feature_access (
  user_id UUID,
  feature_key VARCHAR(100), -- e.g., "timeline.fill_gap"
  has_access BOOLEAN DEFAULT false,
  monthly_quota INTEGER DEFAULT 0,
  used_this_month INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, feature_key)
);

-- Track usage
CREATE TABLE feature_usage (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID,
  feature_key VARCHAR(100),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  quantity INTEGER DEFAULT 1
);
```

### Access Check Function

```javascript
// Check if user can use feature
async function canUseFeature(userId, featureKey) {
  const { data } = await supabase
    .from('feature_access')
    .select('*')
    .eq('user_id', userId)
    .eq('feature_key', featureKey)
    .single();
  
  if (!data || !data.has_access) return false;
  
  // Check quota
  if (data.monthly_quota > 0) {
    if (data.used_this_month >= data.monthly_quota) {
      return false;
    }
  }
  
  return true;
}
```

### Usage Tracking

```javascript
// Track feature usage
async function trackUsage(userId, featureKey, quantity = 1) {
  // Check access
  const allowed = await canUseFeature(userId, featureKey);
  if (!allowed) {
    throw new Error('Feature not available on current tier');
  }
  
  // Track usage
  await supabase.rpc('increment_feature_usage', {
    p_user_id: userId,
    p_feature_key: featureKey,
    p_quantity: quantity
  });
}
```

### Simplified Stripe Integration

```javascript
// Get user's active subscription
async function getUserSubscription(userId) {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();
  
  return data;
}

// Unlock features based on subscription
async function unlockFeaturesForUser(userId, tier) {
  const features = getFeaturesForTier(tier);
  
  for (const feature of features) {
    await supabase.from('feature_access').upsert({
      user_id: userId,
      feature_key: feature.key,
      has_access: true,
      monthly_quota: feature.quota || 0,
      used_this_month: 0
    });
  }
}
```

---

## Notes

- This is a **simple inventory** - actual implementation will need:
  - Feature key naming convention
  - Gating logic per feature
  - Usage tracking for AI/API calls
  - Subscription webhook handling from Stripe
  
- Focus on **what needs gating** not **pricing tiers**
- Each feature should have:
  - Clear access control method
  - Usage tracking if needed
  - Error handling for locked features
