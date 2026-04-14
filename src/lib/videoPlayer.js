/**
 * Creates a standardized video player component with consistent behavior across the application
 * @param {Object} options - Video player options
 * @param {string} options.src - Video source URL
 * @param {string} options.className - CSS classes for the video element
 * @param {boolean} options.controls - Whether to show video controls (default: true)
 * @param {boolean} options.autoplay - Whether to autoplay the video (default: false)
 * @param {boolean} options.muted - Whether the video should be muted (default: true for autoplay)
 * @param {boolean} options.loop - Whether to loop the video (default: false)
 * @param {boolean} options.playsInline - Whether to play inline on mobile (default: true)
 * @param {string} options.preload - Preload strategy (default: 'metadata')
 * @param {string} options.poster - Poster image URL
 * @param {Function} options.onLoad - Callback when video loads
 * @param {Function} options.onError - Callback when video fails to load
 * @param {Function} options.onPlay - Callback when video starts playing
 * @param {Function} options.onPause - Callback when video pauses
 * @returns {HTMLVideoElement} The video element
 */
export function createVideoPlayer(options = {}) {
  const {
    src,
    className = '',
    controls = true,
    autoplay = false,
    muted = autoplay, // Default to muted if autoplay is enabled
    loop = false,
    playsInline = true,
    preload = 'metadata',
    poster = '',
    onLoad,
    onError,
    onPlay,
    onPause
  } = options;

  const video = document.createElement('video');
  video.className = className;

  // Set attributes
  if (src) video.src = src;
  if (poster) video.poster = poster;

  video.controls = controls;
  video.autoplay = autoplay;
  video.muted = muted;
  video.loop = loop;
  video.playsInline = playsInline;
  video.preload = preload;

  // Event handlers
  if (onLoad) {
    video.onloadedmetadata = () => onLoad(video);
    video.oncanplaythrough = () => onLoad(video);
  }

  if (onError) {
    video.onerror = () => onError(video.error);
  }

  if (onPlay) {
    video.onplay = () => onPlay(video);
  }

  if (onPause) {
    video.onpause = () => onPause(video);
  }

  // Load the video
  if (src) {
    video.load();
  }

  return video;
}

/**
 * Creates a video player with standard preview settings (muted, controls enabled, autoplay)
 * @param {string} src - Video source URL
 * @param {string} className - Additional CSS classes
 * @param {Object} options - Additional options to override defaults
 * @returns {HTMLVideoElement} The video element
 */
export function createVideoPreview(src, className = '', options = {}) {
  return createVideoPlayer({
    src,
    className,
    controls: true,
    autoplay: true,
    muted: true,
    playsInline: true,
    preload: 'metadata',
    ...options
  });
}

/**
 * Creates a video player for uploaded content (controls enabled, no autoplay)
 * @param {string} src - Video source URL
 * @param {string} className - Additional CSS classes
 * @param {Object} options - Additional options to override defaults
 * @returns {HTMLVideoElement} The video element
 */
export function createVideoUpload(src, className = '', options = {}) {
  return createVideoPlayer({
    src,
    className,
    controls: true,
    autoplay: false,
    muted: true,
    playsInline: true,
    preload: 'metadata',
    ...options
  });
}

/**
 * Validates video playback capabilities and provides fallback handling
 * @param {HTMLVideoElement} video - The video element to validate
 * @returns {Object} Validation results with recommendations
 */
export function validateVideoPlayback(video) {
  const results = {
    canPlay: false,
    supportedFormats: [],
    recommendations: [],
    errors: []
  };

  // Check if video element exists and has source
  if (!video || !video.src) {
    results.errors.push('No video element or source provided');
    return results;
  }

  // Check for basic video support
  if (!video.canPlayType) {
    results.errors.push('Video playback not supported in this browser');
    results.recommendations.push('Use a modern browser with video support');
    return results;
  }

  // Test common video formats
  const testFormats = [
    { type: 'video/mp4', ext: 'mp4' },
    { type: 'video/webm', ext: 'webm' },
    { type: 'video/ogg', ext: 'ogv' }
  ];

  testFormats.forEach(format => {
    const support = video.canPlayType(format.type);
    if (support === 'probably' || support === 'maybe') {
      results.supportedFormats.push(format.ext);
    }
  });

  if (results.supportedFormats.length === 0) {
    results.errors.push('No supported video formats detected');
    results.recommendations.push('Convert video to MP4 or WebM format');
  }

  // Check for autoplay policy
  if (video.autoplay && !video.muted) {
    results.recommendations.push('Autoplay requires muted attribute for most browsers');
  }

  // Check network state
  if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
    results.errors.push('Video source not found');
  }

  // Check ready state
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
    results.canPlay = true;
  }

  return results;
}

