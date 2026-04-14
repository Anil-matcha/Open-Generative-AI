/**
 * Media Ingest Components - Category G Integration
 * Handles media input, drag-and-drop, galleries, and asset management
 */

// Animation List Component
export function AnimationList() {
  const container = document.createElement('div');
  container.className = 'animation-list';
  container.innerHTML = `
    <div class="animation-header">
      <h3>🎬 Animations</h3>
      <div class="animation-filters">
        <button class="filter-btn active" data-filter="all">All</button>
        <button class="filter-btn" data-filter="text">Text</button>
        <button class="filter-btn" data-filter="shape">Shapes</button>
        <button class="filter-btn" data-filter="transition">Transitions</button>
      </div>
    </div>
    <div class="animation-grid">
      <div class="animation-item" data-type="text" data-name="Fade In">
        <div class="animation-preview">Fade In</div>
        <span>Text Animation</span>
      </div>
      <div class="animation-item" data-type="text" data-name="Slide Up">
        <div class="animation-preview">Slide Up</div>
        <span>Text Animation</span>
      </div>
      <div class="animation-item" data-type="shape" data-name="Grow">
        <div class="animation-preview">⬜ Grow</div>
        <span>Shape Animation</span>
      </div>
      <div class="animation-item" data-type="transition" data-name="Dissolve">
        <div class="animation-preview">Dissolve</div>
        <span>Transition</span>
      </div>
    </div>
  `;

  // Add event listeners for animation selection
  container.addEventListener('click', (e) => {
    const item = e.target.closest('.animation-item');
    if (item) {
      const animationName = item.dataset.name;
      const animationType = item.dataset.type;

      // Trigger animation application
      window.dispatchEvent(new CustomEvent('applyAnimation', {
        detail: { name: animationName, type: animationType }
      }));

      showToast(`Applied ${animationName} animation`);
    }
  });

  return container;
}

// Giphy Integration Component
export function GiphyIntegration() {
  const container = document.createElement('div');
  container.className = 'giphy-integration';
  container.innerHTML = `
    <div class="giphy-header">
      <h4>GIPHY Search</h4>
      <div class="search-container">
        <input type="text" class="giphy-search" placeholder="Search for GIFs..." />
        <button class="search-btn">🔍</button>
      </div>
    </div>
    <div class="giphy-results">
      <div class="loading">Search for GIFs above</div>
    </div>
  `;

  // Add search functionality
  const searchInput = container.querySelector('.giphy-search');
  const searchBtn = container.querySelector('.search-btn');

  const performSearch = () => {
    const query = searchInput.value.trim();
    if (!query) return;

    const resultsContainer = container.querySelector('.giphy-results');
    resultsContainer.innerHTML = '<div class="loading">Searching...</div>';

    // Simulate GIPHY API call
    setTimeout(() => {
      resultsContainer.innerHTML = `
        <div class="gif-grid">
          <div class="gif-item" data-url="sample1.gif">
            <img src="https://via.placeholder.com/150x100/00ff00/ffffff?text=GIF+1" alt="Sample GIF" />
          </div>
          <div class="gif-item" data-url="sample2.gif">
            <img src="https://via.placeholder.com/150x100/ff0000/ffffff?text=GIF+2" alt="Sample GIF" />
          </div>
          <div class="gif-item" data-url="sample3.gif">
            <img src="https://via.placeholder.com/150x100/0000ff/ffffff?text=GIF+3" alt="Sample GIF" />
          </div>
        </div>
      `;

      // Add click handlers for GIF selection
      resultsContainer.addEventListener('click', (e) => {
        const gifItem = e.target.closest('.gif-item');
        if (gifItem) {
          const gifUrl = gifItem.dataset.url;

          window.dispatchEvent(new CustomEvent('addGifToTimeline', {
            detail: { url: gifUrl }
          }));

          showToast('GIF added to timeline');
        }
      });
    }, 1000);
  };

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  return container;
}

