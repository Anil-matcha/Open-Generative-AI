# Feature Gating Index - Stripe & Supabase

## Overview

This document provides a complete inventory of all features and functions across the Open-Higgsfield-AI platform for subscription gating using Stripe and Supabase.

---

## Table of Contents

1. [Gating Strategy](#gating-strategy)
2. [Tier Definitions](#tier-definitions)
3. [Feature Categories](#feature-categories)
4. [Complete Feature Inventory](#complete-feature-inventory)
5. [Implementation Guidelines](#implementation-guidelines)

---

## Gating Strategy

### Subscription Tiers

| Tier | Price | Features | Target Audience |
|------|-------|-----------|-----------------|
| **Free** | $0/mo | Basic features, watermarked exports, limited AI calls | Hobbyists, explorers |
| **Pro** | $29/mo | Full features, no watermarks, priority processing | Professionals, creators |
| **Team** | $99/mo | Pro + collaboration, shared projects, admin tools | Agencies, teams |
| **Enterprise** | Custom | Unlimited, custom models, dedicated support | Large organizations |

### Access Control Methods

1. **Route-level gating**: Entire applications blocked based on tier
2. **Feature-level gating**: Specific tools/buttons disabled
3. **Quota-based gating**: Limited AI calls, storage, processing time
4. **Watermark gating**: Export watermarks for free tier

---

## Tier Definitions

### Free Tier
- Access to basic applications
- Limited AI generations (50/month)
- Watermarked exports
- Standard quality only
- Community support
- 1GB storage

### Pro Tier
- All Free features
- Unlimited AI generations
- No watermarks
- High-quality exports (4K)
- Priority processing
- Email support
- 100GB storage

### Team Tier
- All Pro features
- Team collaboration tools
- Shared project workspace
- Admin dashboard
- Usage analytics
- 500GB shared storage

### Enterprise Tier
- All Team features
- Custom model training
- Dedicated support
- SLA guarantees
- Custom integrations
- Unlimited storage

---

## Feature Categories

### A. Core Applications (10 Apps)
### B. AI Generation Tools (15 Tools)
### C. Video Editing Features (12 Features)
### D. Audio Production (8 Features)
### E. Media Management (6 Features)
### F. Social & Marketing (10 Features)
### G. AI Agents & Automation (12 Agents)
### H. Advanced Features (9 Features)
### I. Utilities & Support (7 Features)

---

## Complete Feature Inventory

### Category A: Core Applications (10 Apps)

| # | Application | Free | Pro | Team | Enterprise | Repository | Notes |
|---|-------------|------|-----|------|-----------|------------|-------|
| A1 | **Timeline** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A2 | **Image** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A3 | **Video** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A4 | **Audio** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A5 | **Cinema** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A6 | **Editor** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A7 | **Effects** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A8 | **VFX** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A9 | **Avatar** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |
| A10 | **Studio** | ✅ | ✅ | ✅ | ✅ | main | Full unlock at Pro |

### Category B: AI Generation Tools (15 Tools)

| # | Feature | Free | Pro | Team | Enterprise | API Required | Quota | Gating Type |
|---|---------|------|-----|------|-----------|--------------|-------|-------------|
| B1 | **Text-to-Image** | 50/mo | Unlimited | Unlimited | Unlimited | fal.ai | 50 | Tier + Quota |
| B2 | **Image-to-Image** | 25/mo | Unlimited | Unlimited | Unlimited | fal.ai | 25 | Tier + Quota |
| B3 | **Text-to-Video** | 10/mo | Unlimited | Unlimited | Unlimited | fal.ai | 10 | Tier + Quota |
| B4 | **Image-to-Video** | 10/mo | Unlimited | Unlimited | Unlimited | fal.ai | 10 | Tier + Quota |
| B5 | **Video-to-Video** | 5/mo | Unlimited | Unlimited | Unlimited | fal.ai | 5 | Tier + Quota |
| B6 | **Music Generation** | 10/mo | Unlimited | Unlimited | Unlimited | fal.ai, ElevenLabs | 10 | Tier + Quota |
| B7 | **Voice Cloning** | 2 voices | Unlimited | Unlimited | Unlimited | ElevenLabs | 2 voices | Tier + Quota |
| B8 | **Speech-to-Text** | 60 min/mo | Unlimited | Unlimited | Unlimited | Whisper | 60 min | Tier + Quota |
| B9 | **SAM3 Segmentation** | 20/mo | Unlimited | Unlimited | Unlimited | fal.ai | 20 | Tier + Quota |
| B10 | **Upscale (2x)** | 5/mo | Unlimited | Unlimited | Unlimited | fal.ai | 5 | Tier + Quota |
| B11 | **Upscale (4x)** | ❌ | 10/mo | Unlimited | Unlimited | fal.ai | 10 | Tier Only |
| B12 | **Style Transfer** | 10/mo | Unlimited | Unlimited | Unlimited | fal.ai | 10 | Tier + Quota |
| B13 | **Background Removal** | Unlimited | Unlimited | Unlimited | Unlimited | fal.ai | ∞ | Free |
| B14 | **Face Enhancement** | 20/mo | Unlimited | Unlimited | Unlimited | fal.ai | 20 | Tier + Quota |
| B15 | **Object Removal** | 10/mo | Unlimited | Unlimited | Unlimited | fal.ai | 10 | Tier + Quota |

### Category C: Video Editing Features (12 Features)

| # | Feature | Free | Pro | Team | Enterprise | Gating Type | Notes |
|---|---------|------|-----|------|-----------|-------------|-------|
| C1 | **Multi-track Timeline** | ✅ | ✅ | ✅ | ✅ | Free | Always available |
| C2 | **Clip Trimming** | ✅ | ✅ | ✅ | ✅ | Free | Always available |
| C3 | **Transitions** | Basic | All | All | All | Tier-based | Basic: 5, Pro: 25+ |
| C4 | **Text Overlays** | Basic | Premium | Premium | Premium | Tier-based | Fonts & animations |
| C5 | **Color Correction** | Basic | Full | Full | Full | Tier-based | Basic: exposure/contrast, Full: scopes |
| C6 | **Audio Mixing** | 2 tracks | 16 tracks | 32 tracks | 64 tracks | Track count | Volume & pan only vs effects |
| C7 | **Keyframe Animation** | ❌ | ✅ | ✅ | ✅ | Tier Only | Pro and above |
| C8 | **Multi-camera (PIP)** | ❌ | ✅ | ✅ | ✅ | Tier Only | PIP & split-screen |
| C9 | **Stabilization** | 720p | 4K | 8K | 8K | Quality tier | Export resolution |
| C10 | **Speed Ramping** | Basic | Advanced | Advanced | Advanced | Tier-based | Basic: constant speed |
| C11 | **Green Screen** | ❌ | ✅ | ✅ | ✅ | Tier Only | Chroma key |
| C12 | **Motion Tracking** | ❌ | ✅ | ✅ | ✅ | Tier Only | Object tracking |

### Category D: Audio Production (8 Features)

| # | Feature | Free | Pro | Team | Enterprise | Quota | Gating Type |
|---|---------|------|-----|------|-----------|-------|-------------|
| D1 | **Multi-track Mixing** | 2 tracks | 16 tracks | 32 tracks | 64 tracks | Track count | Tier-based |
| D2 | **Audio Effects** | Basic | Full | Full | Full | Effect count | Basic: EQ/Volume |
| D3 | **Noise Reduction** | 5 min/mo | Unlimited | Unlimited | Unlimited | 5 min | Tier + Quota |
| D4 | **Audio Ducking** | ✅ | ✅ | ✅ | ✅ | - | Free |
| D5 | **Fade In/Out** | ✅ | ✅ | ✅ | ✅ | - | Free |
| D6 | **Volume Automation** | ❌ | ✅ | ✅ | ✅ | - | Tier Only |
| D7 | **Mastering Suite** | ❌ | ✅ | ✅ | ✅ | - | Tier Only |
| D8 | **Vocal Isolation** | 2/mo | 20/mo | Unlimited | Unlimited | 2/mo | Tier + Quota |

### Category E: Media Management (6 Features)

| # | Feature | Free | Pro | Team | Enterprise | Storage | Gating Type |
|---|---------|------|-----|------|-----------|---------|-------------|
| E1 | **Media Library** | ✅ | ✅ | ✅ | ✅ | 1GB | Tier + Storage |
| E2 | **Cloud Storage** | 1GB | 100GB | 500GB | Unlimited | See above | Tier + Storage |
| E3 | **Stock Media.** | 50/mo | Unlimited | Unlimited | Unlimited | Downloads | Tier + Quota |
| E4 | **Template Library** | Basic | Full | Full | Full | Count | Basic: 20, Pro: 200+ |
| E5 | **Project Versioning** | 5 versions | 50 versions | 200 versions | Unlimited | Count | Tier-based |
| E6 | **Asset Search** | Basic | Advanced | Advanced | Advanced | AI-powered | Free vs AI search |

### Category F: Social & Marketing (10 Features)

| # | Feature | Free | Pro | Team | Enterprise | Limits | Gating Type |
|---|---------|------|-----|------|-----------|--------|-------------|
| F1 | **Social Publishing** | 1 platform | All platforms | All platforms | All platforms | Platform count | Tier-based |
| F2 | **Scheduling** | 3 posts/mo | Unlimited | Unlimited | Unlimited | 3 posts | Tier + Quota |
| F3 | **Email Campaigns** | 100 emails/mo | 10,000/mo | 50,000/mo | Unlimited | 100 | Tier + Quota |
| F4 | **Hashtag Generation** | ✅ | ✅ | ✅ | ✅ | - | Free |
| F5 | **Analytics Dashboard** | Basic | Full | Full | Full | Metrics depth | Tier-based |
| F6 | **A/B Testing** | ❌ | ✅ | ✅ | ✅ | Tests/mo | Tier Only |
| F7 | **Lead Capture Forms** | 1 form | 10 forms | 50 forms | Unlimited | Form count | Tier-based |
| F8 | **Landing Pages** | ❌ | 5 pages | 25 pages | Unlimited | Page count | Tier Only |
| F9 | **Custom Branding** | ❌ | ✅ | ✅ | ✅ | - | Tier Only |
| F10 | **API Access** | ❌ | ❌ | ✅ | ✅ | API calls | Team+ |

### Category G: AI Agents & Automation (12 Agents)

| # | Agent/Feature | Free | Pro | Team | Enterprise | Calls | Gating Type |
|---|---------------|------|-----|------|-----------|-------|-------------|
| G1 | **Video Summarizer** | 5/mo | Unlimited | Unlimited | Unlimited | 5 | Tier + Quota |
| G2 | **Scene Detector** | ✅ | ✅ | ✅ | ✅ | - | Free |
| G3 | **Object Tracker** | 2/mo | Unlimited | Unlimited | Unlimited | 2 | Tier + Quota |
| G4 | **Motion Analyzer** | 2/mo | Unlimited | Unlimited | Unlimited | 2 | Tier + Quota |
| G5 | **Quality Enhancer** | ❌ | 10/mo | Unlimited | Unlimited | 10 | Tier Only |
| G6 | **Subtitle Translator** | 5 min/mo | Unlimited | Unlimited | Unlimited | 5 min | Tier + Quota |
| G7 | **Audio Dubber** | ❌ | 5/mo | Unlimited | Unlimited | 5 | Tier Only |
| G8 | **Script Parser** | 2/mo | Unlimited | Unlimited | Unlimited | 2 | Tier + Quota |
| G9 | **Shot Analyzer** | 5/mo | Unlimited | Unlimited | Unlimited | 5 | Tier + Quota |
| G10 | **Color Corrector AI** | 2/mo | Unlimited | Unlimited | Unlimited | 2 | Tier + Quota |
| G11 | **Content Classifier** | ✅ | ✅ | ✅ | ✅ | - | Free |
| G12 | **Custom Agent Builder** | ❌ | ❌ | ✅ | ✅ | Agents | Team+ |

### Category H: Advanced Features (9 Features)

| # | Feature | Free | Pro | Team | Enterprise | Limits | Gating Type |
|---|---------|------|-----|------|-----------|--------|-------------|
| H1 | **Custom Model Training** | ❌ | ❌ | Enterprise | ✅ | Models | Enterprise Only |
| H2 | **Batch Processing** | ❌ | 5 jobs | 20 jobs | Unlimited | Jobs | Tier-based |
| H3 | **Parallel Rendering** | ❌ | 2x | 4x | 8x | Speed | Tier-based |
| H4 | **API Access** | ❌ | ❌ | ✅ | ✅ | Rate-limited | Team+ |
| H5 | **Webhook Integration** | ❌ | ❌ | ✅ | ✅ | Events | Team+ |
| H6 | **White-label Export** | ❌ | ❌ | ✅ | ✅ | Watermarks | Team+ |
| H7 | **Dedicated Support** | Community | Email | Priority | 24/7 | SLA | Tier-based |
| H8 | **Custom Integration** | ❌ | ❌ | ❌ | ✅ | Projects | Enterprise Only |
| H9 | **SLA Guarantees** | ❌ | ❌ | ❌ | ✅ | Uptime | Enterprise Only |

### Category I: Utilities & Support (7 Features)

| # | Feature | Free | Pro | Team | Enterprise | Notes |
|---|---------|------|-----|------|-----------|-------|
| I1 | **Keyboard Shortcuts** | ✅ | ✅ | ✅ | ✅ | Free |
| I2 | **Drag & Drop** | ✅ | ✅ | ✅ | ✅ | Free |
| I3 | **Undo/Redo** | ✅ | ✅ | ✅ | ✅ | Free |
| I4 | **Auto-save** | ✅ | ✅ | ✅ | ✅ | Free |
| I5 | **Export to Cloud** | ❌ | ✅ | ✅ | ✅ | Tier Only |
| I6 | **Project Templates** | 3 | 25 | 100 | Unlimited | Count |
| I7 | **Collaboration Tools** | ❌ | ❌ | ✅ | ✅ | Tier-based |

---

## Feature Gating Implementation

### Supabase Schema for Gating

```sql
-- Subscription tiers
CREATE TABLE subscription_tiers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price_monthly DECIMAL(10,2),
  max_projects INTEGER,
  max_storage_gb INTEGER,
  max_ai_calls_monthly INTEGER,
  features JSONB
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tier_id INTEGER REFERENCES subscription_tiers(id),
  status VARCHAR(20) CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255)
);

-- Feature access control
CREATE TABLE feature_flags (
  id SERIAL PRIMARY KEY,
  feature_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  requires_tier INTEGER REFERENCES subscription_tiers(id),
  quota_per_month INTEGER DEFAULT NULL,
  meta JSONB DEFAULT '{}'
);

-- User feature usage tracking
CREATE TABLE feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feature_id INTEGER REFERENCES feature_flags(id),
  used_at TIMESTAMPTZ DEFAULT NOW(),
  quantity INTEGER DEFAULT 1
);

-- Seed tiers
INSERT INTO subscription_tiers (name, price_monthly, max_projects, max_storage_gb, max_ai_calls_monthly, features) VALUES
('Free', 0, 3, 1, 50, '{"watermark": true, "support": "community"}'),
('Pro', 29, 50, 100, 10000, '{"watermark": false, "support": "email"}'),
('Team', 99, 200, 500, 50000, '{"watermark": false, "support": "priority", "collaboration": true}'),
('Enterprise', 0, -1, -1, -1, '{"watermark": false, "support": "24/7", "custom": true}');
```

### Stripe Products & Prices

```javascript
// Stripe product configuration
const products = {
  free: {
    name: 'Free',
    prices: [{ amount: 0, interval: 'month' }],
    features: ['Basic applications', '50 AI calls/month', '1GB storage', 'Watermarked exports']
  },
  pro: {
    name: 'Pro',
    prices: [{ amount: 2900, interval: 'month' }],
    features: ['All Free features', 'Unlimited AI calls', '100GB storage', 'No watermarks', '4K exports', 'Email support']
  },
  team: {
    name: 'Team',
    prices: [{ amount: 9900, interval: 'month' }],
    features: ['All Pro features', 'Team collaboration', '500GB storage', 'Shared projects', 'Admin dashboard', 'Priority support']
  },
  enterprise: {
    name: 'Enterprise',
    prices: [{ amount: 0, interval: 'month' }], // Contact sales
    features: ['All Team features', 'Custom models', 'Dedicated support', 'SLA guarantees', 'Custom integrations']
  }
};
```

### Feature Check Function

```javascript
// Check if user has access to feature
async function checkFeatureAccess(userId, featureKey) {
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select(`
      tier_id,
      subscription_tiers!inner (
        features,
        max_ai_calls_monthly
      )
    `)
    .eq('user_id', userId)
    .single();

  if (!subscription) return { allowed: false, reason: 'no_subscription' };

  const tierFeatures = subscription.subscription_tiers.features;
  const isAllowed = tierFeatures[featureKey] !== false;

  // Check quota if applicable
  const feature = await getFeatureByKey(featureKey);
  if (feature.quota_per_month && isAllowed) {
    const usage = await getMonthlyUsage(userId, featureKey);
    if (usage >= feature.quota_per_month) {
      return { allowed: false, reason: 'quota_exceeded' };
    }
  }

  return { allowed: isAllowed, tier: subscription.tier_id };
}
```

### Usage Tracking Middleware

```javascript
// Track feature usage
async function trackFeatureUsage(userId, featureKey, quantity = 1) {
  // Check access first
  const access = await checkFeatureAccess(userId, featureKey);
  if (!access.allowed) {
    throw new Error(`Feature ${featureKey} not available on current tier`);
  }

  // Record usage
  await supabase.from('feature_usage').insert({
    user_id: userId,
    feature_id: (await getFeatureId(featureKey)),
    quantity
  });

  // Check if quota is exceeded
  const feature = await getFeatureByKey(featureKey);
  if (feature.quota_per_month) {
    const monthlyUsage = await getMonthlyUsage(userId, featureKey);
    if (monthlyUsage >= feature.quota_per_month) {
      throw new Error(`Monthly quota exceeded for ${featureKey}`);
    }
  }
}
```

---

## Application-Specific Gating

### Timeline Editor Gating

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|-----------|
| Basic editing | ✅ | ✅ | ✅ | ✅ |
| AI Fill Gap | 2/mo | Unlimited | Unlimited | Unlimited |
| AI Extend | 2/mo | Unlimited | Unlimited | Unlimited |
| SAM3 Masking | 5/mo | Unlimited | Unlimited | Unlimited |
| Music Generation | 3/mo | Unlimited | Unlimited | Unlimited |
| Multi-camera | ❌ | ✅ | ✅ | ✅ |
| Keyframe animation | ❌ | ✅ | ✅ | ✅ |
| Advanced transitions | ❌ | ✅ | ✅ | ✅ |
| Color scopes | ❌ | ✅ | ✅ | ✅ |
| Audio effects | Basic | Full | Full | Full |
| Export quality | 720p | 4K | 8K | 8K |
| Watermark | ✅ | ❌ | ❌ | ❌ |

### Image Studio Gating

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|-----------|
| Text-to-Image | 50/mo | Unlimited | Unlimited | Unlimited |
| Image-to-Image | 25/mo | Unlimited | Unlimited | Unlimited |
| Advanced filters | Basic | All | All | All |
| Batch generation | ❌ | 5/mo | 20/mo | Unlimited |
| High-res export | 1024px | 2048px | 4096px | 8192px |
| Commercial license | ❌ | ✅ | ✅ | ✅ |

### Video Studio Gating

| Feature | Free | Pro | Team | Enterprise |
|---------|------|-----|------|-----------|
| Video generation | 10/mo | Unlimited | Unlimited | Unlimited |
| Video length | 15s | 60s | 120s | 300s |
| Render quality | 720p | 4K | 8K | 8K |
| Render speed | Standard | Priority | Turbo | Dedicated |
| Custom codecs | ❌ | ✅ | ✅ | ✅ |
| Batch render | ❌ | 3 at once | 10 at once | Unlimited |

### Director App Gating

| Agent | Free | Pro | Team | Enterprise |
|-------|------|-----|------|-----------|
| Video Summarizer | 5/mo | Unlimited | Unlimited | Unlimited |
| Scene Detector | ✅ | ✅ | ✅ | ✅ |
| Object Tracker | 2/mo | Unlimited | Unlimited | Unlimited |
| Quality Enhancer | ❌ | 10/mo | Unlimited | Unlimited |
| Script Parser | 2/mo | Unlimited | Unlimited | Unlimited |
| Custom agents | ❌ | ❌ | 3 | Unlimited |

### ViMax App Gating

| Mode | Free | Pro | Team | Enterprise |
|------|------|-----|------|-----------|
| Idea2Video | 1/mo | 10/mo | 50/mo | Unlimited |
| Novel2Video | ❌ | 2/mo | 10/mo | Unlimited |
| Script2Video | ❌ | 5/mo | 25/mo | Unlimited |
| AutoCameo | ❌ | 2/mo | 10/mo | Unlimited |
| Parallel processing | ❌ | 2x | 4x | 8x |

---

## Watermark Strategy

### Free Tier Watermarks
- **Video**: Semi-transparent "Created with Higgsfield AI" in corner
- **Image**: "Sample" text overlay
- **Audio**: 3-second intro/outro with voice

### Removal Conditions
- Watermark removed for all paid tiers (Pro+)
- Enterprise can customize watermark (brand their own)

---

## Quota Management

### Monthly Reset
- All quotas reset on 1st of month
- Prorated upgrades/downgrades
- Overage charges: $0.10 per AI call, $0.50 per video minute

### Quota Boosters
- One-time quota purchases available
- Referral programs (bonus AI calls)
- Early adopter bonuses

---

## Implementation Checklist

### Required Data Structures
- [x] Supabase tables for tiers & subscriptions
- [x] Feature flags table
- [x] Usage tracking tables
- [x] Stripe products & prices configured

### Required Functions
- [ ] `checkFeatureAccess(userId, featureKey)`
- [ ] `trackFeatureUsage(userId, featureKey)`
- [ ] `getUserTier(userId)`
- [ ] `getRemainingQuota(userId, featureKey)`
- [ ] `upgradeSubscription(userId, tierId)`

### UI Components to Gate
- [ ] Modal windows (Hide/disable based on tier)
- [ ] Toolbar buttons (Show/hide/disable)
- [ ] Menu items (Disable with tooltip explaining upgrade)
- [ ] Export options (Quality/tier-dependent)
- [ ] AI generators (Quota tracking & limits)

---

## Testing Strategy

### Unit Tests
- Feature access validation
- Quota calculation
- Subscription status checks

### E2E Tests
- User journey per tier
- Gating behavior verification
- Upgrade flow testing
- Quota exhaustion handling

### Monitoring
- Usage analytics per feature
- Conversion funnel tracking
- Revenue per feature tracking
