/**
 * Media Library Module
 * Handles media asset management, upload, and library interactions
 */

export function renderMediaGrid(mediaItems, container, onMediaSelect, showToast, state) {
  if (!container) return;

  container.innerHTML = '';
  mediaItems.forEach((media, index) => {
    const item = document.createElement('button');
    item.className = 'media-item drag-ready';
    item.dataset.mediaIndex = index;
    item.setAttribute('data-testid', 'media-item');
    item.innerHTML = `
      <span class="media-icon">${media.icon}</span>
      <span class="media-copy">
        <div class="media-label">${media.label}</div>
        <div class="media-desc">${media.desc}</div>
      </span>
    `;

    // Enhanced title for tooltips
    item.title = `${media.label}\n${media.desc}\nClick to add or drag to timeline`;

    item.addEventListener('click', () => onMediaSelect(media, index, showToast));

    // Add mouse enter/leave for enhanced tooltips
    item.addEventListener('mouseenter', () => {
      item.classList.add('media-item-hover');
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('media-item-hover');
    });

    container.appendChild(item);
  });

  // Initialize drag and drop for media items
  if (state) {
    import('./dragDrop.js').then(({ initializeMediaLibraryDragDrop }) => {
      initializeMediaLibraryDragDrop(state, container);
    });
  }
}

export function addMediaToTimeline(media, index, state, showToast) {
  const targetTrack = getTargetTrackForMedia(media, state.tracks);
  const newId = Date.now() + index;
  const startTime = Math.min(state.timelineSeconds - 10, 5 + targetTrack.items.length * 8);
  const duration = getDurationForMedia(media);

  // Determine asset type based on media label or direct type property
  const isPexelsAsset = media.source === 'pexels';
  const assetType = isPexelsAsset 
    ? media.type === 'video' ? 'video' : 'image'
    : getTypeForMedia(media);

  // Create asset entry first for non-Pexels, Pexels assets already have URL
  const assetId = isPexelsAsset 
    ? media.id || `asset-${Date.now()}`
    : 'asset-' + (index + 1);

  // If not Pexels, create local asset entry
  if (!isPexelsAsset) {
    const newAsset = {
      id: assetId,
      type: assetType,
      name: `${media.label} ${targetTrack.items.length + 1}`,
      url: null, // Local media handled differently
      duration: duration
    };
    if (!state.assets) state.assets = [];
    state.assets.push(newAsset);
  } else {
    // Pexels asset: add to assets list directly
    if (!state.assets) state.assets = [];
    state.assets.push({
      id: assetId,
      type: assetType,
      name: media.alt || `Pexels ${media.type}`,
      url: media.url,
      thumbnail: media.thumbnail,
      duration: media.duration || 5,
      source: 'pexels',
      photographer: media.photographer
    });
  }

  const newItem = {
    id: newId,
    assetId: assetId,
    type: assetType,
    start: startTime,
    end: startTime + duration,
    sourceStart: 0,
    sourceEnd: duration,
    lane: 0,
    trimIn: 0,
    trimOut: duration,
    volume: 1,
    playbackRate: 1,
    effects: [],
    name: `${media.label || (media.alt || 'Pexels Asset')} ${targetTrack.items.length + 1}`
  };

  targetTrack.items.push(newItem);
  state.selectedClipId = newId;

  return { newItem, targetTrack };
}

function getTargetTrackForMedia(media, tracks) {
  if (media.label === 'Audio Track') {
    return tracks.find(t => t.name === 'Audio') || tracks[1] || tracks[0];
  }
  if (media.label === 'Image Frame') {
    return tracks.find(t => t.name === 'Text') || tracks[0];
  }
  if (media.label === 'B-Roll Asset') {
    return tracks.find(t => t.name === 'B-Roll') || tracks[0];
  }
  return tracks.find(t => t.name === 'Video') || tracks[0];
}

function getTypeForMedia(media) {
  if (media.label === 'Audio Track') return 'audio';
  if (media.label === 'Image Frame') return 'text';
  if (media.label === 'B-Roll Asset') return 'broll';
  return 'video';
}

function getDurationForMedia(media) {
  if (media.label === 'Audio Track') return 20;
  if (media.label === 'Image Frame') return 5;
  if (media.label === 'B-Roll Asset') return 8;
  return 10;
}

export function addGeneratedAssetToLibrary(asset, state) {
  const newAsset = {
    id: `asset-${Date.now()}`,
    type: asset.type,
    name: asset.name || `${asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} Asset`,
    url: asset.url,
    duration: asset.duration || 0,
    ...(asset.type === 'audio' && asset.waveformData && { waveformData: asset.waveformData })
  };

  state.assets.push(newAsset);
  return newAsset;
}

export function handleUpload(showToast) {
  // Placeholder for upload functionality
  showToast('Upload flow placeholder triggered');
}

export function searchMedia(query, mediaItems) {
  if (!query.trim()) return mediaItems;

  const searchTerm = query.toLowerCase();
  return mediaItems.filter(media =>
    media.label.toLowerCase().includes(searchTerm) ||
    media.desc.toLowerCase().includes(searchTerm)
  );
}

export function filterMediaByType(type, mediaItems) {
  if (!type || type === 'all') return mediaItems;

  return mediaItems.filter(media => {
    if (type === 'video') return ['Video Clip', 'Generated Video', 'Webcam Recording', 'B-Roll Asset'].includes(media.label);
    if (type === 'audio') return ['Audio Track', 'Generated Speech'].includes(media.label);
    if (type === 'image') return ['Generated Image', 'Edited Image'].includes(media.label);
    if (type === 'text') return media.label === 'Image Frame';
    return false;
  });
}