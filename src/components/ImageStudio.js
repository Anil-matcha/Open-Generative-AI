import { muapi } from '../lib/muapi.js';
import { createSafeImage } from '../lib/security.js';
import {
    t2iModels, getAspectRatiosForModel, getResolutionsForModel, getQualityFieldForModel,
    i2iModels, getAspectRatiosForI2IModel, getResolutionsForI2IModel, getQualityFieldForI2IModel,
    getMaxImagesForI2IModel
} from '../lib/models.js';
import { ENHANCE_TAGS, QUICK_PROMPTS } from '../lib/promptUtils.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';
import { createInlineInstructions } from './InlineInstructions.js';
import { createHeroSection } from '../lib/thumbnails.js';

export function ImageStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-start bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

    // --- State ---
    const defaultModel = t2iModels[0];
    let selectedModel = defaultModel.id;
    let selectedModelName = defaultModel.name;
    let selectedAr = defaultModel.inputs?.aspect_ratio?.default || '1:1';
    let dropdownOpen = null;
    let uploadedImageUrls = []; // array of uploaded image URLs (multi-image support)
    let imageMode = false; // false = t2i models, true = i2i models
    
    // Advanced parameters state
    let negativePrompt = '';
    let guidanceScale = 7.5;
    let steps = 25;
    let seed = -1;
    let showAdvanced = false;
    let selectedStyle = 'None';
    let batchCount = 1;
    
    // New advanced controls
    let customWidth = 0;  // 0 means use default (aspect ratio based)
    let customHeight = 0;
    let referenceStrength = 50;  // 0-100, for style reference models
    let selectedLora = '';  // LoRA model ID from Civitai
    let loraWeight = 1.0;
    
    // Quick tools panel state
    let showToolsPanel = false;

    const getCurrentModels = () => imageMode ? i2iModels : t2iModels;
    const getCurrentAspectRatios = (id) => imageMode ? getAspectRatiosForI2IModel(id) : getAspectRatiosForModel(id);
    const getCurrentResolutions = (id) => imageMode ? getResolutionsForI2IModel(id) : getResolutionsForModel(id);
    const getCurrentQualityField = (id) => imageMode ? getQualityFieldForI2IModel(id) : getQualityFieldForModel(id);

    // ==========================================
    // 1. HERO SECTION
    // ==========================================
    const hero = document.createElement('div');
    hero.className = 'flex flex-col items-center mb-2 md:mb-4 animate-fade-in-up transition-all duration-700 w-full';
    const heroBanner = createHeroSection('image', 'h-32 md:h-44 mb-3');
    if (heroBanner) {
        const heroContent = document.createElement('div');
        heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
        heroContent.innerHTML = `
            <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-1">Image Studio</h1>
            <p class="text-white/60 text-sm font-medium">Transform images with AI — upscale, stylize, animate and more</p>
        `;
        heroBanner.appendChild(heroContent);
        hero.appendChild(heroBanner);
    }
    container.appendChild(hero);

    // ==========================================
    // 2. PROMPT BAR (Tailwind Refactor)
    // ==========================================
    const promptWrapper = document.createElement('div');
    promptWrapper.className = 'w-full relative z-40 animate-fade-in-up';
    promptWrapper.style.animationDelay = '0.2s';

    const bar = document.createElement('div');
    bar.className = 'w-full bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 flex flex-col gap-3 md:gap-5 shadow-3xl';

    // Top Row: Input
    const topRow = document.createElement('div');
    topRow.className = 'flex items-start gap-5 px-2';

    // --- Image Upload Picker (Image-to-Image) ---
    const picker = createUploadPicker({
        anchorContainer: container,
        onSelect: ({ url, urls }) => {
            uploadedImageUrls = urls || [url];
            if (!imageMode) {
                imageMode = true;
                selectedModel = i2iModels[0].id;
                selectedModelName = i2iModels[0].name;
                selectedAr = getAspectRatiosForI2IModel(selectedModel)[0];
                document.getElementById('model-btn-label').textContent = selectedModelName;
                document.getElementById('ar-btn-label').textContent = selectedAr;
                const validResolutions = getResolutionsForI2IModel(selectedModel);
                qualityBtn.style.display = validResolutions.length > 0 ? 'flex' : 'none';
                if (validResolutions.length > 0) document.getElementById('quality-btn-label').textContent = validResolutions[0];
                picker.setMaxImages(getMaxImagesForI2IModel(selectedModel));
            }
            textarea.placeholder = uploadedImageUrls.length > 1
                ? `${uploadedImageUrls.length} images selected — describe the transformation (optional)`
                : 'Describe how to transform this image (optional)';
        },
        onClear: () => {
            uploadedImageUrls = [];
            imageMode = false;
            selectedModel = t2iModels[0].id;
            selectedModelName = t2iModels[0].name;
            selectedAr = getAspectRatiosForModel(selectedModel)[0];
            document.getElementById('model-btn-label').textContent = selectedModelName;
            document.getElementById('ar-btn-label').textContent = selectedAr;
            const t2iResolutions = getResolutionsForModel(selectedModel);
            qualityBtn.style.display = t2iResolutions.length > 0 ? 'flex' : 'none';
            if (t2iResolutions.length > 0) document.getElementById('quality-btn-label').textContent = t2iResolutions[0];
            picker.setMaxImages(1);
            textarea.placeholder = 'Describe the image you want to create';
        }
    });
    topRow.appendChild(picker.trigger);
    container.appendChild(picker.panel);

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Describe the image you want to create';
    textarea.className = 'flex-1 bg-transparent border-none text-white text-base md:text-xl placeholder:text-muted focus:outline-none resize-none pt-2.5 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar';
    textarea.rows = 1;
    textarea.oninput = () => {
        textarea.style.height = 'auto';
        const maxHeight = window.innerWidth < 768 ? 150 : 250;
        textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    };

    const prefill = localStorage.getItem('prefill_prompt');
    if (prefill) {
        textarea.value = prefill;
        localStorage.removeItem('prefill_prompt');
        requestAnimationFrame(() => {
            textarea.style.height = 'auto';
            const maxHeight = window.innerWidth < 768 ? 150 : 250;
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        });
    }

    topRow.appendChild(textarea);

    // GTM Prompt Enhancer Button
    const gtmBtn = document.createElement('button');
    gtmBtn.className = 'w-10 h-10 shrink-0 rounded-xl border bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all flex items-center justify-center relative overflow-hidden mt-1.5 group';
    gtmBtn.title = 'GTM Prompt Enhancement - Create conversion-optimized prompts';
    gtmBtn.innerHTML = '🚀';
    gtmBtn.onclick = () => {
        openGTMPromptModal(textarea);
    };
    topRow.appendChild(gtmBtn);

    bar.appendChild(topRow);

    // Bottom Row: Controls
    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-2 pt-4 border-t border-white/5';

    const controlsLeft = document.createElement('div');
    controlsLeft.className = 'flex items-center gap-1.5 md:gap-2.5 relative overflow-x-auto no-scrollbar pb-1 md:pb-0';

    const createControlBtn = (icon, label, id, tooltip) => {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap';
        if (tooltip) btn.setAttribute('data-tooltip', tooltip);
        btn.innerHTML = `
            ${icon}
            <span id="${id}-label" class="text-xs font-bold text-white group-hover:text-primary transition-colors">${label}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" class="opacity-20 group-hover:opacity-100 transition-opacity"><path d="M6 9l6 6 6-6"/></svg>
        `;
        return btn;
    };

    const modelBtn = createControlBtn(`
        <div class="w-5 h-5 bg-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
            <span class="text-[10px] font-black text-black">G</span>
        </div>
    `, selectedModelName, 'model-btn', 'Select AI generation model');

    const arBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
    `, selectedAr, 'ar-btn', 'Change aspect ratio');

    const qualityBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><path d="M6 2L3 6v15a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"/></svg>
    `, '720p', 'quality-btn', 'Set output quality');

    controlsLeft.appendChild(modelBtn);
    controlsLeft.appendChild(arBtn);
    controlsLeft.appendChild(qualityBtn);
    
    // Advanced options toggle button
    const advancedBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 001.82-.33 1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-1.82.33A1.65 1.65 0 0019.4 9a1.65 1.65 0 00-1.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
    `, 'Advanced', 'advanced-btn', 'Show advanced options');
    controlsLeft.appendChild(advancedBtn);
    
    // Quick Tools toggle button
    const toolsBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
    `, 'Tools', 'tools-btn', 'Quick starters & prompt enhancer');
    controlsLeft.appendChild(toolsBtn);
    // Show quality button if the default model has quality/resolution options
    const _initResolutions = getResolutionsForModel(defaultModel.id);
    qualityBtn.style.display = _initResolutions.length > 0 ? 'flex' : 'none';
    if (_initResolutions.length > 0) {
        const qlabel = qualityBtn.querySelector('#quality-btn-label');
        if (qlabel) qlabel.textContent = _initResolutions[0];
    }

    const generateBtn = document.createElement('button');
    generateBtn.className = 'bg-primary text-black px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-base hover:shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto shadow-lg';
    generateBtn.setAttribute('data-tooltip', 'Generate AI image from prompt');
    generateBtn.innerHTML = `Generate ✨`;

    bottomRow.appendChild(controlsLeft);
    bottomRow.appendChild(generateBtn);
    bar.appendChild(bottomRow);
    promptWrapper.appendChild(bar);
    container.appendChild(promptWrapper);

    const inlineInstructions = createInlineInstructions('image');
    inlineInstructions.classList.add('mt-8');
    container.appendChild(inlineInstructions);

    // ==========================================
    // 3. QUICK TOOLS PANEL (Prompt Enhancer + Quick Starters)
    // ==========================================
    const toolsPanel = document.createElement('div');
    toolsPanel.className = 'w-full mt-6 animate-fade-in-up hidden';
    toolsPanel.id = 'tools-panel';
    
    // Build tools panel HTML
    toolsPanel.innerHTML = `
        <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 class="text-sm font-bold text-white">Quick Tools</h3>
                <button id="close-tools-btn" class="text-white/40 hover:text-white transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            
            <div class="flex flex-col lg:flex-row gap-6">
                <!-- Quick Starters Section -->
                <div class="flex-1">
                    <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Quick Starters</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        ${QUICK_PROMPTS.map(q => `
                            <button class="quick-starter-btn px-3 py-2 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 hover:text-primary transition-all text-left border border-white/5 hover:border-primary/30" data-prompt="${q.prompt}">
                                ${q.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Prompt Enhancer Section -->
                <div class="flex-1">
                    <h4 class="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Prompt Enhancer</h4>
                    <div class="flex flex-col gap-3">
                        <input type="text" id="base-prompt-input" 
                            placeholder="Enter base prompt..."
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
                        
                        <div>
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Enhancement Tags</label>
                            <div id="enhance-tags-area" class="flex flex-wrap gap-1.5">
                                ${Object.entries(ENHANCE_TAGS).map(([category, tags]) => 
                                    tags.map(tag => `<button class="enhance-tag-btn px-2 py-1 rounded-full text-[10px] font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all" data-tag="${tag}">${tag}</button>`).join('')
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="flex flex-col gap-2">
                            <label class="text-[10px] font-bold text-muted uppercase tracking-wider">Enhanced Prompt</label>
                            <div id="enhanced-prompt-display" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs min-h-[40px]"></div>
                            <div class="flex gap-2">
                                <button id="copy-enhanced-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all">
                                    Copy
                                </button>
                                <button id="use-enhanced-btn" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:shadow-glow transition-all">
                                    Use in Generator
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(toolsPanel);

    // ==========================================
    // 4. ADVANCED OPTIONS PANEL
    // ==========================================
    const STYLE_PRESETS = ['None', 'Photorealistic', 'Anime', 'Cinematic', 'Oil Painting', 'Watercolor', 'Digital Art', 'Concept Art', 'Cyberpunk'];
    
    const advancedPanel = document.createElement('div');
    advancedPanel.className = 'w-full mt-6 animate-fade-in-up hidden';
    advancedPanel.id = 'advanced-panel';
    advancedPanel.innerHTML = `
        <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <div class="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 class="text-sm font-bold text-white">Advanced Options</h3>
                <button id="close-adv-btn" class="text-white/40 hover:text-white transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>
            
            <!-- Style Presets -->
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-secondary uppercase tracking-wider">Style Preset</label>
                <div class="flex gap-2 flex-wrap">
                    ${STYLE_PRESETS.map(s => `<button class="style-preset-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-secondary hover:bg-white/10 transition-all" data-style="${s}">${s}</button>`).join('')}
                </div>
            </div>
            
            <!-- Negative Prompt -->
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-secondary uppercase tracking-wider">Negative Prompt</label>
                <input type="text" id="negative-prompt-input" 
                    placeholder="What to exclude from the image (e.g., blurry, distorted, watermark)"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
            </div>
            
            <!-- Guidance Scale & Steps Row -->
            <div class="flex gap-4 flex-wrap">
                <div class="flex-1 min-w-[200px] flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-secondary uppercase tracking-wider">Guidance Scale</label>
                        <span id="guidance-value" class="text-xs font-bold text-primary">7.5</span>
                    </div>
                    <input type="range" id="guidance-slider" min="1" max="20" step="0.5" value="7.5" 
                        class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
                </div>
                
                <div class="flex-1 min-w-[200px] flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-secondary uppercase tracking-wider">Steps</label>
                        <span id="steps-value" class="text-xs font-bold text-primary">25</span>
                    </div>
                    <input type="range" id="steps-slider" min="1" max="50" step="1" value="25" 
                        class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
                </div>
            </div>
            
            <!-- Seed -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">Seed</label>
                    <button id="randomize-seed-btn" class="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Randomize</button>
                </div>
                <input type="number" id="seed-input" 
                    placeholder="-1 for random"
                    value="-1"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
            </div>
            
            <!-- Batch Count -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">Batch Count</label>
                    <span id="batch-value" class="text-xs font-bold text-primary">1</span>
                </div>
                <input type="range" id="batch-slider" min="1" max="4" step="1" value="1" 
                    class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
            </div>
            
            <!-- Width & Height -->
            <div class="flex gap-4 flex-wrap">
                <div class="flex-1 min-w-[120px] flex flex-col gap-2">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">Width</label>
                    <input type="number" id="width-input" 
                        placeholder="Auto"
                        value=""
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
                </div>
                <div class="flex-1 min-w-[120px] flex flex-col gap-2">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">Height</label>
                    <input type="number" id="height-input" 
                        placeholder="Auto"
                        value=""
                        class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
                </div>
            </div>
            
            <!-- Reference Strength (for I2I models) -->
            <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-secondary uppercase tracking-wider">Reference Strength</label>
                    <span id="reference-strength-value" class="text-xs font-bold text-primary">50%</span>
                </div>
                <input type="range" id="reference-strength-slider" min="0" max="100" step="5" value="50" 
                    class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary">
                <p class="text-xs text-muted">How much to preserve the reference image characteristics</p>
            </div>
            
            <!-- LoRA Model Selection -->
            <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-secondary uppercase tracking-wider">LoRA Model (Optional)</label>
                <input type="text" id="lora-input" 
                    placeholder="e.g., civitai:1642876@1864626"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors">
                <div class="flex items-center gap-2 mt-1">
                    <label class="text-xs font-bold text-secondary">LoRA Weight:</label>
                    <input type="number" id="lora-weight-input" 
                        value="1.0" min="0" max="4" step="0.1"
                        class="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors">
                </div>
                <p class="text-xs text-muted">Enter a LoRA model ID from Civitai (format: civitai:id@version)</p>
            </div>
        </div>
    `;
    container.appendChild(advancedPanel);

    // Advanced panel toggle logic
    const toggleAdvanced = () => {
        showAdvanced = !showAdvanced;
        advancedPanel.classList.toggle('hidden', !showAdvanced);
        document.getElementById('advanced-btn-label').textContent = showAdvanced ? 'Less' : 'Advanced';
    };
    
    // Add tools panel and advanced panel to container first before accessing their elements
    container.appendChild(toolsPanel);
    container.appendChild(advancedPanel);
    
    // Now set up event handlers after elements are in DOM
    advancedBtn.onclick = toggleAdvanced;
    const closeAdvBtn = advancedPanel.querySelector('#close-adv-btn');
    if (closeAdvBtn) closeAdvBtn.onclick = toggleAdvanced;
    
    // Quick Tools Panel toggle
    const toggleTools = () => {
        showToolsPanel = !showToolsPanel;
        toolsPanel.classList.toggle('hidden', !showToolsPanel);
        if (showToolsPanel) {
            // Close advanced panel when opening tools
            if (!showAdvanced) {
                showAdvanced = true;
                advancedPanel.classList.remove('hidden');
            }
        }
        document.getElementById('tools-btn-label').textContent = showToolsPanel ? 'Tools' : 'Tools';
    };
    
    toolsBtn.onclick = toggleTools;
    const closeToolsBtn = toolsPanel.querySelector('#close-tools-btn');
    if (closeToolsBtn) closeToolsBtn.onclick = toggleTools;
    
    // Quick Starter buttons
    const quickStarterBtns = toolsPanel.querySelectorAll('.quick-starter-btn');
    quickStarterBtns.forEach(btn => {
        btn.onclick = () => {
            const prompt = btn.dataset.prompt;
            textarea.value = prompt;
            textarea.style.height = 'auto';
            const maxHeight = window.innerWidth < 768 ? 150 : 250;
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
            // Close tools panel after selection
            showToolsPanel = false;
            toolsPanel.classList.add('hidden');
        };
    });
    
    // Prompt Enhancer - selected tags state
    const enhanceSelectedTags = new Set();
    const basePromptInput = toolsPanel.querySelector('#base-prompt-input');
    const enhancedPromptDisplay = toolsPanel.querySelector('#enhanced-prompt-display');
    
    // Update enhanced prompt display
    const updateEnhancedPrompt = () => {
        const base = basePromptInput?.value?.trim() || '';
        const tags = Array.from(enhanceSelectedTags).join(', ');
        const enhanced = [base, tags].filter(p => p).join(', ');
        if (enhancedPromptDisplay) {
            enhancedPromptDisplay.textContent = enhanced || 'Your enhanced prompt will appear here...';
            enhancedPromptDisplay.classList.toggle('text-muted', !enhanced);
        }
    };
    
    // Base prompt input handler
    if (basePromptInput) {
        basePromptInput.oninput = updateEnhancedPrompt;
    }
    
    // Enhance tag buttons
    const enhanceTagBtns = toolsPanel.querySelectorAll('.enhance-tag-btn');
    enhanceTagBtns.forEach(btn => {
        btn.onclick = () => {
            const tag = btn.dataset.tag;
            if (enhanceSelectedTags.has(tag)) {
                enhanceSelectedTags.delete(tag);
                btn.classList.remove('bg-primary', 'text-black');
                btn.classList.add('bg-white/5', 'text-secondary');
            } else {
                enhanceSelectedTags.add(tag);
                btn.classList.remove('bg-white/5', 'text-secondary');
                btn.classList.add('bg-primary', 'text-black');
            }
            updateEnhancedPrompt();
        };
    });
    
    // Copy enhanced button
    const copyEnhancedBtn = toolsPanel.querySelector('#copy-enhanced-btn');
    if (copyEnhancedBtn) {
        copyEnhancedBtn.onclick = () => {
            const text = enhancedPromptDisplay?.textContent || '';
            if (text && text !== 'Your enhanced prompt will appear here...') {
                navigator.clipboard.writeText(text);
                copyEnhancedBtn.textContent = 'Copied!';
                setTimeout(() => { copyEnhancedBtn.textContent = 'Copy'; }, 1500);
            }
        };
    }
    
    // Use enhanced button
    const useEnhancedBtn = toolsPanel.querySelector('#use-enhanced-btn');
    if (useEnhancedBtn) {
        useEnhancedBtn.onclick = () => {
            const text = enhancedPromptDisplay?.textContent || '';
            if (text && text !== 'Your enhanced prompt will appear here...') {
                textarea.value = text;
                textarea.style.height = 'auto';
                const maxHeight = window.innerWidth < 768 ? 150 : 250;
                textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
                // Close tools panel after use
                showToolsPanel = false;
                toolsPanel.classList.add('hidden');
            }
        };
    }
    
    // Negative prompt
    const negPromptInput = advancedPanel.querySelector('#negative-prompt-input');
    if (negPromptInput) negPromptInput.oninput = (e) => { negativePrompt = e.target.value; };
    
    // Guidance scale slider
    const guidanceSlider = advancedPanel.querySelector('#guidance-slider');
    const guidanceValue = advancedPanel.querySelector('#guidance-value');
    if (guidanceSlider && guidanceValue) {
        guidanceSlider.oninput = (e) => {
            guidanceScale = parseFloat(e.target.value);
            guidanceValue.textContent = guidanceScale;
        };
    }
    
    // Steps slider
    const stepsSlider = advancedPanel.querySelector('#steps-slider');
    const stepsValue = advancedPanel.querySelector('#steps-value');
    if (stepsSlider && stepsValue) {
        stepsSlider.oninput = (e) => {
            steps = parseInt(e.target.value);
            stepsValue.textContent = steps;
        };
    }
    
    // Seed input
    const seedInput = advancedPanel.querySelector('#seed-input');
    if (seedInput) seedInput.oninput = (e) => { seed = parseInt(e.target.value) || -1; };
    
    // Randomize seed button
    const randSeedBtn = advancedPanel.querySelector('#randomize-seed-btn');
    if (randSeedBtn) {
        randSeedBtn.onclick = () => {
            seed = Math.floor(Math.random() * 999999999);
            if (seedInput) seedInput.value = seed;
        };
    }
    
    // Batch count slider
    const batchSlider = advancedPanel.querySelector('#batch-slider');
    const batchValueEl = advancedPanel.querySelector('#batch-value');
    if (batchSlider && batchValueEl) {
        batchSlider.oninput = (e) => {
            batchCount = parseInt(e.target.value);
            batchValueEl.textContent = batchCount;
        };
    }
    
    // Width input
    const widthInput = advancedPanel.querySelector('#width-input');
    if (widthInput) {
        widthInput.oninput = (e) => {
            customWidth = parseInt(e.target.value) || 0;
        };
    }
    
    // Height input
    const heightInput = advancedPanel.querySelector('#height-input');
    if (heightInput) {
        heightInput.oninput = (e) => {
            customHeight = parseInt(e.target.value) || 0;
        };
    }
    
    // Reference strength slider
    const refStrengthSlider = advancedPanel.querySelector('#reference-strength-slider');
    const refStrengthValue = advancedPanel.querySelector('#reference-strength-value');
    if (refStrengthSlider && refStrengthValue) {
        refStrengthSlider.oninput = (e) => {
            referenceStrength = parseInt(e.target.value);
            refStrengthValue.textContent = referenceStrength + '%';
        };
    }
    
    // LoRA input
    const loraInput = advancedPanel.querySelector('#lora-input');
    if (loraInput) {
        loraInput.oninput = (e) => {
            selectedLora = e.target.value.trim();
        };
    }
    
    // LoRA weight input
    const loraWeightInput = advancedPanel.querySelector('#lora-weight-input');
    if (loraWeightInput) {
        loraWeightInput.oninput = (e) => {
            loraWeight = parseFloat(e.target.value) || 1.0;
        };
    }
    
    // Style preset handlers
    advancedPanel.querySelectorAll('.style-preset-btn').forEach(btn => {
        btn.onclick = () => {
            selectedStyle = btn.dataset.style;
            advancedPanel.querySelectorAll('.style-preset-btn').forEach(b => {
                b.classList.remove('bg-primary/20', 'text-primary', 'border-primary/30');
                b.classList.add('bg-white/5', 'text-secondary');
            });
            btn.classList.add('bg-primary/20', 'text-primary', 'border-primary/30');
            btn.classList.remove('bg-white/5', 'text-secondary');
        };
    });

    // ==========================================
    // 3. DROPDOWNS (Professional implementation)
    // ==========================================
    const dropdown = document.createElement('div');
    dropdown.className = 'absolute bottom-[102%] left-2 z-50 transition-all opacity-0 pointer-events-none scale-95 origin-bottom-left glass rounded-3xl p-3 translate-y-2 w-[calc(100vw-3rem)] max-w-xs shadow-4xl border border-white/10 flex flex-col';

    const showDropdown = (type, anchorBtn) => {
        dropdown.innerHTML = '';
        dropdown.classList.remove('opacity-0', 'pointer-events-none');
        dropdown.classList.add('opacity-100', 'pointer-events-auto');

        if (type === 'model') {
            dropdown.classList.add('w-[calc(100vw-3rem)]', 'max-w-xs');
            dropdown.classList.remove('max-w-[240px]', 'max-w-[200px]');
            dropdown.innerHTML = `
                <div class="flex flex-col h-full max-h-[70vh]">
                    <div class="px-2 pb-3 mb-2 border-b border-white/5 shrink-0">
                        <div class="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2.5 border border-white/5 focus-within:border-primary/50 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-muted"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                            <input type="text" id="model-search" placeholder="Search models..." class="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0">
                        </div>
                    </div>
                    <div class="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 shrink-0">Available models</div>
                    <div id="model-list-container" class="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2"></div>
                </div>
            `;
            const list = dropdown.querySelector('#model-list-container');

            const renderModels = (filter = '') => {
                list.innerHTML = '';
                const filtered = getCurrentModels().filter(m => m.name.toLowerCase().includes(filter.toLowerCase()) || m.id.toLowerCase().includes(filter.toLowerCase()));

                filtered.forEach(m => {
                    const item = document.createElement('div');
                    item.className = `flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? 'bg-white/5 border-white/5' : ''}`;
                    item.innerHTML = `
                        <div class="flex items-center gap-3.5">
                             <div class="w-10 h-10 ${m.family === 'kontext' ? 'bg-blue-500/10 text-blue-400' : m.family === 'effects' ? 'bg-purple-500/10 text-purple-400' : 'bg-primary/10 text-primary'} border border-white/5 rounded-xl flex items-center justify-center font-black text-sm shadow-inner uppercase">${m.name.charAt(0)}</div>
                             <div class="flex flex-col gap-0.5">
                                <span class="text-xs font-bold text-white tracking-tight">${m.name}</span>
                             </div>
                        </div>
                        ${selectedModel === m.id ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                    `;
                    item.onclick = (e) => {
                        e.stopPropagation();
                        selectedModel = m.id;
                        selectedModelName = m.name;
                        const availableArs = getCurrentAspectRatios(selectedModel);
                        selectedAr = availableArs[0];
                        document.getElementById('model-btn-label').textContent = selectedModelName;
                        document.getElementById('ar-btn-label').textContent = selectedAr;

                        const validResolutions = getCurrentResolutions(selectedModel);
                        qualityBtn.style.display = validResolutions.length > 0 ? 'flex' : 'none';
                        if (validResolutions.length > 0) {
                            document.getElementById('quality-btn-label').textContent = validResolutions[0];
                        }

                        // Update picker's max images when switching i2i models
                        if (imageMode) {
                            picker.setMaxImages(getMaxImagesForI2IModel(selectedModel));
                        }

                        closeDropdown();
                    };
                    list.appendChild(item);
                });
            };

            renderModels();

            const searchInput = dropdown.querySelector('#model-search');
            searchInput.onclick = (e) => e.stopPropagation();
            searchInput.oninput = (e) => renderModels(e.target.value);

        } else if (type === 'ar') {
            dropdown.classList.add('max-w-[240px]');
            dropdown.innerHTML = `<div class="text-[10px] font-bold text-muted uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Aspect Ratio</div>`;
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';

            const availableArs = getCurrentAspectRatios(selectedModel);
            availableArs.forEach(r => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group';
                item.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-6 h-6 border-2 border-white/20 rounded-md shadow-inner flex items-center justify-center group-hover:border-primary/50 transition-colors">
                             <div class="w-3 h-3 bg-white/10 rounded-sm"></div>
                        </div>
                        <span class="text-xs font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity">${r}</span>
                    </div>
                     ${selectedAr === r ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;
                item.onclick = (e) => {
                    e.stopPropagation();
                    selectedAr = r;
                    document.getElementById('ar-btn-label').textContent = r;
                    closeDropdown();
                };
                list.appendChild(item);
            });
            dropdown.appendChild(list);
        } else if (type === 'quality') {
            dropdown.classList.add('max-w-[200px]');
            dropdown.innerHTML = `<div class="text-[10px] font-bold text-secondary uppercase tracking-widest px-3 py-2 border-b border-white/5 mb-2">Resolution</div>`;
            const list = document.createElement('div');
            list.className = 'flex flex-col gap-1';

            const options = getCurrentResolutions(selectedModel);

            options.forEach(opt => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group';
                item.innerHTML = `
                    <span class="text-xs font-bold text-white opacity-80 group-hover:opacity-100">${opt}</span>
                     ${document.getElementById('quality-btn-label').textContent === opt ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9ff00" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                `;
                item.onclick = (e) => {
                    e.stopPropagation();
                    document.getElementById('quality-btn-label').textContent = opt;
                    closeDropdown();
                };
                list.appendChild(item);
            });
            dropdown.appendChild(list);
        }

        // Position dropdown
        const btnRect = anchorBtn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Horizontal position
        if (window.innerWidth < 768) {
            // Center on mobile
            dropdown.style.left = '50%';
            dropdown.style.transform = 'translateX(-50%) translate(0, 8px)';
        } else {
            // Align with button on desktop
            dropdown.style.left = `${btnRect.left - containerRect.left}px`;
            dropdown.style.transform = 'translate(0, 8px)';
        }

        // Vertical position (always above button)
        dropdown.style.bottom = `${containerRect.bottom - btnRect.top + 8}px`;
    };

    const closeDropdown = () => {
        dropdown.classList.add('opacity-0', 'pointer-events-none');
        dropdown.classList.remove('opacity-100', 'pointer-events-auto');
        dropdownOpen = null;
    };

    modelBtn.onclick = (e) => {
        e.stopPropagation();
        if (dropdownOpen === 'model') closeDropdown();
        else {
            dropdownOpen = 'model';
            showDropdown('model', modelBtn);
        }
    };

    arBtn.onclick = (e) => {
        e.stopPropagation();
        if (dropdownOpen === 'ar') closeDropdown();
        else {
            dropdownOpen = 'ar';
            showDropdown('ar', arBtn);
        }
    };

    qualityBtn.onclick = (e) => {
        e.stopPropagation();
        if (dropdownOpen === 'quality') closeDropdown();
        else {
            dropdownOpen = 'quality';
            showDropdown('quality', qualityBtn);
        }
    };

    window.onclick = () => closeDropdown();
    container.appendChild(dropdown);

    // ==========================================
    // 4. CANVAS AREA + HISTORY
    // ==========================================
    const generationHistory = [];

    // History sidebar
    const historySidebar = document.createElement('div');
    historySidebar.className = 'fixed right-0 top-0 h-full w-20 md:w-24 bg-black/60 backdrop-blur-xl border-l border-white/5 z-50 flex flex-col items-center py-4 gap-3 overflow-y-auto transition-all duration-500 translate-x-full opacity-0';
    historySidebar.id = 'history-sidebar';

    const historyLabel = document.createElement('div');
    historyLabel.className = 'text-[9px] font-bold text-muted uppercase tracking-widest mb-2 rotate-0';
    historyLabel.textContent = 'History';
    historySidebar.appendChild(historyLabel);

    const historyList = document.createElement('div');
    historyList.className = 'flex flex-col gap-2 w-full px-2';
    historySidebar.appendChild(historyList);

    container.appendChild(historySidebar);

    // Main canvas
    const canvas = document.createElement('div');
    canvas.className = 'absolute inset-0 flex flex-col items-center justify-center p-4 min-[800px]:p-16 z-10 opacity-0 pointer-events-none transition-all duration-1000 translate-y-10 scale-95';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative group';

    const resultImg = document.createElement('img');
    resultImg.className = 'max-h-[60vh] max-w-[80vw] rounded-3xl shadow-3xl border border-white/10 interactive-glow object-contain';
    imageContainer.appendChild(resultImg);

    // Canvas Controls
    const canvasControls = document.createElement('div');
    canvasControls.className = 'mt-6 flex gap-3 opacity-0 transition-opacity delay-500 duration-500 justify-center';

    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    regenerateBtn.textContent = '↻ Regenerate';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'bg-primary text-black px-6 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-glow active:scale-95';
    downloadBtn.textContent = '↓ Download';

    const newPromptBtn = document.createElement('button');
    newPromptBtn.className = 'bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-2xl text-xs font-bold transition-all border border-white/5 backdrop-blur-lg text-white';
    newPromptBtn.textContent = '+ New';

    canvasControls.appendChild(regenerateBtn);
    canvasControls.appendChild(downloadBtn);
    canvasControls.appendChild(newPromptBtn);

    canvas.appendChild(imageContainer);
    canvas.appendChild(canvasControls);
    container.appendChild(canvas);

    // --- Helper: Show image in canvas ---
    const showImageInCanvas = (imageUrl) => {
        // Fully hide hero and prompt
        hero.classList.add('hidden');
        promptWrapper.classList.add('hidden');

        resultImg.src = imageUrl;
        resultImg.onload = () => {
            canvas.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
            canvas.classList.add('opacity-100', 'translate-y-0', 'scale-100');
            canvasControls.classList.remove('opacity-0');
            canvasControls.classList.add('opacity-100');
        };
    };

    // --- Helper: Add to history ---
    const addToHistory = (entry) => {
        generationHistory.unshift(entry);

        // Save to localStorage
        localStorage.setItem('muapi_history', JSON.stringify(generationHistory.slice(0, 50)));

        // Show sidebar
        historySidebar.classList.remove('translate-x-full', 'opacity-0');
        historySidebar.classList.add('translate-x-0', 'opacity-100');

        renderHistory();
    };

    const renderHistory = () => {
        historyList.innerHTML = '';
        generationHistory.forEach((entry, idx) => {
            const thumb = document.createElement('div');
            thumb.className = `relative group/thumb cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${idx === 0 ? 'border-primary shadow-glow' : 'border-white/10 hover:border-white/30'}`;

            // Safe image creation - prevents XSS from user-provided URLs
            const img = createSafeImage(entry.url, entry.prompt?.substring(0, 30) || 'Generated', 'w-full aspect-square object-cover');
            thumb.appendChild(img);

            // Create overlay with download button
            const overlay = document.createElement('div');
            overlay.className = 'absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-1';
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'hist-download p-1.5 bg-primary rounded-lg text-black hover:scale-110 transition-transform';
            downloadBtn.title = 'Download';
            downloadBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
            overlay.appendChild(downloadBtn);
            thumb.appendChild(overlay);

            thumb.onclick = (e) => {
                if (e.target.closest('.hist-download')) {
                    downloadImage(entry.url, `muapi-${entry.id || idx}.jpg`);
                    return;
                }
                showImageInCanvas(entry.url);
                // Update active border
                historyList.querySelectorAll('div').forEach(t => {
                    t.classList.remove('border-primary', 'shadow-glow');
                    t.classList.add('border-white/10');
                });
                thumb.classList.remove('border-white/10');
                thumb.classList.add('border-primary', 'shadow-glow');
            };

            historyList.appendChild(thumb);
        });
    };

    // --- Helper: Download image ---
    const downloadImage = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            // Fallback: open in new tab
            window.open(url, '_blank');
        }
    };

    // --- Load history from localStorage ---
    try {
        const saved = JSON.parse(localStorage.getItem('muapi_history') || '[]');
        if (saved.length > 0) {
            saved.forEach(e => generationHistory.push(e));
            historySidebar.classList.remove('translate-x-full', 'opacity-0');
            historySidebar.classList.add('translate-x-0', 'opacity-100');
            renderHistory();
        }
    } catch (e) { /* ignore */ }

    // --- Button Handlers ---
    downloadBtn.onclick = () => {
        const current = resultImg.src;
        if (current) {
            const entry = generationHistory.find(e => e.url === current);
            downloadImage(current, `muapi-${entry?.id || 'image'}.jpg`);
        }
    };

    regenerateBtn.onclick = () => {
        generateBtn.click();
    };

    newPromptBtn.onclick = () => {
        // Reset to prompt view
        canvas.classList.add('opacity-0', 'pointer-events-none', 'translate-y-10', 'scale-95');
        canvas.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
        canvasControls.classList.add('opacity-0');
        canvasControls.classList.remove('opacity-100');
        // Restore hero and prompt
        hero.classList.remove('hidden', 'opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        promptWrapper.classList.remove('hidden', 'opacity-40');
        textarea.value = '';
        picker.reset();
        uploadedImageUrls = [];
        picker.setMaxImages(1);
        // Reset to t2i mode
        imageMode = false;
        selectedModel = t2iModels[0].id;
        selectedModelName = t2iModels[0].name;
        selectedAr = getAspectRatiosForModel(selectedModel)[0];
        document.getElementById('model-btn-label').textContent = selectedModelName;
        document.getElementById('ar-btn-label').textContent = selectedAr;
        const resetResolutions = getResolutionsForModel(selectedModel);
        qualityBtn.style.display = resetResolutions.length > 0 ? 'flex' : 'none';
        if (resetResolutions.length > 0) document.getElementById('quality-btn-label').textContent = resetResolutions[0];
        textarea.placeholder = 'Describe the image you want to create';
        textarea.focus();
    };

    // ==========================================
    // 5. GENERATION LOGIC
    // ==========================================
    generateBtn.onclick = async () => {
        const prompt = textarea.value.trim();
        if (imageMode) {
            if (uploadedImageUrls.length === 0) {
                alert('Please upload a reference image first.');
                return;
            }
        } else {
            if (!prompt) {
                alert('Please enter a prompt to generate an image.');
                return;
            }
        }

        const apiKey = await securityService.getDecryptedKey();
        if (!apiKey) {
            AuthModal(() => generateBtn.click());
            return;
        }

        hero.classList.add('opacity-0', 'scale-95', '-translate-y-10', 'pointer-events-none');
        generateBtn.disabled = true;
        generateBtn.innerHTML = `<span class="animate-spin inline-block mr-2 text-black">◌</span> Generating...`;

        try {
            let res;
            const qualityLabel = document.getElementById('quality-btn-label')?.textContent;
            if (imageMode) {
                const genParams = {
                    model: selectedModel,
                    images_list: uploadedImageUrls,
                    image_url: uploadedImageUrls[0], // backward compat for single-image models
                    aspect_ratio: selectedAr
                };
                if (prompt) genParams.prompt = prompt;
                if (negativePrompt) genParams.negative_prompt = negativePrompt;
                if (guidanceScale && guidanceScale !== 7.5) genParams.guidance_scale = guidanceScale;
                if (steps && steps !== 25) genParams.steps = steps;
                if (customWidth > 0) genParams.width = customWidth;
                if (customHeight > 0) genParams.height = customHeight;
                if (selectedLora) {
                    genParams.model_id = [{ model: selectedLora, weight: loraWeight }];
                }
                if (seed && seed !== -1) genParams.seed = seed;
                const qualityField = getCurrentQualityField(selectedModel);
                if (qualityField && qualityLabel) genParams[qualityField] = qualityLabel;
                res = await muapi.generateI2I(genParams);
            } else {
                const genParams = {
                    model: selectedModel,
                    prompt,
                    aspect_ratio: selectedAr
                };
                // Add style to prompt if selected
                if (selectedStyle && selectedStyle !== 'None') {
                    genParams.prompt = `${prompt}, ${selectedStyle.toLowerCase()} style`;
                }
                if (negativePrompt) genParams.negative_prompt = negativePrompt;
                if (guidanceScale && guidanceScale !== 7.5) genParams.guidance_scale = guidanceScale;
                if (steps && steps !== 25) genParams.steps = steps;
                if (seed && seed !== -1) genParams.seed = seed;
                const qualityField = getCurrentQualityField(selectedModel);
                if (qualityField && qualityLabel) genParams[qualityField] = qualityLabel;
                res = await muapi.generateImage(genParams);
            }

            console.log('[ImageStudio] Full response:', res);

            if (res && res.url) {
                // Add to history
                addToHistory({
                    id: res.id || Date.now().toString(),
                    url: res.url,
                    prompt: prompt,
                    model: selectedModel,
                    aspect_ratio: selectedAr,
                    timestamp: new Date().toISOString()
                });

                // Show image
                showImageInCanvas(res.url);
            } else {
                console.error('[ImageStudio] No image URL in response:', res);
                throw new Error('No image URL returned by API');
            }
        } catch (e) {
            generateBtn.innerHTML = `Error: ${e.message.slice(0, 40)}`;
            setTimeout(() => {
                generateBtn.innerHTML = `Generate ✨`;
                generateBtn.disabled = false;
            }, 3000);
            return;
        }
        generateBtn.disabled = false;
        generateBtn.innerHTML = `Generate ✨`;
    };

    // GTM Prompt Modal Function
    function openGTMPromptModal(promptTextarea) {
        try {
            const modal = new GTMPromptModal({
                appTheme: 'image-studio',
                onPromptGenerated: (generatedPrompt) => {
                    // Load the generated prompt into the textarea
                    promptTextarea.value = generatedPrompt;
                    promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

                    // Adjust textarea height
                    promptTextarea.style.height = 'auto';
                    const maxHeight = window.innerWidth < 768 ? 150 : 250;
                    promptTextarea.style.height = Math.min(promptTextarea.scrollHeight, maxHeight) + 'px';

                    // Show success message (you might want to add a toast system to ImageStudio)
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
