const STORAGE_KEY = 'open-generative-ai.video-provider';
const DEFAULT_PROVIDER = 'muapi';

export const VIDEO_PROVIDERS = [
  { id: 'muapi', label: 'MuAPI', badge: 'Cloud' },
  { id: 'comfyui', label: 'ComfyUI', badge: 'Local · Free' },
];

export function getPreferredVideoProvider() {
  if (typeof window === 'undefined') return DEFAULT_PROVIDER;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return VIDEO_PROVIDERS.some((provider) => provider.id === value) ? value : DEFAULT_PROVIDER;
}

export function setPreferredVideoProvider(provider) {
  if (!VIDEO_PROVIDERS.some((item) => item.id === provider)) return;
  window.localStorage.setItem(STORAGE_KEY, provider);
  window.dispatchEvent(new CustomEvent('open-generative-ai:video-provider-change', { detail: provider }));
}
