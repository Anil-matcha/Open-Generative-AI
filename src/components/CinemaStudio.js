
import { muapi } from '../lib/muapi.js';
import { CameraControls } from './CameraControls.js';
import { buildNanoBananaPrompt, CAMERA_MAP, LENS_MAP, FOCAL_PERSPECTIVE, APERTURE_EFFECT } from '../lib/promptUtils.js';
import { AuthModal } from './AuthModal.js';

export function CinemaStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden';

    // --- State ---
    const currentSettings = {
        prompt: '',
        aspect_ratio: '16:9',
        camera: Object.keys(CAMERA_MAP)[0],
        lens: Object.keys(LENS_MAP)[0],
        focal: 35,
        aperture: "f/1.4"
    };
    
    // Camera builder panel state
    let showCameraBuilder = false;

    // ==========================================
    // 1. HERO SECTION (Empty State)
    // ==========================================
    const heroSection = document.createElement('div');
    heroSection.className = 'flex flex-col items-center justify-center text-center px-4 animate-fade-in-up';
    heroSection.innerHTML = `
        <div class="mb-4 text-xs font-bold text-white/40 tracking-[0.2em] uppercase">Cinema Studio 2.0</div>
        <h1 class="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tight leading-tight mb-2">
            What would you shoot<br>with infinite budget?
        </h1>
    `;
    container.appendChild(heroSection);

    // ==========================================
    // 2. CAMERA CONTROLS OVERLAY
    // ==========================================
    const overlayBackdrop = document.createElement('div');
    overlayBackdrop.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-40 opacity-0 pointer-events-none transition-opacity duration-300 flex items-center justify-center';

    const overlayContent = document.createElement('div');
    // Reduced padding for mobile (p-4) and added max-height/overflow handling
    overlayContent.className = 'w-full max-w-4xl bg-[#141414] border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl transform scale-95 transition-transform duration-300 flex flex-col max-h-[90vh]';
    overlayBackdrop.appendChild(overlayContent);

    // Header for Overlay
    const overlayHeader = document.createElement('div');
    overlayHeader.className = 'flex items-center justify-between mb-8';
    overlayHeader.innerHTML = `
        <div class="flex gap-4">
            <button class="px-4 py-2 bg-white text-black text-xs font-bold rounded-full">All</button>
        </div>
        <button id="close-overlay-btn" class="text-white/50 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
    `;
    overlayContent.appendChild(overlayHeader);

    // Controls Component
    const cameraControls = CameraControls((state) => {
        currentSettings.camera = state.camera;
        currentSettings.lens = state.lens;
        currentSettings.focal = state.focal;
        currentSettings.aperture = state.aperture;
        updateSummaryCard();
    });
    overlayContent.appendChild(cameraControls);

    document.body.appendChild(overlayBackdrop); // Append to body to sit above everything

    // Overlay Logic
    const openOverlay = () => {
        overlayBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        overlayContent.classList.remove('scale-95');
        overlayContent.classList.add('scale-100');
    };
    const closeOverlay = () => {
        overlayBackdrop.classList.add('opacity-0', 'pointer-events-none');
        overlayContent.classList.add('scale-95');
        overlayContent.classList.remove('scale-100');
    };
    overlayContent.querySelector('#close-overlay-btn').onclick = closeOverlay;
    overlayBackdrop.onclick = (e) => { if (e.target === overlayBackdrop) closeOverlay(); };


    // ==========================================
    // 3. FLOATING PROMPT BAR
    // ==========================================
    const promptBarWrapper = document.createElement('div');
    promptBarWrapper.className = 'absolute bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-30';

    const promptBar = document.createElement('div');
    promptBar.className = 'bg-[#1a1a1a] border border-white/10 rounded-[2rem] p-4 flex justify-between shadow-3xl items-end relative';

    // --- LEFT COLUMN (Input + Settings) ---
    const leftColumn = document.createElement('div');
    leftColumn.className = 'flex-1 flex flex-col gap-3 min-h-[80px] justify-between py-1 px-1';

    // 1. Input Area
    const inputRow = document.createElement('div');
    inputRow.className = 'flex items-start gap-3 w-full';



    // Textarea
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Describe your scene - use @ to add characters & props';
    textarea.className = 'flex-1 bg-transparent border-none text-white text-lg font-medium placeholder:text-white/20 focus:outline-none resize-none h-[28px] leading-relaxed overflow-hidden';
    textarea.style.height = 'auto'; // Auto-grow check
    textarea.rows = 1;
    textarea.oninput = function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    };
    inputRow.appendChild(textarea);

    leftColumn.appendChild(inputRow);

    // 2. Settings Toolbar (Bottom Left)
    // 2. Settings Toolbar (Bottom Left)
    const settingsToolbar = document.createElement('div');
    settingsToolbar.className = 'flex items-center gap-3'; // Removed pl-11 to align left

    // Helper: Create Dropdown
    const createDropdown = (items, selected, onSelect, trigger) => {
        const existing = document.querySelectorAll('.custom-dropdown');
        existing.forEach(el => el.remove());

        const rect = trigger.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'custom-dropdown fixed bg-[#1a1a1a] border border-white/10 rounded-xl py-1 shadow-2xl z-50 flex flex-col min-w-[100px] animate-fade-in';
        menu.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
        menu.style.left = rect.left + 'px';

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = `px-3 py-2 text-xs font-bold text-left hover:bg-white/10 transition-colors ${item === selected ? 'text-primary' : 'text-white'}`;
            btn.textContent = item;
            btn.onclick = (e) => {
                e.stopPropagation();
                onSelect(item);
                menu.remove();
            };
            menu.appendChild(btn);
        });

        const closeHandler = (e) => {
            if (!menu.contains(e.target) && e.target !== trigger) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);
        document.body.appendChild(menu);
    };

    // Aspect Ratio
    const arBtn = document.createElement('button');
    arBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5';
    const updateArBtn = () => {
        arBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"/></svg> ${currentSettings.aspect_ratio}`;
    };
    updateArBtn();
    arBtn.onclick = () => {
        createDropdown(['16:9', '21:9', '9:16', '1:1', '4:5'], currentSettings.aspect_ratio, (val) => {
            currentSettings.aspect_ratio = val;
            updateArBtn();
        }, arBtn);
    };
    settingsToolbar.appendChild(arBtn);

    // Resolution
    const resBtn = document.createElement('button');
    resBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5';
    const updateResBtn = (val) => {
        resBtn.dataset.value = val || '2K';
        resBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> ${resBtn.dataset.value}`;
    };
    updateResBtn('2K');
    resBtn.onclick = () => {
        createDropdown(['1K', '2K', '4K'], resBtn.dataset.value, (val) => { updateResBtn(val); }, resBtn);
    };
    settingsToolbar.appendChild(resBtn);
    
    // Camera Builder Toggle Button
    const cameraBuilderBtn = document.createElement('button');
    cameraBuilderBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5';
    cameraBuilderBtn.setAttribute('data-tooltip', 'Quick camera builder');
    cameraBuilderBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/></svg> Builder`;
    settingsToolbar.appendChild(cameraBuilderBtn);

    leftColumn.appendChild(settingsToolbar);
    promptBar.appendChild(leftColumn);


    // --- RIGHT GROUP (Summary + Generate) ---
    const rightGroup = document.createElement('div');
    rightGroup.className = 'flex items-center gap-2 h-full self-end mb-1';

    // Summary Card (Triggers Overlay)
    const summaryCard = document.createElement('button');
    // Removed 'hidden' class, added 'flex' and refined width constraints for mobile
    summaryCard.className = 'flex flex-col items-start justify-center px-4 py-2 bg-[#2a2a2a] rounded-xl border border-white/5 hover:border-white/20 transition-colors text-left flex-1 min-w-[100px] md:min-w-[140px] max-w-[240px] h-[56px] relative group overflow-hidden';
    summaryCard.setAttribute('data-tooltip', 'Open camera settings');

    // Dot indicator
    const dot = document.createElement('div');
    dot.className = 'absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-glow-sm';
    summaryCard.appendChild(dot);

    const summaryTitle = document.createElement('span');
    summaryTitle.className = 'text-[10px] font-bold text-white uppercase truncate w-full tracking-wide';
    summaryTitle.textContent = currentSettings.camera;

    const summaryValue = document.createElement('span');
    summaryValue.className = 'text-[10px] font-medium text-white/60 truncate w-full';
    summaryValue.textContent = formatSummaryValue();

    summaryCard.appendChild(summaryTitle);
    summaryCard.appendChild(summaryValue);

    summaryCard.onclick = openOverlay;

    function formatSummaryValue() {
        return `${currentSettings.lens}, ${currentSettings.focal}mm, ${currentSettings.aperture}`;
    }

    function updateSummaryCard() {
        summaryTitle.textContent = currentSettings.camera;
        summaryValue.textContent = formatSummaryValue();
    }

    // Generate Button
    const generateBtn = document.createElement('button');
    generateBtn.className = 'h-[56px] px-8 bg-[#d9ff00] text-black rounded-xl font-black text-xs uppercase hover:bg-white transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed';
    generateBtn.setAttribute('data-tooltip', 'Generate cinema shot');
    generateBtn.innerHTML = `GENERATE ✨`;

    rightGroup.appendChild(summaryCard);
    rightGroup.appendChild(generateBtn);
    promptBar.appendChild(rightGroup);

    promptBarWrapper.appendChild(promptBar);
    container.appendChild(promptBarWrapper);

    // ==========================================
    // 3B. CAMERA BUILDER PANEL (Collapsible)
    // ==========================================
    const cameraBuilderPanel = document.createElement('div');
    cameraBuilderPanel.className = 'absolute bottom-8 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-20';
    cameraBuilderPanel.style.display = 'none'; // Hidden by default
    
    const builderCard = document.createElement('div');
    builderCard.className = 'bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-3xl';
    
    builderCard.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h4 class="text-xs font-bold text-white">Camera Builder</h4>
            <button id="close-builder-btn" class="text-white/40 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted uppercase">Camera</label>
                <select id="builder-camera" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50">
                    ${Object.keys(CAMERA_MAP).map(c => `<option value="${c}" ${c === currentSettings.camera ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted uppercase">Lens</label>
                <select id="builder-lens" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50">
                    ${Object.keys(LENS_MAP).map(l => `<option value="${l}" ${l === currentSettings.lens ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted uppercase">Focal</label>
                <select id="builder-focal" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50">
                    ${Object.keys(FOCAL_PERSPECTIVE).map(f => `<option value="${f}" ${f === currentSettings.focal ? 'selected' : ''}>${f}mm</option>`).join('')}
                </select>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold text-muted uppercase">Aperture</label>
                <select id="builder-aperture" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50">
                    ${Object.keys(APERTURE_EFFECT).map(a => `<option value="${a}" ${a === currentSettings.aperture ? 'selected' : ''}>${a}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="flex flex-col gap-2">
            <label class="text-[10px] font-bold text-muted uppercase">Preview</label>
            <div id="builder-preview" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-xs min-h-[40px]"></div>
            <button id="apply-builder-btn" class="px-4 py-2 bg-primary text-black rounded-lg text-xs font-bold hover:shadow-glow transition-all">
                Use This Setup
            </button>
        </div>
    `;
    
    cameraBuilderPanel.appendChild(builderCard);
    container.appendChild(cameraBuilderPanel);
    
    // Camera Builder toggle logic
    cameraBuilderBtn.onclick = () => {
        showCameraBuilder = !showCameraBuilder;
        cameraBuilderPanel.style.display = showCameraBuilder ? 'block' : 'none';
        if (showCameraBuilder) updateBuilderPreview();
    };
    
    const closeBuilderBtn = cameraBuilderPanel.querySelector('#close-builder-btn');
    if (closeBuilderBtn) closeBuilderBtn.onclick = () => {
        showCameraBuilder = false;
        cameraBuilderPanel.style.display = 'none';
    };
    
    // Update builder preview
    const updateBuilderPreview = () => {
        const camera = builderCard.querySelector('#builder-camera')?.value || currentSettings.camera;
        const lens = builderCard.querySelector('#builder-lens')?.value || currentSettings.lens;
        const focal = parseInt(builderCard.querySelector('#builder-focal')?.value || currentSettings.focal);
        const aperture = builderCard.querySelector('#builder-aperture')?.value || currentSettings.aperture;
        
        const preview = buildNanoBananaPrompt('', camera, lens, focal, aperture);
        const previewEl = builderCard.querySelector('#builder-preview');
        if (previewEl) {
            previewEl.textContent = preview || 'Select camera settings to see preview...';
        }
    };
    
    // Builder event listeners
    const builderCamera = builderCard.querySelector('#builder-camera');
    const builderLens = builderCard.querySelector('#builder-lens');
    const builderFocal = builderCard.querySelector('#builder-focal');
    const builderAperture = builderCard.querySelector('#builder-aperture');
    
    if (builderCamera) builderCamera.onchange = updateBuilderPreview;
    if (builderLens) builderLens.onchange = updateBuilderPreview;
    if (builderFocal) builderFocal.onchange = updateBuilderPreview;
    if (builderAperture) builderAperture.onchange = updateBuilderPreview;
    
    const applyBuilderBtn = builderCard.querySelector('#apply-builder-btn');
    if (applyBuilderBtn) {
        applyBuilderBtn.onclick = () => {
            currentSettings.camera = builderCamera?.value || currentSettings.camera;
            currentSettings.lens = builderLens?.value || currentSettings.lens;
            currentSettings.focal = parseInt(builderFocal?.value || currentSettings.focal);
            currentSettings.aperture = builderAperture?.value || currentSettings.aperture;
            updateSummaryCard();
            showCameraBuilder = false;
            cameraBuilderPanel.style.display = 'none';
        };
    }


    // ==========================================
    // 3. HISTORY SIDEBAR
    // ==========================================
    const generationHistory = [];

    // History Sidebar - VISIBLE BY DEFAULT (removed translate-x-full opacity-0)
    const historySidebar = document.createElement('div');
    historySidebar.className = 'fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-50 flex flex-col items-center py-4 gap-3 overflow-y-auto transition-all duration-500';

    const historyLabel = document.createElement('div');
    historyLabel.className = 'text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2';
    historyLabel.textContent = 'History';
    historySidebar.appendChild(historyLabel);

    const historyList = document.createElement('div');
    historyList.className = 'flex flex-col gap-2 w-full px-2';
    historySidebar.appendChild(historyList);

    container.appendChild(historySidebar);

    // ==========================================
    // 4. CANVAS AREA (Result View)
    // ==========================================
    const canvas = document.createElement('div');
    canvas.className = 'absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-30 opacity-0 pointer-events-none transition-all duration-1000 translate-y-10 scale-95 bg-black/90 backdrop-blur-3xl';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative group max-w-full max-h-[70vh] flex items-center justify-center';

    const resultImg = document.createElement('img');
    resultImg.className = 'max-h-[60vh] max-w-[90vw] rounded-2xl shadow-2xl border border-white/10 object-contain';
    imageContainer.appendChild(resultImg);
    canvas.appendChild(imageContainer);

    // Canvas Controls
    const canvasControls = document.createElement('div');
    canvasControls.className = 'mt-8 flex gap-3 opacity-0 transition-opacity delay-500 duration-500 justify-center';

    const createActionBtn = (label, primary = false) => {
        const btn = document.createElement('button');
        btn.className = primary
            ? 'bg-[#d9ff00] text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-white transition-colors shadow-glow-sm hover:scale-105 active:scale-95'
            : 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-white/5 backdrop-blur-lg text-white hover:border-white/20';
        btn.textContent = label;
        return btn;
    };

    const regenerateBtn = createActionBtn('↻ Regenerate');
    const downloadBtn = createActionBtn('↓ Download', true);
    const newPromptBtn = createActionBtn('+ New Shot');

    canvasControls.appendChild(regenerateBtn);
    canvasControls.appendChild(downloadBtn);
    canvasControls.appendChild(newPromptBtn);
    canvas.appendChild(canvasControls);

    container.appendChild(canvas);

    // --- History Logic ---
    const renderHistory = () => {
        historyList.innerHTML = '';
        generationHistory.forEach((entry, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `relative group/thumb cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 aspect-square ${idx === 0 ? 'border-[#d9ff00] shadow-glow-sm' : 'border-white/10 hover:border-white/30'}`;

            thumb.innerHTML = `
                <img src="${entry.url}" class="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="text-[8px] font-bold text-white uppercase">Load</span>
                </div>
            `;

            thumb.onclick = () => loadHistoryItem(entry, thumb);
            historyList.appendChild(thumb);
        });
    };

    const addToHistory = (entry) => {
        generationHistory.unshift(entry);
        localStorage.setItem('cinema_history', JSON.stringify(generationHistory.slice(0, 50)));
        renderHistory();
    };

    const loadHistoryItem = (entry, thumbElement) => {
        // Restore Settings
        if (entry.settings) {
            currentSettings.camera = entry.settings.camera;
            currentSettings.lens = entry.settings.lens;
            currentSettings.focal = entry.settings.focal;
            currentSettings.aperture = entry.settings.aperture;
            currentSettings.aspect_ratio = entry.settings.aspect_ratio;

            // Update UI elements
            textarea.value = entry.settings.prompt || '';
            updateSummaryCard();
            updateArBtn();
            updateResBtn(entry.settings.resolution || '2K');
        }

        showCanvas(entry.url);

        // Highlight active history item
        if (thumbElement) {
            historyList.querySelectorAll('div').forEach(t => {
                t.classList.remove('border-[#d9ff00]', 'shadow-glow-sm');
                t.classList.add('border-white/10');
            });
            thumbElement.classList.remove('border-white/10');
            thumbElement.classList.add('border-[#d9ff00]', 'shadow-glow-sm');
        }
    };

    const showCanvas = (url) => {
        resultImg.src = url;

        // Hide Input UI
        heroSection.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        promptBarWrapper.classList.add('opacity-0', 'pointer-events-none', 'translate-y-20');

        // Show Canvas
        canvas.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.add('opacity-100', 'translate-y-0', 'scale-100');
        canvasControls.classList.remove('opacity-0');
        canvasControls.classList.add('opacity-100');
    };

    const resetToPrompt = () => {
        // Hide Canvas
        canvas.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.remove('opacity-100', 'translate-y-0', 'scale-100');

        // Show Input UI
        heroSection.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        promptBarWrapper.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-20');

        // Clear prompt for new shot?
        textarea.value = '';
        textarea.focus();
    };

    // Load saved history
    try {
        const saved = JSON.parse(localStorage.getItem('cinema_history') || '[]');
        if (saved.length > 0) {
            saved.forEach(e => generationHistory.push(e));
            renderHistory();
        }
    } catch (e) { }

    // Actions
    newPromptBtn.onclick = resetToPrompt;

    regenerateBtn.onclick = () => {
        resetToPrompt();
        setTimeout(() => {
            generateBtn.click();
        }, 300);
    };

    downloadBtn.onclick = async () => {
        try {
            const response = await fetch(resultImg.src);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `cinema-shot-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            window.open(resultImg.src, '_blank');
        }
    };

    // ==========================================
    // 5. GENERATION LOGIC UPDATE
    // ==========================================
    generateBtn.onclick = async () => {
        const basePrompt = textarea.value.trim();
        if (!basePrompt) return;

        const apiKey = localStorage.getItem('muapi_key');
        if (!apiKey) {
            AuthModal(() => generateBtn.click());
            return;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = "SHOOTING...";

        // Compile Prompt
        const finalPrompt = buildNanoBananaPrompt(
            basePrompt,
            currentSettings.camera,
            currentSettings.lens,
            currentSettings.focal,
            currentSettings.aperture
        );

        try {
            const res = await muapi.generateImage({
                model: 'nano-banana-pro',
                prompt: finalPrompt,
                aspect_ratio: currentSettings.aspect_ratio,
                resolution: (resBtn.dataset.value || '1k').toLowerCase(),
                negative_prompt: "blurry, low quality, distortion, bad composition"
            });

            if (res && res.url) {
                // Save to history
                addToHistory({
                    url: res.url,
                    timestamp: Date.now(),
                    settings: {
                        prompt: basePrompt,
                        ...currentSettings,
                        resolution: resBtn.dataset.value
                    }
                });

                showCanvas(res.url);
            } else {
                throw new Error('No Data');
            }

        } catch (e) {
            console.error(e);
            alert('Generation Failed: ' + e.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = `GENERATE ✨`;
        }
    };

    return container;
}
