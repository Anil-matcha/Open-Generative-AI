import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { securityService } from '../lib/services/SecurityService.js';

const UPSCALE_METHODS = [
  { id: 'ai-image-upscaler', name: 'AI Upscaler', description: 'General-purpose AI upscaling with 2x/4x factor', factors: ['2', '4'] },
  { id: 'topaz-image-upscale', name: 'Topaz Upscale', description: 'Premium Topaz-quality enhancement', factors: [] },
  { id: 'seedvr2-image-upscale', name: 'Seed Upscale', description: 'SeedVR2 high-fidelity upscaling', factors: [] },
];

export function UpscaleStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg p-6 md:p-10 relative';

  let selectedMethod = UPSCALE_METHODS[0];
  let selectedFactor = '2';
  let uploadedUrl = null;

  const header = document.createElement('div');
  header.className = 'mb-8 animate-fade-in-up text-center w-full max-w-xl';
  const upscaleBanner = createHeroSection('upscale', 'h-64 md:h-80 lg:h-96 mb-4');
  if (upscaleBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-5 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Upscale Suite</h1><p class="text-white/60 text-sm">Enhance and upscale images with 3 AI methods</p>';
    upscaleBanner.appendChild(bannerText);
    header.appendChild(upscaleBanner);
  }
  container.appendChild(header);

  const methodRow = document.createElement('div');
  methodRow.className = 'flex gap-3 mb-6 flex-wrap justify-center animate-fade-in-up';
  methodRow.style.animationDelay = '0.1s';

  const methodBtns = {};
  UPSCALE_METHODS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border';
    btn.textContent = m.name;
    btn.onclick = () => {
      selectedMethod = m;
      selectedFactor = m.factors[0] || '';
      updateMethodBtns();
      updateFactorBtns();
    };
    methodBtns[m.id] = btn;
    methodRow.appendChild(btn);
  });
  container.appendChild(methodRow);

  const factorRow = document.createElement('div');
  factorRow.className = 'flex gap-2 mb-6 justify-center';
  container.appendChild(factorRow);

  const formCard = document.createElement('div');
  formCard.className = 'w-full max-w-md bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.2s';

  const uploadRow = document.createElement('div');
  uploadRow.className = 'flex items-center gap-4';
  const picker = createUploadPicker({
    anchorContainer: container,
    onSelect: ({ url }) => { uploadedUrl = url; },
    onClear: () => { uploadedUrl = null; },
  });
  uploadRow.appendChild(picker.trigger);
  const hint = document.createElement('span');
  hint.className = 'text-sm text-muted';
  hint.textContent = 'Upload image or video to upscale';
  uploadRow.appendChild(hint);
  formCard.appendChild(uploadRow);
  container.appendChild(picker.panel);

  const genBtn = document.createElement('button');
  genBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all';
  genBtn.textContent = 'Upscale Image';
  formCard.appendChild(genBtn);
  container.appendChild(formCard);

  const inlineInstructions = createInlineInstructions('upscale');
  inlineInstructions.classList.add('max-w-md', 'mt-6');
  container.appendChild(inlineInstructions);

  const resultArea = document.createElement('div');
  resultArea.className = 'w-full max-w-md mt-6 hidden';
  container.appendChild(resultArea);

  function updateMethodBtns() {
    Object.entries(methodBtns).forEach(([id, btn]) => {
      if (id === selectedMethod.id) {
        btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border bg-primary text-black border-primary';
      } else {
        btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
      }
    });
  }

  function updateFactorBtns() {
    factorRow.innerHTML = '';
    if (selectedMethod.factors.length === 0) return;
    selectedMethod.factors.forEach(f => {
      const btn = document.createElement('button');
      btn.className = f === selectedFactor
        ? 'px-4 py-2 rounded-lg text-xs font-bold bg-primary text-black'
        : 'px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10';
      btn.textContent = `${f}x`;
      btn.onclick = () => { selectedFactor = f; updateFactorBtns(); };
      factorRow.appendChild(btn);
    });
  }

  genBtn.onclick = async () => {
    if (!uploadedUrl) { alert('Upload an image or video first'); return; }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) { AuthModal(() => genBtn.click()); return; }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Upscaling...';

    try {
      const params = { model: selectedMethod.id, image_url: uploadedUrl };
      if (selectedFactor) params.upscale_factor = parseInt(selectedFactor);
      const result = await muapi.generateI2I(params);
      if (result?.url) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
          <div class="bg-[#111]/80 border border-white/10 rounded-2xl p-4">
            <img src="${result.url}" class="w-full rounded-xl mb-3">
            <a href="${result.url}" download class="block w-full bg-primary text-black py-2.5 rounded-xl font-bold text-sm text-center hover:shadow-glow transition-all">Download</a>
          </div>
        `;
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Upscale Image';
    }
  };

  updateMethodBtns();
  updateFactorBtns();
  return container;
}
