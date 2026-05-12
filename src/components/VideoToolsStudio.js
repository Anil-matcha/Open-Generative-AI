import { muapi } from '../lib/muapi.js';
import { videoToolsModels } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { securityService } from '../lib/services/SecurityService.js';

export function VideoToolsStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg relative';

  let selectedModel = videoToolsModels[0];
  let uploadedVideoUrl = null;
  let prompt = '';

  // Top bar with hero banner and inline instructions
  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0 animate-fade-in-up';
  
  const videoToolsBanner = createHeroSection('videotools', 'h-64 md:h-80 lg:h-96 mb-4');
  if (videoToolsBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Video Tools Studio</h1><p class="text-white/60 text-sm">Enhance, edit, and transform your videos with AI</p>';
    videoToolsBanner.appendChild(bannerText);
    topBar.appendChild(videoToolsBanner);
  }
  
  const inlineInstructions = createInlineInstructions('video-tools');
  inlineInstructions.classList.add('px-4', 'md:px-8', 'mt-2', 'mx-auto', 'max-w-md');
  topBar.appendChild(inlineInstructions);
  
  container.appendChild(topBar);

  // Main content area
  const contentArea = document.createElement('div');
  contentArea.className = 'flex-1 overflow-y-auto px-4 md:px-8 pb-8';
  container.appendChild(contentArea);

  // Model selector
  const modelRow = document.createElement('div');
  modelRow.className = 'flex gap-3 mb-6 flex-wrap justify-center animate-fade-in-up';
  modelRow.style.animationDelay = '0.1s';

  const modelBtns = {};
  videoToolsModels.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
    btn.textContent = m.name;
    btn.onclick = () => {
      selectedModel = m;
      updateModelBtns();
      updateFormVisibility();
    };
    modelBtns[m.id] = btn;
    modelRow.appendChild(btn);
  });
  contentArea.appendChild(modelRow);

  // Form card
  const formCard = document.createElement('div');
  formCard.className = 'w-full max-w-md mx-auto bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.2s';

  // Video upload
  const videoUploadGroup = document.createElement('div');
  videoUploadGroup.className = 'flex flex-col gap-2';
  const videoLabel = document.createElement('label');
  videoLabel.className = 'text-sm font-bold text-secondary';
  videoLabel.textContent = 'Source Video';
  videoUploadGroup.appendChild(videoLabel);

  const videoPicker = createUploadPicker({
    anchorContainer: container,
    accept: 'video/*',
    onSelect: ({ url }) => { 
      uploadedVideoUrl = url; 
    },
    onClear: () => { uploadedVideoUrl = null; },
  });
  videoUploadGroup.appendChild(videoPicker.trigger);
  formCard.appendChild(videoUploadGroup);
  contentArea.appendChild(videoPicker.panel);

  // Prompt input (for models that support it)
  const promptGroup = document.createElement('div');
  promptGroup.className = 'flex flex-col gap-2 hidden';
  const promptLabel = document.createElement('label');
  promptLabel.className = 'text-sm font-bold text-secondary';
  promptLabel.textContent = 'Prompt (optional)';
  promptGroup.appendChild(promptLabel);
  const promptInput = document.createElement('textarea');
  promptInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-primary focus:outline-none resize-none';
  promptInput.rows = 3;
  promptInput.placeholder = 'Describe the transformation you want...';
  promptInput.oninput = (e) => { prompt = e.target.value; };
  promptGroup.appendChild(promptInput);
  formCard.appendChild(promptGroup);

  // Generate button
  const genBtn = document.createElement('button');
  genBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all';
  genBtn.textContent = 'Process Video';
  formCard.appendChild(genBtn);
  contentArea.appendChild(formCard);

  // Result area
  const resultArea = document.createElement('div');
  resultArea.className = 'w-full max-w-md mx-auto mt-6 hidden';
  contentArea.appendChild(resultArea);

  // Helper functions
  function updateModelBtns() {
    Object.entries(modelBtns).forEach(([id, btn]) => {
      if (id === selectedModel.id) {
        btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-primary text-black border-primary';
      } else {
        btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
      }
    });
  }

  function updateFormVisibility() {
    // Show/hide prompt based on model
    const supportsPrompt = selectedModel.hasPrompt;
    promptGroup.classList.toggle('hidden', !supportsPrompt);
  }

  // Generate button handler
  genBtn.onclick = async () => {
    if (!uploadedVideoUrl && selectedModel.videoField) {
      alert('Upload a source video first');
      return;
    }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) { 
      AuthModal(() => genBtn.click()); 
      return; 
    }

    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Processing...';

    try {
      const params = { 
        model: selectedModel.id,
        [selectedModel.videoField]: uploadedVideoUrl,
      };

      if (prompt && selectedModel.hasPrompt) {
        params.prompt = prompt;
      }

       const result = await muapi.processVideoTool(params);
      if (result?.url) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
          <div class="bg-[#111]/80 border border-white/10 rounded-2xl p-4">
            <video controls class="w-full rounded-xl mb-3" src="${result.url}"></video>
            <a href="${result.url}" download class="block w-full bg-primary text-black py-2.5 rounded-xl font-bold text-sm text-center hover:shadow-glow transition-all">Download Video</a>
          </div>
        `;
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Process Video';
    }
  };

  updateModelBtns();
  updateFormVisibility();
  return container;
}
