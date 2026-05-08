import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * @typedef {Object} DragState
 * @property {boolean} isDragging - Whether a drag operation is active
 * @property {File[]} files - Array of dragged files
 * @property {Object} position - Current drag position {x, y}
 * @property {string|null} activeZone - Currently active drop zone ID
 * @property {boolean} isValidDrop - Whether current drop location is valid
 * @property {Object} preview - Preview data for dragged files
 */

/**
 * @typedef {Object} UploadProgress
 * @property {string} fileId - Unique file identifier
 * @property {string} fileName - Original file name
 * @property {number} progress - Upload progress (0-100)
 * @property {string} status - Upload status ('pending', 'uploading', 'complete', 'error')
 * @property {string|null} error - Error message if upload failed
 */

/**
 * @typedef {Object} DropZone
 * @property {string} id - Unique zone identifier
 * @property {DOMRect} bounds - Zone boundaries
 * @property {string} type - Zone type ('track', 'empty-space', 'canvas')
 * @property {Object} metadata - Additional zone data (trackId, position, etc.)
 */

/**
 * Advanced drag-and-drop hook for timeline editor
 * Provides comprehensive file upload and asset management functionality
 * @param {Object} options - Hook configuration options
 * @param {Function} options.onFileDrop - Callback when files are dropped
 * @param {Function} options.onZoneEnter - Callback when entering a drop zone
 * @param {Function} options.onZoneLeave - Callback when leaving a drop zone
 * @param {Array} options.dropZones - Array of drop zone configurations
 * @param {Object} options.validation - Validation configuration
 * @returns {Object} Hook interface with state and handlers
 */
