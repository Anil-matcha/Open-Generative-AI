import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { securityService } from '../lib/services/SecurityService.js';
import { t2iModels } from '../lib/models.js';

const SCENE_PRESETS = [
  'Studio white background', 'Luxury marble surface', 'Outdoor natural light',
  'Lifestyle kitchen counter', 'Neon tech showroom', 'Wooden table cozy',
  'Minimalist gradient', 'Beach sand and waves', 'Office desk setup',
];

const FORMAT_PRESETS = [
  { name: 'Ad Banner', ar: '16:9' },
  { name: 'Social Post', ar: '1:1' },
  { name: 'Story', ar: '9:16' },
  { name: 'Billboard', ar: '21:9' },
];

export function CommercialStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center bg-app-bg overflow-y-auto p-6 md:p-10 relative';

  let uploadedUrl = null;
  let selectedScene = SCENE_PRESETS[0];
  let selectedFormat = FORMAT_PRESETS[0];
  let selectedModel = 'ai-product-shot';

  const header = document.createElement('div');
  header.className = 'mb-8 animate-fade-in-up text-center w-full';
  const commBanner = createHeroSection('commercial', 'h-64 md:h-80 lg:h-96 mb-4');
  if (commBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-5 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Commercial Studio</h1><p class="text-white/60 text-sm max-w-md">AI product photography, ads, and commercial content</p>';
    commBanner.appendChild(bannerText);
    header.appendChild(commBanner);
  }
  container.appendChild(header);

  const formCard = document.createElement('div');
  formCard.className = 'w-full max-w-xl bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.15s';

  const modelLabel = document.createElement('label');
  modelLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  modelLabel.textContent = 'Model';
  formCard.appendChild(modelLabel);

  // Filter for MiniMax models
  const minimaxModels = t2iModels.filter(m => m.id.includes('minimax'));

  const modelSelect = document.createElement('select');
  modelSelect.className = 'w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 text-white border border-white/10 focus:border-primary focus:outline-none transition-all';
  minimaxModels.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    if (model.id === selectedModel || (!selectedModel && minimaxModels.indexOf(model) === 0)) {
      option.selected = true;
      selectedModel = model.id;
    }
    modelSelect.appendChild(option);
  });
  modelSelect.onchange = () => {
    selectedModel = modelSelect.value;
  };
  formCard.appendChild(modelSelect);

  const uploadLabel = document.createElement('label');
  uploadLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  uploadLabel.textContent = 'Product Media';
  formCard.appendChild(uploadLabel);

  const uploadRow = document.createElement('div');
  uploadRow.className = 'flex items-center gap-4';
  const picker = createUploadPicker({
    anchorContainer: container,
    onSelect: ({ url }) => { uploadedUrl = url; },
    onClear: () => { uploadedUrl = null; },
  });
  uploadRow.appendChild(picker.trigger);
  const uploadHint = document.createElement('span');
  uploadHint.className = 'text-sm text-muted';
  uploadHint.textContent = 'Upload product image or video';
  uploadRow.appendChild(uploadHint);
  formCard.appendChild(uploadRow);
  container.appendChild(picker.panel);

  const sceneLabel = document.createElement('label');
  sceneLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  sceneLabel.textContent = 'Scene Preset';
  formCard.appendChild(sceneLabel);

  const sceneGrid = document.createElement('div');
  sceneGrid.className = 'flex flex-wrap gap-2';
  SCENE_PRESETS.forEach(s => {
    const chip = document.createElement('button');
    chip.className = s === selectedScene
      ? 'px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-black transition-all'
      : 'px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all';
    chip.textContent = s;
    chip.onclick = () => {
      selectedScene = s;
      sceneGrid.querySelectorAll('button').forEach(b => {
        b.className = b.textContent === s
          ? 'px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-black transition-all'
          : 'px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all';
      });
    };
    sceneGrid.appendChild(chip);
  });
  formCard.appendChild(sceneGrid);

  const formatLabel = document.createElement('label');
  formatLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  formatLabel.textContent = 'Output Format';
  formCard.appendChild(formatLabel);

  const formatRow = document.createElement('div');
  formatRow.className = 'flex gap-2 flex-wrap';
  FORMAT_PRESETS.forEach(f => {
    const btn = document.createElement('button');
    btn.className = f.name === selectedFormat.name
      ? 'px-4 py-2 rounded-xl text-xs font-bold bg-primary text-black transition-all'
      : 'px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 border border-white/10 transition-all';
    btn.textContent = `${f.name} (${f.ar})`;
    btn.onclick = () => {
      selectedFormat = f;
      formatRow.querySelectorAll('button').forEach(b => {
        const isActive = b.textContent.includes(f.name);
        b.className = isActive
          ? 'px-4 py-2 rounded-xl text-xs font-bold bg-primary text-black transition-all'
          : 'px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 border border-white/10 transition-all';
      });
    };
    formatRow.appendChild(btn);
  });
  formCard.appendChild(formatRow);

  const genBtn = document.createElement('button');
  genBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all mt-2';
  genBtn.textContent = 'Generate Product Shot';
  formCard.appendChild(genBtn);
  container.appendChild(formCard);

  const inlineInstructions = createInlineInstructions('commercial');
  inlineInstructions.classList.add('max-w-xl', 'mt-6');
  container.appendChild(inlineInstructions);

  const resultArea = document.createElement('div');
  resultArea.className = 'w-full max-w-xl mt-6 hidden';
  container.appendChild(resultArea);

  genBtn.onclick = async () => {
    if (!uploadedUrl) { alert('Upload a product image or video first'); return; }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) { AuthModal(() => genBtn.click()); return; }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Generating...';

    try {
      const params = {
        model: selectedModel,
        image_url: uploadedUrl,
        prompt: `${selectedScene}, professional product photography, commercial quality`,
        aspect_ratio: selectedFormat.ar,
      };
      const result = await muapi.generateI2I(params);
      if (result?.url) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
          <div class="bg-[#111]/80 border border-white/10 rounded-2xl p-4 animate-fade-in-up">
            <img src="${result.url}" class="w-full rounded-xl mb-3">
            <div class="flex gap-3">
              <a href="${result.url}" download class="flex-1 bg-primary text-black py-2.5 rounded-xl font-bold text-sm text-center hover:shadow-glow transition-all">Download</a>
              <button class="flex-1 bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all regen-btn">Generate Again</button>
            </div>
          </div>
        `;
        resultArea.querySelector('.regen-btn').onclick = () => genBtn.click();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Generate Product Shot';
    }
  };

  return container;
}
