import { muapi } from '../lib/muapi.js';
import { lipsyncModels, imageLipSyncModels, videoLipSyncModels, getLipSyncModelById, getResolutionsForLipSyncModel } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';
import { savePendingJob, removePendingJob, getPendingJobs } from '../lib/pendingJobs.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { securityService } from '../lib/services/SecurityService.js';

export function LipSyncStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

    // --- State ---
    // 'image' mode: portrait image + audio → video
    // 'video' mode: existing video + audio → lipsync video
    let inputMode = 'image';
    let selectedModel = imageLipSyncModels[0].id;
    let selectedResolution = imageLipSyncModels[0].inputs?.resolution?.default || '480p';
    let uploadedImageUrl = null;
    let uploadedVideoUrl = null;
    let uploadedAudioUrl = null;
    let dropdownOpen = null;

    const getCurrentModels = () => inputMode === 'image' ? imageLipSyncModels : videoLipSyncModels;
    const getCurrentModel = () => lipsyncModels.find(m => m.id === selectedModel);

    // ==========================================
    // 1. HERO SECTION
    // ==========================================
    const hero = document.createElement('div');
    hero.className = 'flex flex-col items-center mb-4 md:mb-6 animate-fade-in-up transition-all duration-700 w-full';
    const heroBanner = createHeroSection('lipsync', 'h-32 md:h-44 mb-6');
    if (heroBanner) {
        const heroContent = document.createElement('div');
        heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
        heroContent.innerHTML = `
            <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-1">Lip Sync</h1>
            <p class="text-white/60 text-sm font-medium">Animate portraits or sync lips to audio with AI</p>
        `;
        heroBanner.appendChild(heroContent);
        hero.appendChild(heroBanner);
    }
    container.appendChild(hero);

    // ==========================================
    // 2. INPUT BAR
    // ==========================================
    const promptWrapper = document.createElement('div');
    promptWrapper.className = 'w-full relative z-40 animate-fade-in-up';
    promptWrapper.style.animationDelay = '0.2s';

    const bar = document.createElement('div');
    bar.className = 'w-full bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 flex flex-col gap-3 md:gap-5 shadow-3xl';

    // --- Mode Toggle (Image vs Video) ---
    const modeToggleRow = document.createElement('div');
    modeToggleRow.className = 'flex items-center gap-2 px-2';

    const modeLabel = document.createElement('span');
    modeLabel.className = 'text-xs text-muted font-bold uppercase tracking-widest mr-2';
    modeLabel.textContent = 'Input:';

    const imageModeBtn = document.createElement('button');
    imageModeBtn.type = 'button';
    imageModeBtn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-primary bg-primary/10 text-primary';
    imageModeBtn.textContent = '🖼 Portrait Image';

    const videoModeBtn = document.createElement('button');
    videoModeBtn.type = 'button';
    videoModeBtn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/10 text-muted hover:border-white/30 hover:text-white';
    videoModeBtn.textContent = '🎬 Video';

    modeToggleRow.appendChild(modeLabel);
    modeToggleRow.appendChild(imageModeBtn);
    modeToggleRow.appendChild(videoModeBtn);
    bar.appendChild(modeToggleRow);

    // --- Uploads Row ---
    const uploadsRow = document.createElement('div');
    uploadsRow.className = 'flex items-start gap-3 px-2';

    // ── Image Upload ──
    const imageFileInput = document.createElement('input');
    imageFileInput.type = 'file';
    imageFileInput.accept = 'image/*';
    imageFileInput.className = 'hidden';

    const imageUploadBtn = document.createElement('button');
    imageUploadBtn.type = 'button';
    imageUploadBtn.title = 'Upload portrait image';
    imageUploadBtn.className = 'flex-shrink-0 w-14 h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 group relative overflow-hidden';
    imageUploadBtn.innerHTML = `
        <div class="image-icon flex flex-col items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted group-hover:text-primary transition-colors"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span class="text-[9px] text-muted group-hover:text-primary font-bold">IMAGE</span>
        </div>
        <div class="image-spinner hidden items-center justify-center w-full h-full absolute inset-0"><span class="animate-spin text-primary text-sm">◌</span></div>
        <div class="image-ready hidden flex-col items-center gap-1 absolute inset-0 bg-primary/10 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary mt-3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/><polyline points="7 18 10 15 13 18" stroke="#d9ff00" stroke-width="2.5"/></svg>
            <span class="text-[9px] text-primary font-bold">READY</span>
        </div>
    `;
    imageUploadBtn.appendChild(imageFileInput);

    // ── Video Upload ──
    const videoFileInput = document.createElement('input');
    videoFileInput.type = 'file';
    videoFileInput.accept = 'video/*';
    videoFileInput.className = 'hidden';

    const videoUploadBtn = document.createElement('button');
    videoUploadBtn.type = 'button';
    videoUploadBtn.title = 'Upload source video';
    videoUploadBtn.className = 'flex-shrink-0 w-14 h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 group relative overflow-hidden hidden';
    videoUploadBtn.innerHTML = `
        <div class="video-icon flex flex-col items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted group-hover:text-primary transition-colors"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span class="text-[9px] text-muted group-hover:text-primary font-bold">VIDEO</span>
        </div>
        <div class="video-spinner hidden items-center justify-center w-full h-full absolute inset-0"><span class="animate-spin text-primary text-sm">◌</span></div>
        <div class="video-ready hidden flex-col items-center gap-1 absolute inset-0 bg-primary/10 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary mt-3"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><polyline points="7 10 10 13 15 8" stroke="#d9ff00" stroke-width="2.5"/></svg>
            <span class="text-[9px] text-primary font-bold">READY</span>
        </div>
    `;
    videoUploadBtn.appendChild(videoFileInput);

    // ── Audio Upload ──
    const audioFileInput = document.createElement('input');
    audioFileInput.type = 'file';
    audioFileInput.accept = 'audio/*';
    audioFileInput.className = 'hidden';

    const audioUploadBtn = document.createElement('button');
    audioUploadBtn.type = 'button';
    audioUploadBtn.title = 'Upload audio file';
    audioUploadBtn.className = 'flex-shrink-0 w-14 h-14 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 group relative overflow-hidden';
    audioUploadBtn.innerHTML = `
        <div class="audio-icon flex flex-col items-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted group-hover:text-primary transition-colors"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
            <span class="text-[9px] text-muted group-hover:text-primary font-bold">AUDIO</span>
        </div>
        <div class="audio-spinner hidden items-center justify-center w-full h-full absolute inset-0"><span class="animate-spin text-primary text-sm">◌</span></div>
        <div class="audio-ready hidden flex-col items-center gap-1 absolute inset-0 bg-primary/10 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary mt-3"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><polyline points="7 10 10 13 15 8" stroke="#d9ff00" stroke-width="2.5"/></svg>
            <span class="text-[9px] text-primary font-bold">READY</span>
        </div>
    `;
    audioUploadBtn.appendChild(audioFileInput);

    // ── Prompt Textarea ──
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Optional: describe the talking style or motion...';
    textarea.className = 'flex-1 bg-transparent text-white placeholder-muted/50 text-sm resize-none outline-none min-h-[56px] leading-relaxed pt-1';
    textarea.rows = 2;

    uploadsRow.appendChild(imageUploadBtn);
    uploadsRow.appendChild(videoUploadBtn);
    uploadsRow.appendChild(audioUploadBtn);
    uploadsRow.appendChild(textarea);
    bar.appendChild(uploadsRow);

    // ── Status labels ──
    const statusRow = document.createElement('div');
    statusRow.className = 'flex items-center gap-3 px-2 text-xs text-muted';

    const imageStatusLabel = document.createElement('span');
    imageStatusLabel.className = 'text-muted';
    imageStatusLabel.textContent = 'No image';

    const audioStatusLabel = document.createElement('span');
    audioStatusLabel.className = 'text-muted';
    audioStatusLabel.textContent = 'No audio';

    statusRow.appendChild(imageStatusLabel);
    statusRow.appendChild(document.createTextNode(' · '));
    statusRow.appendChild(audioStatusLabel);
    bar.appendChild(statusRow);

    // ── Bottom Controls Row ──
    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex items-center gap-2 md:gap-3 flex-wrap px-2';

    // Model selector
    const modelBtn = document.createElement('button');
    modelBtn.id = 'ls-model-btn';
    modelBtn.type = 'button';
    modelBtn.className = 'flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 transition-all text-xs font-bold text-white group';
    modelBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg><span id="ls-model-btn-label">${getCurrentModels()[0].name}</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-muted group-hover:text-white transition-colors"><polyline points="6 9 12 15 18 9"/></svg>`;

    // Resolution selector
    const resolutionBtn = document.createElement('button');
    resolutionBtn.id = 'ls-resolution-btn';
    resolutionBtn.type = 'button';
    resolutionBtn.className = 'flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 transition-all text-xs font-bold text-white group';
    resolutionBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span id="ls-resolution-btn-label">${selectedResolution}</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-muted group-hover:text-white transition-colors"><polyline points="6 9 12 15 18 9"/></svg>`;

    // Generate button
    const generateBtn = document.createElement('button');
    generateBtn.id = 'ls-generate-btn';
    generateBtn.type = 'button';
    generateBtn.className = 'ml-auto px-6 py-2.5 bg-primary text-black font-black text-sm rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';
    generateBtn.textContent = 'Generate ✨';

    bottomRow.appendChild(modelBtn);
    bottomRow.appendChild(resolutionBtn);
    bottomRow.appendChild(generateBtn);
    bar.appendChild(bottomRow);

    promptWrapper.appendChild(bar);
    container.appendChild(promptWrapper);

    // ==========================================
    // 3. DROPDOWN SYSTEM
    // ==========================================
    const dropdown = document.createElement('div');
    dropdown.className = 'hidden fixed z-[100] bg-[#111] border border-white/10 rounded-2xl shadow-3xl p-2 min-w-[200px] max-h-[400px] overflow-y-auto custom-scrollbar';
    dropdown.id = 'ls-dropdown';

    const closeDropdown = (e) => {
        if (!e || (!dropdown.contains(e.target) && !e.target.closest('[id^="ls-"]'))) {
            dropdown.classList.add('hidden');
            dropdownOpen = null;
        }
    };

    const populateDropdown = (type) => {
        dropdown.innerHTML = '';
        if (type === 'model') {
            const models = getCurrentModels();
            models.forEach(m => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = `w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10 ${m.id === selectedModel ? 'text-primary font-bold bg-primary/5' : 'text-white font-medium'}`;
                item.innerHTML = `<div>${m.name}</div><div class="text-xs text-muted mt-0.5">${m.description?.slice(0, 60)}...</div>`;
                item.onclick = () => {
                    selectedModel = m.id;
                    document.getElementById('ls-model-btn-label').textContent = m.name;
                    const resolutions = getResolutionsForLipSyncModel(selectedModel);
                    if (resolutions.length > 0) {
                        selectedResolution = m.inputs?.resolution?.default || resolutions[0];
                        document.getElementById('ls-resolution-btn-label').textContent = selectedResolution;
                        resolutionBtn.classList.remove('hidden');
                    } else {
                        resolutionBtn.classList.add('hidden');
                    }
                    textarea.style.display = m.hasPrompt ? '' : 'none';
                    closeDropdown();
                };
                dropdown.appendChild(item);
            });
        } else if (type === 'resolution') {
            const resolutions = getResolutionsForLipSyncModel(selectedModel);
            resolutions.forEach(r => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = `w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all hover:bg-white/10 ${r === selectedResolution ? 'text-primary font-bold bg-primary/5' : 'text-white font-medium'}`;
                item.textContent = r;
                item.onclick = () => {
                    selectedResolution = r;
                    document.getElementById('ls-resolution-btn-label').textContent = r;
                    closeDropdown();
                };
                dropdown.appendChild(item);
            });
        }
    };

    const openDropdown = (type, anchorBtn) => {
        dropdownOpen = type;

        // Populate and temporarily show off-screen to measure height
        populateDropdown(type);
        dropdown.style.top = '-9999px';
        dropdown.style.bottom = 'auto';
        dropdown.classList.remove('hidden');

        const ddHeight = dropdown.offsetHeight;
        const rect = anchorBtn.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;

        if (spaceBelow >= ddHeight || spaceBelow >= spaceAbove) {
            dropdown.style.top = `${rect.bottom + 8}px`;
            dropdown.style.bottom = 'auto';
            dropdown.style.maxHeight = `${Math.max(150, spaceBelow - 8)}px`;
        } else {
            dropdown.style.top = 'auto';
            dropdown.style.bottom = `${window.innerHeight - rect.top + 8}px`;
            dropdown.style.maxHeight = `${Math.max(150, spaceAbove - 8)}px`;
        }
        dropdown.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;
    };

    modelBtn.onclick = (e) => { e.stopPropagation(); if (dropdownOpen === 'model') { closeDropdown(); } else { openDropdown('model', modelBtn); } };
    resolutionBtn.onclick = (e) => { e.stopPropagation(); if (dropdownOpen === 'resolution') { closeDropdown(); } else { openDropdown('resolution', resolutionBtn); } };
    window.addEventListener('click', closeDropdown);
    container.appendChild(dropdown);

    // ==========================================
    // 4. MODE SWITCHING LOGIC
    // ==========================================
    const updateUIForMode = () => {
        if (inputMode === 'image') {
            imageModeBtn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-primary bg-primary/10 text-primary';
            videoModeBtn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/10 text-muted hover:border-white/30 hover:text-white';
            imageUploadBtn.classList.remove('hidden');
            videoUploadBtn.classList.add('hidden');
        } else {
            videoModeBtn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-primary bg-primary/10 text-primary';
            imageModeBtn.className = 'px-4 py-1.5 rounded-xl text-xs font-bold transition-all border border-white/10 text-muted hover:border-white/30 hover:text-white';
            videoUploadBtn.classList.remove('hidden');
            imageUploadBtn.classList.add('hidden');
        }

        // Switch to first model of new mode
        const models = getCurrentModels();
        selectedModel = models[0].id;
        document.getElementById('ls-model-btn-label').textContent = models[0].name;

        // Update resolution
        const resolutions = getResolutionsForLipSyncModel(selectedModel);
        if (resolutions.length > 0) {
            selectedResolution = models[0].inputs?.resolution?.default || resolutions[0];
            document.getElementById('ls-resolution-btn-label').textContent = selectedResolution;
            resolutionBtn.classList.remove('hidden');
        } else {
            resolutionBtn.classList.add('hidden');
        }

        // Show/hide prompt
        textarea.style.display = models[0].hasPrompt ? '' : 'none';
    };

    imageModeBtn.onclick = () => {
        if (inputMode === 'image') return;
        inputMode = 'image';
        uploadedVideoUrl = null;
        updateVideoUploadState('idle');
        updateUIForMode();
    };

    videoModeBtn.onclick = () => {
        if (inputMode === 'video') return;
        inputMode = 'video';
        uploadedImageUrl = null;
        updateImageUploadState('idle');
        updateUIForMode();
    };

    // ==========================================
    // 5. UPLOAD HANDLERS
    // ==========================================
    const updateImageUploadState = (state, filename) => {
        const icon = imageUploadBtn.querySelector('.image-icon');
        const spinner = imageUploadBtn.querySelector('.image-spinner');
        const ready = imageUploadBtn.querySelector('.image-ready');
        if (state === 'idle') {
            icon.classList.remove('hidden'); icon.classList.add('flex');
            spinner.classList.add('hidden'); spinner.classList.remove('flex');
            ready.classList.add('hidden'); ready.classList.remove('flex');
            imageUploadBtn.classList.remove('border-primary/60');
            imageUploadBtn.classList.add('border-white/10');
            imageUploadBtn.title = 'Upload portrait image';
            imageStatusLabel.textContent = 'No image';
            imageStatusLabel.className = 'text-muted';
        } else if (state === 'loading') {
            icon.classList.add('hidden'); icon.classList.remove('flex');
            spinner.classList.remove('hidden'); spinner.classList.add('flex');
            ready.classList.add('hidden'); ready.classList.remove('flex');
        } else if (state === 'ready') {
            icon.classList.add('hidden'); icon.classList.remove('flex');
            spinner.classList.add('hidden'); spinner.classList.remove('flex');
            ready.classList.remove('hidden'); ready.classList.add('flex');
            imageUploadBtn.classList.remove('border-white/10');
            imageUploadBtn.classList.add('border-primary/60');
            imageUploadBtn.title = `${filename} — click to clear`;
            imageStatusLabel.textContent = `✓ ${filename}`;
            imageStatusLabel.className = 'text-primary';
        }
    };

    const updateVideoUploadState = (state, filename) => {
        const icon = videoUploadBtn.querySelector('.video-icon');
        const spinner = videoUploadBtn.querySelector('.video-spinner');
        const ready = videoUploadBtn.querySelector('.video-ready');
        if (state === 'idle') {
            icon.classList.remove('hidden'); icon.classList.add('flex');
            spinner.classList.add('hidden'); spinner.classList.remove('flex');
            ready.classList.add('hidden'); ready.classList.remove('flex');
            videoUploadBtn.classList.remove('border-primary/60');
            videoUploadBtn.classList.add('border-white/10');
            videoUploadBtn.title = 'Upload source video';
            imageStatusLabel.textContent = 'No video';
            imageStatusLabel.className = 'text-muted';
        } else if (state === 'loading') {
            icon.classList.add('hidden'); icon.classList.remove('flex');
            spinner.classList.remove('hidden'); spinner.classList.add('flex');
            ready.classList.add('hidden'); ready.classList.remove('flex');
        } else if (state === 'ready') {
            icon.classList.add('hidden'); icon.classList.remove('flex');
            spinner.classList.add('hidden'); spinner.classList.remove('flex');
            ready.classList.remove('hidden'); ready.classList.add('flex');
            videoUploadBtn.classList.remove('border-white/10');
            videoUploadBtn.classList.add('border-primary/60');
            videoUploadBtn.title = `${filename} — click to clear`;
            imageStatusLabel.textContent = `✓ ${filename}`;
            imageStatusLabel.className = 'text-primary';
        }
    };

    const updateAudioUploadState = (state, filename) => {
        const icon = audioUploadBtn.querySelector('.audio-icon');
        const spinner = audioUploadBtn.querySelector('.audio-spinner');
        const ready = audioUploadBtn.querySelector('.audio-ready');
        if (state === 'idle') {
            icon.classList.remove('hidden'); icon.classList.add('flex');
            spinner.classList.add('hidden'); spinner.classList.remove('flex');
            ready.classList.add('hidden'); ready.classList.remove('flex');
            audioUploadBtn.classList.remove('border-primary/60');
            audioUploadBtn.classList.add('border-white/10');
            audioUploadBtn.title = 'Upload audio file';
            audioStatusLabel.textContent = 'No audio';
            audioStatusLabel.className = 'text-muted';
        } else if (state === 'loading') {
            icon.classList.add('hidden'); icon.classList.remove('flex');
            spinner.classList.remove('hidden'); spinner.classList.add('flex');
            ready.classList.add('hidden'); ready.classList.remove('flex');
        } else if (state === 'ready') {
            icon.classList.add('hidden'); icon.classList.remove('flex');
            spinner.classList.add('hidden'); spinner.classList.remove('flex');
            ready.classList.remove('hidden'); ready.classList.add('flex');
            audioUploadBtn.classList.remove('border-white/10');
            audioUploadBtn.classList.add('border-primary/60');
            audioUploadBtn.title = `${filename} — click to clear`;
            audioStatusLabel.textContent = `✓ ${filename}`;
            audioStatusLabel.className = 'text-primary';
        }
    };

    imageUploadBtn.onclick = async (e) => {
        e.stopPropagation();
        if (uploadedImageUrl) {
            uploadedImageUrl = null;
            updateImageUploadState('idle');
            return;
        }
        imageFileInput.click();
    };

    imageFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const apiKey = await securityService.getDecryptedKey();
        if (!apiKey) { AuthModal(() => imageFileInput.click()); return; }
        updateImageUploadState('loading');
        try {
            uploadedImageUrl = await muapi.uploadFile(file);
            updateImageUploadState('ready', file.name);
        } catch (err) {
            updateImageUploadState('idle');
            alert(`Image upload failed: ${err.message}`);
        }
        imageFileInput.value = '';
    };

    videoUploadBtn.onclick = async (e) => {
        e.stopPropagation();
        if (uploadedVideoUrl) {
            uploadedVideoUrl = null;
            updateVideoUploadState('idle');
            return;
        }
        videoFileInput.click();
    };

    videoFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const apiKey = await securityService.getDecryptedKey();
        if (!apiKey) { AuthModal(() => videoFileInput.click()); return; }
        updateVideoUploadState('loading');
        try {
            uploadedVideoUrl = await muapi.uploadFile(file);
            updateVideoUploadState('ready', file.name);
        } catch (err) {
            updateVideoUploadState('idle');
            alert(`Video upload failed: ${err.message}`);
        }
        videoFileInput.value = '';
    };

    audioUploadBtn.onclick = async (e) => {
        e.stopPropagation();
        if (uploadedAudioUrl) {
            uploadedAudioUrl = null;
            updateAudioUploadState('idle');
            return;
        }
        audioFileInput.click();
    };

    audioFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const apiKey = await securityService.getDecryptedKey();
        if (!apiKey) { AuthModal(() => audioFileInput.click()); return; }
        updateAudioUploadState('loading');
        try {
            uploadedAudioUrl = await muapi.uploadFile(file);
            updateAudioUploadState('ready', file.name);
        } catch (err) {
            updateAudioUploadState('idle');
            alert(`Audio upload failed: ${err.message}`);
        }
        audioFileInput.value = '';
    };

    // Hide resolution if first model has none
    if (getResolutionsForLipSyncModel(selectedModel).length === 0) {
        resolutionBtn.classList.add('hidden');
    }

    // ==========================================
    // 6. CANVAS AREA + HISTORY
    // ==========================================
    const generationHistory = [];

    const historySidebar = document.createElement('div');
    historySidebar.className = 'fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-50 flex flex-col items-center py-4 gap-3 overflow-y-auto transition-all duration-500 translate-x-full opacity-0';
    historySidebar.id = 'lipsync-history-sidebar';

    const historyLabel = document.createElement('div');
    historyLabel.className = 'text-[9px] font-bold text-muted uppercase tracking-widest mb-2';
    historyLabel.textContent = 'History';
    historySidebar.appendChild(historyLabel);

    const historyList = document.createElement('div');
    historyList.className = 'flex flex-col gap-2 w-full px-2';
    historySidebar.appendChild(historyList);
    container.appendChild(historySidebar);

    // Main canvas
    const canvas = document.createElement('div');
    canvas.className = 'absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-10 opacity-0 pointer-events-none transition-all duration-1000 translate-y-10 scale-95';

    const videoContainer = document.createElement('div');
    videoContainer.className = 'relative group';

    const resultVideo = document.createElement('video');
    resultVideo.className = 'max-h-[60vh] max-w-[80vw] rounded-3xl shadow-3xl border border-white/10 interactive-glow object-contain';
    resultVideo.controls = true;
    resultVideo.loop = true;
    resultVideo.autoplay = true;
    resultVideo.muted = false;
    resultVideo.playsInline = true;
    videoContainer.appendChild(resultVideo);

    const canvasControls = document.createElement('div');
    canvasControls.className = 'mt-6 flex gap-3 opacity-0 transition-opacity delay-500 duration-500 justify-center';

    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    regenerateBtn.textContent = '↻ Regenerate';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-glow active:scale-95';
    downloadBtn.textContent = '↓ Download';

    const newBtn = document.createElement('button');
    newBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    newBtn.textContent = '+ New';

    canvasControls.appendChild(regenerateBtn);
    canvasControls.appendChild(downloadBtn);
    canvasControls.appendChild(newBtn);
    canvas.appendChild(videoContainer);
    canvas.appendChild(canvasControls);
    container.appendChild(canvas);

    const showVideoInCanvas = (videoUrl) => {
        hero.classList.add('hidden');
        promptWrapper.classList.add('hidden');
        resultVideo.src = videoUrl;
        resultVideo.onloadeddata = () => {
            canvas.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
            canvas.classList.add('opacity-100', 'translate-y-0', 'scale-100');
            canvasControls.classList.remove('opacity-0');
            canvasControls.classList.add('opacity-100');
        };
    };

    const addToHistory = (entry) => {
        generationHistory.unshift(entry);
        localStorage.setItem('lipsync_history', JSON.stringify(generationHistory.slice(0, 30)));
        historySidebar.classList.remove('translate-x-full', 'opacity-0');
        historySidebar.classList.add('translate-x-0', 'opacity-100');
        renderHistory();
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        generationHistory.forEach((entry, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `relative group/thumb cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${idx === 0 ? 'border-primary shadow-glow' : 'border-white/10 hover:border-white/30'}`;
            thumb.innerHTML = `
                <video src="${entry.url}" preload="metadata" muted class="w-full aspect-square object-cover"></video>
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <button class="hist-download p-1.5 bg-primary rounded-lg text-black hover:scale-110 transition-transform" title="Download">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                </div>
            `;
            thumb.onclick = (e) => {
                if (e.target.closest('.hist-download')) { downloadFile(entry.url, `lipsync-${entry.id || idx}.mp4`); return; }
                showVideoInCanvas(entry.url);
                historyList.querySelectorAll('div').forEach(t => { t.classList.remove('border-primary', 'shadow-glow'); t.classList.add('border-white/10'); });
                thumb.classList.remove('border-white/10');
                thumb.classList.add('border-primary', 'shadow-glow');
            };
            historyList.appendChild(thumb);
        });
    };

    const downloadFile = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl; a.download = filename;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch { window.open(url, '_blank'); }
    };

    // Load history
    try {
        const saved = JSON.parse(localStorage.getItem('lipsync_history') || '[]');
        if (saved.length > 0) {
            saved.forEach(e => generationHistory.push(e));
            historySidebar.classList.remove('translate-x-full', 'opacity-0');
            historySidebar.classList.add('translate-x-0', 'opacity-100');
            renderHistory();
        }
    } catch { /* ignore */ }

    // Resume pending jobs
    (async () => {
        const pending = getPendingJobs('lipsync');
        if (!pending.length) return;
        const apiKey = await securityService.getDecryptedKey();
        if (!apiKey) return;
        const banner = document.createElement('div');
        banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-[#111] border border-white/10 text-white text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3';
        banner.innerHTML = `<span class="animate-spin text-primary">◌</span> <span class="banner-text">Resuming ${pending.length} pending generation${pending.length > 1 ? 's' : ''}…</span>`;
        document.body.appendChild(banner);
        let remaining = pending.length;
        pending.forEach(async (job) => {
            const elapsedAttempts = Math.floor((Date.now() - job.submittedAt) / job.interval);
            const attemptsLeft = Math.max(1, job.maxAttempts - elapsedAttempts);
            try {
                const result = await muapi.pollForResult(job.requestId, apiKey, attemptsLeft, job.interval);
                const url = result.outputs?.[0] || result.url || result.output?.url;
                if (url) addToHistory({ id: job.requestId, url, ...job.historyMeta, timestamp: new Date().toISOString() });
            } catch (e) { console.warn('[LipSyncStudio] Pending job failed:', job.requestId, e.message); }
            finally {
                removePendingJob(job.requestId);
                remaining--;
                if (remaining === 0) banner.remove();
                else banner.querySelector('.banner-text').textContent = `Resuming ${remaining} pending generation${remaining > 1 ? 's' : ''}…`;
            }
        });
    })();

    // ==========================================
    // 7. CANVAS BUTTON HANDLERS
    // ==========================================
    downloadBtn.onclick = () => {
        const current = resultVideo.src;
        if (current) {
            const entry = generationHistory.find(e => e.url === current);
            downloadFile(current, `lipsync-${entry?.id || 'clip'}.mp4`);
        }
    };

    regenerateBtn.onclick = () => generateBtn.click();

    newBtn.onclick = () => {
        canvas.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
        canvasControls.classList.add('opacity-0');
        canvasControls.classList.remove('opacity-100');
        hero.classList.remove('hidden', 'opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        promptWrapper.classList.remove('hidden', 'opacity-40');
        textarea.value = '';
        textarea.focus();
    };

    // ==========================================
    // 8. GENERATION LOGIC
    // ==========================================
    generateBtn.onclick = async () => {
        const model = getCurrentModel();
        const prompt = textarea.value.trim();

        // Validation
        if (!uploadedAudioUrl) {
            alert('Please upload an audio file first.');
            return;
        }
        if (inputMode === 'image' && !uploadedImageUrl) {
            alert('Please upload a portrait image first.');
            return;
        }
        if (inputMode === 'video' && !uploadedVideoUrl) {
            alert('Please upload a source video first.');
            return;
        }

        const apiKey = await securityService.getDecryptedKey();
        if (!apiKey) { AuthModal(() => generateBtn.click()); return; }

        hero.classList.add('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="animate-spin inline-block mr-2 text-black">◌</span> Generating...`;

        let hadError = false;
        let capturedRequestId = null;
        const historyMeta = { prompt, model: selectedModel };

        const onRequestId = (rid) => {
            capturedRequestId = rid;
            savePendingJob({ requestId: rid, studioType: 'lipsync', historyMeta, maxAttempts: 900, interval: 2000, submittedAt: Date.now() });
        };

        try {
            const lipsyncParams = {
                model: selectedModel,
                audio_url: uploadedAudioUrl,
                onRequestId
            };

            if (inputMode === 'image') {
                lipsyncParams.image_url = uploadedImageUrl;
            } else {
                lipsyncParams.video_url = uploadedVideoUrl;
            }

            if (prompt && model?.hasPrompt) lipsyncParams.prompt = prompt;

            const resolutions = getResolutionsForLipSyncModel(selectedModel);
            if (resolutions.length > 0) lipsyncParams.resolution = selectedResolution;

            if (model?.hasSeed) lipsyncParams.seed = -1;

            const res = await muapi.processLipSync(lipsyncParams);
            console.log('[LipSyncStudio] Response:', res);

            if (res && res.url) {
                if (capturedRequestId) removePendingJob(capturedRequestId);
                const genId = res.id || capturedRequestId || Date.now().toString();
                addToHistory({ id: genId, url: res.url, prompt, model: selectedModel, timestamp: new Date().toISOString() });
                showVideoInCanvas(res.url);
            } else {
                throw new Error('No video URL returned by API');
            }
        } catch (e) {
            hadError = true;
            if (capturedRequestId) removePendingJob(capturedRequestId);
            console.error(e);
            hero.classList.remove('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
            generateBtn.innerHTML = `Error: ${e.message.slice(0, 60)}`;
            setTimeout(() => { generateBtn.innerHTML = `Generate ✨`; }, 4000);
        } finally {
            generateBtn.disabled = false;
            if (!hadError) generateBtn.innerHTML = `Generate ✨`;
        }
    };

    return container;
}
