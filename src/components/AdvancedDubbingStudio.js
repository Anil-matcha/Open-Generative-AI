import { muapiEnhanced } from '../lib/muapiEnhanced.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';

export function AdvancedDubbingStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto custom-scrollbar overflow-x-hidden relative';

    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    let uploadedVideoUrl = null;
    let detectedLanguage = 'en';
    let sourceLanguage = 'en';
    let targetLanguage = 'es';
    let selectedVoice = null;
    let availableVoices = [];
    const isTranslating = false;
    const isDubbing = false;
    let previewAudioUrl = null;
    const currentJobId = null;

    // Voice cloning options
    let voiceCloneEnabled = false;
    let referenceAudioUrl = null;
    let clonedVoiceId = null;

    // Quality controls
    let lipSyncQuality = 'high';
    let preserveEmotion = true;
    let speedAdjustment = 1.0;
    let voiceStyle = 'natural';

    // ==========================================
    // TOP BAR WITH HERO BANNER AND INSTRUCTIONS
    // ==========================================
    const topBar = document.createElement('div');
    topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0 animate-fade-in-up';
    
    const heroBanner = createHeroSection('advanced-dubbing', 'h-32 md:h-44 mb-4');
    if (heroBanner) {
        const heroContent = document.createElement('div');
        heroContent.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
        heroContent.innerHTML = `
            <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-1">Advanced Dubbing Studio</h1>
            <p class="text-white/60 text-sm font-medium">Professional video translation and dubbing with voice cloning</p>
        `;
        heroBanner.appendChild(heroContent);
        topBar.appendChild(heroBanner);
    }
    
    const inlineInstructions = createInlineInstructions('advanced-dubbing');
    inlineInstructions.classList.add('px-4', 'md:px-8', 'mt-2', 'max-w-4xl', 'mx-auto');
    topBar.appendChild(inlineInstructions);
    
    container.appendChild(topBar);

    // ==========================================
    // MAIN CONTENT AREA
    // ==========================================
    const contentArea = document.createElement('div');
    contentArea.className = 'flex-1 overflow-y-auto px-4 md:px-8 pb-8';
    container.appendChild(contentArea);

    // ==========================================
    // MAIN FORM CARD
    // ==========================================
    const formCard = document.createElement('div');
    formCard.className = 'w-full max-w-4xl mx-auto bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 flex flex-col gap-6 animate-fade-in-up';
    formCard.style.animationDelay = '0.2s';

    // Video Upload Section
    const videoSection = document.createElement('div');
    videoSection.className = 'flex flex-col gap-3';
    videoSection.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
            </div>
            <label class="text-sm font-bold text-white">Source Video</label>
        </div>
    `;

    const videoPicker = createUploadPicker({
        anchorContainer: container,
        accept: 'video/*',
        onSelect: async ({ url }) => {
            uploadedVideoUrl = url;
            updateFormState();

            // Auto-detect language
            try {
                detectedLanguage = await muapiEnhanced.detectLanguage(url);
                sourceLanguage = detectedLanguage;
                updateLanguageSelectors();
                updateAvailableVoices();
            } catch (error) {
                console.warn('Language detection failed:', error);
            }
        },
        onClear: () => {
            uploadedVideoUrl = null;
            detectedLanguage = 'en';
            updateFormState();
        },
    });
    videoSection.appendChild(videoPicker.trigger);
    formCard.appendChild(videoSection);
    contentArea.appendChild(videoPicker.panel);

    // Language Selection Section
    const languageSection = document.createElement('div');
    languageSection.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    // Source Language
    const sourceLangGroup = document.createElement('div');
    sourceLangGroup.className = 'flex flex-col gap-2';
    sourceLangGroup.innerHTML = `
        <label class="text-sm font-bold text-secondary flex items-center gap-2">
            Source Language
            <span class="text-xs text-muted bg-white/5 px-2 py-0.5 rounded">Auto-detected</span>
        </label>
    `;

    const sourceLangSelect = document.createElement('select');
    sourceLangSelect.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none';
    sourceLangSelect.onchange = (e) => {
        sourceLanguage = e.target.value;
        updateAvailableVoices();
    };
    sourceLangGroup.appendChild(sourceLangSelect);
    languageSection.appendChild(sourceLangGroup);

    // Target Language
    const targetLangGroup = document.createElement('div');
    targetLangGroup.className = 'flex flex-col gap-2';
    targetLangGroup.innerHTML = `
        <label class="text-sm font-bold text-secondary">Target Language</label>
    `;

    const targetLangSelect = document.createElement('select');
    targetLangSelect.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none';
    targetLangSelect.onchange = (e) => {
        targetLanguage = e.target.value;
        updateAvailableVoices();
    };
    targetLangGroup.appendChild(targetLangSelect);
    languageSection.appendChild(targetLangGroup);

    formCard.appendChild(languageSection);

    // Voice Selection Section
    const voiceSection = document.createElement('div');
    voiceSection.className = 'flex flex-col gap-3';
    voiceSection.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                    <path d="M12 19v4"/>
                    <path d="M8 23h8"/>
                </svg>
            </div>
            <label class="text-sm font-bold text-white">Voice</label>
        </div>
    `;

    const voiceList = document.createElement('div');
    voiceList.className = 'grid grid-cols-2 md:grid-cols-3 gap-2';
    voiceSection.appendChild(voiceList);
    formCard.appendChild(voiceSection);

    // Voice cloning toggle
    const cloneToggle = document.createElement('button');
    cloneToggle.className = 'text-xs text-white/60 hover:text-white flex items-center gap-2 w-fit';
    cloneToggle.innerHTML = `
        <input type="checkbox" id="voiceCloneToggle" class="rounded">
        <label for="voiceCloneToggle">Use voice cloning</label>
    `;
    cloneToggle.querySelector('input').onchange = (e) => {
        voiceCloneEnabled = e.target.checked;
        updateFormState();
    };
    voiceSection.appendChild(cloneToggle);

    // Clone audio upload (hidden by default)
    const cloneAudioGroup = document.createElement('div');
    cloneAudioGroup.className = 'flex flex-col gap-2 hidden';
    const cloneLabel = document.createElement('label');
    cloneLabel.className = 'text-sm font-bold text-secondary';
    cloneLabel.textContent = 'Reference Audio (for voice cloning)';
    cloneAudioGroup.appendChild(cloneLabel);
    const clonePicker = createUploadPicker({
        anchorContainer: container,
        accept: 'audio/*',
        onSelect: ({ url }) => { referenceAudioUrl = url; },
        onClear: () => { referenceAudioUrl = null; },
    });
    cloneAudioGroup.appendChild(clonePicker.trigger);
    voiceSection.appendChild(cloneAudioGroup);
    contentArea.appendChild(clonePicker.panel);

    // Quality controls
    const qualitySection = document.createElement('div');
    qualitySection.className = 'flex flex-col gap-4 pt-2';

    const qualityRow = document.createElement('div');
    qualityRow.className = 'flex items-center justify-between';
    const qualityLabel = document.createElement('span');
    qualityLabel.className = 'text-sm text-secondary';
    qualityLabel.textContent = 'Quality';
    qualityRow.appendChild(qualityLabel);
    const qualitySelect = document.createElement('select');
    qualitySelect.className = 'bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none';
    qualitySelect.innerHTML = `
        <option value="high" selected>High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
    `;
    qualitySelect.onchange = (e) => { lipSyncQuality = e.target.value; };
    qualityRow.appendChild(qualitySelect);
    qualitySection.appendChild(qualityRow);

    const emotionRow = document.createElement('div');
    emotionRow.className = 'flex items-center justify-between';
    const emotionLabel = document.createElement('span');
    emotionLabel.className = 'text-sm text-secondary';
    emotionLabel.textContent = 'Preserve Emotion';
    emotionRow.appendChild(emotionLabel);
    const emotionToggle = document.createElement('button');
    emotionToggle.className = 'w-12 h-6 rounded-full relative transition-colors ' + (preserveEmotion ? 'bg-primary' : 'bg-white/20');
    emotionToggle.innerHTML = `<div class="w-4 h-4 rounded-full bg-white absolute top-1 ${preserveEmotion ? 'left-7' : 'left-1'} transition-all"></div>`;
    emotionToggle.onclick = () => {
        preserveEmotion = !preserveEmotion;
        emotionToggle.className = 'w-12 h-6 rounded-full relative transition-colors ' + (preserveEmotion ? 'bg-primary' : 'bg-white/20');
        emotionToggle.innerHTML = `<div class="w-4 h-4 rounded-full bg-white absolute top-1 ${preserveEmotion ? 'left-7' : 'left-1'} transition-all"></div>`;
    };
    emotionRow.appendChild(emotionToggle);
    qualitySection.appendChild(emotionRow);

    formCard.appendChild(qualitySection);

    // Action buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'flex gap-3 pt-2';

    const translateBtn = document.createElement('button');
    translateBtn.className = 'flex-1 bg-white/10 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    translateBtn.textContent = 'Translate';
    translateBtn.onclick = handleTranslate;
    actionButtons.appendChild(translateBtn);

    const dubBtn = document.createElement('button');
    dubBtn.className = 'flex-1 bg-primary text-black py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    dubBtn.textContent = 'Dub';
    dubBtn.onclick = handleDub;
    actionButtons.appendChild(dubBtn);

    const previewBtn = document.createElement('button');
    previewBtn.className = 'flex-1 bg-white/5 text-white py-3 rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    previewBtn.textContent = 'Preview';
    previewBtn.onclick = handlePreview;
    actionButtons.appendChild(previewBtn);

    formCard.appendChild(actionButtons);
    contentArea.appendChild(formCard);

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    function updateFormState() {
        const hasVideo = uploadedVideoUrl !== null;
        translateBtn.disabled = !hasVideo;
        dubBtn.disabled = !hasVideo;
        previewBtn.disabled = !hasVideo || !selectedVoice;

        formCard.classList.toggle('opacity-75', !hasVideo);
    }

    function updateLanguageSelectors() {
        const languages = muapiEnhanced.getSupportedLanguages();

        sourceLangSelect.innerHTML = languages.map(lang =>
            `<option value="${lang.code}" ${lang.code === sourceLanguage ? 'selected' : ''}>${lang.flag} ${lang.name}</option>`
        ).join('');

        targetLangSelect.innerHTML = languages.map(lang =>
            `<option value="${lang.code}" ${lang.code === targetLanguage ? 'selected' : ''}>${lang.flag} ${lang.name}</option>`
        ).join('');
    }

    async function updateAvailableVoices() {
        try {
            availableVoices = await muapiEnhanced.getAvailableVoices(targetLanguage);
            renderVoiceList();
        } catch (error) {
            console.warn('Failed to load voices:', error);
            availableVoices = muapiEnhanced.getDefaultVoices(targetLanguage);
            renderVoiceList();
        }
    }

    function renderVoiceList() {
        voiceList.innerHTML = '';

        availableVoices.forEach(voice => {
            const voiceCard = document.createElement('div');
            voiceCard.className = `p-3 rounded-xl border cursor-pointer transition-all ${
                selectedVoice?.id === voice.id
                    ? 'bg-primary/20 border-primary/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
            }`;
            voiceCard.innerHTML = `
                <div class="font-bold text-sm">${voice.name}</div>
                <div class="text-xs text-muted">${voice.language} • ${voice.gender}</div>
            `;
            voiceCard.onclick = () => {
                selectedVoice = voice;
                renderVoiceList();
                updateFormState();
            };
            voiceList.appendChild(voiceCard);
        });
    }

    // Initialize
    updateLanguageSelectors();
    updateAvailableVoices();

    function handleTranslate() {
        // TODO: implement translate
        alert('Translate clicked');
    }

    function handleDub() {
        // TODO: implement dub
        alert('Dub clicked');
    }

    function handlePreview() {
        // TODO: implement preview
        alert('Preview clicked');
    }

    return container;
}
