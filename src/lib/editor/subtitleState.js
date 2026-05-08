/**
 * SubtitleState - State management for subtitle data
 * Handles subtitle creation, editing, and synchronization with timeline
 */

class SubtitleState {
  constructor() {
    this.subtitles = []; // Array of subtitle objects
    this.selectedSubtitleId = null;
    this.currentLanguage = 'en';
    this.style = {
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      strokeColor: '#000000',
      strokeWidth: 2,
      position: 'bottom', // top, middle, bottom
      alignment: 'center' // left, center, right
    };
    this.listeners = new Set();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistorySize = 50;
  }

  /**
   * Initialize subtitles from transcription result
   */
  initializeFromTranscription(transcriptionResult, videoDuration) {
    const subtitles = [];

    // Process segments into subtitle entries
    if (transcriptionResult.segments) {
      transcriptionResult.segments.forEach((segment, index) => {
        subtitles.push({
          id: `subtitle_${Date.now()}_${index}`,
          startTime: segment.start,
          endTime: segment.end,
          text: segment.text.trim(),
          language: transcriptionResult.language,
          words: segment.words || [],
          style: { ...this.style },
          confidence: segment.confidence || 1.0
        });
      });
    }

    this.setSubtitles(subtitles);
    return subtitles;
  }

  /**
   * Set subtitles array
   */
  setSubtitles(subtitles) {
    this.saveToHistory();
    this.subtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime);
    this.notifyListeners('subtitles-changed');
  }

  /**
   * Add a new subtitle
   */
  addSubtitle(subtitle) {
    this.saveToHistory();
    const newSubtitle = {
      id: subtitle.id || `subtitle_${Date.now()}_${this.subtitles.length}`,
      startTime: subtitle.startTime || 0,
      endTime: subtitle.endTime || (subtitle.startTime || 0) + 3,
      text: subtitle.text || '',
      language: subtitle.language || this.currentLanguage,
      words: subtitle.words || [],
      style: { ...this.style, ...subtitle.style },
      confidence: subtitle.confidence || 1.0
    };

    this.subtitles.push(newSubtitle);
    this.subtitles.sort((a, b) => a.startTime - b.startTime);
    this.notifyListeners('subtitle-added', newSubtitle);
    return newSubtitle;
  }

  /**
   * Update an existing subtitle
   */
  updateSubtitle(id, updates) {
    this.saveToHistory();
    const index = this.subtitles.findIndex(s => s.id === id);
    if (index === -1) return null;

    const updatedSubtitle = { ...this.subtitles[index], ...updates };
    this.subtitles[index] = updatedSubtitle;

    // Re-sort if timing changed
    if (updates.startTime !== undefined || updates.endTime !== undefined) {
      this.subtitles.sort((a, b) => a.startTime - b.startTime);
    }

    this.notifyListeners('subtitle-updated', updatedSubtitle);
    return updatedSubtitle;
  }

  /**
   * Delete a subtitle
   */
  deleteSubtitle(id) {
    this.saveToHistory();
    const index = this.subtitles.findIndex(s => s.id === id);
    if (index === -1) return false;

    const deletedSubtitle = this.subtitles[index];
    this.subtitles.splice(index, 1);

    if (this.selectedSubtitleId === id) {
      this.selectedSubtitleId = null;
    }

    this.notifyListeners('subtitle-deleted', deletedSubtitle);
    return true;
  }

  /**
   * Get subtitle by ID
   */
  getSubtitle(id) {
    return this.subtitles.find(s => s.id === id) || null;
  }

  /**
   * Get subtitles within a time range
   */
  getSubtitlesInRange(startTime, endTime) {
    return this.subtitles.filter(s =>
      (s.startTime >= startTime && s.startTime <= endTime) ||
      (s.endTime >= startTime && s.endTime <= endTime) ||
      (s.startTime <= startTime && s.endTime >= endTime)
    );
  }

  /**
   * Get current subtitle at playback time
   */
  getCurrentSubtitle(playbackTime) {
    return this.subtitles.find(s =>
      playbackTime >= s.startTime && playbackTime <= s.endTime
    ) || null;
  }

  /**
   * Set selected subtitle
   */
  setSelectedSubtitle(id) {
    this.selectedSubtitleId = id;
    this.notifyListeners('selection-changed', id);
  }

  /**
   * Update global style settings
   */
  updateStyle(styleUpdates) {
    this.style = { ...this.style, ...styleUpdates };
    this.notifyListeners('style-changed', this.style);
  }

  /**
   * Apply style to specific subtitle
   */
  applyStyleToSubtitle(subtitleId, styleUpdates) {
    const subtitle = this.getSubtitle(subtitleId);
    if (subtitle) {
      const newStyle = { ...subtitle.style, ...styleUpdates };
      this.updateSubtitle(subtitleId, { style: newStyle });
    }
  }

  /**
   * Split subtitle at time
   */
  splitSubtitle(id, splitTime) {
    const subtitle = this.getSubtitle(id);
    if (!subtitle || splitTime <= subtitle.startTime || splitTime >= subtitle.endTime) {
      return null;
    }

    this.saveToHistory();

    // Create two new subtitles
    const firstPart = {
      ...subtitle,
      id: `${subtitle.id}_1`,
      endTime: splitTime,
      text: this._splitTextAtTime(subtitle, splitTime, true)
    };

    const secondPart = {
      ...subtitle,
      id: `${subtitle.id}_2`,
      startTime: splitTime,
      text: this._splitTextAtTime(subtitle, splitTime, false)
    };

    // Replace original with two parts
    const index = this.subtitles.findIndex(s => s.id === id);
    this.subtitles.splice(index, 1, firstPart, secondPart);

    this.notifyListeners('subtitle-split', { original: subtitle, parts: [firstPart, secondPart] });
    return [firstPart, secondPart];
  }

  /**
   * Merge adjacent subtitles
   */
  mergeSubtitles(ids) {
    if (ids.length < 2) return null;

    this.saveToHistory();

    const subtitles = ids.map(id => this.getSubtitle(id)).filter(Boolean);
    if (subtitles.length < 2) return null;

    // Sort by start time
    subtitles.sort((a, b) => a.startTime - b.startTime);

    // Create merged subtitle
    const merged = {
      id: `merged_${Date.now()}`,
      startTime: subtitles[0].startTime,
      endTime: subtitles[subtitles.length - 1].endTime,
      text: subtitles.map(s => s.text).join(' '),
      language: subtitles[0].language,
      words: subtitles.flatMap(s => s.words),
      style: { ...subtitles[0].style },
      confidence: Math.min(...subtitles.map(s => s.confidence))
    };

    // Remove originals and add merged
    ids.forEach(id => {
      const index = this.subtitles.findIndex(s => s.id === id);
      if (index !== -1) this.subtitles.splice(index, 1);
    });

    this.subtitles.push(merged);
    this.subtitles.sort((a, b) => a.startTime - b.startTime);

    this.notifyListeners('subtitles-merged', { merged, originals: subtitles });
    return merged;
  }

  /**
   * Split text based on word timing
   */
  _splitTextAtTime(subtitle, splitTime, isFirstPart) {
    if (!subtitle.words || subtitle.words.length === 0) {
      return isFirstPart ? subtitle.text : '';
    }

    const words = subtitle.words;
    const splitIndex = words.findIndex(word => word.end > splitTime);

    if (splitIndex === -1) {
      return isFirstPart ? subtitle.text : '';
    }

    if (isFirstPart) {
      return words.slice(0, splitIndex).map(w => w.word).join(' ');
    } else {
      return words.slice(splitIndex).map(w => w.word).join(' ');
    }
  }

  /**
   * History management
   */
  saveToHistory() {
    const state = {
      subtitles: this.subtitles.map(s => ({ ...s })),
      selectedSubtitleId: this.selectedSubtitleId,
      style: { ...this.style }
    };

    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(state);

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  /**
   * Undo last change
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      this._restoreState(state);
      this.notifyListeners('undo');
      return true;
    }
    return false;
  }

  /**
   * Redo last undone change
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];
      this._restoreState(state);
      this.notifyListeners('redo');
      return true;
    }
    return false;
  }

  /**
   * Restore state from history
   */
  _restoreState(state) {
    this.subtitles = state.subtitles.map(s => ({ ...s }));
    this.selectedSubtitleId = state.selectedSubtitleId;
    this.style = { ...state.style };
  }

  /**
   * Export subtitles to various formats
   */
  exportToFormat(format = 'srt') {
    switch (format.toLowerCase()) {
      case 'srt':
        return this._exportToSRT();
      case 'vtt':
        return this._exportToVTT();
      case 'json':
        return this._exportToJSON();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export to SRT format
   */
  _exportToSRT() {
    return this.subtitles.map((subtitle, index) => {
      const start = this._formatTime(subtitle.startTime);
      const end = this._formatTime(subtitle.endTime);
      return `${index + 1}\n${start} --> ${end}\n${subtitle.text}\n`;
    }).join('\n');
  }

  /**
   * Export to VTT format
   */
  _exportToVTT() {
    const content = ['WEBVTT\n'];
    this.subtitles.forEach((subtitle, index) => {
      const start = this._formatTime(subtitle.startTime);
      const end = this._formatTime(subtitle.endTime);
      content.push(`${start} --> ${end}\n${subtitle.text}\n`);
    });
    return content.join('\n');
  }

  /**
   * Export to JSON format
   */
  _exportToJSON() {
    return JSON.stringify({
      subtitles: this.subtitles,
      metadata: {
        language: this.currentLanguage,
        style: this.style,
        exportTime: new Date().toISOString()
      }
    }, null, 2);
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
   * Event listener management
   */
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('SubtitleState listener error:', error);
      }
    });
  }

  /**
   * Get state summary
   */
  getSummary() {
    return {
      totalSubtitles: this.subtitles.length,
      selectedId: this.selectedSubtitleId,
      language: this.currentLanguage,
      totalDuration: this.subtitles.length > 0 ?
        Math.max(...this.subtitles.map(s => s.endTime)) : 0,
      averageConfidence: this.subtitles.length > 0 ?
        this.subtitles.reduce((sum, s) => sum + s.confidence, 0) / this.subtitles.length : 0
    };
  }

  /**
   * Clear all subtitles
   */
  clear() {
    this.saveToHistory();
    this.subtitles = [];
    this.selectedSubtitleId = null;
    this.notifyListeners('cleared');
  }

  /**
   * Destroy state (cleanup)
   */
  destroy() {
    this.listeners.clear();
    this.history = [];
    this.subtitles = [];
  }
}

// Create default instance
const subtitleState = new SubtitleState();

export { SubtitleState, subtitleState };