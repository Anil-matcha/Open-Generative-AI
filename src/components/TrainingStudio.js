import { muapi } from '../lib/muapi.js';
import { trainingModels } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { securityService } from '../lib/services/SecurityService.js';

export function TrainingStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg';

  let selectedModel = trainingModels[0];
  let loraName = '';
  let triggerWord = '';
  let epochs = '10';
  let uploadedImages = [];

  // Top bar with hero banner and inline instructions
  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0 animate-fade-in-up';
  
  const trainingBanner = createHeroSection('training', 'h-64 md:h-80 lg:h-96 mb-4');
  if (trainingBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Training Studio</h1><p class="text-white/60 text-sm">Train custom LoRA models from your images</p>';
    trainingBanner.appendChild(bannerText);
    topBar.appendChild(trainingBanner);
  }
  
  const inlineInstructions = createInlineInstructions('training');
  inlineInstructions.classList.add('px-4', 'md:px-8', 'mt-2');
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
  trainingModels.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'px-5 py-3 rounded-xl text-sm font-bold transition-all border bg-white/5 text-secondary border-white/10 hover:bg-white/10';
    btn.textContent = m.name;
    btn.onclick = () => {
      selectedModel = m;
      updateModelBtns();
    };
    modelBtns[m.id] = btn;
    modelRow.appendChild(btn);
  });
  contentArea.appendChild(modelRow);

  // Form card
  const formCard = document.createElement('div');
  formCard.className = 'w-full max-w-md mx-auto bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-5 animate-fade-in-up';
  formCard.style.animationDelay = '0.2s';

  // LoRA Name
  const nameGroup = document.createElement('div');
  nameGroup.className = 'flex flex-col gap-2';
  const nameLabel = document.createElement('label');
  nameLabel.className = 'text-sm font-bold text-secondary';
  nameLabel.textContent = 'LoRA Name';
  nameGroup.appendChild(nameLabel);
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-primary focus:outline-none';
  nameInput.placeholder = 'MyCustomLoRA';
  nameInput.oninput = (e) => { loraName = e.target.value; };
  nameGroup.appendChild(nameInput);
  formCard.appendChild(nameGroup);

  // Trigger Word
  const triggerGroup = document.createElement('div');
  triggerGroup.className = 'flex flex-col gap-2';
  const triggerLabel = document.createElement('label');
  triggerLabel.className = 'text-sm font-bold text-secondary';
  triggerLabel.textContent = 'Trigger Word (optional)';
  triggerGroup.appendChild(triggerLabel);
  const triggerInput = document.createElement('input');
  triggerInput.type = 'text';
  triggerInput.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/30 focus:border-primary focus:outline-none';
  triggerInput.placeholder = 'mytriggerword';
  triggerInput.oninput = (e) => { triggerWord = e.target.value; };
  triggerGroup.appendChild(triggerInput);
  formCard.appendChild(triggerGroup);

  // Epochs selector
  const epochsGroup = document.createElement('div');
  epochsGroup.className = 'flex flex-col gap-2';
  const epochsLabel = document.createElement('label');
  epochsLabel.className = 'text-sm font-bold text-secondary';
  epochsLabel.textContent = 'Training Epochs';
  epochsGroup.appendChild(epochsLabel);
  const epochsRow = document.createElement('div');
  epochsRow.className = 'flex gap-2';
  ['5', '10', '20', '30'].forEach(e => {
    const btn = document.createElement('button');
    btn.className = e === epochs 
      ? 'px-4 py-2 rounded-lg text-xs font-bold bg-primary text-black' 
      : 'px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10';
    btn.textContent = e;
    btn.onclick = () => {
      epochs = e;
      updateEpochsBtns();
    };
    epochsRow.appendChild(btn);
  });
  epochsGroup.appendChild(epochsRow);
  formCard.appendChild(epochsGroup);

  // Image upload
  const imageUploadGroup = document.createElement('div');
  imageUploadGroup.className = 'flex flex-col gap-2';
  const imageLabel = document.createElement('label');
  imageLabel.className = 'text-sm font-bold text-secondary';
  imageLabel.textContent = 'Training Images (10-20 recommended)';
  imageUploadGroup.appendChild(imageLabel);

  const imagePicker = createUploadPicker({
    anchorContainer: container,
    accept: 'image/*',
    multiple: true,
    onSelect: ({ urls }) => { 
      uploadedImages = urls; 
      updateImageCount();
    },
    onClear: () => { uploadedImages = []; },
  });
  imageUploadGroup.appendChild(imagePicker.trigger);
  
  const imageCount = document.createElement('span');
  imageCount.className = 'text-sm text-muted';
  imageCount.textContent = uploadedImages.length > 0 ? `${uploadedImages.length} images selected` : '';
  imageUploadGroup.appendChild(imageCount);
  
  formCard.appendChild(imageUploadGroup);
  contentArea.appendChild(imagePicker.panel);

  // Train button
  const trainBtn = document.createElement('button');
  trainBtn.className = 'w-full bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all';
  trainBtn.textContent = 'Train LoRA';
  formCard.appendChild(trainBtn);
  contentArea.appendChild(formCard);

  // Result area
  const resultArea = document.createElement('div');
  resultArea.className = 'w-full max-w-md mx-auto mt-6 hidden';
  contentArea.appendChild(resultArea);

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

  function updateEpochsBtns() {
    const epochsRow = epochsGroup.querySelector('.flex.gap-2');
    Array.from(epochsRow.children).forEach((btn, i) => {
      const e = ['5', '10', '20', '30'][i];
      btn.className = e === epochs 
        ? 'px-4 py-2 rounded-lg text-xs font-bold bg-primary text-black' 
        : 'px-4 py-2 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10';
    });
  }

  function updateImageCount() {
    imageCount.textContent = uploadedImages.length > 0 ? `${uploadedImages.length} images selected` : '';
  }

  // Train button handler
  trainBtn.onclick = async () => {
    if (!loraName) {
      
      return;
    }
    if (uploadedImages.length < 5) {
      alert('Upload at least 5 training images (10-20 recommended)');
      return;
    }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) { 
      AuthModal(() => trainBtn.click()); 
      return; 
    }

    trainBtn.disabled = true;
    trainBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Training...';

    try {
      const params = { 
        model: selectedModel.id,
        name: loraName,
        images_list: uploadedImages,
        epochs: parseInt(epochs),
      };
      
      if (triggerWord) params.trigger_word = triggerWord;
      
      const result = await muapi.trainLora(params);
      if (result?.lora_url) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
          <div class="bg-[#111]/80 border border-white/10 rounded-2xl p-4">
            <div class="text-green-400 font-bold mb-3">Training Complete!</div>
            <p class="text-white/60 text-sm mb-3">Your LoRA model has been trained successfully.</p>
            <a href="${result.lora_url}" download class="block w-full bg-primary text-black py-2.5 rounded-xl font-bold text-sm text-center hover:shadow-glow transition-all">Download LoRA</a>
          </div>
        `;
      }
    } catch (err) {
      
    } finally {
      trainBtn.disabled = false;
      trainBtn.textContent = 'Train LoRA';
    }
  };

  updateModelBtns();
  return container;
}
