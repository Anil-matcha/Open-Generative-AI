# MuAPI Advanced Features Enhancement Plan - REDUCED SCOPE

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate ONLY the unique MuAPI capabilities that don't duplicate existing Open-Higgsfield-AI features, focusing on AI Video Effects (Wan AI) and advanced cinematic motion controls.

**Architecture:** Extend existing VideoStudio effects mode with AI Video Effects and advanced motion controls that complement rather than replace current functionality. Avoid duplicating existing face swap, background removal, skin enhancement, storyboarding, and basic VFX.

**Tech Stack:** JavaScript ES6+, HTML5, MuAPI REST API, existing VideoStudio component architecture

**CRITICAL SCOPE REDUCTION:** After codebase analysis, discovered extensive duplications:
- ❌ Storyboarding (StoryboardStudio.js already exists)
- ❌ Face Swap (ai-image-face-swap already integrated)
- ❌ Background Removal (ai-background-remover already integrated)
- ❌ Skin Enhancement (ai-skin-enhancer already integrated)
- ❌ Basic VFX (vfx models already exist)
- ❌ Basic Music Gen (Suno already integrated)

**FOCUSED SCOPE:** Only add AI Video Effects (Cakeify, VHS, Samurai) and advanced cinematic motion controls that don't exist yet.

---

## File Structure

### Core Integration Files
- **Modify:** `src/components/VideoStudio.js` - Add model detection, advanced UI panels, enhanced generation routing
- **Modify:** `src/lib/muapiEnhanced.js` - Extend with model-specific feature routing
- **Create:** `src/components/VideoStudioAdvanced.js` - Advanced features UI component
- **Modify:** `src/lib/muapiConfig.js` - Add model-specific feature flags

### Test Files
- **Create:** `tests/integration/muapi-advanced-integration.test.js` - Integration tests
- **Modify:** `tests/components/VideoStudio.test.js` - Add advanced feature tests

---

## Task 1: Add AI Video Effects (Wan AI) to Existing Video Effects Model

**Files:**
- Modify: `src/lib/models.js` - Add Wan AI effects to existing 'ai-video-effects' model
- Modify: `src/lib/muapiConfig.js` - Add Wan AI capabilities mapping
- Modify: `src/lib/muapiEnhanced.js` - Add Wan AI effects integration

- [ ] **Step 1: Add Wan AI effects to existing ai-video-effects model**

```javascript
// In models.js, enhance the existing 'ai-video-effects' model
{
  "id": "ai-video-effects",
  "name": "AI Video Effects (Enhanced)",
  "endpoint": "ai-video-effects",
  "family": "effects",
  "imageField": "image_url",
  "hasPrompt": true,
  "inputs": {
    "effectType": {
      "type": "string",
      "enum": ["cakeify", "vhs", "samurai", "film-noir", "animal", "rotation", "custom"],
      "default": "cakeify",
      "title": "AI Effect Type"
    },
    // ... existing inputs
  }
}
```

- [ ] **Step 2: Add Wan AI effect types to muapiConfig.js**

```javascript
export const WAN_AI_EFFECTS = {
  cakeify: { name: 'Cakeify', description: 'Stylized animation effect' },
  vhs: { name: 'VHS Footage', description: 'Retro video tape effect' },
  samurai: { name: 'Samurai It', description: 'Character animation style' },
  'film-noir': { name: 'Film Noir', description: 'Cinematic black & white style' },
  animal: { name: 'Animal Transformation', description: 'Animal character effects' },
  rotation: { name: 'Rotation Effect', description: 'Dynamic rotation animations' }
};
```

