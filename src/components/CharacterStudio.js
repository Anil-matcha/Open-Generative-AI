import { muapi } from '../lib/muapi.js';
import { securityService } from '../lib/services/SecurityService.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

const CHARACTER_MODELS = [
  { id: 'flux-pulid', name: 'Flux PuLID', description: 'Face ID preservation with text prompt' },
  { id: 'minimax-image-01-subject-reference', name: 'Subject Reference', description: 'Maintain subject consistency across images' },
];

export function CharacterStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto relative';

  let uploadedUrl = null;
  let selectedModel = CHARACTER_MODELS[0];

  // Top bar with hero banner and inline instructions
  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0 animate-fade-in-up';
  
  const charBanner = createHeroSection('character', 'h-32 md:h-44 mb-4');
  if (charBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Character Studio</h1><p class="text-white/60 text-sm max-w-md">Generate consistent character images using face ID preservation</p>';
    charBanner.appendChild(bannerText);
    topBar.appendChild(charBanner);
  }
  
  const inlineInstructions = createInlineInstructions('character');
  inlineInstructions.classList.add('px-4', 'md:px-8', 'mt-2');
  topBar.appendChild(inlineInstructions);
  
  container.appendChild(topBar);

  // Main content area
  const contentArea = document.createElement('div');
  contentArea.className = 'flex-1 overflow-y-auto px-4 md:px-8 pb-8';
  container.appendChild(contentArea);

  const formCard = document.createElement('div');
  formCard.className = 'w-full max-w-lg mx-auto bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.15s';

  const modelLabel = document.createElement('label');
  modelLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  modelLabel.textContent = 'Model';
  formCard.appendChild(modelLabel);

  const modelRow = document.createElement('div');
  modelRow.className = 'flex gap-2';
  const modelBtns = {};
  CHARACTER_MODELS.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border text-left';
    btn.innerHTML = `<div class="text-white">${m.name}</div><div class="text-muted text-[10px] mt-0.5">${m.description}</div>`;
    btn.onclick = () => {
      selectedModel = m;
      Object.entries(modelBtns).forEach(([id, b]) => {
        b.className = id === m.id
          ? 'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border bg-primary/10 border-primary/30'
          : 'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border bg-white/[0.03] border-white/10 hover:border-white/20';
      });
    };
    modelBtns[m.id] = btn;
    modelRow.appendChild(btn);
  });
  formCard.appendChild(modelRow);

  const uploadLabel = document.createElement('label');
  uploadLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  uploadLabel.textContent = 'Reference Face';
  formCard.appendChild(uploadLabel);

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
  hint.textContent = 'Upload a clear face photo or video';
  uploadRow.appendChild(hint);
  formCard.appendChild(uploadRow);
  contentArea.appendChild(picker.panel);

  const promptLabel = document.createElement('label');
  promptLabel.className = 'text-xs font-bold text-secondary uppercase tracking-wider';
  promptLabel.textContent = 'Character Description';
  formCard.appendChild(promptLabel);

  const promptContainer = document.createElement('div');
  promptContainer.className = 'relative';

  const promptInput = document.createElement('textarea');
  promptInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none';
  promptInput.rows = 3;
  promptInput.placeholder = 'e.g. wearing a leather jacket, standing in a neon-lit alley, cyberpunk style';
  promptContainer.appendChild(promptInput);

  // GTM Prompt Enhancer Button
  const gtmBtn = document.createElement('button');
  gtmBtn.className = 'absolute top-2 right-2 w-8 h-8 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all flex items-center justify-center text-xs';
  gtmBtn.title = 'GTM Prompt Enhancement - Create conversion-optimized prompts';
  gtmBtn.innerHTML = '🚀';
  gtmBtn.onclick = () => {
    openGTMPromptModal(promptInput);
  };
  promptContainer.appendChild(gtmBtn);

  formCard.appendChild(promptContainer);

  const genBtn = document.createElement('button');
  genBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all mt-2';
  genBtn.textContent = 'Generate Character';
  formCard.appendChild(genBtn);
  contentArea.appendChild(formCard);

  // Expression presets
  const expressionSection = document.createElement('div');
  expressionSection.className = 'w-full max-w-lg mx-auto mt-6';
  expressionSection.innerHTML = `
    <h3 class="text-sm font-bold text-white mb-3">Expression Presets</h3>
    <div class="flex gap-2 flex-wrap">
      <button class="expr-btn px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all" data-expr="happy">😊 Happy</button>
      <button class="expr-btn px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all" data-expr="sad">😢 Sad</button>
      <button class="expr-btn px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all" data-expr="angry">😠 Angry</button>
      <button class="expr-btn px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all" data-expr="surprised">😲 Surprised</button>
      <button class="expr-btn px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all" data-expr="neutral">😐 Neutral</button>
    </div>
  `;
  contentArea.appendChild(expressionSection);

  // Expression click handlers
  expressionSection.querySelectorAll('.expr-btn').forEach(btn => {
    btn.onclick = () => {
      const expr = btn.dataset.expr;
      const exprMap = {
        'happy': 'smiling, happy expression, cheerful',
        'sad': 'sad expression, melancholy, tearful eyes',
        'angry': 'angry expression, furious, glaring',
        'surprised': 'surprised expression, shocked, wide eyes',
        'neutral': 'neutral expression, calm, poker face'
      };
      promptInput.value = promptInput.value.trim() 
        ? promptInput.value + ', ' + exprMap[expr] 
        : exprMap[expr];
    };
  });

  // Character library
  const librarySection = document.createElement('div');
  librarySection.className = 'w-full max-w-lg mx-auto mt-6';
  const savedCharacters = JSON.parse(localStorage.getItem('character_library') || '[]');
  
  librarySection.innerHTML = `
    <h3 class="text-sm font-bold text-white mb-3 flex items-center justify-between">
      Saved Characters 
      <span class="text-xs font-normal text-muted">${savedCharacters.length} saved</span>
    </h3>
    ${savedCharacters.length > 0 ? `
      <div class="grid grid-cols-2 gap-2">
        ${savedCharacters.map(c => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-2 flex items-center gap-2 cursor-pointer hover:bg-white/[0.06] character-item" data-id="${c.id}">
            <img src="${c.thumbnail}" class="w-12 h-12 rounded-lg object-cover">
            <div class="flex-1 min-w-0">
              <div class="text-xs font-bold text-white truncate">${c.name}</div>
              <div class="text-[10px] text-muted truncate">${c.description || 'No description'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="text-center py-6 text-muted text-xs">
        No saved characters yet. Generate a character and save it!
      </div>
    `}
  `;
  contentArea.appendChild(librarySection);

  // Character item click handlers
  librarySection.querySelectorAll('.character-item').forEach(item => {
    item.onclick = () => {
      const char = savedCharacters.find(c => c.id === item.dataset.id);
      if (char) {
        uploadedUrl = char.imageUrl;
        promptInput.value = char.description || '';
        alert(`Loaded character: ${char.name}`);
      }
    };
  });

  const resultArea = document.createElement('div');
  resultArea.className = 'w-full max-w-lg mx-auto mt-6 hidden';
  contentArea.appendChild(resultArea);

  genBtn.onclick = async () => {
    if (!uploadedUrl) { alert('Upload a reference face first'); return; }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) { AuthModal(() => genBtn.click()); return; }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Generating...';

    try {
      const params = {
        model: selectedModel.id,
        image_url: uploadedUrl,
        prompt: promptInput.value.trim() || 'professional portrait photo',
      };
      const result = await muapi.generateI2I(params);
      if (result?.url) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
          <div class="bg-[#111]/80 border border-white/10 rounded-2xl p-4 animate-fade-in-up">
            <img src="${result.url}" class="w-full rounded-xl mb-3">
            <div class="flex gap-3">
              <a href="${result.url}" download class="flex-1 bg-primary text-black py-2.5 rounded-xl font-bold text-sm text-center hover:shadow-glow transition-all">Download</a>
              <button class="flex-1 bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all" onclick="this.closest('.bg-\\\\[\\\\#111\\\\]').remove()">Generate Again</button>
            </div>
          </div>
        `;
        resultArea.querySelector('button').onclick = () => genBtn.click();
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Generate Character';
    }
  };

  Object.entries(modelBtns).forEach(([id, btn]) => {
    btn.className = id === selectedModel.id
      ? 'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border bg-primary/10 border-primary/30'
      : 'flex-1 px-4 py-3 rounded-xl text-xs font-bold transition-all border bg-white/[0.03] border-white/10 hover:border-white/20';
  });

  // GTM Prompt Modal Function
  function openGTMPromptModal(promptTextarea) {
    try {
      const modal = new GTMPromptModal({
        appTheme: 'character-studio',
        onPromptGenerated: (generatedPrompt) => {
          // Load the generated prompt into the textarea
          promptTextarea.value = generatedPrompt;
          promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

          console.log('GTM-optimized character prompt loaded successfully!');
        }
      });
      modal.open();
    } catch (error) {
      console.error('GTM Prompt Modal error:', error);
      alert('Failed to open GTM Prompt Enhancer');
    }
  }

  return container;
}
