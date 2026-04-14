import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createMediaPreview, createFullscreenPreview } from './MediaPreview.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { i2iModels, i2vModels } from '../lib/models.js';
import { createHeroSection } from '../lib/thumbnails.js';

const EFFECT_TABS = [
  { id: 'image-effects', label: 'Image Effects', type: 'i2i', field: 'name' },
  { id: 'nano-banana-effects', label: 'Nano Banana', type: 'i2i', field: 'name' },
  { id: 'flux-kontext-effects', label: 'Kontext Effects', type: 'i2i', field: 'name' },
  { id: 'ai-video-effects', label: 'AI Video Effects', type: 'i2v', field: 'name' },
  { id: 'custom-ai-video-effects', label: 'Custom AI Effects', type: 'muapi-custom', field: 'prompt' },
  { id: 'motion-controls', label: 'Motion Controls', type: 'i2v', field: 'name' },
  { id: 'video-effects', label: 'Video FX v2', type: 'i2v', field: 'name' },
];

function getEffectsForModel(modelId) {
  // Special handling for custom AI video effects - no preset effects needed
  if (modelId === 'custom-ai-video-effects') return [];

  const allModels = [...i2iModels, ...i2vModels];
  const model = allModels.find(m => m.id === modelId);
  if (!model) return [];
  const nameField = model.inputs?.name;
  if (nameField?.enum) return nameField.enum;
  return [];
}