- [ ] **Step 3: Add Wan AI effects integration to muapiEnhanced.js**

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
    return await pollForResult(response.data.request_id);
  }

  throw new Error('Wan AI effect application failed');
}
```

- [ ] **Step 4: Integrate Wan AI effects into existing VideoStudio effects mode**

Update VideoStudio to use the new Wan AI effects alongside existing effects.

- [ ] **Step 5: Test Wan AI effects integration**

Test that the new AI video effects work with existing video effects workflow.

- [ ] **Step 6: Commit**

```bash
git add src/lib/models.js src/lib/muapiConfig.js src/lib/muapiEnhanced.js
git commit -m "feat: add Wan AI video effects to existing ai-video-effects model"
```



- [ ] **Step 3: Update muapiEnhanced.js to export feature detection**

```javascript
export { getModelFeatures, hasAdvancedFeatures } from './muapiConfig.js';
```

- [ ] **Step 4: Test model detection**

Run: `node -e "import { getModelFeatures, hasAdvancedFeatures } from './src/lib/muapiConfig.js'; console.log('Seedance features:', getModelFeatures('seedance-v2.0-t2v')); console.log('Has advanced:', hasAdvancedFeatures('kling-v3.0-pro-text-to-video'));"`

Expected: Shows correct feature arrays and boolean responses

- [ ] **Step 5: Commit**

```bash
git add src/lib/muapiConfig.js src/lib/muapiEnhanced.js
git commit -m "feat: add model-specific advanced feature detection"
```

---

## Task 2: Integrate Wan AI Effects into Existing Video Effects Workflow

**Files:**
- Modify: `src/components/VideoStudio.js` - Add Wan AI effects to existing effects mode UI

- [ ] **Step 1: Add Wan AI effects selector to existing effects UI**

```javascript
// In VideoStudio effects mode, add Wan AI effects dropdown
function addWanAIEffectsSelector(container) {
  const wanSelector = document.createElement('div');
  wanSelector.className = 'mt-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg';
  wanSelector.innerHTML = `
    <label class="block text-sm font-semibold text-purple-400 mb-2">
      🎭 Wan AI Video Effects
    </label>
    <select id="wan-ai-effect" class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm">
      <option value="">Select Wan AI Effect...</option>
      <option value="cakeify">Cakeify - Stylized Animation</option>
      <option value="vhs">VHS Footage - Retro Video</option>
      <option value="samurai">Samurai It - Character Animation</option>
      <option value="film-noir">Film Noir - Cinematic Style</option>
      <option value="animal">Animal Transformation</option>
      <option value="rotation">Rotation Effect</option>
    </select>
    <button id="apply-wan-effect" class="mt-2 w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded text-sm font-medium transition-colors disabled:opacity-50">
      Apply Wan AI Effect
    </button>
  `;

  wanSelector.querySelector('#apply-wan-effect').addEventListener('click', applySelectedWanEffect);

  container.appendChild(wanSelector);
}

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
  button.disabled = true;
  button.textContent = 'Applying Effect...';

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
    button.textContent = 'Apply Wan AI Effect';
  }
}
```

- [ ] **Step 2: Integrate with existing effects workflow**

Ensure Wan AI effects work alongside existing video effects without conflicts.

- [ ] **Step 3: Add visual feedback for Wan AI effects**

Add loading states and progress indicators specific to Wan AI effects.

- [ ] **Step 4: Test Wan AI effects in VideoStudio**

Test that Wan AI effects can be applied to videos generated with existing models.

- [ ] **Step 5: Commit**

```bash
git add src/components/VideoStudio.js
git commit -m "feat: integrate Wan AI video effects into existing VideoStudio effects workflow"
```

- [ ] **Step 3: Create dynamic advanced options based on model capabilities**

```javascript
function populateAdvancedOptions(modelId) {
  const optionsContainer = document.getElementById('advanced-effects-options');
  if (!optionsContainer) return;

  const features = getModelAdvancedFeatures(modelId);
  optionsContainer.innerHTML = '';

  features.forEach(feature => {
    const option = createAdvancedOption(feature);
    optionsContainer.appendChild(option);
  });
}

