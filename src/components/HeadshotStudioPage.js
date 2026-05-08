import { HeadshotGeneratorForm } from './HeadshotGeneratorForm.js';
import { HeadshotSettingsModal } from './HeadshotSettingsModal.js';

export function HeadshotStudioPage() {
  const page = document.createElement('div');
  page.className = 'w-full h-full overflow-y-auto px-4 md:px-8 py-8 bg-app-bg';
  page.innerHTML = `<div class="max-w-6xl mx-auto"><div class="flex items-center justify-between gap-4"><div><h1 class="text-3xl md:text-5xl font-black text-white">AI Headshot Studio</h1><p class="text-secondary mt-2">Turn everyday photos into polished professional headshots, team portraits, and personal brand images.</p></div><div><button data-settings class="px-4 py-2 rounded-xl bg-white/10 text-white">Settings</button></div></div></div>`;
  const container = page.querySelector('.max-w-6xl');
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
