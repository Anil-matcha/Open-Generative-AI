import { createHeroSection } from "../lib/thumbnails.js";
export function AIVideoOutreachPage() {
  const element = document.createElement('div');
  element.className = 'w-full h-full relative';
  element.style.overflow = 'hidden';
  element.style.backgroundColor = '#111827';
  element.style.color = '#e5e7eb';
  
  const heroBanner = createHeroSection('ai-video-outreach', 'h-64 md:h-80 lg:h-96 mb-4');
  if (heroBanner) {
    element.appendChild(heroBanner);
    const textOverlay = document.createElement('div');
    textOverlay.className = 'absolute bottom-4 left-4 z-10';
    textOverlay.innerHTML = '<h1 class="text-2xl md:text-3xl font-bold text-white">AI Video Outreach Studio</h1>';
    heroBanner.appendChild(textOverlay);
  }
  
  const content = document.createElement('div');
  content.className = 'p-4 md:p-6 max-w-4xl mx-auto';
  content.innerHTML = `
    <p class="text-gray-400 mb-6">Create personalized video messages for outreach and engagement.</p>
    <div class="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 class="text-xl font-semibold mb-4">Workflow Automation</h2>
      <p class="text-gray-400 mb-4">Automate your video creation, personalization, and distribution workflows.</p>
      <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
        Get Started
      </button>
    </div>
  `;
  element.appendChild(content);
  
  return element;
}