/**
 * Generate Panel Module
 * Handles the AI generation panel with types, prompts, and settings
 */

export function renderGenerateTypes(generateTypes, selectedType, container, onTypeSelect, showToast) {
  if (!container) return;

  container.innerHTML = '';
  generateTypes.forEach(([icon, label]) => {
    const btn = document.createElement('button');
    btn.className = `generate-type ${selectedType === label ? 'active' : ''}`;
    btn.innerHTML = `<span class="emoji">${icon}</span><span>${label}</span>`;
    btn.addEventListener('click', () => {
      onTypeSelect(label);
      showToast(`${label} mode selected`);
    });
    container.appendChild(btn);
  });
}

export function generateClip(prompt, state, showToast) {
  if (!prompt) {
    prompt = `${state.generateType} cinematic shot`;
  }

  const track = state.tracks.find(t => t.name === 'Video') || state.tracks[0];
  const clipId = Date.now();
  const duration = parseFloat(document.getElementById('durationSelect')?.value || '5');
  const startTime = Math.min(state.timelineSeconds - duration, 5 + track.items.length * 8);

  const newClip = {
    id: clipId,
    assetId: 'asset-gen-' + clipId,
    type: 'video',
    start: startTime,
    end: startTime + duration,
    sourceStart: 0,
    sourceEnd: duration,
    lane: 0,
    trimIn: 0,
    trimOut: duration,
    volume: 1,
    playbackRate: 1,
    effects: [],
    name: `${state.generateType}: ${prompt.slice(0, 18)}`
  };

  track.items.push(newClip);

  // Add to assets
  const newAsset = {
    id: 'asset-gen-' + clipId,
    type: 'video',
    name: prompt,
    duration,
    url: null
  };
  state.assets.push(newAsset);

  state.selectedClipId = clipId;

  // Add to chat history
  state.chat.push({ role: 'user', text: `${state.generateType} generate: ${prompt}` });
  state.chat.push({
    role: 'ai',
    text: `Created a ${state.generateType.toLowerCase()} clip with ${document.getElementById('durationSelect')?.value || '5'}, ${document.getElementById('aspectSelect')?.value || '16:9'}, ${document.getElementById('styleSelect')?.value || 'Cinematic'}.`
  });

  return { newClip, track };
}

export function updateGeneratePanel(state, els) {
  // Update form values based on state
  const promptInput = document.getElementById('promptInput');
  const negativeInput = document.getElementById('negativeInput');
  const durationSelect = document.getElementById('durationSelect');
  const aspectSelect = document.getElementById('aspectSelect');
  const styleSelect = document.getElementById('styleSelect');

  if (promptInput) promptInput.value = promptInput.value || '';
  if (negativeInput) negativeInput.value = negativeInput.value || '';
  if (durationSelect) durationSelect.value = durationSelect.value || '5';
  if (aspectSelect) aspectSelect.value = aspectSelect.value || '16:9';
  if (styleSelect) styleSelect.value = styleSelect.value || 'Cinematic';
}

export function validateGenerateRequest(state) {
  const errors = [];

  if (!state.generateType) {
    errors.push('Please select a generation type');
  }

  const prompt = document.getElementById('promptInput')?.value?.trim();
  if (!prompt) {
    errors.push('Please enter a prompt');
  }

  const duration = parseFloat(document.getElementById('durationSelect')?.value || '5');
  if (duration < 1 || duration > 20) {
    errors.push('Duration must be between 1 and 20 seconds');
  }

  return errors;
}

export function createGeneratePatch(prompt, state) {
  return {
    action: 'generate_clip',
    type: state.generateType,
    prompt,
    duration: parseFloat(document.getElementById('durationSelect')?.value || '5'),
    aspectRatio: document.getElementById('aspectSelect')?.value || '16:9',
    style: document.getElementById('styleSelect')?.value || 'Cinematic',
    negativePrompt: document.getElementById('negativeInput')?.value || ''
  };
}

export function applyGeneratePatch(patch, state, showToast) {
  if (patch.action === 'generate_clip') {
    const result = generateClip(patch.prompt, state, showToast);
    return result;
  }

  return null;
}