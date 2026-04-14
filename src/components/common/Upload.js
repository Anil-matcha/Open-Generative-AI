import { showToast } from '../../lib/loading.js';

/**
 * Reusable Upload Component
 * @param {Object} options - Configuration options
 * @param {string} options.type - Upload type: 'file' or 'video' (default: 'file')
 * @param {string[]} options.accept - Accepted file types (default: ['*\/*'])
 * @param {number} options.maxSize - Max file size in MB (default: 100)
 * @param {boolean} options.multiple - Allow multiple files (default: false)
 * @param {boolean} options.dragDrop - Enable drag and drop (default: true)
 * @param {string} options.placeholder - Placeholder text
 * @param {Function} options.onUpload - Callback when file is uploaded (receives file(s))
 * @param {Function} options.onProgress - Progress callback (optional)
 * @param {Function} options.onError - Error callback (optional)
 * @returns {HTMLElement} The upload component
 */
export function Upload(options = {}) {
  const {
    type = 'file',
    accept = ['*/*'],
    maxSize = 100,
    multiple = false,
    dragDrop = true,
    placeholder = 'Click to upload or drag and drop',
    onUpload,
    onProgress,
    onError
  } = options;

  // Create container
  const container = document.createElement('div');
  container.className = 'upload-container';

  // Create upload area
  const uploadArea = document.createElement('div');
  uploadArea.className = `
    relative border-2 border-dashed border-white/20 rounded-xl p-8 text-center
    transition-all duration-300 hover:border-white/40 hover:bg-white/5
    ${dragDrop ? 'cursor-pointer' : ''}
  `;

  // Content
  const content = document.createElement('div');
  content.className = 'space-y-4';

  // Icon
  const icon = document.createElement('div');
  icon.className = 'mx-auto w-12 h-12 text-secondary';
  icon.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14,2 14,8 20,8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
  `;

  // Text
  const text = document.createElement('div');
  text.className = 'space-y-2';
  text.innerHTML = `
    <p class="text-lg font-semibold text-white">${placeholder}</p>
    <p class="text-sm text-secondary">
      ${accept.includes('*/*') ? 'Any file type supported' : `Supported: ${accept.join(', ')}`}
      ${maxSize > 0 ? ` • Max ${maxSize}MB` : ''}
      ${multiple ? ' • Multiple files allowed' : ''}
    </p>
  `;

  content.appendChild(icon);
  content.appendChild(text);

  // Progress bar (hidden initially)
  const progressContainer = document.createElement('div');
  progressContainer.className = 'hidden space-y-2';
  progressContainer.innerHTML = `
    <div class="w-full bg-white/10 rounded-full h-2">
      <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
    </div>
    <p class="text-sm text-secondary progress-text">Uploading...</p>
  `;

  uploadArea.appendChild(content);
  uploadArea.appendChild(progressContainer);

  // File input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.className = 'hidden';
  fileInput.accept = accept.join(',');
  fileInput.multiple = multiple;

  // Event handlers
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = [];
    const errors = [];

    // Validate files
    for (const file of files) {
      // Check file size
      if (maxSize > 0 && file.size > maxSize * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max ${maxSize}MB)`);
        continue;
      }

      // Check file type
      if (!accept.includes('*/*')) {
        const fileType = file.type || '';
        const isAccepted = accept.some(type => {
          if (type === '*/*') return true;
          if (type.endsWith('/*')) {
            return fileType.startsWith(type.slice(0, -1));
          }
          return fileType === type;
        });

        if (!isAccepted) {
          errors.push(`${file.name}: Unsupported file type`);
          continue;
        }
      }

      validFiles.push(file);
    }

    // Show errors
    if (errors.length > 0) {
      errors.forEach(error => showToast(error, 'error'));
      if (onError) onError(errors);
    }

    // Process valid files
    if (validFiles.length > 0) {
      try {
        // Show progress
        content.classList.add('hidden');
        progressContainer.classList.remove('hidden');

        const progressBar = progressContainer.querySelector('.bg-primary');
        const progressText = progressContainer.querySelector('.progress-text');

        // Simulate upload progress (replace with real upload logic)
        for (let i = 0; i <= 100; i += 10) {
          progressBar.style.width = `${i}%`;
          progressText.textContent = `Uploading... ${i}%`;
          if (onProgress) onProgress(i, validFiles);

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Complete upload
        progressText.textContent = 'Upload complete!';
        showToast(`${validFiles.length} file(s) uploaded successfully`, 'success');

        if (onUpload) {
          onUpload(multiple ? validFiles : validFiles[0]);
        }

        // Reset after delay
        setTimeout(() => {
          progressContainer.classList.add('hidden');
          content.classList.remove('hidden');
          progressBar.style.width = '0%';
          progressText.textContent = 'Uploading...';
        }, 2000);

      } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed', 'error');
        if (onError) onError([error.message]);

        // Reset on error
        progressContainer.classList.add('hidden');
        content.classList.remove('hidden');
      }
    }
  };

  // Click to upload
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  });

  // Drag and drop
  if (dragDrop) {
    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      uploadArea.classList.add('border-primary', 'bg-primary/5');
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        uploadArea.classList.remove('border-primary', 'bg-primary/5');
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      uploadArea.classList.remove('border-primary', 'bg-primary/5');

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    };

    uploadArea.addEventListener('dragenter', handleDragEnter);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
  }

  container.appendChild(uploadArea);
  container.appendChild(fileInput);

  return container;
}

/**
 * Create a video upload component with video-specific features
 * @param {Object} options - Upload options
 * @returns {HTMLElement} The video upload component
 */
export function VideoUpload(options = {}) {
  return Upload({
    type: 'video',
    accept: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
    maxSize: 500, // 500MB for videos
    placeholder: 'Upload your video',
    dragDrop: true,
    ...options
  });
}