import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { createHeroSection, getToolThumbnail, createThumbnailImg } from '../lib/thumbnails.js';
import { securityService } from '../lib/services/SecurityService.js';
import { assetStore } from '../lib/assets/assetStore.js';
import { showToast } from '../lib/loading.js';

const EDIT_TOOLS = [
  { id: 'ai-object-eraser', name: 'Remove Object', description: 'Erase unwanted objects from images', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 5H9l-7 7 7 7h11a2 2 0 002-2V7a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>', hasPrompt: true, promptPlaceholder: 'What to remove...' },
  { id: 'ai-background-remover', name: 'Remove Background', description: 'Clean background removal', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 3l18 18"/></svg>', hasPrompt: false },
  { id: 'ai-image-extension', name: 'Extend Image', description: 'AI outpainting to expand images', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>', hasPrompt: true, promptPlaceholder: 'What to extend with...' },
  { id: 'seedream-5.0-edit', name: 'AI Edit', description: 'Instruction-based image editing', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', hasPrompt: true, promptPlaceholder: 'Describe the edit...' },
  { id: 'ideogram-v3-reframe', name: 'Reframe', description: 'Change aspect ratio intelligently', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>', hasPrompt: false },
  { id: 'ai-dress-change', name: 'Change Dress', description: 'AI outfit and clothing swap', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2 12 5.5 8 2l-4.38 1.46a2 2 0 00-1.34 2.31l2.1 9.89A2 2 0 006.34 17H7l-2 5h14l-2-5h.66a2 2 0 001.96-1.34l2.1-9.89a2 2 0 00-1.34-2.31z"/></svg>', hasPrompt: true, promptPlaceholder: 'Describe the outfit...' },
  { id: 'ai-skin-enhancer', name: 'Enhance Skin', description: 'Professional skin retouching', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>', hasPrompt: false },
  { id: 'ai-color-photo', name: 'Colorize', description: 'Add color to B&W photos', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="13" r="2.5"/><circle cx="7" cy="13" r="2.5"/><circle cx="13.5" cy="19.5" r="2.5"/></svg>', hasPrompt: false },
  { id: 'add-image-watermark', name: 'Add Watermark', description: 'Overlay watermark on images', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', hasPrompt: true, promptPlaceholder: 'Watermark text...' },
  { id: 'ai-image-upscaler', name: 'Upscale', description: 'AI image upscaling to higher resolution', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>', hasPrompt: false },
  { id: 'ai-image-face-swap', name: 'Face Swap', description: 'Swap faces in images', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>', hasPrompt: false },
  { id: 'ai-product-shot', name: 'Product Shot', description: 'Create professional product images', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>', hasPrompt: true, promptPlaceholder: 'Product style...' },
  { id: 'ai-ghibli-style', name: 'Ghibli Style', description: 'Transform into Studio Ghibli art style', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', hasPrompt: false },
];

export function EditStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg relative';

  let activeTool = null;
  let uploadedUrl = null;

  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0';
  const editBanner = createHeroSection('edit', 'h-64 md:h-80 lg:h-96 mb-4');
  if (editBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Edit Studio</h1><p class="text-white/60 text-xs">13 AI-powered editing tools for images</p>';
    editBanner.appendChild(bannerText);
    topBar.appendChild(editBanner);
  } else {
    topBar.innerHTML = '<h1 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Edit Studio</h1><p class="text-secondary text-xs mb-5">13 AI-powered editing tools for images</p>';
  }

  const toolGrid = document.createElement('div');
  toolGrid.className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2';

  EDIT_TOOLS.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all group';
    const thumbSrc = getToolThumbnail(tool.id);
    if (thumbSrc) {
      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'thumb-hero h-20 relative';
      thumbWrapper.innerHTML = '<div class="thumb-skeleton absolute inset-0"></div>';
      const img = createThumbnailImg(thumbSrc, tool.name, 'w-full h-full object-cover');
      thumbWrapper.appendChild(img);
      card.appendChild(thumbWrapper);
    }
    const info = document.createElement('div');
    info.className = 'p-3';
    info.innerHTML = `
      <div class="text-xs font-bold text-white group-hover:text-primary transition-colors">${tool.name}</div>
      <div class="text-[10px] text-muted mt-0.5">${tool.description}</div>
    `;
    card.appendChild(info);
    card.onclick = () => selectTool(tool, card);
    toolGrid.appendChild(card);
  });

  topBar.appendChild(toolGrid);

  const inlineInstructions = createInlineInstructions('edit');
  inlineInstructions.classList.add('px-4', 'md:px-8', 'mt-2');
  topBar.appendChild(inlineInstructions);

  container.appendChild(topBar);

  const workArea = document.createElement('div');
  workArea.className = 'flex-1 px-4 md:px-8 pb-8';

  const workCard = document.createElement('div');
  workCard.className = 'max-w-xl mx-auto bg-white/[0.03] border border-white/5 rounded-2xl p-6 hidden flex-col gap-4';

  const toolTitle = document.createElement('div');
  toolTitle.className = 'text-sm font-bold text-primary';
  workCard.appendChild(toolTitle);

  const previewImg = document.createElement('img');
  previewImg.className = 'hidden w-full h-48 object-cover rounded-xl border border-white/10';

  const uploadHint = document.createElement('span');
  uploadHint.className = 'text-sm text-muted';
  uploadHint.textContent = 'Upload source image or video';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'hidden text-xs font-bold text-red-400 hover:text-red-300 transition-colors';
  clearBtn.textContent = 'Remove';

  const uploadSection = document.createElement('div');
  uploadSection.className = 'flex flex-col gap-3';
  const uploadRow = document.createElement('div');
  uploadRow.className = 'flex items-center gap-4';
  const picker = createUploadPicker({
    anchorContainer: container,
    onSelect: ({ url }) => {
      uploadedUrl = url;
      previewImg.src = url;
      previewImg.classList.remove('hidden');
      uploadHint.textContent = 'Media uploaded';
      clearBtn.classList.remove('hidden');
    },
    onClear: () => {
      uploadedUrl = null;
      previewImg.classList.add('hidden');
      previewImg.src = '';
      uploadHint.textContent = 'Upload source image or video';
      clearBtn.classList.add('hidden');
    },
    onFilePreview: (file) => {
      const blobUrl = URL.createObjectURL(file);
      previewImg.src = blobUrl;
      previewImg.classList.remove('hidden');
      uploadHint.textContent = file.name;
    },
  });

  clearBtn.onclick = (e) => {
    e.stopPropagation();
    picker.reset();
    uploadedUrl = null;
    previewImg.classList.add('hidden');
    previewImg.src = '';
    uploadHint.textContent = 'Upload source image or video';
    clearBtn.classList.add('hidden');
  };

   uploadRow.appendChild(picker.trigger);
   uploadRow.appendChild(uploadHint);
   uploadRow.appendChild(clearBtn);
   uploadSection.appendChild(uploadRow);
   uploadSection.appendChild(previewImg);
   workCard.appendChild(uploadSection);
   container.appendChild(picker.panel);

   // Load asset from URL parameter if present
   (async () => {
     try {
       const params = new URLSearchParams(window.location.search);
       const assetId = params.get('asset');
       if (assetId) {
         const asset = await assetStore.getAsset(assetId);
         if (asset && (asset.type === 'image' || asset.type === 'video')) {
           uploadedUrl = asset.media?.url;
           previewImg.src = uploadedUrl;
           previewImg.classList.remove('hidden');
           uploadHint.textContent = asset.title;
           clearBtn.classList.remove('hidden');
           showToast(`Loaded "${asset.title}" for editing`, 'success');
         } else {
           showToast('Asset not found or not an image/video', 'error');
         }
       }
     } catch (e) {
       console.error('Failed to load asset:', e);
     }
   })();

   const promptField = document.createElement('input');
  promptField.type = 'text';
  promptField.className = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors hidden';
  workCard.appendChild(promptField);

  const editBtn = document.createElement('button');
  editBtn.className = 'w-full bg-primary text-black py-3 rounded-xl font-black text-sm hover:shadow-glow transition-all';
  editBtn.textContent = 'Apply Edit';
  workCard.appendChild(editBtn);

  const resultArea = document.createElement('div');
  resultArea.className = 'hidden mt-4';
  workCard.appendChild(resultArea);

  workArea.appendChild(workCard);
  container.appendChild(workArea);

  function selectTool(tool, cardEl) {
    activeTool = tool;
    toolGrid.querySelectorAll('.border-primary').forEach(el => {
      el.classList.remove('border-primary');
      el.classList.add('border-white/5');
    });
    cardEl.classList.remove('border-white/5');
    cardEl.classList.add('border-primary');

    workCard.classList.remove('hidden');
    workCard.classList.add('flex');
    toolTitle.textContent = tool.name;

    if (tool.hasPrompt) {
      promptField.classList.remove('hidden');
      promptField.placeholder = tool.promptPlaceholder || 'Describe...';
    } else {
      promptField.classList.add('hidden');
    }
    resultArea.classList.add('hidden');
  }

  editBtn.onclick = async () => {
    if (!activeTool) return;
    if (!uploadedUrl) { alert('Upload an image or video first'); return; }
    const apiKey = await securityService.getDecryptedKey();
    if (!apiKey) { AuthModal(() => editBtn.click()); return; }

    editBtn.disabled = true;
    editBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Processing...';

    try {
      const params = { model: activeTool.id, image_url: uploadedUrl };
      if (activeTool.hasPrompt && promptField.value.trim()) {
        params.prompt = promptField.value.trim();
      }
      const result = await muapi.generateI2I(params);
      if (result?.url) {
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `
          <img src="${result.url}" class="w-full rounded-xl border border-white/10 mb-3">
          <a href="${result.url}" download class="block w-full bg-primary text-black py-2.5 rounded-xl font-bold text-sm text-center hover:shadow-glow transition-all">Download</a>
        `;
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      editBtn.disabled = false;
      editBtn.textContent = 'Apply Edit';
    }
  };

  return container;
}
