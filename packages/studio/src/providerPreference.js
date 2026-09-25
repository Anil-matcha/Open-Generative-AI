const STORAGE_KEY = 'open-generative-ai.provider';
const DEFAULT_PROVIDER = 'muapi';

export const IMAGE_PROVIDERS = [
  { id: 'muapi', label: 'MuAPI', badge: 'Cloud' },
  { id: 'gemini', label: 'Gemini Image', badge: 'Cloud · Paid' },
  { id: 'comfyui', label: 'ComfyUI', badge: 'Local · Free' },
];

export function getPreferredProvider() {
  if (typeof window === 'undefined') return DEFAULT_PROVIDER;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return IMAGE_PROVIDERS.some((provider) => provider.id === value) ? value : DEFAULT_PROVIDER;
}

export function setPreferredProvider(provider) {
  if (!IMAGE_PROVIDERS.some((item) => item.id === provider)) return;
  window.localStorage.setItem(STORAGE_KEY, provider);
  window.dispatchEvent(new CustomEvent('open-generative-ai:provider-change', { detail: provider }));
}