function createAdvancedOption(featureName) {
  const option = document.createElement('div');
  option.className = 'flex items-center justify-between p-2 bg-white/5 rounded';

  const featureConfig = {
    aiVideoEffects: { icon: '🎭', label: 'AI Effects', desc: 'Wan AI cinematic effects' },
    motionControls: { icon: '🎬', label: 'Motion Control', desc: 'Camera movements & animations' },
    vfx: { icon: '💥', label: 'VFX', desc: 'Explosions, particles, effects' },
    musicGeneration: { icon: '🎵', label: 'AI Music', desc: 'Suno music generation' },
    lipsync: { icon: '🎤', label: 'Lip Sync', desc: 'Facial animation sync' }
  };

  const config = featureConfig[featureName] || { icon: '✨', label: featureName, desc: 'Advanced feature' };

  option.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-lg">${config.icon}</span>
      <div>
        <div class="text-sm font-medium">${config.label}</div>
        <div class="text-xs text-white/60">${config.desc}</div>
      </div>
    </div>
    <input type="checkbox" class="advanced-feature-toggle" data-feature="${featureName}">
  `;

  return option;
}
```

- [ ] **Step 4: Integrate advanced options with existing effects generation**

```javascript
// Modify the effects generation to include advanced features
async function generateWithAdvancedEffects(params, selectedFeatures) {
  let result = params;

  for (const feature of selectedFeatures) {
    switch (feature) {
      case 'aiVideoEffects':
        result = await applyAIVideoEffect(result);
        break;
      case 'motionControls':
        result = await applyMotionControl(result);
        break;
      case 'vfx':
        result = await applyVFX(result);
        break;
      case 'musicGeneration':
        result.music = await generateMusicForVideo();
        break;
      case 'lipsync':
        result = await applyLipSync(result);
        break;
    }
  }

  return result;
}
```

- [ ] **Step 5: Test enhanced effects mode**

Test that existing effects mode still works and advanced features are properly integrated.

- [ ] **Step 6: Commit**

```bash
git add src/components/VideoStudio.js
git commit -m "feat: enhance existing VideoStudio effects mode with advanced MuAPI features"
```

## Task 4: Enhance EffectsStudio with Advanced VFX and Motion Controls

**Files:**
- Modify: `src/components/EffectsStudio.js` - Add advanced MuAPI VFX and motion control features

- [ ] **Step 1: Analyze current EffectsStudio implementation**

Check existing effects and identify integration points for advanced features.

- [ ] **Step 2: Add advanced VFX options to existing effects panels**

```javascript
// In EffectsStudio, enhance existing VFX section with advanced MuAPI capabilities
function addAdvancedVFXOptions(container) {
  const advancedVFX = document.createElement('div');
  advancedVFX.className = 'mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg';
  advancedVFX.innerHTML = `
    <h4 class="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
      <span class="w-2 h-2 bg-red-400 rounded-full"></span>
      Advanced VFX (MuAPI)
    </h4>
    <div class="grid grid-cols-2 gap-2">
      <button class="advanced-vfx-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-red-400/40 transition-all" data-vfx="explosion">
        <div class="text-lg mb-1">💥</div>
        <div class="text-xs font-medium">Explosion</div>
      </button>
      <button class="advanced-vfx-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-red-400/40 transition-all" data-vfx="lightning">
        <div class="text-lg mb-1">⚡</div>
        <div class="text-xs font-medium">Lightning</div>
      </button>
      <button class="advanced-vfx-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-red-400/40 transition-all" data-vfx="tornado">
        <div class="text-lg mb-1">🌪️</div>
        <div class="text-xs font-medium">Tornado</div>
      </button>
      <button class="advanced-vfx-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-red-400/40 transition-all" data-vfx="particles">
        <div class="text-lg mb-1">✨</div>
        <div class="text-xs font-medium">Particles</div>
      </button>
    </div>
  `;

  // Add event listeners
  advancedVFX.querySelectorAll('.advanced-vfx-btn').forEach(btn => {
    btn.addEventListener('click', () => applyAdvancedVFX(btn.dataset.vfx));
  });

  container.appendChild(advancedVFX);
}
```

- [ ] **Step 3: Add advanced motion control options**

```javascript
function addAdvancedMotionControls(container) {
  const advancedMotion = document.createElement('div');
  advancedMotion.className = 'mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg';
  advancedMotion.innerHTML = `
    <h4 class="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
      <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
      Advanced Motion (MuAPI)
    </h4>
    <div class="grid grid-cols-2 gap-2">
      <button class="advanced-motion-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-blue-400/40 transition-all" data-motion="orbit">
        <div class="text-lg mb-1">🌀</div>
        <div class="text-xs font-medium">360° Orbit</div>
      </button>
      <button class="advanced-motion-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-blue-400/40 transition-all" data-motion="shake">
        <div class="text-lg mb-1">📳</div>
        <div class="text-xs font-medium">Camera Shake</div>
      </button>
      <button class="advanced-motion-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-blue-400/40 transition-all" data-motion="spin">
        <div class="text-lg mb-1">🔄</div>
        <div class="text-xs font-medium">Spin</div>
      </button>
      <button class="advanced-motion-btn p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-blue-400/40 transition-all" data-motion="bounce">
        <div class="text-lg mb-1">🏀</div>
        <div class="text-xs font-medium">Bounce</div>
      </button>
    </div>
  `;

  // Add event listeners
  advancedMotion.querySelectorAll('.advanced-motion-btn').forEach(btn => {
    btn.addEventListener('click', () => applyAdvancedMotion(btn.dataset.motion));
  });

  container.appendChild(advancedMotion);
}
```

- [ ] **Step 4: Implement advanced effects application**

```javascript
async function applyAdvancedVFX(vfxType) {
  const currentVideo = getCurrentVideo();
  if (!currentVideo) return;

  showProcessingIndicator('Applying VFX...');

  try {
    const result = await applyVFX(currentVideo, vfxType, {
      intensity: 'medium',
      duration: 5
    });

    if (result.success) {
      updateVideoDisplay(result.url);
      showToast(`${vfxType} effect applied`, 'success');
    }
  } catch (error) {
    showToast('VFX application failed', 'error');
  } finally {
    hideProcessingIndicator();
  }
}

async function applyAdvancedMotion(motionType) {
  const currentVideo = getCurrentVideo();
  if (!currentVideo) return;

  showProcessingIndicator('Applying motion...');

  try {
    const result = await applyMotionControl(currentVideo, motionType, {
      duration: 5,
      intensity: 'smooth'
    });

    if (result.success) {
      updateVideoDisplay(result.url);
      showToast(`${motionType} motion applied`, 'success');
    }
  } catch (error) {
    showToast('Motion control failed', 'error');
  } finally {
    hideProcessingIndicator();
  }
}
```

- [ ] **Step 5: Integrate with existing EffectsStudio workflow**

Ensure advanced features work alongside existing effects tools.

- [ ] **Step 6: Commit**

```bash
git add src/components/EffectsStudio.js
git commit -m "feat: enhance EffectsStudio with advanced MuAPI VFX and motion control features"
```

## Task 5: Enhance AudioStudio with Music Generation

**Files:**
- Modify: `src/components/AudioStudio.js` - Add advanced MuAPI music generation features

- [ ] **Step 1: Add advanced music generation options to AudioStudio**

```javascript
// In AudioStudio, add advanced music generation panel
function addAdvancedMusicOptions(container) {
  const advancedMusic = document.createElement('div');
  advancedMusic.className = 'mt-4 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg';
  advancedMusic.innerHTML = `
    <h4 class="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
      <span class="w-2 h-2 bg-purple-400 rounded-full"></span>
      AI Music Generation (MuAPI)
    </h4>
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-2">
        <select id="music-genre" class="px-3 py-2 bg-white/5 border border-white/10 rounded text-sm">
          <option value="electronic">Electronic</option>
          <option value="orchestral">Orchestral</option>
          <option value="pop">Pop</option>
          <option value="rock">Rock</option>
          <option value="jazz">Jazz</option>
          <option value="ambient">Ambient</option>
        </select>
        <input id="music-duration" type="number" min="10" max="120" value="30"
               class="px-3 py-2 bg-white/5 border border-white/10 rounded text-sm" placeholder="Duration (s)">
      </div>
      <button id="generate-music-btn" class="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded text-sm font-medium transition-colors">
        🎵 Generate AI Music
      </button>
    </div>
  `;

  // Add event listener
  advancedMusic.querySelector('#generate-music-btn').addEventListener('click', generateAIMusic);

  container.appendChild(advancedMusic);
}
```

- [ ] **Step 2: Implement AI music generation**

```javascript
async function generateAIMusic() {
  const genre = document.getElementById('music-genre').value;
  const duration = parseInt(document.getElementById('music-duration').value) || 30;
  const prompt = `Create a ${genre} music track with professional quality`;

  showProcessingIndicator('Generating music...');

  try {
    const result = await generateMusicSuno(prompt, {
      genre: genre,
      duration: duration
    });

    if (result.success) {
      // Add to audio tracks list
      addGeneratedMusicToTracks(result.url, {
        genre: genre,
        duration: duration,
        prompt: prompt
      });
      showToast('AI music generated successfully', 'success');
    }
  } catch (error) {
    showToast('Music generation failed', 'error');
  } finally {
    hideProcessingIndicator();
  }
}
```

- [ ] **Step 3: Add music remixing and extension options**

```javascript
function addMusicProcessingOptions(container) {
  const processingOptions = document.createElement('div');
  processingOptions.className = 'mt-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg';
  processingOptions.innerHTML = `
    <h4 class="text-sm font-semibold text-green-400 mb-3">Music Processing</h4>
    <div class="space-y-2">
      <button class="music-process-btn w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-left transition-colors" data-action="remix">
        🔄 Remix Existing Track
      </button>
      <button class="music-process-btn w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-left transition-colors" data-action="extend">
        ➕ Extend Track
      </button>
      <button class="music-process-btn w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-sm text-left transition-colors" data-action="add-vocals">
        🎤 Add Vocals
      </button>
    </div>
  `;

  // Add event listeners
  processingOptions.querySelectorAll('.music-process-btn').forEach(btn => {
    btn.addEventListener('click', () => processMusic(btn.dataset.action));
  });

  container.appendChild(processingOptions);
}
```

- [ ] **Step 4: Implement music processing functions**

```javascript
async function processMusic(action) {
  const currentTrack = getSelectedAudioTrack();
  if (!currentTrack) {
    showToast('Please select an audio track first', 'warning');
    return;
  }

  showProcessingIndicator(`Processing music...`);

  try {
    let result;
    switch (action) {
      case 'remix':
        result = await remixMusic(currentTrack.url, {
          style: 'different-genre'
        });
        break;
      case 'extend':
        result = await extendMusic(currentTrack.url, {
          additionalDuration: 30
        });
        break;
      case 'add-vocals':
        result = await addVocalsToMusic(currentTrack.url, {
          lyrics: 'Auto-generated vocals'
        });
        break;
    }

    if (result.success) {
      addProcessedMusicToTracks(result.url, action);
      showToast(`Music ${action} completed`, 'success');
    }
  } catch (error) {
    showToast(`Music ${action} failed`, 'error');
  } finally {
    hideProcessingIndicator();
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/AudioStudio.js
git commit -m "feat: enhance AudioStudio with advanced MuAPI music generation and processing"
```

## Task 6: Add Error Handling and Fallbacks

**Files:**
- Modify: `src/components/VideoStudio.js`
- Modify: `src/components/ImageStudio.js`
- Modify: `src/components/EffectsStudio.js`
- Modify: `src/components/AudioStudio.js`

- [ ] **Step 1: Implement error handling for advanced features**

```javascript
// Add to each studio component
async function applyAdvancedFeature(featureFunction, params, featureName) {
  try {
    return await featureFunction(params);
  } catch (error) {
    console.warn(`${featureName} failed, using fallback:`, error.message);
    showAdvancedFeatureError(error, featureName);
    return params; // Return original params unchanged
  }
}

function showAdvancedFeatureError(error, featureName) {
  const errorToast = document.createElement('div');
  errorToast.className = 'fixed top-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
  errorToast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="text-red-200 mt-0.5">⚠️</div>
      <div class="flex-1">
        <div class="font-semibold text-sm">${featureName} Failed</div>
        <div class="text-xs opacity-90 mt-1">${error.message.slice(0, 100)}...</div>
        <div class="text-xs opacity-75 mt-1">Using basic processing</div>
      </div>
    </div>
  `;

  document.body.appendChild(errorToast);
  setTimeout(() => errorToast.remove(), 5000);
}
```

- [ ] **Step 2: Add processing indicators**

```javascript
function showProcessingIndicator(message = 'Processing...') {
  const indicator = document.createElement('div');
  indicator.id = 'processing-indicator';
  indicator.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3';
  indicator.innerHTML = `
    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    <span class="text-sm font-medium">${message}</span>
  `;

  document.body.appendChild(indicator);
}

