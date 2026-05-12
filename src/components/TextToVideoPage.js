import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

const TEXT_TO_VIDEO_MODELS = [
  { name: 'Kling v2.1', description: 'Kling v2.1 text-to-video', category: 'Kling' },
  { name: 'Kling v2.5', description: 'Kling v2.5 text-to-video', category: 'Kling' },
  { name: 'Kling v2.6', description: 'Kling v2.6 text-to-video', category: 'Kling' },
  { name: 'Kling v3.0', description: 'Kling v3.0 text-to-video', category: 'Kling' },
  { name: 'Sora', description: 'OpenAI Sora text-to-video', category: 'OpenAI' },
  { name: 'Sora 2', description: 'OpenAI Sora 2 text-to-video', category: 'OpenAI' },
  { name: 'Veo 3', description: 'Google Veo 3 text-to-video', category: 'Google' },
  { name: 'Veo 3.1', description: 'Google Veo 3.1 text-to-video', category: 'Google' },
  { name: 'Seedance Lite', description: 'Seedance Lite text-to-video', category: 'Seedance' },
  { name: 'Seedance Pro', description: 'Seedance Pro text-to-video', category: 'Seedance' },
  { name: 'Seedance v1.5', description: 'Seedance v1.5 text-to-video', category: 'Seedance' },
  { name: 'Seedance v2.0', description: 'Seedance v2.0 text-to-video', category: 'Seedance' },
  { name: 'Seedance 2.0 Extend', description: 'Seedance 2.0 Extend', category: 'Seedance' },
  { name: 'Wan 2.1', description: 'Wan 2.1 text-to-video', category: 'Wan' },
  { name: 'Wan 2.2', description: 'Wan 2.2 text-to-video', category: 'Wan' },
  { name: 'Wan 2.5', description: 'Wan 2.5 text-to-video', category: 'Wan' },
  { name: 'Wan 2.6', description: 'Wan 2.6 text-to-video', category: 'Wan' },
  { name: 'Hunyuan', description: 'Tencent Hunyuan text-to-video', category: 'Hunyuan' },
  { name: 'Hailuo 02', description: 'Hailuo 02 text-to-video', category: 'Hailuo' },
  { name: 'Hailuo 2.3', description: 'Hailuo 2.3 text-to-video', category: 'Hailuo' },
  { name: 'Runway Gen-3', description: 'Runway Gen-3 text-to-video', category: 'Runway' },
  { name: 'Pixverse v4.5', description: 'Pixverse v4.5 text-to-video', category: 'Pixverse' },
  { name: 'Pixverse v5', description: 'Pixverse v5 text-to-video', category: 'Pixverse' },
  { name: 'Pixverse v5.5', description: 'Pixverse v5.5 text-to-video', category: 'Pixverse' },
  { name: 'Vidu v2.0', description: 'Vidu v2.0 text-to-video', category: 'Vidu' },
  { name: 'LTX 2 Pro', description: 'LTX 2 Pro text-to-video', category: 'LTX' },
  { name: 'OVI', description: 'OVI text-to-video', category: 'OVI' },
  { name: 'Grok Imagine', description: 'Grok Imagine text-to-video', category: 'Grok' },
];

const EXAMPLE_PROMPTS = [
  { prompt: 'A drone shot flying over a futuristic city at sunset, neon lights, cinematic', model: 'Kling v2.1' },
  { prompt: 'Close-up of waves crashing on rocky coastline, dramatic ocean, 4K', model: 'Sora' },
  { prompt: 'Timelapse of a flower blooming in supernatural colors, magical lighting', model: 'Veo 3' },
  { prompt: 'Character walking through a cyberpunk street, rain reflections, epic', model: 'Runway Gen-3' },
  { prompt: 'Aerial view of mountains covered in snow, morning mist, nature documentary', model: 'Hunyuan' },
];

const FEATURES = [
  { icon: '🎬', title: 'Cinematic Quality', description: 'Generate professional-grade videos with stunning visuals' },
  { icon: '⏱️', title: '40+ Models', description: 'Access the latest video generation models from top AI labs' },
  { icon: '📹', title: 'Multiple Durations', description: 'Create videos from seconds to minutes in length' },
  { icon: '🎥', title: 'HD & 4K Support', description: 'Export videos in high definition up to 4K resolution' },
];

