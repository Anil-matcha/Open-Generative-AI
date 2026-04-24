import { muapi } from '../lib/muapi.js';
import { avatarModels } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

export function AvatarStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center bg-app-bg overflow-y-auto p-6 md:p-10 relative';

  let selectedModel = avatarModels[0];
  let uploadedVideoUrl = null;
  let uploadedAudioUrl = null;
  let prompt = '';

  // Header with hero banner
  const header = document.createElement('div');
  header.className = 'mb-8 animate-fade-in-up text-center w-full max-w-xl';
  const avatarBanner = createHeroSection('avatar', 'h-32 md:h-44 mb-4');
  if (avatarBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-5 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Avatar Studio</h1><p class="text-white/60 text-sm">Create talking avatars and lip sync videos</p>';
    avatarBanner.appendChild(bannerText);
    header.appendChild(avatarBanner);
  }
  container.appendChild(header);

  // Model selector
  const modelRow = document.createElement('div');
  modelRow.className = 'flex gap-3 mb-6 flex-wrap justify-center animate-fade-in-up';
  modelRow.style.animationDelay = '0.1s';

  const modelBtns = {};
  avatarModels.forEach(m => {
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
  container.appendChild(modelRow);

  // Form card
  const formCard = document.createElement('div');
  formCard.className = 'w-full max-w-md bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.2s';

  // Video/Image upload (for lip sync models)
  const videoUploadGroup = document.createElement('div');
  videoUploadGroup.className = 'flex flex-col gap-2';
  const videoLabel = document.createElement('label');
  videoLabel.className = 'text-sm font-bold text-secondary';
  videoLabel.textContent = 'Source Video/Image';
  videoUploadGroup.appendChild(videoLabel);

  const videoPicker = createUploadPicker({
    anchorContainer: container,
    accept: 'video/*,image/*',
    onSelect: ({ url, type }) => { 
      uploadedVideoUrl = url; 
    },
    onClear: () => { uploadedVideoUrl = null; },
  });
  videoUploadGroup.appendChild(videoPicker.trigger);
  formCard.appendChild(videoUploadGroup);
  container.appendChild(videoPicker.panel);

  // Audio upload (for lip sync models)
  const audioUploadGroup = document.createElement('div');
  audioUploadGroup.className = 'flex flex-col gap-2 hidden';
  const audioLabel = document.createElement('label');
  audioLabel.className = 'text-sm font-bold text-secondary';
  audioLabel.textContent = 'Audio (for lip sync)';
  audioUploadGroup.appendChild(audioLabel);

  const audioPicker = createUploadPicker({
    anchorContainer: container,
    accept: 'audio/*',
    onSelect: ({ url }) => { 
      uploadedAudioUrl = url; 
    },
    onClear: () => { uploadedAudioUrl = null; },
  });
  audioUploadGroup.appendChild(audioPicker.trigger);
  formCard.appendChild(audioUploadGroup);
  container.appendChild(audioPicker.panel);

  // Prompt input (for some avatar models)
  const promptGroup = document.createElement('div');
  promptGroup.className = 'flex flex-col gap-2 hidden';
  const promptLabel = document.createElement('label');
  promptLabel.className = 'text-sm font-bold text-secondary';
  promptLabel.textContent = 'Prompt (optional)';
  promptGroup.appendChild(promptLabel);

  const promptContainer = document.createElement('div');
  promptContainer.className = 'relative';
  const promptInput = document.createElement('textarea');
  promptInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-primary focus:outline-none resize-none';
  promptInput.rows = 2;
  promptInput.placeholder = 'Describe the animation you want...';
  promptInput.oninput = (e) => { prompt = e.target.value; };
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

  promptGroup.appendChild(promptContainer);
  formCard.appendChild(promptGroup);

  // Generate button
  const genBtn = document.createElement('button');
  genBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all';
  genBtn.textContent = 'Generate Avatar Video';
  formCard.appendChild(genBtn);
  container.appendChild(formCard);

  // Instructions
  const inlineInstructions = createInlineInstructions('avatar');
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
        btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-primary text-black border-primary';
      } else {
        btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
      }
    });
  }

  function updateFormVisibility() {
    // Show/hide video upload
    const needsVideo = selectedModel.hasVideo;
    videoUploadGroup.classList.toggle('hidden', !needsVideo);

    // Show/hide audio upload
    const needsAudio = selectedModel.hasAudio;
    audioUploadGroup.classList.toggle('hidden', !needsAudio);

    // Show/hide prompt
    const needsPrompt = selectedModel.hasPrompt;
    promptGroup.classList.toggle('hidden', !needsPrompt);
  }

  // Generate button handler
  genBtn.onclick = async () => {
    if (!uploadedVideoUrl && selectedModel.hasVideo) {
      alert('Upload a source video or image first');
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
        video_url: uploadedVideoUrl,
      };
      
      if (uploadedAudioUrl) params.audio_url = uploadedAudioUrl;
      if (prompt) params.prompt = prompt;
      
      const result = await muapi.generateAvatar(params);
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
      genBtn.textContent = 'Generate Avatar Video';
    }
  };

  updateModelBtns();
  updateFormVisibility();

  // GTM Prompt Modal Function
  function openGTMPromptModal(promptTextarea) {
    try {
      const modal = new GTMPromptModal({
        appTheme: 'avatar-studio',
        onPromptGenerated: (generatedPrompt) => {
          // Load the generated prompt into the textarea
          promptTextarea.value = generatedPrompt;
          promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

          console.log('GTM-optimized prompt loaded successfully!');
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
