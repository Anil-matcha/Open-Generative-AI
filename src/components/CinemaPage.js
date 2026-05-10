import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';

const CAMERA_OPTIONS = ['Wide', 'Medium', 'Close-Up', 'Overhead', 'Low Angle', 'POV'];
const LENS_OPTIONS = ['Standard', 'Wide Angle', 'Telephoto', 'Fisheye', 'Macro'];

const FEATURES = [
  { icon: '🎬', title: 'Cinematic Camera', description: 'Control camera angles, lens types, and focal lengths' },
  { icon: '📷', title: 'Professional Controls', description: 'Aperture, focal length, and depth of field settings' },
  { icon: '🎥', title: 'AI-Powered', description: 'Generate cinema-quality shots from text descriptions' },
  { icon: '🌅', title: 'Multiple Formats', description: 'Support for various aspect ratios and resolutions' },
];

const EXAMPLE_PROMPTS = [
  { camera: 'Wide Shot', prompt: 'Epic mountain landscape at golden hour, cinematic wide angle' },
  { camera: 'Close-Up', prompt: 'Dramatic close-up of actor face, dramatic lighting, shallow depth of field' },
  { camera: 'Low Angle', prompt: 'Low angle shot of skyscraper, imposing perspective, city background' },
];

export function CinemaPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

  // Hero
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';
  const heroBanner = createHeroSection('cinema', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Cinema Studio</h1>
      <p class="text-white/60 text-sm font-medium">What would you shoot with infinite budget?</p>
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
    <!-- Start Creating CTA -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
      <button class="start-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Start Creating
      </button>
    </div>

    <!-- Features -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Professional Controls</h2>
      <p class="text-sm text-muted mb-4">Cinematic tools at your fingertips</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <div class="text-2xl mb-2">${f.icon}</div>
            <h3 class="text-sm font-bold text-white mb-1">${f.title}</h3>
            <p class="text-xs text-muted">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Camera Controls -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Camera Controls</h2>
      <p class="text-sm text-muted mb-4">Full control over your shots</p>

      <div class="mb-4">
        <h3 class="text-sm font-bold text-white mb-3">Camera Angle</h3>
        <div class="flex flex-wrap gap-2">
          ${CAMERA_OPTIONS.map(opt => `
            <span class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-medium hover:border-primary/20 transition-all cursor-pointer">${opt}</span>
          `).join('')}
        </div>
      </div>

      <div>
        <h3 class="text-sm font-bold text-white mb-3">Lens Type</h3>
        <div class="flex flex-wrap gap-2">
          ${LENS_OPTIONS.map(opt => `
            <span class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-medium hover:border-primary/20 transition-all cursor-pointer">${opt}</span>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Example Prompts -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="text-lg font-black text-white mb-1">Example Shots</h2>
      <p class="text-sm text-muted mb-4">Get inspired by these cinematic prompts</p>
      <div class="grid md:grid-cols-3 gap-3">
        ${EXAMPLE_PROMPTS.map(p => `
          <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 cursor-pointer hover:border-primary/20 transition-all">
            <span class="inline-block text-xs font-bold px-3 py-1 rounded-lg bg-primary/20 text-primary mb-2">${p.camera}</span>
            <p class="text-sm text-white/70 leading-relaxed">${p.prompt}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center mb-6">
      <h2 class="text-xl md:text-2xl font-black text-white mb-2">Create Cinema Magic</h2>
      <p class="text-sm text-muted mb-6">Generate professional cinema-quality shots</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Get Started Free
      </button>
    </div>
  `;

  container.appendChild(contentWrapper);

  container.querySelector('.start-btn').onclick = () => navigate('cinema');
  container.querySelector('.cta-btn').onclick = () => navigate('cinema');

  return container;
}