export function TextToVideoPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // Hero
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';
  const heroBanner = createHeroSection('video', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Text to Video</h1>
      <p class="text-white/60 text-sm font-medium">Create stunning, professional-quality videos from simple text descriptions</p>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // Content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full max-w-5xl relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';

  contentWrapper.innerHTML = `
    <!-- Features -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-4">Video Generation Reimagined</h2>
      <p class="text-sm text-muted mb-6">Everything you need to create stunning videos</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
            <div class="text-3xl mb-3">${f.icon}</div>
            <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
            <p class="text-xs text-muted">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Start CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-black text-white mb-1">Ready to Create Videos?</h2>
          <p class="text-sm text-muted">Start generating amazing videos with 40+ AI models</p>
        </div>
        <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
          Get Started Free
        </button>
      </div>
    </div>

    <!-- Models -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Available Models</h2>
      <p class="text-sm text-muted mb-6">Choose from ${TEXT_TO_VIDEO_MODELS.length} powerful video generation models</p>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${TEXT_TO_VIDEO_MODELS.map(m => `
          <button class="model-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 text-left" data-model="${m.name}">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-bold text-white truncate mr-2">${m.name}</span>
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full whitespace-nowrap">${m.category}</span>
            </div>
            <p class="text-xs text-muted">${m.description}</p>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Example Prompts -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Example Prompts</h2>
      <p class="text-sm text-muted mb-6">Get inspired by these creative video prompts</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${EXAMPLE_PROMPTS.map((p, i) => `
          <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 cursor-pointer transition-all duration-300">
            <div class="flex items-center justify-between mb-3">
              <span class="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">${p.model}</span>
              <div class="flex items-center gap-2">
                <button class="gtm-btn w-6 h-6 rounded border border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary/40 transition-all flex items-center justify-center text-xs" data-prompt-index="${i}" title="Enhance with GTM">🎯</button>
                <button class="text-xs text-muted hover:text-white transition-colors try-btn">Try this →</button>
              </div>
            </div>
            <p class="text-sm text-gray-300 leading-relaxed">${p.prompt}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Bottom CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-black text-white mb-1">Start Creating Now</h2>
          <p class="text-sm text-muted">Pick a model or try an example prompt to begin</p>
        </div>
        <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
          Start Creating Videos
        </button>
      </div>
    </div>
  `;

  container.appendChild(contentWrapper);

  // Event Listeners
  container.querySelector('.start-btn').onclick = () => navigate('video');
  container.querySelector('.cta-btn').onclick = () => navigate('video');

  container.querySelectorAll('.model-card').forEach(card => {
    card.onclick = () => {
      const modelName = card.dataset.model;
      localStorage.setItem('prefill_model', modelName);
      navigate('video');
    };
  });

  container.querySelectorAll('.prompt-card').forEach((card, i) => {
    card.onclick = () => {
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('video');
    };
  });

  container.querySelectorAll('.prompt-card .try-btn').forEach((btn, i) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('video');
    };
  });

  container.querySelectorAll('.prompt-card .gtm-btn').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const promptIndex = parseInt(btn.dataset.promptIndex);
      const prompt = EXAMPLE_PROMPTS[promptIndex];

      try {
        const modal = new GTMPromptModal({
          appTheme: 'text-to-video',
          onPromptGenerated: (generatedPrompt) => {
            // Store the enhanced prompt and navigate to video studio
            localStorage.setItem('prefill_prompt', generatedPrompt);
            localStorage.setItem('prefill_model', prompt.model);
            navigate('video');
          }
        });

        // Pre-fill the modal with the example prompt
        setTimeout(() => {
          const basePromptInput = modal.content?.querySelector('#base-prompt');
          if (basePromptInput) {
            basePromptInput.value = prompt.prompt;
            basePromptInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 100);

        modal.open();
      } catch (error) {
        console.error('GTM Prompt Modal error:', error);
        alert('Failed to open GTM Prompt Enhancer');
      }
    };
  });

  return container;
}
