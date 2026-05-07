import { HEADSHOT_PRESETS } from '../lib/headshotPresets.js';

export function HeadshotStyleSelector({ selectedSlug, onSelect }) {
  const wrap = document.createElement('div');
  wrap.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3';

  HEADSHOT_PRESETS.forEach((preset) => {
    const btn = document.createElement('button');
    btn.className = `text-left p-3 rounded-xl border transition-all ${selectedSlug === preset.slug ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`;
    btn.innerHTML = `<div class="text-white font-semibold text-sm">${preset.title}</div><div class="text-xs text-secondary mt-1">${preset.description}</div>`;
    btn.onclick = () => onSelect(preset.slug);
    wrap.appendChild(btn);
  });

  return wrap;
}
