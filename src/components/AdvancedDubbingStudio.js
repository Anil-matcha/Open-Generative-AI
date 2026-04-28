import { muapiEnhanced } from '../lib/muapiEnhanced.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';

export function AdvancedDubbingStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-start bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

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
    // HERO SECTION
    // ==========================================
    const hero = document.createElement('div');
    hero.className = 'flex flex-col items-center mb-2 md:mb-4 animate-fade-in-up transition-all duration-700 w-full';
    const heroBanner = createHeroSection('advanced-dubbing', 'h-32 md:h-44 mb-3');
    if (heroBanner) {
        const heroContent = document.createElement('div');
        heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
        heroContent.innerHTML = `
            <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-1">Advanced Dubbing Studio</h1>
            <p class="text-white/60 text-sm font-medium">Professional video translation and dubbing with voice cloning</p>
        `;
        heroBanner.appendChild(heroContent);
        hero.appendChild(heroBanner);
    }
    container.appendChild(hero);

    // ==========================================
    // MAIN FORM CARD
    // ==========================================
    const formCard = document.createElement('div');
    formCard.className = 'w-full max-w-4xl bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-6 flex flex-col gap-6 animate-fade-in-up';
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
    container.appendChild(videoPicker.panel);

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
            <div class="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                </svg>
            </div>
            <label class="text-sm font-bold text-white">Voice Selection</label>
        </div>
    `;

    const voiceOptions = document.createElement('div');
    voiceOptions.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';

    // Voice Clone Toggle
    const voiceCloneGroup = document.createElement('div');
    voiceCloneGroup.className = 'flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10';
    voiceCloneGroup.innerHTML = `
        <div class="flex flex-col gap-1">
            <span class="text-sm font-bold text-white">Voice Cloning</span>
            <span class="text-xs text-muted">Clone from reference audio</span>
        </div>
    `;

    const voiceCloneToggle = document.createElement('button');
    voiceCloneToggle.className = 'w-12 h-6 bg-white/10 rounded-full relative transition-all';
    voiceCloneToggle.onclick = () => {
        voiceCloneEnabled = !voiceCloneEnabled;
        voiceCloneToggle.className = voiceCloneEnabled
            ? 'w-12 h-6 bg-primary rounded-full relative transition-all'
            : 'w-12 h-6 bg-white/10 rounded-full relative transition-all';
        updateVoiceCloneSection();
    };
    voiceCloneGroup.appendChild(voiceCloneToggle);
    voiceOptions.appendChild(voiceCloneGroup);

    // Voice Style Selector
    const voiceStyleGroup = document.createElement('div');
    voiceStyleGroup.className = 'flex flex-col gap-2';
    voiceStyleGroup.innerHTML = `
        <label class="text-sm font-bold text-secondary">Voice Style</label>
    `;

    const voiceStyleSelect = document.createElement('select');
    voiceStyleSelect.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none';
    voiceStyleSelect.innerHTML = `
        <option value="natural">Natural</option>
        <option value="professional">Professional</option>
        <option value="casual">Casual</option>
        <option value="dramatic">Dramatic</option>
    `;
    voiceStyleSelect.onchange = (e) => { voiceStyle = e.target.value; };
    voiceStyleGroup.appendChild(voiceStyleSelect);
    voiceOptions.appendChild(voiceStyleGroup);

    voiceSection.appendChild(voiceOptions);

    // Voice Clone Reference Audio Upload (hidden by default)
    const voiceCloneSection = document.createElement('div');
    voiceCloneSection.className = 'flex flex-col gap-2 hidden';
    voiceCloneSection.innerHTML = `
        <label class="text-sm font-bold text-secondary">Reference Audio for Cloning</label>
    `;

    const voiceClonePicker = createUploadPicker({
        anchorContainer: container,
        accept: 'audio/*',
        onSelect: ({ url }) => {
            referenceAudioUrl = url;
        },
        onClear: () => {
            referenceAudioUrl = null;
            clonedVoiceId = null;
        },
    });
    voiceCloneSection.appendChild(voiceClonePicker.trigger);
    voiceSection.appendChild(voiceCloneSection);
    container.appendChild(voiceClonePicker.panel);

    // Voice List
    const voiceList = document.createElement('div');
    voiceList.className = 'grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto';
    voiceList.id = 'voice-list';
    voiceSection.appendChild(voiceList);

    formCard.appendChild(voiceSection);

    // Quality Controls Section
    const qualitySection = document.createElement('div');
    qualitySection.className = 'flex flex-col gap-3';
    qualitySection.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            </div>
            <label class="text-sm font-bold text-white">Quality Controls</label>
        </div>
    `;

    const qualityControls = document.createElement('div');
    qualityControls.className = 'grid grid-cols-1 md:grid-cols-3 gap-4';

    // Lip Sync Quality
    const lipSyncGroup = document.createElement('div');
    lipSyncGroup.className = 'flex flex-col gap-2';
    lipSyncGroup.innerHTML = `
        <label class="text-sm font-bold text-secondary">Lip Sync Quality</label>
    `;

    const lipSyncSelect = document.createElement('select');
    lipSyncSelect.className = 'w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-primary focus:outline-none';
    lipSyncSelect.innerHTML = `
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
    `;
    lipSyncSelect.onchange = (e) => { lipSyncQuality = e.target.value; };
    lipSyncGroup.appendChild(lipSyncSelect);
    qualityControls.appendChild(lipSyncGroup);

    // Speed Adjustment
    const speedGroup = document.createElement('div');
    speedGroup.className = 'flex flex-col gap-2';
    speedGroup.innerHTML = `
        <label class="text-sm font-bold text-secondary">Speed Adjustment</label>
    `;

    const speedInput = document.createElement('input');
    speedInput.type = 'range';
    speedInput.min = '0.5';
    speedInput.max = '2.0';
    speedInput.step = '0.1';
    speedInput.value = '1.0';
    speedInput.className = 'w-full';
    speedInput.oninput = (e) => {
        speedAdjustment = parseFloat(e.target.value);
        speedLabel.textContent = `${speedAdjustment}x`;
    };

    const speedLabel = document.createElement('span');
    speedLabel.className = 'text-xs text-muted text-center';
    speedLabel.textContent = '1.0x';

    speedGroup.appendChild(speedInput);
    speedGroup.appendChild(speedLabel);
    qualityControls.appendChild(speedGroup);

    // Preserve Emotion Toggle
    const emotionGroup = document.createElement('div');
    emotionGroup.className = 'flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10';
    emotionGroup.innerHTML = `
        <div class="flex flex-col gap-1">
            <span class="text-sm font-bold text-white">Preserve Emotion</span>
            <span class="text-xs text-muted">Maintain emotional tone</span>
        </div>
    `;

    const emotionToggle = document.createElement('button');
    emotionToggle.className = 'w-12 h-6 bg-primary rounded-full relative transition-all';
    emotionToggle.onclick = () => {
        preserveEmotion = !preserveEmotion;
        emotionToggle.className = preserveEmotion
            ? 'w-12 h-6 bg-primary rounded-full relative transition-all'
            : 'w-12 h-6 bg-white/10 rounded-full relative transition-all';
    };
    emotionGroup.appendChild(emotionToggle);
    qualityControls.appendChild(emotionGroup);

    qualitySection.appendChild(qualityControls);
    formCard.appendChild(qualitySection);

    // Preview Section
    const previewSection = document.createElement('div');
    previewSection.className = 'flex flex-col gap-3';
    previewSection.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
            </div>
            <label class="text-sm font-bold text-white">Preview & Generate</label>
        </div>
    `;

    const previewControls = document.createElement('div');
    previewControls.className = 'flex flex-col gap-3';

    // Preview Audio Button
    const previewBtn = document.createElement('button');
    previewBtn.className = 'px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    previewBtn.textContent = 'Generate Voice Preview';
    previewBtn.onclick = generateVoicePreview;
    previewControls.appendChild(previewBtn);

    // Audio Preview Player (hidden initially)
    const audioPreview = document.createElement('div');
    audioPreview.className = 'hidden flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10';
    audioPreview.id = 'audio-preview';
    audioPreview.innerHTML = `
        <audio controls class="flex-1 max-w-md"></audio>
        <button class="px-3 py-1 bg-primary text-black rounded-lg text-xs font-bold hover:bg-primary/80 transition-all">
            Use This Voice
        </button>
    `;
    previewControls.appendChild(audioPreview);

    // Action Buttons
    const actionButtons = document.createElement('div');
    actionButtons.className = 'flex gap-3';

    const translateBtn = document.createElement('button');
    translateBtn.className = 'flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    translateBtn.textContent = 'Translate Only';
    translateBtn.onclick = () => startTranslation(false);
    actionButtons.appendChild(translateBtn);

    const dubBtn = document.createElement('button');
    dubBtn.className = 'flex-1 bg-primary text-black py-3.5 rounded-xl font-black text-sm hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed';
    dubBtn.textContent = 'Translate & Dub';
    dubBtn.onclick = () => startTranslation(true);
    actionButtons.appendChild(dubBtn);

    previewControls.appendChild(actionButtons);
    previewSection.appendChild(previewControls);
    formCard.appendChild(previewSection);

    container.appendChild(formCard);

    // Instructions
    const inlineInstructions = createInlineInstructions('advanced-dubbing');
    inlineInstructions.classList.add('max-w-4xl', 'mt-6');
    container.appendChild(inlineInstructions);

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
                    ? 'bg-primary/20 border-primary'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`;

            voiceCard.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex flex-col gap-1">
                        <span class="text-sm font-bold text-white">${voice.name}</span>
                        <span class="text-xs text-muted">${voice.gender} • ${voice.style}</span>
                    </div>
                    <div class="w-4 h-4 rounded-full border-2 border-white/30 ${selectedVoice?.id === voice.id ? 'bg-primary border-primary' : ''}"></div>
                </div>
            `;

            voiceCard.onclick = () => {
                selectedVoice = voice;
                renderVoiceList();
                previewBtn.disabled = false;
            };

            voiceList.appendChild(voiceCard);
        });
    }

    function updateVoiceCloneSection() {
        voiceCloneSection.classList.toggle('hidden', !voiceCloneEnabled);
        if (!voiceCloneEnabled) {
            referenceAudioUrl = null;
            clonedVoiceId = null;
        }
    }

    async function generateVoicePreview() {
        if (!selectedVoice || !uploadedVideoUrl) return;

        previewBtn.disabled = true;
        previewBtn.textContent = 'Generating...';

        try {
            // Generate a sample text for preview
            const sampleText = `Hello, this is a preview of the ${selectedVoice.name} voice in ${targetLanguage.toUpperCase()}.`;

            const result = await muapiEnhanced.generatePreviewAudio(sampleText, selectedVoice.id, targetLanguage);

            if (result.audio_url) {
                previewAudioUrl = result.audio_url;
                const audioElement = audioPreview.querySelector('audio');
                audioElement.src = result.audio_url;
                audioPreview.classList.remove('hidden');

                // Setup use voice button
                const useBtn = audioPreview.querySelector('button');
                useBtn.onclick = () => {
                    // Voice is already selected
                    audioPreview.classList.add('hidden');
                };
            }
        } catch (error) {
            console.error('Preview generation failed:', error);
            alert('Failed to generate voice preview. Please try again.');
        } finally {
            previewBtn.disabled = false;
            previewBtn.textContent = 'Generate Voice Preview';
        }
    }

    async function startTranslation(includeDubbing = true) {
        if (!uploadedVideoUrl || !sourceLanguage || !targetLanguage) return;

        const button = includeDubbing ? dubBtn : translateBtn;
        const originalText = button.textContent;

        button.disabled = true;
        button.textContent = includeDubbing ? 'Dubbing...' : 'Translating...';

        try {
            let result;

            if (includeDubbing) {
                // Handle voice cloning if enabled
                if (voiceCloneEnabled && referenceAudioUrl && !clonedVoiceId) {
                    const cloneResult = await muapiEnhanced.cloneVoice(referenceAudioUrl, `custom-voice-${Date.now()}`);
                    if (cloneResult.voice_id) {
                        clonedVoiceId = cloneResult.voice_id;
                    }
                }

                result = await muapiEnhanced.dubVideo(uploadedVideoUrl, sourceLanguage, targetLanguage, {
                    clone: voiceCloneEnabled,
                    voiceId: clonedVoiceId || selectedVoice?.id,
                    style: voiceStyle,
                    lipSyncQuality,
                    preserveEmotion,
                    speedAdjustment
                });
            } else {
                result = await muapiEnhanced.translateVideo(uploadedVideoUrl, sourceLanguage, targetLanguage, {
                    preserveTone: preserveEmotion,
                    quality: 'high',
                    syncAudio: true
                });
            }

            if (result.video_url) {
                // Success - show download/share options
                showResultModal(result, includeDubbing);
            } else {
                throw new Error('No video URL in response');
            }
        } catch (error) {
            console.error('Translation/Dubbing failed:', error);
            alert(`Failed to ${includeDubbing ? 'dub' : 'translate'} video: ${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    function showResultModal(result, wasDubbed) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-white">Success!</h3>
                </div>
                <p class="text-secondary text-sm mb-6">
                    Your video has been ${wasDubbed ? 'translated and dubbed' : 'translated'} successfully.
                </p>
                <div class="flex gap-3">
                    <a href="${result.video_url}" download class="flex-1 bg-primary text-black py-3 rounded-xl font-bold text-sm text-center hover:bg-primary/80 transition-all">
                        Download
                    </a>
                    <button class="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-bold hover:bg-white/20 transition-all" onclick="this.closest('.fixed').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Add video preview if available
        if (result.preview_url) {
            const preview = document.createElement('video');
            preview.src = result.preview_url;
            preview.controls = true;
            preview.className = 'w-full rounded-xl mb-4';
            modal.querySelector('p').insertAdjacentElement('afterend', preview);
        }

        container.appendChild(modal);
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    updateLanguageSelectors();
    updateAvailableVoices();
    updateFormState();

    return container;
}