// Feature Card Component - Higgsfield.ai style
// Autoplay video on hover, CTA button, clean layout

export function FeatureCard({ feature }) {
  const card = document.createElement('a');
  card.href = feature.link || `/${feature.id}`;
  card.className = 'feature-card group relative block overflow-hidden rounded-xl border border-white/8 bg-white/3 transition-all duration-200 hover:border-primary hover:bg-white/5 hover:shadow-xl';
  card.dataset.featureId = feature.id;
  
  // Card content
  card.innerHTML = `
    <div class="video-container aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
      <!-- Video will be injected here via JS -->
      <div class="video-placeholder w-full h-full flex items-center justify-center">
        <div class="text-5xl opacity-20">${feature.icon || '🎬'}</div>
      </div>
      <video 
        class="feature-video absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        src="${feature.video || ''}"
        muted
        loop
        playsinline
        preload="metadata"
      ></video>
    </div>
    <div class="p-4">
      <h3 class="text-base font-semibold text-white mb-1">${feature.title}</h3>
      <p class="text-sm text-gray-500 leading-relaxed line-clamp-2">${feature.description}</p>
      <span class="inline-flex mt-3 text-sm text-primary font-medium transition-colors group-hover:text-blue-400">
        Try ${feature.title.split(' ')[0]} →
      </span>
    </div>
  `;
  
  // Add hover video playback logic
  const video = card.querySelector('video');
  let hoverTimeout;
  
  card.addEventListener('mouseenter', () => {
    if (video && video.src) {
      hoverTimeout = setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 300); // 300ms delay like Higgsfield
    }
  });
  
  card.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimeout);
    if (video) {
      video.pause();
    }
  });
  
  return card;
}