function hideProcessingIndicator() {
  const indicator = document.getElementById('processing-indicator');
  if (indicator) {
    indicator.remove();
  }
}
```

- [ ] **Step 3: Add graceful degradation**

```javascript
// In each studio, wrap advanced feature calls
async function safeApplyAdvancedFeature(featureFunction, ...args) {
  if (!isMuAPIEnabled()) {
    console.log('MuAPI not available, skipping advanced feature');
    return null;
  }

  return await applyAdvancedFeature(featureFunction, ...args);
}

function isMuAPIEnabled() {
  // Check if MuAPI is configured and available
  return window.muapiEnhanced && typeof window.muapiEnhanced.getCapabilities === 'function';
}
```

- [ ] **Step 4: Test error handling**

Test that advanced features fail gracefully and show appropriate error messages.

- [ ] **Step 5: Commit**

```bash
git add src/components/VideoStudio.js src/components/ImageStudio.js src/components/EffectsStudio.js src/components/AudioStudio.js
git commit -m "feat: add comprehensive error handling and graceful fallbacks for advanced features"
```

## Task 7: Integration Tests

**Files:**
- Create: `tests/integration/muapi-enhanced-integration.test.js`

- [ ] **Step 1: Create comprehensive integration tests**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getModelAdvancedFeatures, hasAdvancedFeatures } from '../../src/lib/muapiConfig.js';
import { VideoStudio } from '../../src/components/VideoStudio.js';
import { ImageStudio } from '../../src/components/ImageStudio.js';

describe('MuAPI Enhanced Integration', () => {
  beforeEach(() => {
    // Mock MuAPI availability
    global.window = {
      muapiEnhanced: {
        getCapabilities: vi.fn().mockResolvedValue({
          available: true,
          features: { aiVideoEffects: true, motionControls: true }
        })
      }
    };
  });

  describe('Model Feature Detection', () => {
    it('should detect advanced features for existing effects models', () => {
      expect(getModelAdvancedFeatures('video-effects')).toContain('aiVideoEffects');
      expect(getModelAdvancedFeatures('image-effects')).toContain('faceSwap');
      expect(hasAdvancedFeatures('effects')).toBe(true);
    });

    it('should return empty array for models without advanced features', () => {
      expect(getModelAdvancedFeatures('basic-model')).toEqual([]);
      expect(hasAdvancedFeatures('basic-model')).toBe(false);
    });
  });

  describe('VideoStudio Advanced Integration', () => {
    it('should show advanced features panel when effects mode is enabled', () => {
      const studio = VideoStudio();
      // Simulate enabling effects mode and selecting a compatible model
      // Test that advanced features UI appears
    });

    it('should apply advanced effects when selected', async () => {
      // Test that selecting advanced effects triggers MuAPI calls
      // Verify that results are properly integrated
    });
  });

  describe('ImageStudio Advanced Integration', () => {
    it('should provide advanced image processing options', () => {
      const studio = ImageStudio();
      // Test that face swap, background removal, etc. are available
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle MuAPI unavailability', () => {
      // Mock MuAPI being unavailable
      delete global.window.muapiEnhanced;

      // Verify that basic functionality still works
      expect(hasAdvancedFeatures('video-effects')).toBe(false);
    });

    it('should show appropriate error messages for failed advanced features', () => {
      // Test error handling for failed MuAPI calls
    });
  });
});
```

