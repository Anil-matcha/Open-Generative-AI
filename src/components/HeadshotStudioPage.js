import { HeadshotGeneratorForm } from './HeadshotGeneratorForm.js';
import { HeadshotSettingsModal } from './HeadshotSettingsModal.js';
import { createHeroSection } from '../lib/thumbnails.js';

export function HeadshotStudioPage() {
  const page = document.createElement('div');
  page.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg';
  const iframe = document.createElement('iframe');
  iframe.src = '/apps/ai-headshot-generator';
  iframe.className = 'w-full h-full border-0';
  iframe.setAttribute('title', 'AI Headshot Generator');
  page.appendChild(iframe);
  return page;
}
