import { muapi } from '../lib/muapi.js';
import { audioModels } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

export function AudioStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center bg-app-bg overflow-y-auto p-6 md:p-10 relative';

  let selectedModel = audioModels[0];
  let prompt = '';
  let style = '';
  let duration = '30';

  // Header with hero banner
  const header = document.createElement('div');
  header.className = 'mb-8 animate-fade-in-up text-center w-full';
  const audioBanner = createHeroSection('audio', 'h-32 md:h-44 mb-4');
  if (audioBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-5 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Audio Studio</h1><p class="text-white/60 text-sm">Generate music and speech with AI</p>';
    audioBanner.appendChild(bannerText);
    header.appendChild(audioBanner);
  }
  container.appendChild(header);

  // Model selector
  const modelRow = document.createElement('div');
  modelRow.className = 'flex gap-3 mb-6 flex-wrap justify-center animate-fade-in-up';
  modelRow.style.animationDelay = '0.1s';

  const modelBtns = {};
  audioModels.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
    btn.textContent = m.name;
    btn.onclick = () => {
      selectedModel = m;
      updateModelBtns();
      updateFormVisibility();
    };
    modelBtns[m.id] = btn;
    modelRow.appendChild(btn);
  });
  container.appendChild(modelRow);

  // Form card
  const formCard = document.createElement('div');
  formCard.className = 'w-full bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.2s';

  // Prompt input (for music generation)
  const promptGroup = document.createElement('div');
  promptGroup.className = 'flex flex-col gap-2';
  const promptLabel = document.createElement('label');
  promptLabel.className = 'text-sm font-bold text-secondary';
  promptLabel.textContent = 'Prompt';
  promptGroup.appendChild(promptLabel);

  const promptContainer = document.createElement('div');
  promptContainer.className = 'relative';
  const promptInput = document.createElement('textarea');
  promptInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-primary focus:outline-none resize-none';
  promptInput.rows = 3;
  promptInput.placeholder = 'Describe the music you want to generate...';
  promptInput.oninput = (e) => { prompt = e.target.value; };
  promptContainer.appendChild(promptInput);

  // GTM Prompt Enhancer Button
  const gtmBtn = document.createElement('button');
  gtmBtn.className = 'absolute top-2 right-2 w-8 h-8 rounded-lg border bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all flex items-center justify-center text-xs';
  gtmBtn.title = 'GTM Prompt Enhancement - Create conversion-optimized music prompts';
  gtmBtn.innerHTML = '🚀';
  gtmBtn.onclick = () => {
    openGTMPromptModal(promptInput);
  };
  promptContainer.appendChild(gtmBtn);

  promptGroup.appendChild(promptContainer);
  formCard.appendChild(promptGroup);

  // Style selector (for music models)
  const styleGroup = document.createElement('div');
  styleGroup.className = 'flex flex-col gap-2 hidden';
  const styleLabel = document.createElement('label');
  styleLabel.className = 'text-sm font-bold text-secondary';
  styleLabel.textContent = 'Style';
  styleGroup.appendChild(styleLabel);
  const styleSelect = document.createElement('select');
  styleSelect.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none';
  styleSelect.innerHTML = `
    <option value="">Select a style</option>
    <option value="pop">Pop</option>
    <option value="rock">Rock</option>
    <option value="electronic">Electronic</option>
    <option value="classical">Classical</option>
    <option value="jazz">Jazz</option>
    <option value="hip-hop">Hip Hop</option>
    <option value="ambient">Ambient</option>
  `;
  styleSelect.onchange = (e) => { style = e.target.value; };
  styleGroup.appendChild(styleSelect);
  formCard.appendChild(styleGroup);

  // Duration selector
  const durationGroup = document.createElement('div');
  durationGroup.className = 'flex flex-col gap-2';
  const durationLabel = document.createElement('label');
  durationLabel.className = 'text-sm font-bold text-secondary';
  durationLabel.textContent = 'Duration';
  durationGroup.appendChild(durationLabel);
  const durationRow = document.createElement('div');
  durationRow.className = 'flex gap-2';
  ['15', '30', '60', '120'].forEach(d => {
    const btn = document.createElement('button');
    btn.className = d === duration 
      ? 'px-4 py-2 rounded-lg text-xs font-bold bg-primary text-black' 
      : 'px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10';
    btn.textContent = `${d}s`;
    btn.onclick = () => {
      duration = d;
      updateDurationBtns();
    };
    durationRow.appendChild(btn);
  });
  durationGroup.appendChild(durationRow);
  formCard.appendChild(durationGroup);

  // Generate button
  const genBtn = document.createElement('button');
  genBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all';
  genBtn.textContent = 'Generate Audio';
  formCard.appendChild(genBtn);
  container.appendChild(formCard);

  // Instructions
  const inlineInstructions = createInlineInstructions('audio');
  inlineInstructions.classList.add('max-w-md', 'mt-6');
  container.appendChild(inlineInstructions);

  // Result area
  const resultArea = document.createElement('div');
  resultArea.className = 'w-full max-w-md mt-6 hidden';
  container.appendChild(resultArea);

  // Helper functions
  function updateModelBtns() {
    Object.entries(modelBtns).forEach(([id, btn]) => {
      if (id === selectedModel.id) {
        btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border bg-primary text-black border-primary';
      } else {
        btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
      }
    });
  }

  function updateDurationBtns() {
    const durationRow = durationGroup.querySelector('.flex.gap-2');
    Array.from(durationRow.children).forEach((btn, i) => {
      const d = ['15', '30', '60', '120'][i];
      btn.className = d === duration 
        ? 'px-4 py-2 rounded-lg text-xs font-bold bg-primary text-black' 
        : 'px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10';
    });
  }

  function updateFormVisibility() {
    // Show/hide prompt based on model
    const supportsPrompt = selectedModel.hasPrompt;
    promptGroup.classList.toggle('hidden', !supportsPrompt);
    
    // Show/hide style selector for music models
    const supportsStyles = selectedModel.supportsStyles;
    styleGroup.classList.toggle('hidden', !supportsStyles);
  }

  // Generate button handler
  genBtn.onclick = async () => {
    if (!prompt && selectedModel.hasPrompt) {
      alert('Enter a prompt');
      return;
    }
    const apiKey = localStorage.getItem('muapi_key');
    if (!apiKey) { 
      AuthModal(() => genBtn.click()); 
      return; 
    }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Generating...';

    try {
      const params = { 
        model: selectedModel.id,
        prompt: prompt,
        duration: parseInt(duration)
      };
      
      if (style) params.style = style;
      
      const result = await muapi.generateAudio(params);
      if (result?.url) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
          <div class="bg-[#111]/80 border border-white/10 rounded-2xl p-4">
            <audio controls class="w-full mb-3">
              <source src="${result.url}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
            <a href="${result.url}" download class="block w-full bg-primary text-black py-2.5 rounded-xl font-bold text-sm text-center hover:shadow-glow transition-all">Download Audio</a>
          </div>
        `;
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Generate Audio';
    }
  };

  updateModelBtns();
  updateFormVisibility();

  // GTM Prompt Modal Function
  function openGTMPromptModal(promptTextarea) {
    try {
      const modal = new GTMPromptModal({
        appTheme: 'audio-studio',
        onPromptGenerated: (generatedPrompt) => {
          // Load the generated prompt into the textarea
          promptTextarea.value = generatedPrompt;
          promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

          console.log('GTM-optimized audio prompt loaded successfully!');
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