export function EffectsStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden relative';

  let activeTab = EFFECT_TABS[0];
  let selectedEffect = null;
  let uploadedUrl = null;

  const fullscreen = createFullscreenPreview();
  container.appendChild(fullscreen.element);

  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0';
  const effectsBanner = createHeroSection('effects', 'h-32 md:h-44 mb-4');
  if (effectsBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';

    const h1 = document.createElement('h1');
    h1.className = 'text-2xl md:text-3xl font-black text-white tracking-tight mb-1';
    h1.textContent = 'Effects Studio';

    const p = document.createElement('p');
    p.className = 'text-white/60 text-xs';
    p.textContent = 'Apply 350+ visual effects to your photos and videos';

    bannerText.appendChild(h1);
    bannerText.appendChild(p);
    effectsBanner.appendChild(bannerText);
    topBar.appendChild(effectsBanner);
  } else {
    const h1 = document.createElement('h1');
    h1.className = 'text-2xl md:text-3xl font-black text-white tracking-tight mb-1';
    h1.textContent = 'Effects Studio';

    const p = document.createElement('p');
    p.className = 'text-secondary text-xs mb-4';
    p.textContent = 'Apply 350+ visual effects to your photos and videos';

    topBar.appendChild(h1);
    topBar.appendChild(p);
  }

  const tabRow = document.createElement('div');
  tabRow.className = 'flex gap-2 overflow-x-auto no-scrollbar pb-2';

  const tabButtons = {};
  EFFECT_TABS.forEach(tab => {
    const btn = document.createElement('button');
    const count = getEffectsForModel(tab.id).length;
    btn.className = 'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all';
    btn.textContent = `${tab.label} (${count})`;
    btn.onclick = () => switchTab(tab);
    tabButtons[tab.id] = btn;
    tabRow.appendChild(btn);
  });

  topBar.appendChild(tabRow);

  const inlineInstructions = createInlineInstructions('effects');
  inlineInstructions.classList.add('mt-2');
  topBar.appendChild(inlineInstructions);

  container.appendChild(topBar);

  const bodyArea = document.createElement('div');
  bodyArea.className = 'flex flex-1 overflow-hidden';

  const effectsPanel = document.createElement('div');
  effectsPanel.className = 'w-full md:w-[340px] lg:w-[400px] shrink-0 overflow-y-auto px-4 md:px-6 pb-6 md:border-r border-white/5';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search effects...';
  searchInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors mb-3';
  effectsPanel.appendChild(searchInput);

  const effectsGrid = document.createElement('div');
  effectsGrid.className = 'grid grid-cols-2 gap-2';
  effectsPanel.appendChild(effectsGrid);

  const previewPanel = document.createElement('div');
  previewPanel.className = 'hidden md:flex flex-1 flex-col overflow-y-auto';

  const previewTop = document.createElement('div');
  previewTop.className = 'p-4 lg:p-6 flex flex-col gap-4 flex-1';

  const previewHeader = document.createElement('div');
  previewHeader.className = 'flex items-center justify-between';
  previewHeader.innerHTML = '<div class="text-xs font-bold text-secondary uppercase tracking-wider">Preview</div>';

  const selectedBadge = document.createElement('div');
  selectedBadge.className = 'text-xs font-bold text-muted';
  selectedBadge.textContent = 'No effect selected';
  previewHeader.appendChild(selectedBadge);
  previewTop.appendChild(previewHeader);

  const splitRow = document.createElement('div');
  splitRow.className = 'flex gap-4 flex-1 min-h-0';

  const inputCol = document.createElement('div');
  inputCol.className = 'flex-1 flex flex-col gap-3 min-w-0';
  const inputLabel = document.createElement('div');
  inputLabel.className = 'text-[10px] font-bold text-muted uppercase tracking-wider';
  inputLabel.textContent = 'Input';
  inputCol.appendChild(inputLabel);

  const inputPreview = createMediaPreview({ maxHeight: '40vh', showDownload: false, showMeta: true });
  inputCol.appendChild(inputPreview.element);

  const uploadRow = document.createElement('div');
  uploadRow.className = 'flex items-center gap-3';

  const picker = createUploadPicker({
    anchorContainer: container,
    acceptVideo: true,
    onFilePreview: (file) => {
      inputPreview.loadFile(file);
    },
    onSelect: ({ url }) => {
      uploadedUrl = url;
      inputPreview.load(url, { filename: 'Uploaded media' });
    },
    onClear: () => {
      uploadedUrl = null;
      inputPreview.clear();
    },
  });
  uploadRow.appendChild(picker.trigger);
  container.appendChild(picker.panel);

  const uploadHint = document.createElement('span');
  uploadHint.className = 'text-xs text-muted';
  uploadHint.textContent = 'Upload image or video';
  uploadRow.appendChild(uploadHint);
  inputCol.appendChild(uploadRow);

  const outputCol = document.createElement('div');
  outputCol.className = 'flex-1 flex flex-col gap-3 min-w-0';
  const outputLabel = document.createElement('div');
  outputLabel.className = 'text-[10px] font-bold text-muted uppercase tracking-wider';
  outputLabel.textContent = 'Output';
  outputCol.appendChild(outputLabel);

  const outputPreview = createMediaPreview({ maxHeight: '40vh', showDownload: true, showMeta: true });
  outputCol.appendChild(outputPreview.element);

  splitRow.appendChild(inputCol);
  splitRow.appendChild(outputCol);
  previewTop.appendChild(splitRow);

  const promptRow = document.createElement('div');
  promptRow.className = 'flex items-center gap-3';
  const promptInput = document.createElement('input');
  promptInput.type = 'text';
  promptInput.placeholder = 'Optional prompt...';
  promptInput.className = 'flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors';
  promptRow.appendChild(promptInput);

  const generateBtn = document.createElement('button');
  generateBtn.className = 'bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow transition-all whitespace-nowrap';
  generateBtn.textContent = 'Apply Effect';
  promptRow.appendChild(generateBtn);
  previewTop.appendChild(promptRow);

  previewPanel.appendChild(previewTop);

  bodyArea.appendChild(effectsPanel);
  bodyArea.appendChild(previewPanel);
  container.appendChild(bodyArea);

  const mobileControls = document.createElement('div');
  mobileControls.className = 'md:hidden px-4 pb-4 shrink-0 flex flex-col gap-3 border-t border-white/5 pt-3';

  const mobilePreviewRow = document.createElement('div');
  mobilePreviewRow.className = 'flex gap-3';

  const mobileInputPreview = createMediaPreview({ maxHeight: '30vh', showDownload: false, showMeta: false });
  mobileInputPreview.element.className += ' flex-1';
  const mobileOutputPreview = createMediaPreview({ maxHeight: '30vh', showDownload: true, showMeta: false });
  mobileOutputPreview.element.className += ' flex-1';

  mobilePreviewRow.appendChild(mobileInputPreview.element);
  mobilePreviewRow.appendChild(mobileOutputPreview.element);
  mobileControls.appendChild(mobilePreviewRow);

  const mobileUploadRow = document.createElement('div');
  mobileUploadRow.className = 'flex items-center gap-3';
  const mobilePicker = createUploadPicker({
    anchorContainer: container,
    acceptVideo: true,
    onFilePreview: (file) => { mobileInputPreview.loadFile(file); },
    onSelect: ({ url }) => {
      uploadedUrl = url;
      mobileInputPreview.load(url);
    },
    onClear: () => {
      uploadedUrl = null;
      mobileInputPreview.clear();
    },
  });
  mobileUploadRow.appendChild(mobilePicker.trigger);
  container.appendChild(mobilePicker.panel);

  const mobilePrompt = document.createElement('input');
  mobilePrompt.type = 'text';
  mobilePrompt.placeholder = 'Optional prompt...';
  mobilePrompt.className = 'flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50';
  mobileUploadRow.appendChild(mobilePrompt);
  mobileControls.appendChild(mobileUploadRow);

  const mobileGenBtn = document.createElement('button');
  mobileGenBtn.className = 'w-full bg-primary text-black py-3 rounded-xl font-black text-sm';
  mobileGenBtn.textContent = 'Apply Effect';
  mobileControls.appendChild(mobileGenBtn);
  container.appendChild(mobileControls);

  function switchTab(tab) {
    activeTab = tab;
    selectedEffect = null;
    selectedBadge.textContent = 'No effect selected';
    selectedBadge.className = 'text-xs font-bold text-muted';

    // Update prompt placeholders based on tab
    if (tab.id === 'custom-ai-video-effects') {
      promptInput.placeholder = 'Describe your desired video effect...';
      mobilePrompt.placeholder = 'Describe your desired video effect...';
      // Hide effects grid for custom tab
      effectsPanel.style.display = 'none';
    } else {
      promptInput.placeholder = 'Optional prompt...';
      mobilePrompt.placeholder = 'Optional prompt...';
      // Show effects grid for other tabs
      effectsPanel.style.display = 'block';
    }

    Object.entries(tabButtons).forEach(([id, btn]) => {
      btn.className = id === tab.id
        ? 'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-primary text-black'
        : 'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-white/5 text-secondary hover:bg-white/10';
    });
    renderEffects();
  }

  // Helper to get thumbnail URL for an effect
  function getEffectThumbnail(effectName, tabId, tabType) {
    // Create a slug from the effect name
    const slug = effectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    // Map effect names to their thumbnail indices (for ai-video effects)
    const effectIndexMap = {
      '360 rotation': '01', 'abandoned places': '02', 'angry': '03', 'animal documentary': '04',
      'assassin it': '05', 'baby it': '06', 'boxing': '07', 'bride it': '08', 'cakeify': '09',
      'cartoon jaw drop': '10', 'cats': '11', 'crush it': '12', 'crying': '13', 'cyberpunk 2077': '14',
      'deflate it': '15', 'disney princess it': '16', 'dogs': '17', 'eye close-up': '18',
      'fantasy landscapes': '19', 'film noir': '20', 'fire': '21', 'glamor': '22', 'goblin': '23',
      'gun reveal': '24', 'hug jesus': '25', 'hulk transformation': '26', 'inflate it': '27',
      'jungle it': '28', 'jumpscare': '29', 'kamehameha': '30', 'kiss cam': '31', 'kissing': '32',
      'lego': '33', 'laughing': '34', 'little planet': '35', 'live wallpaper': '36',
      'looping pixel art': '37', 'melt it': '38', 'mona lisa it': '39', 'museum it': '40',
      'muscle show off': '41', 'orc': '42', 'pixar': '43', 'pirate captain': '44', 'pov driving': '45',
      'princess it': '46', 'puppy it': '47', 'robotic face reveal': '48', 'samurai it': '49',
      'sharingan eyes': '50', 'skyrim fus-ro-dah': '51', 'snow white it': '52', 'squish it': '53',
      'steamboat willie': '54', 'super saiyan transformation': '55', 'tsunami': '56', 'ultra wide': '57',
      'vhs footage': '58', 'vip it': '59', 'warrior it': '60', 'wind blast': '61',
      'younger self selfie': '62', 'zen it': '63', 'zoom call': '64'
    };
    
    const index = effectIndexMap[slug] || effectIndexMap[effectName.toLowerCase()];
    
    if (tabId === 'ai-video-effects' && index) {
      // AI Video Effects - use webp first, fallback to svg
      return `/thumbnails/effects/ai-video/${index}-${slug}.webp.png`;
    }
    
    if (tabId === 'image-effects') {
      // Image Effects - use webp.png format
      return `/thumbnails/effects/image-effects/${slug}.webp.png`;
    }
    
    if (tabId === 'nano-banana-effects') {
      // Nano Banana Effects - use webp.png format
      return `/thumbnails/effects/nano-banana/${slug}.webp.png`;
    }
    
    if (tabId === 'flux-kontext-effects') {
      // Kontext Effects - use webp.png format
      return `/thumbnails/effects/kontext-effects/${slug}.webp.png`;
    }
    
    if (tabId === 'motion-controls') {
      // Motion Controls - use webp.png format
      return `/thumbnails/effects/motion-controls/${slug}.webp.png`;
    }
    
    if (tabId === 'video-effects') {
      // Video Effects v2 - use direct slug mapping
      return `/thumbnails/effects/vfx/${slug}.webp.png`;
    }
    
    if (tabType === 'i2v' && index) {
      // Fallback for other i2v tabs
      return `/thumbnails/effects/ai-video/${index}-${slug}.webp.png`;
    }
    
    return null;
  }

  function renderEffects(filter = '') {
    effectsGrid.innerHTML = '';

    // Special handling for custom AI video effects - no effect selection needed
    if (activeTab.id === 'custom-ai-video-effects') {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'col-span-2 text-xs text-muted py-6 text-center';
      messageDiv.textContent = 'Free-form prompt mode - no templates required';
      effectsGrid.appendChild(messageDiv);
      return;
    }

    let effects = getEffectsForModel(activeTab.id);

    if (filter) {
      effects = effects.filter(name => name.toLowerCase().includes(filter.toLowerCase()));
    }

    effects.forEach(name => {
      const card = document.createElement('div');
      const isVideo = activeTab.type === 'i2v';
      const thumbnailUrl = getEffectThumbnail(name, activeTab.id, activeTab.type);
      
      card.className = 'bg-white/[0.03] border border-white/5 rounded-xl p-2 cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all group overflow-hidden';
      
      // Card content using createElement
      const thumbnailDiv = document.createElement('div');
      thumbnailDiv.className = 'relative w-full aspect-square mb-2 rounded-lg overflow-hidden bg-white/5';

      if (thumbnailUrl) {
        const img = document.createElement('img');
        img.src = thumbnailUrl;
        img.alt = name;
        img.className = 'w-full h-full object-cover';
        img.loading = 'lazy';
        img.decoding = 'async';
        thumbnailDiv.appendChild(img);
      } else {
        const iconContainer = document.createElement('div');
        iconContainer.className = 'w-full h-full flex items-center justify-center';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', isVideo ? 'w-8 h-8 text-blue-400' : 'w-8 h-8 text-primary');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('viewBox', '0 0 24 24');

        if (isVideo) {
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          polygon.setAttribute('points', '23 7 16 12 23 17 23 7');
          svg.appendChild(polygon);

          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '1');
          rect.setAttribute('y', '5');
          rect.setAttribute('width', '15');
          rect.setAttribute('height', '14');
          rect.setAttribute('rx', '2');
          rect.setAttribute('ry', '2');
          svg.appendChild(rect);
        } else {
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', '3');
          rect.setAttribute('y', '3');
          rect.setAttribute('width', '18');
          rect.setAttribute('height', '18');
          rect.setAttribute('rx', '2');
          rect.setAttribute('ry', '2');
          svg.appendChild(rect);

          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '8.5');
          circle.setAttribute('cy', '8.5');
          circle.setAttribute('r', '1.5');
          svg.appendChild(circle);

          const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          polyline.setAttribute('points', '21 15 16 10 5 21');
          svg.appendChild(polyline);
        }

        iconContainer.appendChild(svg);
        thumbnailDiv.appendChild(iconContainer);
      }

      const contentDiv = document.createElement('div');
      contentDiv.className = 'flex items-center gap-1.5';

      const indicatorDot = document.createElement('div');
      indicatorDot.className = isVideo ? 'w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0' : 'w-1.5 h-1.5 rounded-full bg-primary shrink-0';
      contentDiv.appendChild(indicatorDot);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'text-[10px] font-bold text-white group-hover:text-primary transition-colors truncate';
      nameDiv.textContent = name;
      contentDiv.appendChild(nameDiv);

      const typeDiv = document.createElement('div');
      typeDiv.className = 'text-[9px] text-muted mt-0.5';
      typeDiv.textContent = isVideo ? 'Video' : 'Image';

      card.appendChild(thumbnailDiv);
      card.appendChild(contentDiv);
      card.appendChild(typeDiv);
      card.onclick = () => {
        selectedEffect = name;
        effectsGrid.querySelectorAll('[data-selected]').forEach(el => {
          el.removeAttribute('data-selected');
          el.classList.remove('border-primary/50', 'bg-primary/5');
          el.classList.add('border-white/5');
        });
        card.setAttribute('data-selected', '1');
        card.classList.remove('border-white/5');
        card.classList.add('border-primary/50', 'bg-primary/5');
        selectedBadge.textContent = name;
        selectedBadge.className = 'text-xs font-bold text-primary';
      };
      effectsGrid.appendChild(card);
    });

    if (effects.length === 0) {
      const noResultsDiv = document.createElement('div');
      noResultsDiv.className = 'col-span-2 text-xs text-muted py-6 text-center';
      noResultsDiv.textContent = 'No effects match your search';
      effectsGrid.appendChild(noResultsDiv);
    }
  }

  searchInput.oninput = () => renderEffects(searchInput.value);

  async function handleGenerate() {
    // Special validation for different tab types
    if (activeTab.id === 'ai-video-effects' && !selectedEffect) {
      alert('Please select an effect template first');
      return;
    }
    if (activeTab.id === 'custom-ai-video-effects') {
      const customPrompt = promptInput.value.trim() || mobilePrompt.value.trim();
      if (!customPrompt) {
        alert('Please enter a prompt describing the desired effect');
        return;
      }
    } else if (!selectedEffect) {
      alert('Select an effect first');
      return;
    }
    if (!uploadedUrl) { alert('Upload an image or video first'); return; }
    const apiKey = localStorage.getItem('muapi_key');
    if (!apiKey) { AuthModal(() => handleGenerate()); return; }

    generateBtn.disabled = true;
    mobileGenBtn.disabled = true;
    generateBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Processing...';
    mobileGenBtn.innerHTML = generateBtn.innerHTML;

    const effectName = activeTab.id === 'custom-ai-video-effects' ? 'Custom Effect' : selectedEffect;
    outputPreview.showLoading(`Applying "${effectName}"...`);
    mobileOutputPreview.showLoading('Processing...');

    try {
      let result;

      // Handle MuAPI AI Video Effects
      if (activeTab.id === 'ai-video-effects') {
        // Preset effects mode
        const prompt = promptInput.value.trim() || mobilePrompt.value.trim();
        result = await muapi.generateVideoEffect({
          prompt: prompt || 'Apply effect',
          image_url: uploadedUrl,
          name: selectedEffect,
          aspect_ratio: '16:9',
          resolution: '720p',
          quality: 'medium',
          duration: 5
        });
      } else if (activeTab.id === 'custom-ai-video-effects') {
        // Custom prompt mode
        const customPrompt = promptInput.value.trim() || mobilePrompt.value.trim();
        result = await muapi.generateVideoEffect({
          prompt: customPrompt,
          image_url: uploadedUrl,
          aspect_ratio: '16:9',
          resolution: '720p',
          quality: 'medium',
          duration: 5
        });
      } else {
        // Original logic for other tabs
        const params = {
          model: activeTab.id,
          image_url: uploadedUrl,
          [activeTab.field]: selectedEffect,
        };
        const prompt = promptInput.value.trim() || mobilePrompt.value.trim();
        if (prompt) params.prompt = prompt;

        if (activeTab.type === 'i2v') {
          params.resolution = '720p';
          params.duration = 5;
          result = await muapi.generateI2V(params);
        } else {
          result = await muapi.generateI2I(params);
        }
      }

      if (result?.url) {
        const mediaType = (activeTab.type === 'i2v' || activeTab.id.includes('video')) ? 'video' : 'image';
        const filename = activeTab.id === 'custom-ai-video-effects' ?
          `custom-effect-${Date.now()}` :
          `${effectName}-${Date.now()}`;
        outputPreview.load(result.url, { type: mediaType, model: activeTab.label, filename });
        mobileOutputPreview.load(result.url, { type: mediaType });

        saveToHistory(result.url, mediaType);
      } else {
        outputPreview.showError('No output URL returned');
        mobileOutputPreview.showError('Failed');
      }
    } catch (err) {
      outputPreview.showError(`Error: ${err.message}`);
      mobileOutputPreview.showError('Error');
    } finally {
      generateBtn.disabled = false;
      mobileGenBtn.disabled = false;
      generateBtn.textContent = 'Apply Effect';
      mobileGenBtn.textContent = 'Apply Effect';
    }
  }

  function saveToHistory(url, type) {
    try {
      const key = type === 'video' ? 'video_history' : 'muapi_history';
      const history = JSON.parse(localStorage.getItem(key) || '[]');

      // For custom effects, save the actual prompt used
      let savedPrompt = selectedEffect;
      if (activeTab.id === 'custom-ai-video-effects') {
        savedPrompt = promptInput.value.trim() || mobilePrompt.value.trim();
      }

      history.unshift({
        id: Date.now().toString(),
        url,
        prompt: savedPrompt,
        model: activeTab.id,
        type,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(history.slice(0, 100)));
    } catch (e) { /* ignore */ }
  }

  generateBtn.onclick = handleGenerate;
  mobileGenBtn.onclick = handleGenerate;

  outputPreview.element.style.cursor = 'pointer';
  outputPreview.element.onclick = () => {
    const url = outputPreview.getUrl();
    if (url) fullscreen.show(url, { type: outputPreview.getType(), model: activeTab.label });
  };

  switchTab(EFFECT_TABS[0]);
  return container;
}
