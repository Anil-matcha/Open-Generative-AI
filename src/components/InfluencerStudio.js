import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { securityService } from '../lib/services/SecurityService.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

const STYLE_PRESETS = [
  'Realistic', 'DigitalCam', 'Quiet luxury', 'FashionShow', '90s Grain', 'Sunset beach',
  'Amalfi Summer', 'Bimbocore', 'Vintage PhotoBooth', 'Gorpcore', 'Indie sleaze',
  'Fairycore', 'Avant-garde', 'Y2K Posters', 'Grunge', 'Coquette core', 'Tokyo Streetstyle',
  '2049', 'Night rider', 'Glazed doll skin makeup',
];

const FORMAT_PRESETS = [
  { name: 'Instagram Post', ar: '1:1' },
  { name: 'Story / Reel', ar: '9:16' },
  { name: 'YouTube Thumb', ar: '16:9' },
  { name: 'Pinterest Pin', ar: '2:3' },
];

export function InfluencerStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg';

  let uploadedUrl = null;
  let selectedStyle = STYLE_PRESETS[0];
  let selectedFormat = FORMAT_PRESETS[0];

  // Top bar with hero banner
  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0 animate-fade-in-up';
  
  const influBanner = createHeroSection('influencer', 'h-64 md:h-80 lg:h-96 mb-4');
  if (influBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">AI Influencer Studio</h1><p class="text-white/60 text-sm max-w-md">Generate social content with 20+ fashion presets and format templates</p>';
    influBanner.appendChild(bannerText);
    topBar.appendChild(influBanner);
  }
  
  container.appendChild(topBar);

  // Main content area
  const contentArea = document.createElement('div');
  contentArea.className = 'flex-1 overflow-y-auto px-4 md:px-8 pb-8';
  container.appendChild(contentArea);

  const formCard = document.createElement('div');
  formCard.className = 'w-full max-w-xl mx-auto bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.15s';

  const uploadRow = document.createElement('div');
  const uploadLabel = document.createElement('label');
  uploadLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider block mb-2';
  uploadLabel.textContent = 'Your Photo';
  uploadRow.appendChild(uploadLabel);
  const uploadInner = document.createElement('div');
  uploadInner.className = 'flex items-center gap-4';
  const picker = createUploadPicker({
    anchorContainer: container,
    onSelect: ({ url }) => { uploadedUrl = url; },
    onClear: () => { uploadedUrl = null; },
  });
  uploadInner.appendChild(picker.trigger);
  const uploadHint = document.createElement('span');
  uploadHint.className = 'text-sm text-muted';
  uploadHint.textContent = 'Upload reference photo or video';
  uploadInner.appendChild(uploadHint);
  uploadRow.appendChild(uploadInner);
  formCard.appendChild(uploadRow);
  contentArea.appendChild(picker.panel);

  const styleLabel = document.createElement('label');
  styleLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  styleLabel.textContent = 'Style Preset';
  formCard.appendChild(styleLabel);

  const styleGrid = document.createElement('div');
  styleGrid.className = 'flex flex-wrap gap-2 max-h-32 overflow-y-auto';
  STYLE_PRESETS.forEach(s => {
    const chip = document.createElement('button');
    chip.className = s === selectedStyle
      ? 'px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-black transition-all'
      : 'px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all';
    chip.textContent = s;
    chip.onclick = () => {
      selectedStyle = s;
      styleGrid.querySelectorAll('button').forEach(b => {
        b.className = b.textContent === s
          ? 'px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-black transition-all'
          : 'px-3 py-1.5 rounded-full text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all';
      });
    };
    styleGrid.appendChild(chip);
  });
  formCard.appendChild(styleGrid);

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
      : 'px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all border border-white/10';
    btn.textContent = `${f.name} (${f.ar})`;
    btn.onclick = () => {
      selectedFormat = f;
      formatRow.querySelectorAll('button').forEach(b => {
        const isActive = b.textContent.includes(f.name);
        b.className = isActive
          ? 'px-4 py-2 rounded-xl text-xs font-bold bg-primary text-black transition-all'
          : 'px-4 py-2 rounded-xl text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all border border-white/10';
      });
    };
    formatRow.appendChild(btn);
  });
  formCard.appendChild(formatRow);

  const promptInput = document.createElement('textarea');
  promptInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none';
  promptInput.rows = 2;
  promptInput.placeholder = 'Additional instructions (optional)';
  
  // GTM Prompt Enhancer Button
  const gtmBtn = document.createElement('button');
  gtmBtn.className = 'absolute top-2 right-2 w-8 h-8 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all flex items-center justify-center text-xs';
  gtmBtn.title = 'GTM Prompt Enhancement - Create conversion-optimized prompts';
  gtmBtn.innerHTML = '🚀';
  gtmBtn.onclick = () => {
    openGTMPromptModal(promptInput);
  };
  
  const promptContainer = document.createElement('div');
  promptContainer.className = 'relative';
  promptContainer.appendChild(promptInput);
  promptContainer.appendChild(gtmBtn);
  formCard.appendChild(promptContainer);

  const genBtn = document.createElement('button');
  genBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all mt-2';
  genBtn.textContent = 'Generate Content';
  formCard.appendChild(genBtn);
  contentArea.appendChild(formCard);

  const resultArea = document.createElement('div');
  resultArea.className = 'w-full max-w-xl mx-auto mt-6 hidden';
  contentArea.appendChild(resultArea);

  genBtn.onclick = async () => {
    if (!uploadedUrl) {  return; }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) { AuthModal(() => genBtn.click()); return; }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Generating...';

    try {
      const prompt = `Style preset: ${selectedStyle}. ${promptInput.value.trim() || 'Fashion editorial photo, professional quality'}`;
      const params = {
        model: 'higgsfield-soul-image-to-image',
        image_url: uploadedUrl,
        prompt,
        style: selectedStyle,
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
      
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Generate Content';
    }
  };

  // GTM Prompt Modal Function
  function openGTMPromptModal(promptTextarea) {
    try {
      const modal = new GTMPromptModal({
        appTheme: 'influencer-studio',
        onPromptGenerated: (generatedPrompt) => {
          promptTextarea.value = generatedPrompt;
          promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('GTM-optimized prompt loaded successfully!');
        }
      });
      modal.open();
    } catch (error) {
      console.error('GTM Prompt Modal error:', error);
    }
  }

  return container;
}
