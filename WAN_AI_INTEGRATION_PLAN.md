# Wan AI Video Effects Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate ONLY the unique Wan AI video effects (Cakeify, VHS, Samurai, Film Noir, Animal, Rotation) into VideoStudio effects mode, avoiding all duplications discovered in codebase audit.

**Architecture:** Extend existing VideoStudio effects mode with Wan AI effects selector and processing. Uses existing MuAPI infrastructure without replacing current functionality.

**Tech Stack:** JavaScript ES6+, HTML5, MuAPI REST API, existing VideoStudio component architecture

**CRITICAL SCOPE REDUCTION AFTER CODEBASE AUDIT:**
- ❌ **Storyboard**: StoryboardStudio.js already exists with full character/scene management
- ❌ **Face Swap**: ai-image-face-swap model already integrated in EditStudio
- ❌ **Background Removal**: ai-background-remover model already exists
- ❌ **Skin Enhancement**: ai-skin-enhancer model already integrated
- ❌ **Music Generation**: Suno already integrated in AudioStudio
- ❌ **Basic VFX**: vfx models and effects already exist
- ✅ **Wan AI Effects**: Unique cinematic video transformations not available elsewhere

**FOCUSED SCOPE**: Only add the 6 Wan AI video effects that provide unique cinematic transformations.

---

## Task 1: Add Wan AI Effects to Existing Video Effects Model

**Files:**
- Modify: `src/lib/models.js` - Enhance ai-video-effects model with Wan AI options
- Modify: `src/lib/muapiConfig.js` - Add Wan AI capabilities mapping

- [ ] **Step 1: Update existing ai-video-effects model**

```javascript
// In models.js, enhance the existing ai-video-effects model
{
  "id": "ai-video-effects",
  "name": "AI Video Effects (Enhanced)",
  "endpoint": "ai-video-effects",
  "family": "effects",
  "imageField": "image_url",
  "hasPrompt": true,
  "wanAiEffects": ["cakeify", "vhs", "samurai", "film-noir", "animal", "rotation"],
  "inputs": {
    "effectType": {
      "type": "string",
      "enum": ["cakeify", "vhs", "samurai", "film-noir", "animal", "rotation"],
      "default": "cakeify",
      "title": "Wan AI Effect Type"
    },
    // ... existing inputs
  }
}
```

- [ ] **Step 2: Add Wan AI effect configurations**

```javascript
// In muapiConfig.js
export const WAN_AI_EFFECTS = {
  cakeify: { name: 'Cakeify', description: 'Stylized animation effect' },
  vhs: { name: 'VHS Footage', description: 'Retro video tape effect' },
  samurai: { name: 'Samurai It', description: 'Character animation style' },
  'film-noir': { name: 'Film Noir', description: 'Cinematic black & white style' },
  animal: { name: 'Animal Transformation', description: 'Animal character effects' },
  rotation: { name: 'Rotation Effect', description: 'Dynamic rotation animations' }
};
```

- [ ] **Step 3: Test Wan AI effects configuration**

Run: `node -e "import { WAN_AI_EFFECTS } from './src/lib/muapiConfig.js'; console.log('Available effects:', Object.keys(WAN_AI_EFFECTS));"`

Expected: Shows all 6 Wan AI effect types

- [ ] **Step 4: Commit**

```bash
git add src/lib/models.js src/lib/muapiConfig.js
git commit -m "feat: add Wan AI effects configuration to existing ai-video-effects model"
```

---

## Task 2: Integrate Wan AI Effects into VideoStudio Effects Mode

**Files:**
- Modify: `src/components/VideoStudio.js` - Add Wan AI effects selector to existing effects UI

- [ ] **Step 1: Add Wan AI effects section to existing effects mode**

```javascript
// In VideoStudio effects mode, add Wan AI effects selector
function addWanAIEffectsSelector(container) {
  const wanSection = document.createElement('div');
  wanSection.className = 'mt-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg';
  wanSection.innerHTML = `
    <h4 class="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
      <span class="w-2 h-2 bg-purple-400 rounded-full"></span>
      Wan AI Video Effects
    </h4>
    <div class="space-y-3">
      <select id="wan-ai-effect" class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm">
        <option value="">Select Wan AI Effect...</option>
        <option value="cakeify">🎨 Cakeify - Stylized Animation</option>
        <option value="vhs">📼 VHS Footage - Retro Video</option>
        <option value="samurai">⚔️ Samurai It - Character Animation</option>
        <option value="film-noir">🎭 Film Noir - Cinematic Style</option>
        <option value="animal">🐾 Animal Transformation</option>
        <option value="rotation">🔄 Rotation Effect</option>
      </select>
      <button id="apply-wan-effect" class="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded text-sm font-medium transition-colors disabled:opacity-50">
        Apply Wan AI Effect
      </button>
    </div>
  `;

  wanSection.querySelector('#apply-wan-effect').addEventListener('click', applySelectedWanEffect);

  container.appendChild(wanSection);
}
```

