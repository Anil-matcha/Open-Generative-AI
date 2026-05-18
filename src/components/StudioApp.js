import { navigate } from '../lib/router.js';
import { muapi } from '../lib/muapi.js';

const MODELS = {
  image: ['flux-dev', 'flux-schnell', 'midjourney', 'hidream-fast'],
  video: ['veo3', 'kling-master', 'wan2.1', 'seedance-pro'],
  cinema: ['veo3-fast', 'kling-pro', 'minimax-hailuo-02-pro'],
};

export function StudioApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto custom-scrollbar';

  const studios = [
    { id: 'image', name: 'Image Studio', description: 'Generate images with 20+ AI models', icon: '🎨', color: 'from-purple-500/20 to-pink-500/20', models: MODELS.image },
    { id: 'video', name: 'Video Studio', description: 'Create AI videos from text and images', icon: '🎬', color: 'from-blue-500/20 to-cyan-500/20', models: MODELS.video },
    { id: 'cinema', name: 'Cinema Studio', description: 'Cinematic shots with camera controls', icon: '🎥', color: 'from-amber-500/20 to-orange-500/20', models: MODELS.cinema },
    { id: 'lipsync', name: 'Lip Sync Studio', description: 'AI lip sync and dubbing', icon: '🗣️', color: 'from-green-500/20 to-emerald-500/20' },
    { id: 'marketing-studio', name: 'Marketing Studio', description: 'Brand campaigns and creatives', icon: '📈', color: 'from-indigo-500/20 to-violet-500/20' },
    { id: 'apps', name: 'Apps Studio', description: 'All AI creative tools', icon: '🧩', color: 'from-pink-500/20 to-rose-500/20' },
    { id: 'workflow-builder', name: 'Workflow Builder', description: 'Multi-step AI pipelines', icon: '🔗', color: 'from-teal-500/20 to-aqua-500/20' },
    { id: 'ai-agent', name: 'AI Agent', description: 'Creative AI assistants', icon: '🤖', color: 'from-yellow-500/20 to-orange-500/20' },
    { id: 'design-agent', name: 'Design Agent', description: 'UI and brand design assistant', icon: '✨', color: 'from-fuchsia-500/20 to-purple-500/20' },
    { id: 'render', name: 'Render Studio', description: 'Export and render final projects', icon: '📤', color: 'from-sky-500/20 to-blue-500/20' },
    { id: 'director', name: 'Director Studio', description: 'Cinematic scene planning', icon: '🎬', color: 'from-red-500/20 to-pink-500/20' },
    { id: 'templates', name: 'Templates', description: 'Pre-built project templates', icon: '📋', color: 'from-emerald-500/20 to-teal-500/20' },
    { id: 'library', name: 'Media Library', description: 'Your uploaded and generated assets', icon: '📚', color: 'from-cyan-500/20 to-teal-500/20' },
  ];

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-6 border-b border-white/10';
  header.innerHTML = `
    <div>
      <p class="text-xs font-bold text-muted uppercase tracking-wider mb-1">VideoRemix AI Studio</p>
      <h1 class="text-2xl font-bold text-white">Unified Creative Studio</h1>
      <p class="text-secondary text-sm mt-1">Launch every generation, editing, workflow, and agent tool from one cinematic workspace.</p>
    </div>
    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-white/5 border border-white/10 flex items-center justify-center">
      <span class="text-3xl">🎥</span>
    </div>
  `;
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  studios.forEach((studio, index) => {
    const card = document.createElement('div');
    card.className = `bg-gradient-to-br ${studio.color} backdrop-blur-xl border border-white/10 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-white/20`;
    card.style.animationDelay = `${index * 0.05}s`;
    card.dataset.testid = `studio-card-${studio.id}`;

    card.innerHTML = `
      <div class="flex items-start gap-3 mb-2">
        <div class="text-2xl">${studio.icon}</div>
        <div class="flex-1">
          <div class="text-sm font-bold text-white">${studio.name}</div>
          <div class="text-xs text-secondary mt-1">${studio.description}</div>
        </div>
      </div>
    `;

    card.onclick = () => {
      if (studio.id === 'workflow-builder') {
        navigate('workflow-builder');
      } else if (studio.id === 'ai-agent') {
        navigate('ai-agent');
      } else if (studio.id === 'design-agent') {
        navigate('design-agent');
      } else {
        navigate(studio.id);
      }
    };

    grid.appendChild(card);
  });

  container.appendChild(grid);

  const style = document.createElement('style');
  style.textContent = `
    .animate-studio-grid {
      animation: fade-in-up 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    .animate-studio-grid:nth-child(1) { animation-delay: 0s; }
    .animate-studio-grid:nth-child(2) { animation-delay: 0.05s; }
    .animate-studio-grid:nth-child(3) { animation-delay: 0.1s; }
  `;
  container.appendChild(style);

  return container;
}