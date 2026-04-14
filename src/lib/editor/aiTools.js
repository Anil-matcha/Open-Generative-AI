// Cutout Pro Features Integration
export const AI_FEATURES = [
  {
    id: 'generate-video',
    title: 'Generate Video',
    icon: 'Video',
    category: 'VIDEO',
    description: 'Create AI-generated videos from images or text prompts',
    modelTarget: 'veo',
    requiresTextInput: true,
    aspectRatioOption: true,
    acceptedFileTypes: 'image/*',
    defaultPrompt: 'Cinematic movement, bring this to life'
  },
  {
    id: 'generate-image',
    title: 'Generate Image',
    icon: 'Image',
    category: 'GENERATION',
    description: 'Create stunning AI artwork from text descriptions',
    modelTarget: 'imagen',
    requiresTextInput: true,
    aspectRatioOption: true
  },
  {
    id: 'bg-remove',
    title: 'Remove Background',
    icon: 'ImageMinus',
    category: 'IMAGE_EDITING',
    description: 'Remove backgrounds from images',
    modelTarget: 'flash-image-edit',
    defaultPrompt: 'Remove the background, transparent result',
    requiresImageInput: true,
    acceptedFileTypes: 'image/*'
  },
  {
    id: 'replace-bg',
    title: 'Replace Background',
    icon: 'RefreshCw',
    category: 'IMAGE_EDITING',
    description: 'Swap backgrounds with AI',
    modelTarget: 'flash-image-edit',
    requiresImageInput: true,
    requiresTextInput: true,
    defaultPrompt: 'Replace the background with a scenic mountain view',
    acceptedFileTypes: 'image/*'
  },
  {
    id: 'enhance',
    title: 'Enhance Photo',
    icon: 'Wand2',
    category: 'IMAGE_EDITING',
    description: 'Upscale and enhance image quality',
    modelTarget: 'flash-image-edit',
    defaultPrompt: 'Enhance sharpness and clarity, upscale details',
    requiresImageInput: true,
    acceptedFileTypes: 'image/*'
  },
  {
    id: 'colorize',
    title: 'Colorize',
    icon: 'Palette',
    category: 'IMAGE_EDITING',
    description: 'Add color to black & white photos',
    modelTarget: 'flash-image-edit',
    defaultPrompt: 'Colorize this black and white photo realistically',
    requiresImageInput: true,
    acceptedFileTypes: 'image/*'
  },
  {
    id: 'cartoon',
    title: 'Cartoonify',
    icon: 'Smile',
    category: 'IMAGE_EDITING',
    description: 'Transform into cartoon style',
    modelTarget: 'flash-image-edit',
    defaultPrompt: 'Transform into high quality 3D cartoon character',
    requiresImageInput: true,
    acceptedFileTypes: 'image/*'
  },
  {
    id: 'text-to-speech',
    title: 'Text to Speech',
    icon: 'Mic2',
    category: 'AUDIO',
    description: 'Generate voiceovers with AI',
    modelTarget: 'tts',
    requiresTextInput: true,
    defaultPrompt: 'Welcome to our service. We provide the best AI solutions.'
  },
  {
    id: 'record',
    title: 'Record Webcam',
    icon: 'Video',
    category: 'VIDEO',
    description: 'Record from your camera',
    modelTarget: 'recorder'
  },
  {
    id: 'cutout-pro',
    title: 'Cutout Pro',
    icon: 'ImageMinus',
    category: 'CUTOUT_PRO',
    description: 'Professional background removal and image editing',
    modelTarget: 'cutout-pro',
    requiresImageInput: true,
    acceptedFileTypes: 'image/*',
    features: ['backgroundRemoval', 'backgroundReplacement', 'passportMaker', 'cartoonSelfie', 'photoAnimer']
  }
];

export function renderAITools(selectedFeature, onSelectFeature, container) {
  if (!container) return;
  container.innerHTML = '';

  AI_FEATURES.forEach(feature => {
    const toolBtn = document.createElement('button');
    toolBtn.className = `tool-item ${selectedFeature?.id === feature.id ? 'active' : ''}`;
    toolBtn.innerHTML = `
      <div class="tool-icon">${getIcon(feature.icon)}</div>
      <div class="tool-info">
        <div class="tool-title">${feature.title}</div>
        <div class="tool-desc">${feature.description}</div>
      </div>
    `;
    toolBtn.onclick = () => onSelectFeature(feature);
    container.appendChild(toolBtn);
  });
}

