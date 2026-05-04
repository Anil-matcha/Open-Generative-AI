// Feature Grid Layout - Direct HTML generation (simpler)
export function FeatureGrid({ features }) {
  const section = document.createElement('section');
  section.className = 'py-20 px-4';
  
  const cardsHtml = features.map(f => `
    <a href="${f.link || '#'}" 
       class="feature-card group relative block overflow-hidden rounded-xl border border-white/8 bg-white/3 transition-all duration-200 hover:border-primary hover:bg-white/5 hover:shadow-xl"
       data-feature-id="${f.id}">
      <div class="aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        <div class="video-placeholder w-full h-full flex items-center justify-center">
          <div class="text-5xl opacity-20">${f.icon || '🎬'}</div>
        </div>
        ${f.video ? `
        <video class="feature-video absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
               src="${f.video}" muted loop playsinline preload="metadata"></video>
        ` : ''}
      </div>
      <div class="p-4">
        <h3 class="text-base font-semibold text-white mb-1">${f.title}</h3>
        <p class="text-sm text-gray-500 line-clamp-2">${f.description}</p>
        <span class="inline-flex mt-3 text-sm text-primary font-medium group-hover:text-blue-400">Try ${f.title.split(' ')[0]} →</span>
      </div>
    </a>
  `).join('');
  
  section.innerHTML = `
    <div class="container mx-auto">
      <h2 class="text-3xl font-bold mb-4">${features.sectionTitle || 'Create videos in one click'}</h2>
      <p class="text-gray-400 mb-10">${features.sectionDescription || 'From viral effects to polished commercials'}</p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${cardsHtml}
      </div>
      ${features.viewAllLink ? `
        <div class="mt-8 text-center">
          <a href="${features.viewAllLink}" class="text-primary hover:underline font-medium">
            View all ${features.viewAllCount || 27} apps →
          </a>
        </div>
      ` : ''}
    </div>
  `;
  
  // Add hover video listeners after DOM insertion
  requestAnimationFrame(() => {
    section.querySelectorAll('.feature-card').forEach(card => {
      const video = card.querySelector('video');
      if (!video) return;
      
      let timeout;
      card.addEventListener('mouseenter', () => {
        timeout = setTimeout(() => {
          video.currentTime = 0;
          video.play().catch(() => {});
        }, 300);
      });
      card.addEventListener('mouseleave', () => {
        clearTimeout(timeout);
        video.pause();
      });
    });
  });
  
  return section;
}
