import { HeadshotUploadPanel } from './HeadshotUploadPanel.js';
import { HeadshotStyleSelector } from './HeadshotStyleSelector.js';
import { HeadshotPromptEnhancer } from './HeadshotPromptEnhancer.js';
import { HeadshotOutputGallery } from './HeadshotOutputGallery.js';
import { buildHeadshotPrompt } from '../lib/headshotPromptBuilder.js';
import { generateHeadshot } from '../lib/headshotApiClient.js';

export function HeadshotGeneratorForm() {
  const state = { presetSlug: 'linkedin-professional', tone: 'professional', realismLevel: 'high', images: [] };
  const wrap = document.createElement('div');
  wrap.className = 'space-y-5';
  const status = document.createElement('div'); status.className = 'text-xs text-secondary';
  const galleryHost = document.createElement('div');

  const rerenderGallery = () => { galleryHost.innerHTML = ''; galleryHost.appendChild(HeadshotOutputGallery({ images: state.images })); };

  wrap.appendChild(HeadshotUploadPanel({ onFile: (file) => { state.image = file; status.textContent = file ? `Selected: ${file.name}` : 'No file selected.'; } }));
  wrap.appendChild(HeadshotStyleSelector({ selectedSlug: state.presetSlug, onSelect: (slug) => { state.presetSlug = slug; } }));
  wrap.appendChild(HeadshotPromptEnhancer({ state, onChange: (k, v) => { state[k] = v; } }));

  const actions = document.createElement('div');
  actions.className = 'flex gap-2 flex-wrap';
  actions.innerHTML = '<button class="px-4 py-2 rounded-xl bg-primary/20 text-primary" data-generate>Generate</button><button class="px-4 py-2 rounded-xl bg-white/10 text-white" data-regenerate>Regenerate</button><button class="px-4 py-2 rounded-xl bg-white/10 text-white" data-send>Send to Image Studio</button>';
  wrap.appendChild(actions);
  wrap.appendChild(status);
  wrap.appendChild(galleryHost);
  rerenderGallery();

  const runGenerate = async () => {
    try {
      status.textContent = 'Generating headshot...';
      const apiKey = localStorage.getItem('muapi_key') || '';
      const prompt = buildHeadshotPrompt(state);
      const result = await generateHeadshot({ image: state.image, prompt, preset: state.presetSlug, apiKey, provider: 'muapi', options: { model: 'flux-dev', aspectRatio: '1:1', strength: 0.6 } });
      state.images = result.images || [];
      status.textContent = state.images.length ? 'Generation complete.' : 'No images returned.';
      rerenderGallery();
    } catch (error) {
      status.textContent = error.message;
    }
  };

  actions.querySelector('[data-generate]').onclick = runGenerate;
  actions.querySelector('[data-regenerate]').onclick = runGenerate;
  actions.querySelector('[data-send]').onclick = () => { window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'image' } })); };

  return wrap;
}
