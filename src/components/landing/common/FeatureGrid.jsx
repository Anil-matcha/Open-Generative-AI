// Feature Grid Layout - Direct HTML generation (simpler)
export function FeatureGrid({ features = [], sectionTitle, sectionDescription, viewAllLink, viewAllCount, backgroundClass }) {
  const section = document.createElement('section');
  section.className = `py-20 px-4 relative ${backgroundClass || ''}`;
  section.setAttribute('role', 'region');
  section.setAttribute('aria-labelledby', `section-title-${Math.random().toString(36).substr(2, 9)}`);

  // Handle empty features array
  if (!features || features.length === 0) {
    section.innerHTML = `
      <div class="container mx-auto text-center">
        <h2 id="section-title-${Math.random().toString(36).substr(2, 9)}" class="mb-4 text-white text-2xl md:text-3xl">${sectionTitle || 'Features'}</h2>
        <p class="text-gray-400 mb-10 text-lg">No features available at the moment.</p>
      </div>
    `;
    return section;
  }

  const cardsHtml = features.map(f => {
    const safeTitle = (f.title || '').toString().trim();
    const safeDescription = (f.description || '').toString().trim();
    const firstWord = safeTitle.split(' ')[0] || 'feature';

    return `
    <a href="${f.link || '#'}" role="button" tabindex="0"
       class="feature-card group relative block overflow-hidden rounded-xl border border-white/8 bg-white/3 transition-all duration-200 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:shadow-xl hover:shadow-cyan-400/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
       data-feature-id="${f.id || 'unknown'}"
       aria-label="Try ${safeTitle} - ${safeDescription}">
      <div class="aspect-video w-full overflow-hidden bg-gradient-to-br from-cyan-400/10 via-gray-800/50 to-gray-900">
        <div class="video-placeholder w-full h-full flex items-center justify-center">
          <div class="text-4xl md:text-5xl opacity-20" aria-hidden="true">${f.icon || '🎬'}</div>
        </div>
        ${f.video ? `
        <video class="feature-video absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
               src="${f.video}" muted loop playsinline preload="metadata" aria-hidden="true"></video>
        ` : ''}
      </div>
      <div class="p-4">
        <h3 class="text-base font-semibold text-white mb-1 truncate" title="${safeTitle}">${safeTitle}</h3>
        <p class="text-sm text-gray-500 line-clamp-2" title="${safeDescription}">${safeDescription}</p>
        <span class="inline-flex mt-3 text-sm text-cyan-400 font-medium group-hover:text-cyan-300 transition-colors duration-200">
          Try ${firstWord} →
        </span>
      </div>
    </a>
  `}).join('');

  const sectionId = Math.random().toString(36).substr(2, 9);
  section.innerHTML = `
    <div class="container mx-auto">
      <h2 id="section-title-${sectionId}" class="mb-4 text-white text-2xl md:text-3xl font-bold">${sectionTitle || 'Create videos in one click'}</h2>
      <p class="text-gray-400 mb-10 text-base md:text-lg leading-relaxed">${sectionDescription || 'From viral effects to polished commercials'}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" role="grid" aria-label="Feature grid">
        ${cardsHtml}
      </div>
      ${viewAllLink ? `
        <div class="mt-8 text-center">
          <a href="${viewAllLink}" class="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900" aria-label="View all ${viewAllCount || features.length} apps">
            View all ${viewAllCount || features.length} apps →
          </a>
        </div>
      ` : ''}
    </div>
  `;

  // Add hover video listeners after DOM insertion with error handling and cleanup
  requestAnimationFrame(() => {
    const cards = section.querySelectorAll('.feature-card');
    const videoTimeouts = new Map();

    cards.forEach(card => {
      const video = card.querySelector('video');
      if (!video) return;

      // Error handling for video loading
      video.addEventListener('error', (e) => {
        console.warn('Video failed to load:', e.target.src);
        // Hide broken video, show fallback icon
        e.target.style.display = 'none';
      });

      // Performance: preload on hover with delay
      let timeout;
      const handleMouseEnter = () => {
        timeout = setTimeout(() => {
          if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
            video.currentTime = 0;
            video.play().catch(err => {
              console.warn('Video playback failed:', err);
            });
          }
        }, 300);
        videoTimeouts.set(card, timeout);
      };

      const handleMouseLeave = () => {
        if (timeout) {
          clearTimeout(timeout);
          videoTimeouts.delete(card);
        }
        video.pause();
      };

      // Touch support for mobile
      const handleTouchStart = () => {
        // On touch devices, play immediately without delay
        if (video.readyState >= 2) {
          video.currentTime = 0;
          video.play().catch(err => {
            console.warn('Video playback failed on touch:', err);
          });
        }
      };

      const handleTouchEnd = () => {
        setTimeout(() => video.pause(), 100); // Brief delay to allow interaction
      };

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
      card.addEventListener('touchstart', handleTouchStart, { passive: true });
      card.addEventListener('touchend', handleTouchEnd, { passive: true });

      // Keyboard support
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          // Navigate to link instead of playing video
          window.location.href = card.href;
        }
      });
    });

    // Cleanup function for performance
    const cleanup = () => {
      videoTimeouts.forEach(timeout => clearTimeout(timeout));
      videoTimeouts.clear();
      cards.forEach(card => {
        const video = card.querySelector('video');
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      });
    };

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Store cleanup function for potential external access
    section._cleanup = cleanup;
  });
  
  return section;
}
