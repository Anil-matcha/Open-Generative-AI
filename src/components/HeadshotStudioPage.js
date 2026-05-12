import { HeadshotGeneratorForm } from './HeadshotGeneratorForm.js';
import { HeadshotSettingsModal } from './HeadshotSettingsModal.js';
import { createHeroSection } from '../lib/thumbnails.js';

export function HeadshotStudioPage() {
  const page = document.createElement('div');
  page.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg';
  page.innerHTML = `<div class="max-w-6xl mx-auto"><div class="flex items-center justify-between gap-4"><div><h1 class="text-3xl md:text-5xl font-black text-white">AI Headshot Studio</h1><p class="text-secondary mt-2">Turn everyday photos into polished professional headshots, team portraits, and personal brand images.</p></div><div><button data-settings class="px-4 py-2 rounded-xl bg-white/10 text-white">Settings</button></div></div></div>`;
  const container = page.querySelector('.max-w-6xl');
  const heroBanner = createHeroSection('headshots', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) container.prepend(heroBanner);
  container.appendChild(document.createElement('div')).className = 'h-6';
  container.appendChild(HeadshotGeneratorForm());
  page.querySelector('[data-settings]').onclick = () => {
    const modal = HeadshotSettingsModal({
      currentApiKey: localStorage.getItem('muapi_key') || '',
      onSave: (key) => { localStorage.setItem('muapi_key', key); modal.remove(); },
      onClose: () => modal.remove()
    });
    page.appendChild(modal);
  };
  return page;
}