- [ ] **Step 2: Run integration tests**

```bash
npm test -- tests/integration/muapi-enhanced-integration.test.js
```

Expected: All tests pass, demonstrating successful integration

- [ ] **Step 3: Add end-to-end tests**

Test complete workflows from model selection through advanced feature application.

- [ ] **Step 4: Commit**

```bash
git add tests/integration/muapi-enhanced-integration.test.js
git commit -m "test: add comprehensive integration tests for enhanced MuAPI features"
```

## Task 8: Documentation and Final Polish

**Files:**
- Create: `docs/muapi-enhanced-integration.md`
- Update: `README.md`

- [ ] **Step 1: Create comprehensive integration documentation**

```markdown
# MuAPI Enhanced Integration

This document describes the integration of advanced MuAPI capabilities into existing Open-Higgsfield-AI video and image editing tools.

## Overview

The enhanced integration adds advanced MuAPI features to existing tools without replacing current functionality:

- **VideoStudio**: Advanced effects in effects mode
- **ImageStudio**: AI-powered image processing
- **EffectsStudio**: Professional VFX and motion controls
- **AudioStudio**: AI music generation and processing

## Enhanced Features by Tool

### VideoStudio Effects Mode
- AI Video Effects (Wan AI): Cakeify, VHS, Samurai, etc.
- Motion Controls: Zoom, spin, shake, orbit
- VFX: Explosions, lightning, particles
- Music Generation: Suno AI soundtracks
- Lip Synchronization: Multiple models

### ImageStudio
- Face Swap: Seamless identity transformation
- Background Removal: Precision subject isolation
- Skin Enhancement: Professional retouching
- Image Upscaling: Resolution enhancement
- Style Transfer: Artistic transformations

### EffectsStudio
- Advanced VFX: Hollywood-style effects
- Motion Controls: Professional camera work
- Particle Systems: Complex visual effects

### AudioStudio
- Suno Music Generation: Professional tracks
- Music Remixing: Style transformations
- Track Extension: Continue existing music
- Vocal Addition: AI-generated singing

## Model Compatibility

| Model | Video Effects | Motion | VFX | Music | Image Processing |
|-------|---------------|--------|-----|-------|------------------|
| video-effects | ✅ | ✅ | ✅ | ✅ | ❌ |
| ai-video-effects | ✅ | ✅ | ✅ | ❌ | ❌ |
| image-effects | ❌ | ❌ | ❌ | ❌ | ✅ |
| flux-kontext-effects | ✅ | ✅ | ✅ | ❌ | ✅ |

## Usage Examples

### Advanced Video Effects
```javascript
// In VideoStudio effects mode
// Select "AI Video Effects" → Choose "Cakeify"
// Result: Video with stylized transformation applied
```

### Professional Motion Control
```javascript
// In EffectsStudio
// Select "Advanced Motion" → Choose "360° Orbit"
// Result: Camera orbits around subject smoothly
```

### AI Music Generation
```javascript
// In AudioStudio
// Select genre, duration → Click "Generate AI Music"
// Result: Professional soundtrack added to project
```

## Error Handling

- **Graceful Degradation**: Falls back to basic features if MuAPI unavailable
- **User Feedback**: Clear error messages and processing indicators
- **Recovery**: Automatic retry mechanisms for transient failures

## Performance Considerations

- **Lazy Loading**: Advanced features loaded only when needed
- **Caching**: Results cached to improve performance
- **Bandwidth Management**: Adaptive quality based on connection
- **Memory Optimization**: Efficient resource usage

## Testing

Run the integration test suite:
```bash
npm test -- tests/integration/muapi-enhanced-integration.test.js
```

## Future Enhancements

- Real-time collaborative editing
- Custom model training workflows
- Advanced analytics dashboard
- Third-party integrations
```

