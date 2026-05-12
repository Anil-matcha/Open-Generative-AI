import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const CHARACTER_MODELS = [
  { name: 'Flux PuLID', description: 'Face ID preservation with text prompt', category: 'Flux' },
  { name: 'Subject Reference', description: 'Maintain subject consistency across images', category: 'MiniMax' },
];

const FEATURES = [
  { icon: '👤', title: 'Face ID Preservation', description: 'Maintain consistent facial features across all generations' },
  { icon: '🎭', title: 'Character Consistency', description: 'Create the same character in different poses and settings' },
  { icon: '✨', title: 'Text Prompts', description: 'Control your character with detailed text descriptions' },
  { icon: '📸', title: 'Multiple Formats', description: 'Generate portraits, full body, and scene compositions' },
];

const EXAMPLE_PROMPTS = [
  { prompt: 'Same character in a medieval knight armor, dramatic lighting', model: 'Flux PuLID' },
  { prompt: 'Character as a cyberpunk hacker, neon lights, futuristic setting', model: 'Flux PuLID' },
  { prompt: 'Character in 1920s Gatsby style, vintage fashion, Art Deco background', model: 'Subject Reference' },
];

export function CharacterPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center overflow-hidden bg-app-bg relative p-4 md:p-6';

  // Hero
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up w-full';
  const heroBanner = createHeroSection('character', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Character</h1>
      <p class="text-white/60 text-sm font-medium">Generate consistent character images using face ID preservation</p>
    `;
    heroBanner.appendChild(heroContent);
    hero.appendChild(heroBanner);
  }
  container.appendChild(hero);

  // Inner wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full';

  // Features
  const featuresSection = document.createElement('div');
  featuresSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6';
  featuresSection.innerHTML = `
    <h2 class="text-xl font-black text-white mb-4">Consistent Characters</h2>
    <p class="text-sm text-muted mb-6">Create and maintain character consistency across all your projects</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${FEATURES.map(f => `
        <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all">
          <div class="text-2xl mb-3">${f.icon}</div>
          <h3 class="text-sm font-black text-white mb-1">${f.title}</h3>
          <p class="text-xs text-muted">${f.description}</p>
        </div>
      `).join('')}
    </div>
  `;
  wrapper.appendChild(featuresSection);

  // Models
  const modelsSection = document.createElement('div');
  modelsSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6';
  modelsSection.innerHTML = `
    <h2 class="text-xl font-black text-white mb-4">Available Models</h2>
    <p class="text-sm text-muted mb-6">Specialized models for character generation</p>
    <div class="grid sm:grid-cols-2 gap-4">
      ${CHARACTER_MODELS.map(m => `
        <div class="model-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all text-left cursor-pointer" data-model="${m.name}">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-black text-white">${m.name}</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">${m.category}</span>
          </div>
          <p class="text-xs text-muted">${m.description}</p>
        </div>
      `).join('')}
    </div>
  `;
  wrapper.appendChild(modelsSection);

  // Example Prompts
  const promptsSection = document.createElement('div');
  promptsSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6';
  promptsSection.innerHTML = `
    <h2 class="text-xl font-black text-white mb-4">Example Prompts</h2>
    <p class="text-sm text-muted mb-6">Get inspired by these character creations</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${EXAMPLE_PROMPTS.map(p => `
        <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all cursor-pointer">
          <span class="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">${p.model}</span>
          <p class="text-sm text-white/70 leading-relaxed">${p.prompt}</p>
        </div>
      `).join('')}
    </div>
  `;
  wrapper.appendChild(promptsSection);

  // CTA
  const ctaSection = document.createElement('div');
  ctaSection.className = 'bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl mb-6 text-center';
  ctaSection.innerHTML = `
    <h2 class="text-xl font-black text-white mb-2">Create Your Character</h2>
    <p class="text-sm text-muted mb-6">Generate consistent, professional characters</p>
    <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
      Get Started Free
    </button>
  `;
  wrapper.appendChild(ctaSection);

  container.appendChild(wrapper);

  // Navigation
  container.querySelectorAll('.start-btn').forEach(btn => {
    btn.onclick = () => navigate('character');
  });
  container.querySelector('.cta-btn').onclick = () => navigate('character');

  return container;
}