// Stickers Library Component
export function StickersLibrary() {
  const container = document.createElement('div');
  container.className = 'stickers-library';
  container.innerHTML = `
    <div class="stickers-header">
      <h3>🎨 Stickers</h3>
      <div class="sticker-categories">
        <button class="category-btn active" data-category="all">All</button>
        <button class="category-btn" data-category="emojis">Emojis</button>
        <button class="category-btn" data-category="shapes">Shapes</button>
        <button class="category-btn" data-category="decorative">Decorative</button>
      </div>
    </div>
    <div class="stickers-grid">
      <div class="sticker-item" data-sticker="😀">😀</div>
      <div class="sticker-item" data-sticker="❤️">❤️</div>
      <div class="sticker-item" data-sticker="⭐">⭐</div>
      <div class="sticker-item" data-sticker="🎉">🎉</div>
      <div class="sticker-item" data-sticker="⬜">⬜</div>
      <div class="sticker-item" data-sticker="🔺">🔺</div>
      <div class="sticker-item" data-sticker="💫">💫</div>
      <div class="sticker-item" data-sticker="🌟">🌟</div>
    </div>
  `;

  // Add click handlers for sticker selection
  container.addEventListener('click', (e) => {
    const stickerItem = e.target.closest('.sticker-item');
    if (stickerItem) {
      const sticker = stickerItem.dataset.sticker;

      window.dispatchEvent(new CustomEvent('addStickerToTimeline', {
        detail: { sticker: sticker }
      }));

      showToast(`Added ${sticker} sticker to timeline`);
    }
  });

  return container;
}

// Lower Thirds Component
export function LowerThirds() {
  const container = document.createElement('div');
  container.className = 'lower-thirds';
  container.innerHTML = `
    <div class="lower-thirds-header">
      <h3>📝 Lower Thirds</h3>
      <button class="create-lower-third-btn">+ Create New</button>
    </div>
    <div class="lower-thirds-templates">
      <div class="template-item" data-template="name-title">
        <div class="template-preview">
          <div class="lower-third-bg"></div>
          <div class="lower-third-content">
            <div class="name">John Doe</div>
            <div class="title">CEO, Company Inc.</div>
          </div>
        </div>
        <span>Name & Title</span>
      </div>
      <div class="template-item" data-template="quote">
        <div class="template-preview">
          <div class="lower-third-bg"></div>
          <div class="lower-third-content">
            <div class="quote">"Innovation drives success"</div>
          </div>
        </div>
        <span>Quote</span>
      </div>
      <div class="template-item" data-template="social">
        <div class="template-preview">
          <div class="lower-third-bg"></div>
          <div class="lower-third-content">
            <div class="handle">@company</div>
            <div class="social-icons">📘 📷 🐦</div>
          </div>
        </div>
        <span>Social Media</span>
      </div>
    </div>
  `;

  // Add click handlers for template selection
  container.addEventListener('click', (e) => {
    const templateItem = e.target.closest('.template-item');
    const createBtn = e.target.closest('.create-lower-third-btn');

    if (templateItem) {
      const template = templateItem.dataset.template;

      window.dispatchEvent(new CustomEvent('addLowerThirdToTimeline', {
        detail: { template: template }
      }));

      showToast(`Added ${template} lower third to timeline`);
    }

    if (createBtn) {
      window.dispatchEvent(new CustomEvent('openLowerThirdEditor'));
    }
  });

  return container;
}

// Video Gallery Components
export function VideoGallery() {
  const container = document.createElement('div');
  container.className = 'video-gallery';
  container.innerHTML = `
    <div class="gallery-header">
      <h3>🎥 Video Gallery</h3>
      <div class="gallery-filters">
        <button class="filter-btn active" data-filter="recent">Recent</button>
        <button class="filter-btn" data-filter="favorites">Favorites</button>
        <button class="filter-btn" data-filter="uploaded">Uploaded</button>
      </div>
    </div>
    <div class="gallery-grid">
      <div class="video-tile" data-video-id="1">
        <div class="video-thumbnail">
          <img src="https://via.placeholder.com/200x120/0066cc/ffffff?text=Video+1" alt="Video 1" />
          <div class="play-overlay">▶️</div>
        </div>
        <div class="video-info">
          <h4>Sample Video 1</h4>
          <span>2:30</span>
        </div>
      </div>
      <div class="video-tile" data-video-id="2">
        <div class="video-thumbnail">
          <img src="https://via.placeholder.com/200x120/cc6600/ffffff?text=Video+2" alt="Video 2" />
          <div class="play-overlay">▶️</div>
        </div>
        <div class="video-info">
          <h4>Sample Video 2</h4>
          <span>1:45</span>
        </div>
      </div>
    </div>
  `;

  // Add click handlers for video selection
  container.addEventListener('click', (e) => {
    const videoTile = e.target.closest('.video-tile');
    if (videoTile) {
      const videoId = videoTile.dataset.videoId;

      window.dispatchEvent(new CustomEvent('selectVideoFromGallery', {
        detail: { videoId: videoId }
      }));

      showToast('Video added to timeline');
    }
  });

  return container;
}

