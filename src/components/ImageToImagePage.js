import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const IMAGE_TO_IMAGE_MODELS = [
  { name: 'Nano Banana Edit', description: 'Edit images with Nano Banana', category: 'Nano' },
  { name: 'Nano Banana Pro Edit', description: 'Pro-level image editing', category: 'Nano' },
  { name: 'Nano Banana 2 Edit', description: 'Next-gen image editing', category: 'Nano' },
  { name: 'Flux Kontext Dev I2I', description: 'Flux Kontext development I2I', category: 'Flux' },
  { name: 'Flux Kontext Pro I2I', description: 'Flux Kontext Pro I2I', category: 'Flux' },
  { name: 'Flux Kontext Max I2I', description: 'Flux Kontext Max I2I', category: 'Flux' },
  { name: 'Flux Redux', description: 'Flux Redux image transformation', category: 'Flux' },
  { name: 'Flux Pulid', description: 'Flux Pulid image editing', category: 'Flux' },
  { name: 'GPT-4o Edit', description: 'OpenAI GPT-4o image editing', category: 'OpenAI' },
  { name: 'GPT Image 1.5 Edit', description: 'OpenAI GPT Image 1.5 Edit', category: 'OpenAI' },
  { name: 'Midjourney v7 I2I', description: 'Midjourney v7 image-to-image', category: 'Midjourney' },
  { name: 'Seededit v3', description: 'Seededit v3 image editing', category: 'Seedream' },
  { name: 'Bytedance Seedream Edit', description: 'Bytedance Seedream editing', category: 'Seedream' },
  { name: 'Qwen Image Edit', description: 'Alibaba Qwen image editing', category: 'Qwen' },
  { name: 'Wan Image Edit', description: 'Wan image editing', category: 'Wan' },
  { name: 'Ideogram Character', description: 'Ideogram character creation', category: 'Ideogram' },
  { name: 'AI Background Remover', description: 'Remove backgrounds from images', category: 'AI Tools' },
  { name: 'AI Face Swap', description: 'Swap faces in images', category: 'AI Tools' },
  { name: 'AI Dress Change', description: 'Change clothing in images', category: 'AI Tools' },
  { name: 'AI Skin Enhancer', description: 'Enhance skin in portraits', category: 'AI Tools' },
  { name: 'AI Product Shot', description: 'Create professional product shots', category: 'AI Tools' },
];

const EXAMPLE_PROMPTS = [
  { prompt: 'Transform into a cyberpunk style with neon lights and futuristic elements', model: 'Flux Redux' },
  { prompt: 'Convert to watercolor painting style with soft colors', model: 'Nano Banana Edit' },
  { prompt: 'Make it look like a professional fashion magazine cover', model: 'GPT Image 1.5 Edit' },
  { prompt: 'Add dramatic sunset lighting and warm colors', model: 'Midjourney v7 I2I' },
  { prompt: 'Convert to black and white film noir style', model: 'Seededit v3' },
];

const FEATURES = [
  { icon: '🖼️', title: 'Smart Transformations', description: 'Transform any image with AI-powered style transfer and editing' },
  { icon: '✨', title: '55+ Models', description: 'Access specialized models for every type of image transformation' },
  { icon: '🎭', title: 'Style Transfer', description: 'Apply artistic styles, filters, and effects instantly' },
  { icon: '🔧', title: 'Professional Tools', description: 'Background removal, face swap, skin enhancement & more' },
];

export function ImageToImagePage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

  // Hero Section
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center animate-fade-in-up transition-all duration-700 w-full max-w-5xl';
  const heroBanner = createHeroSection('edit', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Image to Image</h1>
      <p class="text-white/60 text-sm font-medium">Transform, edit, and enhance your images with cutting-edge AI models</p>
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
    <!-- CTA Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6 text-center">
      <h2 class="text-2xl font-black text-white mb-2">Ready to Transform?</h2>
      <p class="text-white/60 text-sm mb-5">Start editing your images with powerful AI models</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">Get Started Free</button>
    </div>

    <!-- Features Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Powerful Image Editing</h2>
      <p class="text-sm text-white/60 mb-6">Everything you need to transform your images</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
            <div class="text-3xl mb-3">${f.icon}</div>
            <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
            <p class="text-xs text-white/50">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Models Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Available Models</h2>
      <p class="text-sm text-white/60 mb-6">Choose from ${IMAGE_TO_IMAGE_MODELS.length}+ powerful editing models</p>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${IMAGE_TO_IMAGE_MODELS.map(m => `
          <button class="model-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 text-left group" data-model="${m.name}">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-white group-hover:text-primary transition-colors">${m.name}</span>
            </div>
            <p class="text-xs text-white/50 mb-2">${m.description}</p>
            <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">${m.category}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Example Prompts Section -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6">
      <h2 class="text-xl font-black text-white mb-1">Example Transformations</h2>
      <p class="text-sm text-white/60 mb-6">Get inspired by these creative transformations</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${EXAMPLE_PROMPTS.map((p, i) => `
          <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 cursor-pointer transition-all duration-300">
            <div class="flex items-center justify-between mb-3">
              <span class="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full">${p.model}</span>
              <button class="text-xs text-white/40 hover:text-white transition-colors try-btn">Try this →</button>
            </div>
            <p class="text-sm text-white/70 leading-relaxed">${p.prompt}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Start Editing CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center">
      <h2 class="text-xl font-black text-white mb-2">Start Editing Now</h2>
      <p class="text-sm text-white/60 mb-5">Upload an image and let AI transform it</p>
      <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">Start Editing</button>
    </div>
  `;

  container.appendChild(contentWrapper);

  // Event Listeners
  container.querySelector('.start-btn').onclick = () => navigate('edit');
  container.querySelector('.cta-btn').onclick = () => navigate('edit');

  container.querySelectorAll('.model-card').forEach(card => {
    card.onclick = () => {
      const modelName = card.dataset.model;
      localStorage.setItem('prefill_model', modelName);
      navigate('edit');
    };
  });

  container.querySelectorAll('.prompt-card').forEach((card, i) => {
    card.onclick = () => {
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('edit');
    };
  });

  container.querySelectorAll('.prompt-card .try-btn').forEach((btn, i) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const prompt = EXAMPLE_PROMPTS[i];
      localStorage.setItem('prefill_prompt', prompt.prompt);
      localStorage.setItem('prefill_model', prompt.model);
      navigate('edit');
    };
  });

  return container;
}
