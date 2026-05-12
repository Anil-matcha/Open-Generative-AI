import { navigate } from '../lib/router.js';
import { buildNanoBananaPrompt, CAMERA_MAP, LENS_MAP, ENHANCE_TAGS, QUICK_PROMPTS } from '../lib/promptUtils.js';
import { getPageThumbnail, createThumbnailImg } from '../lib/thumbnails.js';

export function AssistPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg';

  const inner = document.createElement('div');
  inner.className = 'w-full px-4 md:px-8 py-8 md:py-12';

  const heroBlock = document.createElement('div');
  heroBlock.className = 'mb-10 animate-fade-in-up';
  const assistThumb = getPageThumbnail('assist');
  if (assistThumb) {
    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'relative w-full h-36 md:h-48 rounded-2xl overflow-hidden mb-6';
    bannerWrapper.innerHTML = '<div class="thumb-skeleton absolute inset-0"></div>';
    const img = createThumbnailImg(assistThumb, 'Assist', 'w-full h-full object-cover');
    bannerWrapper.appendChild(img);
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent';
    bannerWrapper.appendChild(overlay);
    const textOverlay = document.createElement('div');
    textOverlay.className = 'absolute bottom-0 left-0 right-0 p-5 z-10';
    textOverlay.innerHTML = '<h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">Assist</h1><p class="text-white/60 text-sm md:text-base max-w-xl">AI prompt enhancement, quick starters, and creative tools</p>';
    bannerWrapper.appendChild(textOverlay);
    heroBlock.appendChild(bannerWrapper);
  }
  inner.appendChild(heroBlock);

  const enhanceSection = document.createElement('div');
  enhanceSection.className = 'mb-10 animate-fade-in-up';
  enhanceSection.style.animationDelay = '0.1s';
  enhanceSection.innerHTML = '<h2 class="text-lg font-bold text-white mb-4">Prompt Enhancer</h2>';

  const enhanceCard = document.createElement('div');
  enhanceCard.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5';

  const baseInput = document.createElement('textarea');
  baseInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none mb-4';
  baseInput.rows = 2;
  baseInput.placeholder = 'Enter your basic prompt idea...';
  enhanceCard.appendChild(baseInput);

  const tagLabel = document.createElement('div');
  tagLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider mb-2';
  tagLabel.textContent = 'Enhancement Tags (click to toggle)';
  enhanceCard.appendChild(tagLabel);

  const selectedTags = new Set();
  const tagsArea = document.createElement('div');
  tagsArea.className = 'flex flex-wrap gap-2 mb-4';

  Object.entries(ENHANCE_TAGS).forEach(([category, tags]) => {
    tags.forEach(tag => {
      const chip = document.createElement('button');
      chip.className = 'px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all';
      chip.textContent = tag;
      chip.onclick = () => {
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
          chip.className = 'px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all';
        } else {
          selectedTags.add(tag);
          chip.className = 'px-3 py-1.5 rounded-full text-[11px] font-bold bg-primary text-black transition-all';
        }
        updateOutput();
      };
      tagsArea.appendChild(chip);
    });
  });
  enhanceCard.appendChild(tagsArea);

  const outputLabel = document.createElement('div');
  outputLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider mb-2';
  outputLabel.textContent = 'Enhanced Prompt';
  enhanceCard.appendChild(outputLabel);

  const outputArea = document.createElement('div');
  outputArea.className = 'bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm min-h-[60px]';
  outputArea.textContent = 'Your enhanced prompt will appear here...';
  enhanceCard.appendChild(outputArea);

  const actionRow = document.createElement('div');
  actionRow.className = 'flex gap-3 mt-4';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'px-5 py-2.5 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all';
  copyBtn.textContent = 'Copy';
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(outputArea.textContent);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  };

  const useBtn = document.createElement('button');
  useBtn.className = 'px-5 py-2.5 bg-primary text-black rounded-xl text-xs font-bold hover:shadow-glow transition-all';
  useBtn.textContent = 'Use in Image Studio';
  useBtn.onclick = () => {
    localStorage.setItem('prefill_prompt', outputArea.textContent);
    navigate('image');
  };

  actionRow.appendChild(copyBtn);
  actionRow.appendChild(useBtn);
  enhanceCard.appendChild(actionRow);
  enhanceSection.appendChild(enhanceCard);
  inner.appendChild(enhanceSection);

  function updateOutput() {
    const base = baseInput.value.trim();
    if (!base) {
      outputArea.textContent = 'Your enhanced prompt will appear here...';
      return;
    }
    const tags = [...selectedTags];
    outputArea.textContent = [base, ...tags].join(', ');
  }
  baseInput.oninput = updateOutput;

  const quickSection = document.createElement('div');
  quickSection.className = 'mb-10 animate-fade-in-up';
  quickSection.style.animationDelay = '0.2s';
  quickSection.innerHTML = '<h2 class="text-lg font-bold text-white mb-4">Quick Starters</h2>';

  const quickGrid = document.createElement('div');
  quickGrid.className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';
  QUICK_PROMPTS.forEach(q => {
    const card = document.createElement('div');
    card.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all group';
    card.innerHTML = `
      <div class="text-sm font-bold text-white group-hover:text-primary transition-colors mb-1">${q.label}</div>
      <div class="text-xs text-muted line-clamp-2">${q.prompt}</div>
    `;
    card.onclick = () => {
      localStorage.setItem('prefill_prompt', q.prompt);
      navigate('image');
    };
    quickGrid.appendChild(card);
  });
  quickSection.appendChild(quickGrid);
  inner.appendChild(quickSection);

  const cineSection = document.createElement('div');
  cineSection.className = 'animate-fade-in-up';
  cineSection.style.animationDelay = '0.3s';
  cineSection.innerHTML = `
    <h2 class="text-lg font-bold text-white mb-4">Cinema Prompt Builder</h2>
    <p class="text-xs text-muted mb-4">Build cinematic prompts with camera and lens metadata</p>
  `;

  const cineCard = document.createElement('div');
  cineCard.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-xl p-5';

  const cinePrompt = document.createElement('input');
  cinePrompt.type = 'text';
  cinePrompt.placeholder = 'Base scene description...';
  cinePrompt.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors mb-4';
  cineCard.appendChild(cinePrompt);

  const cineSelects = document.createElement('div');
  cineSelects.className = 'grid grid-cols-2 gap-3 mb-4';

  const cameraSelect = createSelect('Camera', Object.keys(CAMERA_MAP));
  const lensSelect = createSelect('Lens', Object.keys(LENS_MAP));
  cineSelects.appendChild(cameraSelect.wrapper);
  cineSelects.appendChild(lensSelect.wrapper);
  cineCard.appendChild(cineSelects);

  const cineOutput = document.createElement('div');
  cineOutput.className = 'bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm min-h-[60px] mb-4';
  cineOutput.textContent = 'Cinematic prompt will appear here...';
  cineCard.appendChild(cineOutput);

  function updateCine() {
    const base = cinePrompt.value.trim();
    if (!base) { cineOutput.textContent = 'Cinematic prompt will appear here...'; return; }
    cineOutput.textContent = buildNanoBananaPrompt(base, cameraSelect.select.value, lensSelect.select.value, 35, 'f/1.4');
  }
  cinePrompt.oninput = updateCine;
  cameraSelect.select.onchange = updateCine;
  lensSelect.select.onchange = updateCine;

  const cineUseBtn = document.createElement('button');
  cineUseBtn.className = 'px-5 py-2.5 bg-primary text-black rounded-xl text-xs font-bold hover:shadow-glow transition-all';
  cineUseBtn.textContent = 'Use in Cinema Studio';
  cineUseBtn.onclick = () => {
    localStorage.setItem('prefill_prompt', cineOutput.textContent);
    navigate('cinema');
  };
  cineCard.appendChild(cineUseBtn);

  cineSection.appendChild(cineCard);
  inner.appendChild(cineSection);

  container.appendChild(inner);
  return container;
}

function createSelect(label, options) {
  const wrapper = document.createElement('div');
  const lbl = document.createElement('label');
  lbl.className = 'text-xs font-bold text-secondary uppercase tracking-wider block mb-1';
  lbl.textContent = label;
  wrapper.appendChild(lbl);

  const select = document.createElement('select');
  select.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none appearance-none cursor-pointer';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    opt.style.background = '#111';
    select.appendChild(opt);
  });
  wrapper.appendChild(select);
  return { wrapper, select };
}
