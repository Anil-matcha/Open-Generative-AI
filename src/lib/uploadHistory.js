const STORAGE_KEY = 'muapi_uploads';
const MAX_UPLOADS = 20;

export function getUploadHistory() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function saveUpload({ id, name, uploadedUrl, thumbnail, timestamp }) {
    const history = getUploadHistory();
    history.unshift({ id, name, uploadedUrl, thumbnail, timestamp });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_UPLOADS)));
}

export function removeUpload(id) {
    const history = getUploadHistory().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

/**
 * Generates a square 80×80 base64 JPEG thumbnail from a File.
 * @param {File} file
 * @returns {Promise<string|null>}
 */
export async function generateThumbnail(file) {
    return new Promise((resolve) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const SIZE = 80;
            const canvas = document.createElement('canvas');
            canvas.width = SIZE;
            canvas.height = SIZE;
            const ctx = canvas.getContext('2d');
            // Center-crop to square
            const size = Math.min(img.width, img.height);
            const sx = (img.width - size) / 2;
            const sy = (img.height - size) / 2;
            ctx.drawImage(img, sx, sy, size, size, 0, 0, SIZE, SIZE);
            URL.revokeObjectURL(objectUrl);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(null);
        };
        img.src = objectUrl;
    });
}
