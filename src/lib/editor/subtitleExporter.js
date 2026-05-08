/**
 * SubtitleExporter - Export functionality for SRT and VTT formats
 * Handles subtitle format conversion and file generation
 */

import { subtitleState } from './subtitleState.js';

class SubtitleExporter {
  constructor() {
    this.supportedFormats = {
      srt: {
        name: 'SubRip (.srt)',
        mimeType: 'text/plain',
        extension: 'srt'
      },
      vtt: {
        name: 'WebVTT (.vtt)',
        mimeType: 'text/vtt',
        extension: 'vtt'
      },
      json: {
        name: 'JSON (.json)',
        mimeType: 'application/json',
        extension: 'json'
      },
      txt: {
        name: 'Plain Text (.txt)',
        mimeType: 'text/plain',
        extension: 'txt'
      }
    };
  }

  /**
   * Export subtitles to file
   * @param {string} format - Export format (srt, vtt, json, txt)
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result with blob and filename
   */
  async export(format = 'srt', options = {}) {
    const {
      filename,
      includeStyling = false,
      language = subtitleState.currentLanguage,
      metadata = true
    } = options;

    const subtitles = subtitleState.subtitles;
    if (subtitles.length === 0) {
      throw new Error('No subtitles to export');
    }

    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format.toLowerCase()) {
      case 'srt':
        content = this._exportToSRT(subtitles, { includeStyling, metadata });
        mimeType = this.supportedFormats.srt.mimeType;
        extension = this.supportedFormats.srt.extension;
        break;
      case 'vtt':
        content = this._exportToVTT(subtitles, { includeStyling, metadata });
        mimeType = this.supportedFormats.vtt.mimeType;
        extension = this.supportedFormats.vtt.extension;
        break;
      case 'json':
        content = this._exportToJSON(subtitles, { language, metadata });
        mimeType = this.supportedFormats.json.mimeType;
        extension = this.supportedFormats.json.extension;
        break;
      case 'txt':
        content = this._exportToTXT(subtitles);
        mimeType = this.supportedFormats.txt.mimeType;
        extension = this.supportedFormats.txt.extension;
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    const finalFilename = filename || `subtitles_${language}_${Date.now()}.${extension}`;
    const blob = new Blob([content], { type: mimeType });

    return {
      blob,
      filename: finalFilename,
      content,
      format,
      subtitleCount: subtitles.length,
      totalDuration: this._getTotalDuration(subtitles)
    };
  }