/**
 * Adds error recovery for video elements
 * @param {HTMLVideoElement} video - The video element to enhance
 * @param {Object} options - Recovery options
 * @param {Function} options.onError - Error callback
 * @param {Function} options.onFallback - Fallback callback
 */
export function addVideoErrorRecovery(video, options = {}) {
  const { onError, onFallback } = options;

  video.addEventListener('error', (e) => {
    const error = video.error;
    let errorMessage = 'Video playback failed';

    switch (error?.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        errorMessage = 'Video loading was aborted';
        break;
      case MediaError.MEDIA_ERR_NETWORK:
        errorMessage = 'Network error while loading video';
        break;
      case MediaError.MEDIA_ERR_DECODE:
        errorMessage = 'Video format not supported or corrupted';
        break;
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        errorMessage = 'Video source not supported';
        break;
    }

    console.error('Video error:', errorMessage, error);

    if (onError) {
      onError(errorMessage, error);
    }

    // Attempt basic recovery
    if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      // Try reloading
      setTimeout(() => {
        video.load();
      }, 1000);
    }

    if (onFallback) {
      onFallback(video);
    }
  });

  // Add stalled event handling
  video.addEventListener('stalled', () => {
    console.warn('Video stalled, attempting recovery');
    // Try to resume playback
    if (video.paused) {
      video.play().catch(() => {
        // Ignore play promise rejection
      });
    }
  });
}

/**
 * Comprehensive video playback validation and health check
 * @param {HTMLVideoElement} video - The video element to validate
 * @returns {Object} Comprehensive validation results
 */
export function validateVideoPlaybackHealth(video) {
  const results = {
    isValid: false,
    issues: [],
    recommendations: [],
    metadata: {},
    performance: {}
  };

  if (!video) {
    results.issues.push('No video element provided');
    return results;
  }

  // Check source
  if (!video.src && !video.querySelector('source')) {
    results.issues.push('No video source specified');
  }

  // Check attributes
  if (video.autoplay && !video.muted) {
    results.issues.push('Autoplay without mute may fail in modern browsers');
    results.recommendations.push('Add muted attribute for autoplay');
  }

  if (!video.controls && !video.hasAttribute('controls')) {
    results.recommendations.push('Consider adding controls for user interaction');
  }

  // Check load state
  if (video.readyState === 0) {
    results.issues.push('Video not loaded');
    results.recommendations.push('Call video.load() to start loading');
  }

  // Check error state
  if (video.error) {
    results.issues.push(`Video error: ${video.error.message || 'Unknown error'}`);
    results.recommendations.push('Check video format and network connectivity');
  }

  // Check network state
  if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
    results.issues.push('Network source not available');
  }

  // Metadata
  results.metadata = {
    duration: video.duration || 0,
    currentTime: video.currentTime || 0,
    videoWidth: video.videoWidth || 0,
    videoHeight: video.videoHeight || 0,
    readyState: video.readyState,
    networkState: video.networkState,
    buffered: video.buffered?.length ? `${video.buffered.end(0)}s buffered` : 'No buffering'
  };

  // Performance
  results.performance = {
    canPlayType: checkVideoFormatSupport(video),
    hasPreload: video.preload !== 'none',
    isPlaysInline: video.playsInline
  };

  results.isValid = results.issues.length === 0;

  return results;
}

/**
 * Check supported video formats
 * @param {HTMLVideoElement} video - Video element to test
 * @returns {Object} Format support results
 */
function checkVideoFormatSupport(video) {
  const formats = [
    { mime: 'video/mp4; codecs="avc1.42E01E"', name: 'MP4 H.264' },
    { mime: 'video/webm; codecs="vp8"', name: 'WebM VP8' },
    { mime: 'video/webm; codecs="vp9"', name: 'WebM VP9' },
    { mime: 'video/ogg; codecs="theora"', name: 'Ogg Theora' }
  ];

  const support = {};
  formats.forEach(format => {
    const result = video.canPlayType(format.mime);
    support[format.name] = result;
  });

  return support;
}