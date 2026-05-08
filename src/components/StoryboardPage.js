import { navigate } from '../lib/router.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { CINEMATIC_THEME, cx, pageShell, glassPanel, glassCard, chipButton, actionButton } from '../lib/cinematicTheme.js';

const SHOT_TYPES = ['Wide Shot', 'Medium Shot', 'Close-Up', 'Extreme Close-Up', 'POV', 'Overhead', 'Low Angle'];

const FEATURES = [
  { icon: '🎬', title: 'Multi-Frame Stories', description: 'Create detailed storyboards with 3-10 frames per project' },
  { icon: '🎥', title: 'Shot Type Control', description: 'Choose from Wide, Medium, Close-Up, POV, and more' },
  { icon: '✨', title: 'AI-Powered', description: 'Generate consistent, professional-quality frames instantly' },
  { icon: '📝', title: 'Prompt Editing', description: 'Customize each frame with specific prompts and descriptions' },
];

const EXAMPLE_PROMPTS = [
  { shot: 'Wide Shot', prompt: 'A hero stands on a cliff overlooking a vast city at sunset, epic scale' },
  { shot: 'Close-Up', prompt: 'Close-up of the hero face, determined expression, dramatic lighting' },
  { shot: 'Medium Shot', prompt: 'Hero walking toward camera in slow motion, wind blowing cape' },
];

export function StoryboardPage() {
  const container = document.createElement('div');
  container.className = cx(pageShell(), 'flex flex-col items-center relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden');

  // Hero
  const hero = document.createElement('div');
  hero.className = 'flex flex-col items-center mb-8 md:mb-12 animate-fade-in-up transition-all duration-700 w-full max-w-5xl';
  const heroBanner = createHeroSection('storyboard', 'h-32 md:h-44 mb-4');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">Storyboard</h1>
      <p class="text-white/60 text-sm font-medium">Plan your film scenes with AI-generated storyboard frames</p>
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
      <h2 class="${CINEMATIC_THEME.text.sectionTitle}">Plan Your Vision</h2>
      <p class="${CINEMATIC_THEME.text.bodySoft} mb-6">Professional storyboard creation powered by AI</p>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${FEATURES.map(f => `
          <div class="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300">
            <div class="text-3xl mb-3">${f.icon}</div>
            <h3 class="${CINEMATIC_THEME.text.title} mb-1">${f.title}</h3>
            <p class="${CINEMATIC_THEME.text.body}">${f.description}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Shot Types -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="${CINEMATIC_THEME.text.sectionTitle}">Shot Types</h2>
      <p class="${CINEMATIC_THEME.text.bodySoft} mb-6">Control your narrative with professional shot compositions</p>
      <div class="flex flex-wrap gap-3">
        ${SHOT_TYPES.map(shot => `
          <span class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-medium text-sm hover:border-primary/20 transition-all cursor-pointer">${shot}</span>
        `).join('')}
      </div>
    </div>

    <!-- Example Frames -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 md:p-6 shadow-3xl mb-6">
      <h2 class="${CINEMATIC_THEME.text.sectionTitle}">Example Frames</h2>
      <p class="${CINEMATIC_THEME.text.bodySoft} mb-6">Get inspired by these storyboard examples</p>
      <div class="grid md:grid-cols-3 gap-4">
        ${EXAMPLE_PROMPTS.map(p => `
          <div class="prompt-card bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/20 transition-all duration-300 cursor-pointer">
            <div class="mb-3">
              <span class="${activeSurface({ tone: 'indigo' })} text-xs font-bold px-3 py-1">${p.shot}</span>
            </div>
            <p class="${CINEMATIC_THEME.text.body} leading-relaxed">${p.prompt}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- CTA -->
    <div class="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-6 md:p-8 shadow-3xl text-center">
      <h2 class="${CINEMATIC_THEME.text.sectionTitle} mb-2">Start Your Storyboard</h2>
      <p class="${CINEMATIC_THEME.text.bodySoft} mb-6">Plan your film scenes like a pro</p>
      <button class="cta-btn bg-primary text-black px-6 py-2.5 rounded-xl font-black text-sm hover:shadow-glow hover:scale-105 active:scale-95 transition-all">
        Get Started Free
      </button>
    </div>
  `;

  container.appendChild(contentWrapper);

  container.querySelector('.cta-btn').onclick = () => navigate('storyboard');

  return container;
}
