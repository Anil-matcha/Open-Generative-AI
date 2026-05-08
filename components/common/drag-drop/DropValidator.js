/**
 * DropValidator - Utility service for validating drag-and-drop operations
 * Provides comprehensive validation logic for file drops and zone interactions
 */

export class DropValidator {
  /**
   * Validate if files can be dropped in a specific zone
   * @param {Array} files - Array of file objects with metadata
   * @param {string} zoneId - Target zone identifier
   * @param {string} zoneType - Zone type ('track', 'empty-space', 'canvas')
   * @param {Object} zoneMetadata - Additional zone metadata
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with isValid and error messages
   */
  static validateDrop(files, zoneId, zoneType, zoneMetadata = {}, options = {}) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Basic file validation
    for (const file of files) {
      const fileValidation = this.validateFile(file);
      if (!fileValidation.isValid) {
        result.isValid = false;
        result.errors.push(...fileValidation.errors);
      }
    }

    // Zone-specific validation
    const zoneValidation = this.validateZoneCompatibility(files, zoneType, zoneMetadata);
    if (!zoneValidation.isValid) {
      result.isValid = false;
      result.errors.push(...zoneValidation.errors);
    }

    // Custom validation rules
    if (options.customValidators) {
      for (const validator of options.customValidators) {
        const customResult = validator(files, zoneId, zoneType, zoneMetadata);
        if (!customResult.isValid) {
          result.isValid = false;
          result.errors.push(...(customResult.errors || []));
        }
      }
    }

    return result;
  }

  /**
   * Validate individual file properties
   * @param {Object} file - File object with metadata
   * @returns {Object} Validation result
   */
  static validateFile(file) {
    const result = {
      isValid: true,
      errors: []
    };

    // Check file size (default 100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.metadata.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File "${file.metadata.name}" exceeds maximum size of ${this.formatBytes(maxSize)}`);
    }

    // Check file type
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'
    ];

    if (!allowedTypes.includes(file.metadata.type)) {
      result.isValid = false;
      result.errors.push(`File "${file.metadata.name}" has unsupported type: ${file.metadata.type}`);
    }

    // Check for corruption indicators (basic check)
    if (file.metadata.size === 0) {
      result.isValid = false;
      result.errors.push(`File "${file.metadata.name}" appears to be empty or corrupted`);
    }

    return result;
  }

  /**
   * Validate zone compatibility for file types
   * @param {Array} files - Array of file objects
   * @param {string} zoneType - Zone type
   * @param {Object} zoneMetadata - Zone metadata
   * @returns {Object} Validation result
   */
  static validateZoneCompatibility(files, zoneType, zoneMetadata) {
    const result = {
      isValid: true,
      errors: []
    };

    switch (zoneType) {
      case 'track':
        result.isValid = this.validateTrackDrop(files, zoneMetadata);
        if (!result.isValid) {
          result.errors.push('Files not compatible with this track type');
        }
        break;

      case 'empty-space':
        // Empty spaces can accept any valid files
        result.isValid = true;
        break;

      case 'canvas':
        // Canvas can accept any valid files
        result.isValid = true;
        break;

      default:
        result.isValid = false;
        result.errors.push(`Unknown zone type: ${zoneType}`);
    }

    return result;
  }

  /**
   * Validate track-specific drop rules
   * @param {Array} files - Array of file objects
   * @param {Object} zoneMetadata - Track metadata
   * @returns {boolean} Whether drop is valid
   */
  static validateTrackDrop(files, zoneMetadata) {
    const { trackType } = zoneMetadata;

    // If no track type specified, allow any files
    if (!trackType) return true;

    // Check file compatibility with track type
    for (const file of files) {
      switch (trackType) {
        case 'video':
          if (!['image', 'video'].includes(file.category)) {
            return false;
          }
          break;

        case 'audio':
          if (file.category !== 'audio') {
            return false;
          }
          break;

        case 'text':
          // Text tracks might accept various files
          return true;

        default:
          return true;
      }
    }

    return true;
  }

  /**
   * Check if there's enough space in the target location
   * @param {Array} files - Array of file objects
   * @param {Object} targetBounds - Target area bounds
   * @param {Object} timelineState - Current timeline state
   * @returns {Object} Space validation result
   */
  static validateSpaceAvailability(files, targetBounds, timelineState) {
    const result = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Calculate total duration needed
    const totalDuration = files.reduce((total, file) => {
      // For videos, use actual duration; for images, use default duration
      if (file.category === 'video' && file.metadata.duration) {
        return total + file.metadata.duration;
      } else if (file.category === 'image') {
        return total + 5; // Default 5 seconds for images
      } else if (file.category === 'audio') {
        return total + (file.metadata.duration || 10); // Default 10 seconds for audio
      }
      return total;
    }, 0);

    // Check if target area can accommodate the content
    const availableDuration = targetBounds ? (targetBounds.end - targetBounds.start) : Infinity;

    if (totalDuration > availableDuration) {
      result.isValid = false;
      result.errors.push(`Content duration (${totalDuration}s) exceeds available space (${availableDuration}s)`);
    }

    return result;
  }

  /**
   * Format bytes for display
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted size string
   */
  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get validation error messages for accessibility
   * @param {Array} errors - Array of error messages
   * @returns {string} Combined accessibility message
   */
  static getAccessibilityMessage(errors) {
    if (errors.length === 0) return '';

    if (errors.length === 1) {
      return `Validation error: ${errors[0]}`;
    }

    return `Validation errors: ${errors.length} issues found. ${errors.join('. ')}`;
  }
}

/**
 * Default validation presets
 */
export const ValidationPresets = {
  // Strict validation for production
  strict: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg']
  },

  // Relaxed validation for development
  relaxed: {
    maxFileSize: 200 * 1024 * 1024, // 200MB
    maxFiles: 20,
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/wav', 'audio/ogg'
    ]
  },

  // Images only
  imagesOnly: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },

  // Videos only
  videosOnly: {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxFiles: 3,
    allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime']
  }
};

export default DropValidator;