- [ ] **Step 2: Implement Wan AI effect application**

```javascript
async function applySelectedWanEffect() {
  const effectType = document.getElementById('wan-ai-effect').value;
  if (!effectType) {
    showToast('Please select a Wan AI effect first', 'warning');
    return;
  }

  const currentVideo = getCurrentVideo();
  if (!currentVideo) {
    showToast('Please generate or upload a video first', 'warning');
    return;
  }

  const button = document.getElementById('apply-wan-effect');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Applying Effect...';

  showProcessingIndicator('Applying Wan AI Effect...');

  try {
    const result = await applyWanAIEffect(currentVideo, effectType, {
      prompt: `Apply ${effectType} style transformation`
    });

    if (result.success) {
      updateVideoDisplay(result.url);
      showToast(`Wan AI ${effectType} effect applied successfully`, 'success');
    }
  } catch (error) {
    showToast('Wan AI effect application failed', 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    hideProcessingIndicator();
  }
}
```

- [ ] **Step 3: Integrate with existing VideoStudio effects workflow**

Ensure Wan AI effects work alongside existing video effects without conflicts.

- [ ] **Step 4: Test Wan AI effects in VideoStudio**

Test that Wan AI effects can be applied to videos in effects mode.

- [ ] **Step 5: Commit**

```bash
git add src/components/VideoStudio.js
git commit -m "feat: integrate Wan AI effects into existing VideoStudio effects mode"
```

---

## Task 3: Add Wan AI Effects Processing Function

**Files:**
- Modify: `src/lib/muapiEnhanced.js` - Add applyWanAIEffect function

- [ ] **Step 1: Add Wan AI effects processing function**

```javascript
export async function applyWanAIEffect(videoData, effectType, options = {}) {
  const effectConfig = WAN_AI_EFFECTS[effectType];
  if (!effectConfig) {
    throw new Error(`Unknown Wan AI effect: ${effectType}`);
  }

  const payload = {
    prompt: options.prompt || `apply ${effectConfig.description.toLowerCase()}`,
    image_url: videoData.url,
    name: effectConfig.name,
    aspect_ratio: options.aspectRatio || '16:9',
    resolution: options.resolution || '480p',
    quality: options.quality || 'medium',
    duration: options.duration || 5
  };

  const result = await fetch(`${MUAPI_BASE_URL}/api/v1/generate_wan_ai_effects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': getApiKey() },
    body: JSON.stringify(payload)
  });

  if (result.ok) {
    const response = await result.json();
    return await pollForWanResult(response.data.request_id);
  }

  throw new Error('Wan AI effect application failed');
}

async function pollForWanResult(requestId) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const result = await fetch(`${MUAPI_BASE_URL}/api/v1/predictions/${requestId}/result`, {
      headers: { 'x-api-key': getApiKey() }
    });

    if (result.ok) {
      const data = await result.json();
      if (data.data?.status === 'completed') {
        return {
          success: true,
          url: data.data.outputs?.[0],
          data: data.data
        };
      } else if (data.data?.status === 'failed') {
        return {
          success: false,
          error: data.data.error || 'Processing failed'
        };
      }
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return { success: false, error: 'Polling timeout' };
}
```

- [ ] **Step 2: Test Wan AI effects processing**

```javascript
// Test the applyWanAIEffect function
const testResult = await applyWanAIEffect(
  { url: 'test-video.mp4' },
  'cakeify',
  { prompt: 'stylized transformation' }
);
console.log('Wan AI result:', testResult);
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/muapiEnhanced.js
git commit -m "feat: add Wan AI effects processing function with polling"
```

---

## Task 4: Add Error Handling and UI Polish

**Files:**
- Modify: `src/components/VideoStudio.js` - Add error handling and UI improvements

- [ ] **Step 1: Add processing indicators**

```javascript
function showProcessingIndicator(message = 'Processing...') {
  const indicator = document.createElement('div');
  indicator.id = 'wan-processing-indicator';
  indicator.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3';
  indicator.innerHTML = `
    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span class="text-sm font-medium">${message}</span>
  `;

  document.body.appendChild(indicator);
}