export function getIcon(iconName) {
  const icons = {
    'Video': '🎥',
    'Image': '🖼️',
    'ImageMinus': '🖼️➖',
    'RefreshCw': '🔄',
    'Wand2': '✨',
    'Palette': '🎨',
    'Smile': '😊',
    'Mic2': '🎤'
  };
  return icons[iconName] || '⚡';
}

export function renderToolControls(selectedFeature, prompt, aspectRatio, previewUrl, result, isLoading, onGenerate, onFileChange) {
  if (!selectedFeature) {
    return '<div class="no-tool">Select an AI tool to begin</div>';
  }

  return `
    <div class="tool-header">
      <div class="tool-icon-large">${getIcon(selectedFeature.icon)}</div>
      <div>
        <h3>${selectedFeature.title}</h3>
        <p>${selectedFeature.description}</p>
      </div>
    </div>
    <div class="tool-form">
      ${renderFileInput(selectedFeature, previewUrl)}
      ${renderPromptInput(selectedFeature, prompt)}
      ${renderAspectRatioSelect(selectedFeature, aspectRatio)}
      <button class="generate-btn" id="generateBtn" ${isLoading ? 'disabled' : ''}>
        ${isLoading ? 'Processing...' : 'Generate'}
      </button>
      ${renderResult(result)}
    </div>
  `;
}

function renderFileInput(feature, previewUrl) {
  if (!feature.requiresImageInput) return '';

  return `
    <div class="form-group">
      <label>Source Image</label>
      <input type="file" id="fileInput" accept="${feature.acceptedFileTypes || 'image/*'}">
      ${previewUrl ? `<img src="${previewUrl}" class="file-preview" />` : ''}
    </div>
  `;
}

function renderPromptInput(feature, prompt) {
  if (!feature.requiresTextInput && !feature.defaultPrompt) return '';

  return `
    <div class="form-group">
      <label>${feature.requiresTextInput ? 'Prompt' : 'Instructions (Optional)'}</label>
      <textarea id="promptInput" rows="3" placeholder="${feature.defaultPrompt || 'Describe what you want...'}">${prompt}</textarea>
    </div>
  `;
}

function renderAspectRatioSelect(feature, aspectRatio) {
  if (!feature.aspectRatioOption) return '';

  return `
    <div class="form-group">
      <label>Aspect Ratio</label>
      <select id="aspectSelect">
        <option value="1:1" ${aspectRatio === '1:1' ? 'selected' : ''}>Square (1:1)</option>
        <option value="16:9" ${aspectRatio === '16:9' ? 'selected' : ''}>Landscape (16:9)</option>
        <option value="9:16" ${aspectRatio === '9:16' ? 'selected' : ''}>Portrait (9:16)</option>
        <option value="4:3" ${aspectRatio === '4:3' ? 'selected' : ''}>Classic (4:3)</option>
      </select>
    </div>
  `;
}

function renderResult(result) {
  if (!result) return '';

  return `
    <div class="result">
      ${result.type === 'image' ? `<img src="${result.url}" />` : ''}
      ${result.type === 'video' ? `<video src="${result.url}" controls />` : ''}
      ${result.type === 'text' ? `<p>${result.text}</p>` : ''}
      <button class="add-to-timeline-btn" onclick="addToTimeline()">Add to Timeline</button>
    </div>
  `;
}

export async function handleGenerate(selectedFeature, selectedFile, showToast) {
  if (!selectedFeature) return;

  try {
    const hasKey = await window.generationService.providers.gemini.checkApiKey();
    if (!hasKey) {
      throw new Error('Please configure your Google AI API key first.');
    }

    const request = {
      mode: selectedFeature.id,
      prompt: document.getElementById('promptInput')?.value || selectedFeature.defaultPrompt,
      aspectRatio: document.getElementById('aspectSelect')?.value || '16:9',
      references: selectedFile ? [URL.createObjectURL(selectedFile)] : undefined
    };

    const genResult = await window.generationService.submit(request, 'gemini');

    if (genResult.status === 'completed') {
      return {
        type: selectedFeature.category === 'VIDEO' ? 'video' :
              selectedFeature.category === 'AUDIO' ? 'audio' : 'image',
        url: genResult.previewUrl
      };
    } else {
      return { type: 'text', text: `Error: ${genResult.error}` };
    }
  } catch (error) {
    return { type: 'text', text: `Error: ${error.message}` };
  }
}