  /**
   * Export to SRT format
   */
  _exportToSRT(subtitles, options) {
    const { includeStyling, metadata } = options;
    const lines = [];

    if (metadata) {
      lines.push(`; Exported from Timeline Editor - ${new Date().toISOString()}`);
      lines.push(`; Language: ${subtitleState.currentLanguage}`);
      lines.push(`; Total subtitles: ${subtitles.length}`);
      lines.push('');
    }

    subtitles.forEach((subtitle, index) => {
      lines.push(`${index + 1}`);
      lines.push(`${this._formatTime(subtitle.startTime)} --> ${this._formatTime(subtitle.endTime)}`);

      if (includeStyling && subtitle.style) {
        // Add basic styling info as comments
        lines.push(`; Style: ${JSON.stringify(subtitle.style)}`);
      }

      lines.push(subtitle.text);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Export to VTT format
   */
  _exportToVTT(subtitles, options) {
    const { includeStyling, metadata } = options;
    const lines = ['WEBVTT'];

    if (metadata) {
      lines.push('');
      lines.push(`NOTE Exported from Timeline Editor - ${new Date().toISOString()}`);
      lines.push(`NOTE Language: ${subtitleState.currentLanguage}`);
      lines.push(`NOTE Total subtitles: ${subtitles.length}`);
    }

    lines.push('');

    subtitles.forEach((subtitle, index) => {
      lines.push(`${this._formatTime(subtitle.startTime)} --> ${this._formatTime(subtitle.endTime)}`);

      if (includeStyling && subtitle.style) {
        // WebVTT supports some styling
        const styles = [];
        if (subtitle.style.color) {
          styles.push(`color:${subtitle.style.color}`);
        }
        if (subtitle.style.backgroundColor) {
          styles.push(`background-color:${subtitle.style.backgroundColor}`);
        }
        if (styles.length > 0) {
          lines.push(`STYLE: ${styles.join('; ')}`);
        }
      }

      lines.push(subtitle.text);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Export to JSON format
   */
  _exportToJSON(subtitles, options) {
    const { language, metadata } = options;

    const exportData = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      language: language,
      subtitles: subtitles.map(subtitle => ({
        id: subtitle.id,
        startTime: subtitle.startTime,
        endTime: subtitle.endTime,
        text: subtitle.text,
        language: subtitle.language,
        confidence: subtitle.confidence,
        style: subtitle.style,
        words: subtitle.words
      }))
    };

    if (metadata) {
      exportData.metadata = {
        totalSubtitles: subtitles.length,
        totalDuration: this._getTotalDuration(subtitles),
        averageConfidence: subtitles.reduce((sum, s) => sum + s.confidence, 0) / subtitles.length,
        style: subtitleState.style
      };
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export to plain text format
   */
  _exportToTXT(subtitles) {
    const lines = [
      `SUBTITLE EXPORT - ${new Date().toISOString()}`,
      `Language: ${subtitleState.currentLanguage}`,
      `Total subtitles: ${subtitles.length}`,
      '',
      'TIMED TEXT:'
    ];

    subtitles.forEach((subtitle, index) => {
      lines.push(`${index + 1}. [${this._formatTime(subtitle.startTime)} - ${this._formatTime(subtitle.endTime)}]`);
      lines.push(`   ${subtitle.text}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Format time for SRT/VTT (HH:MM:SS.mmm)
   */
  _formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Get total duration of subtitles
   */
  _getTotalDuration(subtitles) {
    if (subtitles.length === 0) return 0;
    return Math.max(...subtitles.map(s => s.endTime));
  }

  /**
   * Download file to user's device
   */
  async download(format = 'srt', options = {}) {
    try {
      const result = await this.export(format, options);
      const url = URL.createObjectURL(result.blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);

      return result;
    } catch (error) {
      console.error('Export download failed:', error);
      throw error;
    }
  }

  /**
   * Get export preview
   */
  getPreview(format = 'srt', maxLines = 10) {
    const subtitles = subtitleState.subtitles.slice(0, maxLines);

    switch (format.toLowerCase()) {
      case 'srt':
        return this._exportToSRT(subtitles, { metadata: false });
      case 'vtt':
        return this._exportToVTT(subtitles, { metadata: false });
      case 'json':
        return this._exportToJSON(subtitles, { metadata: false });
      case 'txt':
        return this._exportToTXT(subtitles);
      default:
        return 'Unsupported format';
    }
  }

  /**
   * Validate subtitles before export
   */
  validateSubtitles() {
    const subtitles = subtitleState.subtitles;
    const errors = [];
    const warnings = [];

    if (subtitles.length === 0) {
      errors.push('No subtitles to export');
      return { valid: false, errors, warnings };
    }

    subtitles.forEach((subtitle, index) => {
      // Check timing
      if (subtitle.startTime >= subtitle.endTime) {
        errors.push(`Subtitle ${index + 1}: Start time must be before end time`);
      }

      if (subtitle.startTime < 0) {
        errors.push(`Subtitle ${index + 1}: Start time cannot be negative`);
      }

      // Check overlap with next subtitle
      if (index < subtitles.length - 1) {
        const next = subtitles[index + 1];
        if (subtitle.endTime > next.startTime) {
          warnings.push(`Subtitle ${index + 1} overlaps with subtitle ${index + 2}`);
        }
      }

      // Check text content
      if (!subtitle.text || subtitle.text.trim().length === 0) {
        warnings.push(`Subtitle ${index + 1}: Empty text content`);
      }

      // Check confidence
      if (subtitle.confidence < 0.5) {
        warnings.push(`Subtitle ${index + 1}: Low confidence (${(subtitle.confidence * 100).toFixed(1)}%)`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        total: subtitles.length,
        errors: errors.length,
        warnings: warnings.length
      }
    };
  }

  /**
   * Get supported formats
   */
  getSupportedFormats() {
    return { ...this.supportedFormats };
  }

  /**
   * Estimate file size for format
   */
  estimateFileSize(format = 'srt') {
    const preview = this.getPreview(format, 5); // Use first 5 subtitles as sample
    const sampleRatio = subtitleState.subtitles.length / 5;
    const estimatedSize = preview.length * sampleRatio;

    return {
      estimatedBytes: Math.round(estimatedSize),
      estimatedKB: Math.round(estimatedSize / 1024),
      estimatedMB: Math.round(estimatedSize / (1024 * 1024) * 100) / 100
    };
  }
}

// Create default instance
const subtitleExporter = new SubtitleExporter();

export { SubtitleExporter, subtitleExporter };