function hideProcessingIndicator() {
  const indicator = document.getElementById('wan-processing-indicator');
  if (indicator) indicator.remove();
}
```

- [ ] **Step 2: Add error handling**

```javascript
function showWanEffectError(error, effectType) {
  const errorToast = document.createElement('div');
  errorToast.className = 'fixed top-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
  errorToast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-red-200 mt-0.5">🎭</div>
      <div class="flex-1">
        <div class="font-semibold text-sm">Wan AI Effect Failed</div>
        <div class="text-xs opacity-90 mt-1">${effectType}: ${error.message.slice(0, 80)}...</div>
        <div class="text-xs opacity-75 mt-1">Using original video</div>
      </div>
    </div>
  `;

  document.body.appendChild(errorToast);
  setTimeout(() => errorToast.remove(), 5000);
}
```

- [ ] **Step 3: Add UI polish and validation**

```javascript
// Add validation and better UX
function validateWanEffectSelection() {
  const effectSelect = document.getElementById('wan-ai-effect');
  const applyButton = document.getElementById('apply-wan-effect');

  if (effectSelect.value) {
    applyButton.disabled = false;
    applyButton.classList.remove('opacity-50');
  } else {
    applyButton.disabled = true;
    applyButton.classList.add('opacity-50');
  }
}

// Initialize validation
document.getElementById('wan-ai-effect')?.addEventListener('change', validateWanEffectSelection);
```

- [ ] **Step 4: Test error handling and UI**

Test that errors are handled gracefully and UI provides good feedback.

- [ ] **Step 5: Commit**

```bash
git add src/components/VideoStudio.js
git commit -m "feat: add error handling and UI polish for Wan AI effects"
```

---

## Task 5: Create Integration Tests

**Files:**
- Create: `tests/integration/wan-ai-effects.test.js`

- [ ] **Step 1: Create focused tests for Wan AI effects**

```javascript
import { describe, it, expect, vi } from 'vitest';
import { applyWanAIEffect, WAN_AI_EFFECTS } from '../../src/lib/muapiEnhanced.js';

describe('Wan AI Effects', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should support all 6 Wan AI effect types', () => {
    expect(Object.keys(WAN_AI_EFFECTS)).toHaveLength(6);
    expect(WAN_AI_EFFECTS.cakeify.name).toBe('Cakeify');
    expect(WAN_AI_EFFECTS.vhs.name).toBe('VHS Footage');
    expect(WAN_AI_EFFECTS.samurai.name).toBe('Samurai It');
    expect(WAN_AI_EFFECTS['film-noir'].name).toBe('Film Noir');
    expect(WAN_AI_EFFECTS.animal.name).toBe('Animal Transformation');
    expect(WAN_AI_EFFECTS.rotation.name).toBe('Rotation Effect');
  });

  it('should apply Cakeify effect successfully', async () => {
    // Mock successful API responses
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({ data: { request_id: 'test-123' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => ({
          data: {
            status: 'completed',
            outputs: ['https://cdn.example.com/result.mp4']
          }
        })
      });

    const result = await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'cakeify'
    );

    expect(result.success).toBe(true);
    expect(result.url).toBe('https://cdn.example.com/result.mp4');
  });

  it('should handle API errors gracefully', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    const result = await applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'cakeify'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');
  });

  it('should reject invalid effect types', async () => {
    await expect(applyWanAIEffect(
      { url: 'https://example.com/video.mp4' },
      'invalid-effect'
    )).rejects.toThrow('Unknown Wan AI effect');
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test -- tests/integration/wan-ai-effects.test.js
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add tests/integration/wan-ai-effects.test.js
git commit -m "test: add integration tests for Wan AI effects"
```

---

## Summary

**FOCUSED INTEGRATION APPROACH:**
- **Scope**: Only 6 unique Wan AI video effects (no duplications)
- **Integration**: Enhanced existing VideoStudio effects mode
- **Features**: Cakeify, VHS, Samurai, Film Noir, Animal, Rotation effects
- **Quality**: Full error handling, processing indicators, tests, documentation

**Avoided Duplications:**
❌ Storyboard (StoryboardStudio.js exists)
❌ Face swap (ai-image-face-swap exists)
❌ Background removal (ai-background-remover exists)
❌ Skin enhancement (ai-skin-enhancer exists)
❌ Music generation (Suno exists)
❌ Basic VFX (vfx models exist)

**Added Unique Value:**
✅ **6 cinematic Wan AI video effects** that provide unique transformations not available in existing Open-Higgsfield-AI tools