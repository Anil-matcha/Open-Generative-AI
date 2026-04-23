// Media processing Web Worker
// Handles heavy media operations off the main thread

self.onmessage = async function(e) {
  const { action, file, fileId } = e.data;

  try {
    switch (action) {
      case 'getMediaDuration':
        const duration = await getMediaDuration(file);
        self.postMessage({ success: true, action, fileId, result: duration });
        break;

      case 'getImageDimensions':
        const dimensions = await getImageDimensions(file);
        self.postMessage({ success: true, action, fileId, result: dimensions });
        break;

      default:
        self.postMessage({ success: false, action, fileId, error: 'Unknown action' });
    }
  } catch (error) {
    self.postMessage({ success: false, action, fileId, error: error.message });
  }
};

async function getMediaDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');

    media.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(media.duration);
    });

    media.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load media metadata'));
    });

    media.src = url;
  });
}

async function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}