import { getPageThumbnail, createThumbnailImg } from '../lib/thumbnails.js';

export function PlaceholderPage(pageName) {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg p-6';
  container.setAttribute('data-testid', 'placeholder-page');

  const wrapper = document.createElement('div');
  wrapper.className = 'text-center animate-fade-in-up max-w-md w-full';

  const placeholderThumb = getPageThumbnail('placeholder');
  if (placeholderThumb) {
    const bannerWrapper = document.createElement('div');
    bannerWrapper.className = 'relative w-full h-40 md:h-52 rounded-2xl overflow-hidden mb-6';
    bannerWrapper.innerHTML = '<div class="thumb-skeleton absolute inset-0"></div>';
    const img = createThumbnailImg(placeholderThumb, 'Coming Soon', 'w-full h-full object-cover');
    bannerWrapper.appendChild(img);
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent';
    bannerWrapper.appendChild(overlay);
    const textOverlay = document.createElement('div');
    textOverlay.className = 'absolute bottom-0 left-0 right-0 p-5 z-10';
    const heading = document.createElement('h2');
    heading.className = 'text-xl font-bold text-white mb-1';
    heading.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    const subtitle = document.createElement('p');
    subtitle.className = 'text-white/60 text-sm';
    subtitle.textContent = 'Coming soon';
    textOverlay.appendChild(heading);
    textOverlay.appendChild(subtitle);
    bannerWrapper.appendChild(textOverlay);
    wrapper.appendChild(bannerWrapper);
  } else {
    const fallbackHeading = document.createElement('h2');
    fallbackHeading.className = 'text-2xl font-bold text-white mb-2';
    fallbackHeading.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    const fallbackSub = document.createElement('p');
    fallbackSub.className = 'text-secondary text-sm';
    fallbackSub.textContent = 'Coming soon';
    wrapper.appendChild(fallbackHeading);
    wrapper.appendChild(fallbackSub);
  }

  container.appendChild(wrapper);
  return container;
}
