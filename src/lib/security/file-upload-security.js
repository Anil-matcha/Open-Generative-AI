/**
 * File Upload Security
 * Validates and secures file uploads against malware and exploits
 */

import { validateFileContent } from './sanitization.js';

// Security configuration for file uploads
const UPLOAD_SECURITY_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_FILENAME_LENGTH: 255,
  ALLOWED_MIME_TYPES: {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/gif': ['gif'],
    'video/mp4': ['mp4'],
    'video/webm': ['webm'],
    'video/quicktime': ['mov'],
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
    'audio/ogg': ['ogg']
  },
  DANGEROUS_EXTENSIONS: [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 'py', 'php', 'asp', 'jsp'
  ],
  MALICIOUS_PATTERNS: [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /\.\./, // Directory traversal
    /<\?php/i,
    /<%/i // ASP tags
  ]
};

/**
 * Comprehensive file validation for security
 * @param {File} file - File to validate
 * @param {object} options - Validation options
 * @returns {Promise<object>} - Validation result
 */
export async function validateSecureFileUpload(file, options = {}) {
  const errors = [];
  const warnings = [];

  try {
    // Basic file validation
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors, warnings };
    }

    if (!(file instanceof File)) {
      errors.push('Invalid file object');
      return { valid: false, errors, warnings };
    }

    // Size validation
    if (file.size > (options.maxSize || UPLOAD_SECURITY_CONFIG.MAX_FILE_SIZE)) {
      errors.push(`File size ${file.size} exceeds maximum allowed size`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Filename validation
    if (file.name.length > UPLOAD_SECURITY_CONFIG.MAX_FILENAME_LENGTH) {
      errors.push('Filename too long');
    }

    // Check for dangerous characters in filename
    if (/[<>:"|?*\x00-\x1f]/.test(file.name)) {
      errors.push('Filename contains invalid characters');
    }

    // Extension validation
    const extension = file.name.split('.').pop().toLowerCase();
    if (UPLOAD_SECURITY_CONFIG.DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push(`File extension '${extension}' is not allowed`);
    }

    // MIME type validation
    const allowedTypes = Object.keys(UPLOAD_SECURITY_CONFIG.ALLOWED_MIME_TYPES);
    if (!allowedTypes.includes(file.type)) {
      errors.push(`MIME type '${file.type}' is not allowed`);
    } else {
      // Check if extension matches MIME type
      const expectedExtensions = UPLOAD_SECURITY_CONFIG.ALLOWED_MIME_TYPES[file.type];
      if (!expectedExtensions.includes(extension)) {
        warnings.push(`File extension '${extension}' does not match MIME type '${file.type}'`);
      }
    }

    // Content validation for text-based files
    if (file.type.startsWith('text/') || ['application/json', 'application/xml'].includes(file.type)) {
      const isSafe = await validateFileContent(file);
      if (!isSafe) {
        errors.push('File content contains potentially malicious code');
      }
    }

    // Magic number validation for binary files
    if (!file.type.startsWith('text/')) {
      const isValidSignature = await validateFileSignature(file);
      if (!isValidSignature) {
        errors.push('File signature does not match declared MIME type');
      }
    }

    // Additional custom validations
    if (options.customValidators) {
      for (const validator of options.customValidators) {
        try {
          const result = await validator(file);
          if (result && result.error) {
            errors.push(result.error);
          }
          if (result && result.warning) {
            warnings.push(result.warning);
          }
        } catch (error) {
          errors.push(`Custom validation failed: ${error.message}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        size: file.size,
        type: file.type,
        name: file.name,
        extension,
        lastModified: file.lastModified
      }
    };

  } catch (error) {
    return {
      valid: false,
      errors: [`Validation failed: ${error.message}`],
      warnings
    };
  }
}

/**
 * Validate file signature (magic bytes) against MIME type
 * @param {File} file - File to validate
 * @returns {Promise<boolean>} - True if signature matches
 */
async function validateFileSignature(file) {
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF8
    'video/mp4': [0x66, 0x74, 0x79, 0x70], // ftyp (MP4)
    'video/webm': [0x1A, 0x45, 0xDF, 0xA3], // EBML (WebM)
    'audio/mpeg': [0xFF, 0xFB], // MP3 frame sync
    'audio/wav': [0x52, 0x49, 0x46, 0x46], // RIFF (WAV)
    'audio/ogg': [0x4F, 0x67, 0x67, 0x53] // OggS
  };

  const expectedSignature = signatures[file.type];
  if (!expectedSignature) {
    return false; // Unknown MIME type
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      const isValid = expectedSignature.every((byte, i) => arr[i] === byte);
      resolve(isValid);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, Math.max(...expectedSignature.map((_, i) => i + 1))));
  });
}

/**
 * Sanitize filename for safe storage
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/(\.\.[\/\\])+/g, '');

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '_');

  // Ensure it's not too long
  if (sanitized.length > UPLOAD_SECURITY_CONFIG.MAX_FILENAME_LENGTH) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, UPLOAD_SECURITY_CONFIG.MAX_FILENAME_LENGTH - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  // Ensure it's not empty
  if (!sanitized.trim()) {
    return 'unnamed_file';
  }

  return sanitized;
}

/**
 * Generate secure filename with random component
 * @param {string} originalName - Original filename
 * @returns {string} - Secure filename
 */
export function generateSecureFilename(originalName) {
  const sanitized = sanitizeFilename(originalName);
  const extension = sanitized.split('.').pop();
  const randomId = crypto.getRandomValues(new Uint8Array(16))
    .reduce((acc, byte) => acc + byte.toString(36), '')
    .substring(0, 16);

  return `${randomId}.${extension}`;
}

/**
 * Check if file content contains malicious patterns
 * @param {File} file - File to scan
 * @returns {Promise<boolean>} - True if file appears safe
 */
export async function scanForMaliciousContent(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;

      // Convert to string for text-based scanning
      let textContent = '';
      if (typeof content === 'string') {
        textContent = content;
      } else if (content instanceof ArrayBuffer) {
        // Only scan first 10KB for performance
        const slice = new Uint8Array(content.slice(0, 10240));
        textContent = String.fromCharCode.apply(null, slice);
      }

      // Check for malicious patterns
      const hasMaliciousContent = UPLOAD_SECURITY_CONFIG.MALICIOUS_PATTERNS
        .some(pattern => pattern.test(textContent));

      resolve(!hasMaliciousContent);
    };
    reader.onerror = () => resolve(false);

    // Read as text for scanning (first 10KB only)
    const slice = file.slice(0, 10240);
    reader.readAsText(slice);
  });
}

/**
 * Secure file upload handler with comprehensive validation
 * @param {FileList|File[]} files - Files to upload
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Upload results
 */
export async function secureFileUpload(files, options = {}) {
  const results = {
    successful: [],
    failed: [],
    warnings: []
  };

  const fileArray = Array.from(files);

  for (const file of fileArray) {
    try {
      // Comprehensive validation
      const validation = await validateSecureFileUpload(file, options);

      if (!validation.valid) {
        results.failed.push({
          file: file.name,
          errors: validation.errors
        });
        continue;
      }

      // Additional security scans
      const contentScan = await scanForMaliciousContent(file);
      if (!contentScan) {
        results.failed.push({
          file: file.name,
          errors: ['File failed security scan']
        });
        continue;
      }

      // Generate secure filename
      const secureName = generateSecureFilename(file.name);

      // Add warnings if any
      if (validation.warnings.length > 0) {
        results.warnings.push({
          file: file.name,
          warnings: validation.warnings
        });
      }

      results.successful.push({
        originalFile: file,
        secureName,
        metadata: validation.metadata
      });

    } catch (error) {
      results.failed.push({
        file: file.name,
        errors: [`Upload processing failed: ${error.message}`]
      });
    }
  }

  return results;
}

// Export configuration for customization
export { UPLOAD_SECURITY_CONFIG };