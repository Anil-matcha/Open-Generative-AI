/**
 * Pexels Integration Module
 * Bridges Pexels Media Modal with Timeline Editor
 */

import { addMediaToTimeline } from './mediaLibrary.js';
import { showToast } from '../loading.js';

/**
 * Initialize Pexels integration with timeline state
 * @param {Object} state - Timeline state object
 * @param {Function} showToast - Toast notification function
 * @returns {Object} Integration API
 */
export function initializePexelsIntegration(state, showToast) {
  return {
    /**
     * Add Pexels media to timeline
     * @param {Object} pexelsAsset - Asset from Pexels API
     * @param {string} trackType - 'video' or 'image' (determines track)
     * @param {number} [position] - Optional timeline position in seconds
     */
    addToTimeline: (pexelsAsset, trackType = 'video', position = null) => {
      return addPexelsAssetToTimeline(pexelsAsset, state, showToast, trackType, position);
    },
    
    /**
     * Get appropriate track for media type
     * @param {string} type - 'image' or 'video'
     * @returns {Object} Track object
     */
    getTargetTrack: (type) => {
      return getTargetTrackForPexels(type, state.tracks);
    },
    
    /**
     * Check if Pexels is configured
     * @returns {boolean}
     */
    isEnabled: () => {
      return import.meta.env.VITE_PEXELS_ENABLED === 'true' && 
             import.meta.env.VITE_PEXELS_API_KEY;
    }
  };
}

/**
 * Add Pexels asset to timeline at appropriate position
 */
function addPexelsAssetToTimeline(asset, state, showToast, trackType = 'video', position = null) {
  // Find track by type preference
  const targetTrack = getTargetTrackForPexels(asset.type, state.tracks);
  
  if (!targetTrack) {
    showToast('No suitable track found. Create a track first.', 'error');
    return null;
  }
  
  // Calculate start time
  const startTime = position !== null 
    ? position 
    : Math.max(0, state.currentTime || 0);
  
  // Determine duration
  const duration = asset.duration || 5; // Videos have duration, images default to 5s
  
  // Create asset in state.assets first
  const assetId = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newAsset = {
    id: assetId,
    type: asset.type === 'video' ? 'video' : 'image',
    name: asset.alt || `Pexels ${asset.type}`,
    url: asset.url,
    thumbnail: asset.thumbnail,
    duration: duration,
    width: asset.width,
    height: asset.height,
    source: 'pexels',
    photographer: asset.photographer
  };
  
  // Add to assets array
  if (!state.assets) state.assets = [];
  state.assets.push(newAsset);
  
  // Create timeline clip/item
  const newClip = {
    id: `clip-${Date.now()}`,
    assetId: assetId,
    type: asset.type === 'video' ? 'video' : 'image',
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
    opacity: 1,
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    name: asset.alt || `${asset.type} from Pexels`
  };
  
  // Add to track items
  targetTrack.items.push(newClip);
  
  // Update selection
  state.selectedClipId = newClip.id;
  
  // Show success message
  showToast(`✅ Added "${asset.alt || asset.type}" to timeline`, 'success');
  
  // Dispatch custom event for other systems (analytics, etc.)
  window.dispatchEvent(new CustomEvent('pexelsAssetAdded', {
    detail: { asset: newAsset, clip: newClip, trackId: targetTrack.id }
  }));
  
  return { asset: newAsset, clip: newClip, track: targetTrack };
}

/**
 * Find appropriate track for Pexels media type
 */
function getTargetTrackForPexels(mediaType, tracks) {
  if (mediaType === 'video') {
    // Prefer dedicated video or B-roll tracks
    return tracks.find(t => t.name === 'Video' || t.name === 'B-Roll') || 
           tracks.find(t => t.type === 'video') ||
           tracks[0];
  }
  
  if (mediaType === 'image') {
    // Images can go on video tracks as stills or dedicated image track
    return tracks.find(t => t.name === 'Video') || 
           tracks.find(t => t.type === 'video') ||
           tracks[0];
  }
  
  return tracks[0];
}

/**
 * Generate attribution text for Pexels asset
 * @param {Object} asset - Pexels asset
 * @returns {string} HTML attribution string
 */
export function generateAttribution(asset) {
  if (!asset.photographer) return '';
  
  return `
    <div class="attribution-text">
      Photo by <a href="${asset.photographerUrl || 'https://www.pexels.com'}" 
                  target="_blank" 
                  rel="noopener noreferrer">${asset.photographer}</a> 
      on <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a>
    </div>
  `;
}

export default initializePexelsIntegration;