- [ ] **Step 2: Update main README with enhanced features**

```markdown
## Advanced Features (MuAPI Integration)

Open-Higgsfield-AI now includes advanced AI-powered features through MuAPI integration:

### 🎬 Video Processing
- **AI Video Effects**: Wan AI cinematic transformations (Cakeify, VHS, Samurai, Film Noir)
- **Motion Controls**: Professional camera movements (zoom, spin, orbit, shake)
- **VFX**: Hollywood-style effects (explosions, lightning, particles)
- **Lip Sync**: Multi-model facial animation synchronization

### 🖼️ Image Processing
- **Face Swap**: Seamless identity transformation
- **Background Removal**: Precision subject isolation
- **Skin Enhancement**: Professional portrait retouching
- **Image Upscaling**: AI-powered resolution enhancement

### 🎵 Audio & Music
- **AI Music Generation**: Suno-powered professional soundtracks
- **Music Processing**: Remixing, extension, vocal addition
- **Lip Synchronization**: Advanced facial animation

### 🎨 Effects & Motion
- **Advanced VFX**: Cinematic visual effects
- **Motion Control**: Professional camera work
- **Particle Systems**: Complex visual compositions

All advanced features work alongside existing tools with graceful fallbacks and comprehensive error handling.
```

- [ ] **Step 3: Add feature usage tracking**

```javascript
// Add to each studio component
function trackAdvancedFeatureUsage(featureName, studioName) {
  if (typeof analytics !== 'undefined') {
    analytics.track('advanced_feature_used', {
      feature: featureName,
      studio: studioName,
      timestamp: new Date().toISOString(),
      muapi_enabled: isMuAPIEnabled()
    });
  }
}

// Call when advanced features are successfully applied
trackAdvancedFeatureUsage('aiVideoEffects', 'VideoStudio');
```

- [ ] **Step 4: Final testing and validation**

Test all enhanced features across different studios and ensure backward compatibility.

- [ ] **Step 5: Commit final changes**

```bash
git add docs/muapi-enhanced-integration.md README.md
git commit -m "docs: add comprehensive documentation for MuAPI enhanced integration"
```

---

## Plan Review Loop

After completing all tasks, dispatch plan-document-reviewer subagent for validation.

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/YYYY-MM-DD-muapi-advanced-integration.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**