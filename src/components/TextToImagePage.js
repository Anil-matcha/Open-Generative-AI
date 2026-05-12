import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const TEXT_TO_IMAGE_MODELS = [
  { name: 'Flux Dev', description: 'High-quality text-to-image generation', category: 'Flux' },
  { name: 'Flux Schnell', description: 'Fast text-to-image generation', category: 'Flux' },
  { name: 'Flux 2 Dev', description: 'Advanced Flux 2 development model', category: 'Flux' },
  { name: 'Flux 2 Flex', description: 'Flexible Flux 2 model', category: 'Flux' },
  { name: 'Flux 2 Pro', description: 'Professional Flux 2 model', category: 'Flux' },
  { name: 'Nano Banana', description: 'Efficient image generation', category: 'Nano' },
  { name: 'Nano Banana Pro', description: 'Pro-level Nano Banana', category: 'Nano' },
  { name: 'Nano Banana 2', description: 'Next-gen Nano Banana', category: 'Nano' },
  { name: 'Seedream 5.0', description: 'Dream-like image generation', category: 'Seedream' },
  { name: 'Bytedance Seedream v3', description: 'Bytedance Seedream v3', category: 'Seedream' },
  { name: 'Bytedance Seedream v4', description: 'Bytedance Seedream v4', category: 'Seedream' },
  { name: 'Bytedance Seedream v4.5', description: 'Bytedance Seedream v4.5', category: 'Seedream' },
  { name: 'Midjourney v7', description: 'Midjourney v7 image generation', category: 'Midjourney' },
  { name: 'GPT-4o', description: 'OpenAI GPT-4o image model', category: 'OpenAI' },
  { name: 'GPT Image 1.5', description: 'OpenAI GPT Image 1.5', category: 'OpenAI' },
  { name: 'Ideogram v3', description: 'Ideogram v3 text-to-image', category: 'Ideogram' },
  { name: 'Google Imagen4', description: 'Google Imagen 4', category: 'Google' },
  { name: 'SDXL', description: 'Stable Diffusion XL', category: 'SD' },
  { name: 'Wan 2.1', description: 'Wan 2.1 text-to-image', category: 'Wan' },
  { name: 'Wan 2.5', description: 'Wan 2.5 text-to-image', category: 'Wan' },
  { name: 'Wan 2.6', description: 'Wan 2.6 text-to-image', category: 'Wan' },
  { name: 'Hunyuan Image 2.1', description: 'Tencent Hunyuan Image 2.1', category: 'Hunyuan' },
  { name: 'Hunyuan Image 3.0', description: 'Tencent Hunyuan Image 3.0', category: 'Hunyuan' },
  { name: 'Kling O1', description: 'Kling O1 image generation', category: 'Kling' },
  { name: 'Qwen Image', description: 'Alibaba Qwen Image', category: 'Qwen' },
  { name: 'Sora', description: 'OpenAI Sora image model', category: 'OpenAI' },
  { name: 'Veo 3', description: 'Google Veo 3', category: 'Google' },
];

const EXAMPLE_PROMPTS = [
  { prompt: 'A futuristic cityscape at sunset with flying cars and neon lights, cinematic lighting, photorealistic', model: 'Flux Dev' },
  { prompt: 'Portrait of a warrior queen with elaborate golden armor, dramatic lighting, epic fantasy style', model: 'Nano Banana Pro' },
  { prompt: 'Steampunk mechanical owl with brass gears and glowing eyes, intricate details, vintage illustration', model: 'SDXL' },
  { prompt: 'Underwater alien civilization with bioluminescent architecture, crystal clear water, surreal', model: 'Midjourney v7' },
  { prompt: 'Minimalist product shot of a luxury watch on marble, professional photography, studio lighting', model: 'GPT Image 1.5' },
];

const FEATURES = [
  { icon: '⚡', title: 'Lightning Fast', description: 'Generate images in seconds with our optimized AI infrastructure' },
  { icon: '🎨', title: '50+ Models', description: 'Access the latest and most powerful image generation models' },
  { icon: '🔄', title: 'Multiple Ratios', description: 'Support for all aspect ratios from square to ultrawide' },
  { icon: '🌐', title: 'High Resolution', description: 'Generate images up to 4K resolution' },
];

export function TextToImagePage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // Hero Section
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up w-full max-w-5xl';
  const heroBanner = createHeroSection('image', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Text to Image</h1>
      <p class="text-white/60 text-sm font-medium">Transform your ideas into stunning, professional-quality images with 27 AI models</p>
      <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all mt-3">Start Creating Free</button>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // Main content wrapper
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'w-full max-w-5xl relative z-40 animate-fade-in-up';
  contentWrapper.style.animationDelay = '0.1s';

  contentWrapper.innerHTML = `
    <!-- Features Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-8">
      <h2 class="text-xl font-bold text-white mb-2">Why Choose Our Text to Image?</h2>
      <p class="text-sm text-secondary mb-6">Everything you need to create stunning images at scale</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
            <div class="text-3xl mb-3">${f.icon}</div>
            <h3 class="text-sm font-semibold text-white mb-1">${f.title}</h3>
            <p class="text-xs text-muted">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Models Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-8">
      <h2 class="text-xl font-bold text-white mb-2">Available Models</h2>
      <p class="text-sm text-secondary mb-6">Choose from ${TEXT_TO_IMAGE_MODELS.length}+ powerful image generation models</p>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        ${TEXT_TO_IMAGE_MODELS.map(m => `
          <button class="model-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 text-left" data-model="${m.name}">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-sm font-semibold text-white">${m.name}</span>
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">${m.category}</span>
            </div>
            <p class="text-xs text-muted">${m.description}</p>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Example Prompts Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-8">
      <h2 class="text-xl font-bold text-white mb-2">Example Prompts</h2>
      <p class="text-sm text-secondary mb-6">Get inspired by these creative prompts to start generating</p>
      <div class="grid md:grid-cols-2 gap-4">
        ${EXAMPLE_PROMPTS.map((p, i) => `
          <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 cursor-pointer transition-all duration-300">
            <div class="flex items-center justify-between mb-3">
              <span class="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">${p.model}</span>
              <button class="try-btn text-xs text-muted hover:text-white transition-colors">Try this →</button>
            </div>
            <p class="text-sm text-secondary leading-relaxed">${p.prompt}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CTA Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-10 shadow-3xl mb-8 text-center">
      <h2 class="text-xl font-bold text-white mb-2">Ready to Create?</h2>
      <p class="text-sm text-secondary mb-6">Join thousands of creators generating amazing images with our AI platform</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">Get Started Free</button>
    </div>
  `;

  container.appendChild(contentWrapper);

  // Event Listeners
  container.querySelector('.start-btn').onclick = () => navigate('image');
  contentWrapper.querySelector('.cta-btn').onclick = () => navigate('image');

  contentWrapper.querySelectorAll('.model-card').forEach(card => {
    card.onclick = () => {
      const modelName = card.dataset.model;
      localStorage.setItem('prefill_model', modelName);
      navigate('image');
    };
  });

  contentWrapper.querySelectorAll('.prompt-card').forEach((card, i) => {
    card.onclick = () => {
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('image');
    };
  });

  contentWrapper.querySelectorAll('.prompt-card .try-btn').forEach((btn, i) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('image');
    };
  });

  return container;
}