export const useAdvancedDragDrop = ({
  onFileDrop,
  onZoneEnter,
  onZoneLeave,
  dropZones = [],
  validation = {}
} = {}) => {
  // Core drag state
  const [dragState, setDragState] = useState({
    isDragging: false,
    files: [],
    position: { x: 0, y: 0 },
    activeZone: null,
    isValidDrop: false,
    preview: null
  });

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState([]);

  // Error state
  const [errors, setErrors] = useState([]);

  // Refs for cleanup and performance
  const dragCounterRef = useRef(0);
  const animationFrameRef = useRef(null);
  const cleanupRef = useRef([]);

  // Supported file types
  const supportedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
  };

  // Validation configuration
  const defaultValidation = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 10,
    allowedTypes: [...supportedTypes.image, ...supportedTypes.video, ...supportedTypes.audio],
    ...validation
  };

  /**
   * Get file type category
   * @param {File} file - File object
   * @returns {string|null} File category ('image', 'video', 'audio', or null)
   */
  const getFileCategory = useCallback((file) => {
    if (supportedTypes.image.includes(file.type)) return 'image';
    if (supportedTypes.video.includes(file.type)) return 'video';
    if (supportedTypes.audio.includes(file.type)) return 'audio';
    return null;
  }, []);

  /**
   * Validate dragged files
   * @param {File[]} files - Array of files to validate
   * @returns {Object} Validation result with valid files and errors
   */
  const validateFiles = useCallback((files) => {
    const validFiles = [];
    const validationErrors = [];

    files.forEach((file, index) => {
      // Check file size
      if (file.size > defaultValidation.maxFileSize) {
        validationErrors.push({
          file: file.name,
          error: `File size exceeds ${defaultValidation.maxFileSize / (1024 * 1024)}MB limit`
        });
        return;
      }

      // Check file type
      if (!defaultValidation.allowedTypes.includes(file.type)) {
        validationErrors.push({
          file: file.name,
          error: `Unsupported file type: ${file.type}`
        });
        return;
      }

      validFiles.push({
        file,
        id: `file-${Date.now()}-${index}`,
        category: getFileCategory(file),
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
      });
    });

    // Check total file count
    if (validFiles.length > defaultValidation.maxFiles) {
      validationErrors.push({
        file: 'Multiple files',
        error: `Maximum ${defaultValidation.maxFiles} files allowed`
      });
      validFiles.splice(defaultValidation.maxFiles);
    }

    return { validFiles, errors: validationErrors };
  }, [defaultValidation, getFileCategory]);

  /**
   * Generate preview for dragged files
   * @param {File[]} files - Array of files
   * @returns {Promise<Object>} Preview data
   */
  const generatePreview = useCallback(async (files) => {
    if (files.length === 0) return null;

    const file = files[0]; // Show preview for first file
    const category = getFileCategory(file);

    try {
      let preview = { name: file.name, size: file.size, type: file.type, category };

      if (category === 'image') {
        preview.thumbnail = await createImageThumbnail(file);
      } else if (category === 'video') {
        preview.thumbnail = await createVideoThumbnail(file);
        preview.duration = await getVideoDuration(file);
      }

      return preview;
    } catch (error) {
      console.warn('Failed to generate preview:', error);
      return { name: file.name, size: file.size, type: file.type, category };
    }
  }, [getFileCategory]);

  /**
   * Create image thumbnail
   * @param {File} file - Image file
   * @returns {Promise<string>} Base64 thumbnail data URL
   */
  const createImageThumbnail = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const maxSize = 100;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }, []);

  /**
   * Create video thumbnail
   * @param {File} file - Video file
   * @returns {Promise<string>} Base64 thumbnail data URL
   */
  const createVideoThumbnail = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 4); // 25% through video
      };

      video.onseeked = () => {
        const maxSize = 100;
        const ratio = Math.min(maxSize / video.videoWidth, maxSize / video.videoHeight);
        canvas.width = video.videoWidth * ratio;
        canvas.height = video.videoHeight * ratio;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(video.src);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }, []);

  /**
   * Get video duration
   * @param {File} file - Video file
   * @returns {Promise<number>} Duration in seconds
   */
  const getVideoDuration = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }, []);

  /**
   * Detect active drop zone based on mouse position
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   * @returns {string|null} Active zone ID or null
   */
  const detectActiveZone = useCallback((x, y) => {
    for (const zone of dropZones) {
      if (!zone.bounds) continue;

      const { left, top, right, bottom } = zone.bounds;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return zone.id;
      }
    }
    return null;
  }, [dropZones]);

  /**
   * Update drag position and active zone
   * @param {number} x - Mouse X coordinate
   * @param {number} y - Mouse Y coordinate
   */
  const updateDragPosition = useCallback((x, y) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const activeZone = detectActiveZone(x, y);
      const isValidDrop = activeZone !== null;

      setDragState(prev => ({
        ...prev,
        position: { x, y },
        activeZone,
        isValidDrop
      }));

      // Trigger zone callbacks
      if (activeZone && activeZone !== dragState.activeZone) {
        onZoneEnter?.(activeZone);
      } else if (!activeZone && dragState.activeZone) {
        onZoneLeave?.(dragState.activeZone);
      }
    });
  }, [detectActiveZone, dragState.activeZone, onZoneEnter, onZoneLeave]);

  /**
   * Handle drag enter event
   * @param {DragEvent} e - Drag event
   */
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current++;

    if (dragCounterRef.current === 1) {
      setDragState(prev => ({ ...prev, isDragging: true }));
    }
  }, []);

  /**
   * Handle drag leave event
   * @param {DragEvent} e - Drag event
   */
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        activeZone: null,
        isValidDrop: false
      }));
    }
  }, []);

  /**
   * Handle drag over event
   * @param {DragEvent} e - Drag event
   */
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateDragPosition(x, y);
  }, [updateDragPosition]);

  /**
   * Handle drop event
   * @param {DragEvent} e - Drop event
   */
  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    const { validFiles, errors: validationErrors } = validateFiles(files);

    // Update error state
    setErrors(validationErrors);

    if (validFiles.length === 0) {
      setDragState({
        isDragging: false,
        files: [],
        position: { x: 0, y: 0 },
        activeZone: null,
        isValidDrop: false,
        preview: null
      });
      return;
    }

    // Generate preview
    const preview = await generatePreview(validFiles.map(f => f.file));

    setDragState(prev => ({
      ...prev,
      isDragging: false,
      files: validFiles,
      preview
    }));

    // Start upload process
    processFiles(validFiles);

    // Trigger drop callback
    onFileDrop?.(validFiles, dragState.activeZone);
  }, [validateFiles, generatePreview, dragState.activeZone, onFileDrop]);

  /**
   * Process uploaded files
   * @param {Array} validFiles - Array of validated file objects
   */
  const processFiles = useCallback(async (validFiles) => {
    const newProgress = validFiles.map(file => ({
      fileId: file.id,
      fileName: file.metadata.name,
      progress: 0,
      status: 'pending',
      error: null
    }));

    setUploadProgress(prev => [...prev, ...newProgress]);

    // Process files sequentially to avoid overwhelming the system
    for (const file of validFiles) {
      try {
        // Update status to uploading
        setUploadProgress(prev =>
          prev.map(p =>
            p.fileId === file.id
              ? { ...p, status: 'uploading' }
              : p
          )
        );

        // Simulate upload progress (replace with actual upload logic)
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev =>
            prev.map(p =>
              p.fileId === file.id
                ? { ...p, progress }
                : p
            )
          );
        }

        // Mark as complete
        setUploadProgress(prev =>
          prev.map(p =>
            p.fileId === file.id
              ? { ...p, status: 'complete', progress: 100 }
              : p
          )
        );

      } catch (error) {
        setUploadProgress(prev =>
          prev.map(p =>
            p.fileId === file.id
              ? { ...p, status: 'error', error: error.message }
              : p
          )
        );
      }
    }
  }, []);

  /**
   * Cancel ongoing uploads
   * @param {string} fileId - Optional file ID to cancel specific upload
   */
  const cancelUpload = useCallback((fileId = null) => {
    if (fileId) {
      setUploadProgress(prev =>
        prev.map(p =>
          p.fileId === fileId
            ? { ...p, status: 'cancelled' }
            : p
        )
      );
    } else {
      setUploadProgress(prev =>
        prev.map(p => ({ ...p, status: 'cancelled' }))
      );
    }
  }, []);

  /**
   * Clear completed/error uploads from progress list
   */
  const clearCompletedUploads = useCallback(() => {
    setUploadProgress(prev => prev.filter(p => !['complete', 'error', 'cancelled'].includes(p.status)));
  }, []);

  /**
   * Reset drag state
   */
  const resetDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      files: [],
      position: { x: 0, y: 0 },
      activeZone: null,
      isValidDrop: false,
      preview: null
    });
    setErrors([]);
    dragCounterRef.current = 0;
  }, []);

  /**
   * Accessibility: Handle keyboard events for drag operations
   * @param {KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = useCallback((e) => {
    if (!dragState.isDragging) return;

    // ESC to cancel drag
    if (e.key === 'Escape') {
      resetDragState();
    }
  }, [dragState.isDragging, resetDragState]);

  // Global keyboard listener for accessibility
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      cleanupRef.current.forEach(cleanup => cleanup());
    };
  }, []);

  return {
    // State
    isDragging: dragState.isDragging,
    dragPosition: dragState.position,
    activeZone: dragState.activeZone,
    isValidDrop: dragState.isValidDrop,
    preview: dragState.preview,
    files: dragState.files,
    uploadProgress,
    errors,

    // Handlers
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,

    // Actions
    cancelUpload,
    clearCompletedUploads,
    resetDragState,

    // Utilities
    validateFiles,
    getFileCategory,
    detectActiveZone
  };
};