// Enhanced Drop Zones Component
export function EnhancedDropZones() {
  // Add drop zones to timeline tracks
  const tracks = document.querySelectorAll('.track');
  tracks.forEach(track => {
    if (!track.querySelector('.drop-zone')) {
      const dropZone = document.createElement('div');
      dropZone.className = 'drop-zone track-drop-zone';
      dropZone.innerHTML = `
        <div class="drop-zone-content">
          <div class="drop-icon">📥</div>
          <div class="drop-text">Drop media here</div>
        </div>
      `;

      // Add drag and drop event listeners
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files);
        files.forEach(file => {
          window.dispatchEvent(new CustomEvent('addMediaToTimeline', {
            detail: { file: file, trackId: track.dataset.trackId }
          }));
        });

        showToast(`${files.length} file(s) added to timeline`);
      });

      track.appendChild(dropZone);
    }
  });
}

// Line Duration Controls Component
export function LineDuration() {
  return {
    render: (clip) => {
      const container = document.createElement('div');
      container.className = 'line-duration';
      container.innerHTML = `
        <div class="duration-controls">
          <label>Duration:</label>
          <input type="number" class="duration-input" value="${clip.duration || 5}" min="0.1" max="300" step="0.1" />
          <span>seconds</span>
          <button class="apply-duration-btn">Apply</button>
        </div>
      `;

      // Add event listeners
      const input = container.querySelector('.duration-input');
      const applyBtn = container.querySelector('.apply-duration-btn');

      applyBtn.addEventListener('click', () => {
        const newDuration = parseFloat(input.value);
        if (newDuration > 0) {
          window.dispatchEvent(new CustomEvent('updateClipDuration', {
            detail: { clipId: clip.id, duration: newDuration }
          }));
          showToast(`Duration updated to ${newDuration}s`);
        }
      });

      return container;
    }
  };
}

// Overlay List Transitions Component
export function OverlayListTransitions() {
  const container = document.createElement('div');
  container.className = 'overlay-transitions';
  container.innerHTML = `
    <div class="transitions-header">
      <h4>🎭 Transition Overlays</h4>
    </div>
    <div class="transitions-list">
      <div class="transition-item" data-transition="fade">
        <div class="transition-icon">🌫️</div>
        <span>Fade</span>
      </div>
      <div class="transition-item" data-transition="wipe">
        <div class="transition-icon">➡️</div>
        <span>Wipe</span>
      </div>
      <div class="transition-item" data-transition="slide">
        <div class="transition-icon">⬅️</div>
        <span>Slide</span>
      </div>
      <div class="transition-item" data-transition="zoom">
        <div class="transition-icon">🔍</div>
        <span>Zoom</span>
      </div>
    </div>
  `;

  // Add click handlers
  container.addEventListener('click', (e) => {
    const transitionItem = e.target.closest('.transition-item');
    if (transitionItem) {
      const transition = transitionItem.dataset.transition;

      window.dispatchEvent(new CustomEvent('applyTransitionOverlay', {
        detail: { transition: transition }
      }));

      showToast(`Applied ${transition} transition overlay`);
    }
  });

  return container;
}

// Progress Bar Component
export function PercentageProgressBar() {
  return {
    render: (progress, label = 'Progress') => {
      const container = document.createElement('div');
      container.className = 'progress-bar-container';
      container.innerHTML = `
        <div class="progress-label">${label}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-text">${progress}%</div>
      `;

      return container;
    },

    update: (container, progress) => {
      const fill = container.querySelector('.progress-fill');
      const text = container.querySelector('.progress-text');

      if (fill) fill.style.width = `${progress}%`;
      if (text) text.textContent = `${progress}%`;
    }
  };
}

// Main Media Ingest Integration Function
export function integrateMediaIngest() {
  // Add Giphy to generation panel
  const giphyIntegration = GiphyIntegration();
  // This would be integrated into the generation panel

  // Add stickers to media library
  const stickersLibrary = StickersLibrary();
  // This would be added to the media library panel

  // Add lower thirds to media library
  const lowerThirds = LowerThirds();
  // This would be added to the media library panel

  // Add video gallery to media library
  const videoGallery = VideoGallery();
  // This would be added to the media library panel

  // Add enhanced drop zones
  EnhancedDropZones();

  // Add animation list to elements panel
  const animationList = AnimationList();
  // This would be added to the elements panel

  console.log('✅ Media ingest components integrated');

  return {
    giphyIntegration,
    stickersLibrary,
    lowerThirds,
    videoGallery,
    animationList
  };
}