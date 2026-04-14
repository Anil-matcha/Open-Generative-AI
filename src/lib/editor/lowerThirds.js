/**
 * Lower Thirds System
 * Professional lower thirds graphics with presets, animations, and timeline integration
 */

export const LOWER_THIRD_PRESETS = [
  {
    id: 'name-title',
    name: 'Name & Title',
    template: 'name-title',
    fields: ['name', 'title'],
    animation: 'fade-in-out',
    duration: 4000,
    style: {
      background: 'rgba(0,0,0,0.8)',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff'
    }
  },
  {
    id: 'name-title-company',
    name: 'Name, Title & Company',
    template: 'name-title-company',
    fields: ['name', 'title', 'company'],
    animation: 'slide-left',
    duration: 5000,
    style: {
      background: 'linear-gradient(135deg, rgba(59,130,246,0.9), rgba(16,185,129,0.9))',
      borderRadius: '12px',
      padding: '16px 24px',
      fontSize: 20,
      color: '#ffffff'
    }
  },
  {
    id: 'location-date',
    name: 'Location & Date',
    template: 'location-date',
    fields: ['location', 'date'],
    animation: 'slide-up',
    duration: 3000,
    style: {
      background: 'rgba(245,158,11,0.9)',
      borderRadius: '6px',
      padding: '8px 16px',
      fontSize: 18,
      color: '#000000'
    }
  },
  {
    id: 'minimal-name',
    name: 'Minimal Name',
    template: 'minimal-name',
    fields: ['name'],
    animation: 'fade-in',
    duration: 2500,
    style: {
      background: 'transparent',
      border: '2px solid #ffffff',
      borderRadius: '25px',
      padding: '10px 20px',
      fontSize: 28,
      fontWeight: '300',
      color: '#ffffff'
    }
  },
  {
    id: 'corporate',
    name: 'Corporate Style',
    template: 'corporate',
    fields: ['name', 'title', 'department'],
    animation: 'scale-in',
    duration: 4500,
    style: {
      background: 'rgba(255,255,255,0.95)',
      borderRadius: '4px',
      padding: '14px 22px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontSize: 22,
      color: '#1a1a1a'
    }
  }
];

export const LOWER_THIRD_ANIMATIONS = [
  { id: 'fade-in-out', name: 'Fade In/Out', duration: 500 },
  { id: 'slide-left', name: 'Slide Left', duration: 800 },
  { id: 'slide-right', name: 'Slide Right', duration: 800 },
  { id: 'slide-up', name: 'Slide Up', duration: 600 },
  { id: 'slide-down', name: 'Slide Down', duration: 600 },
  { id: 'scale-in', name: 'Scale In', duration: 400 },
  { id: 'bounce-in', name: 'Bounce In', duration: 700 },
  { id: 'rotate-in', name: 'Rotate In', duration: 500 }
];

export const LOWER_THIRD_POSITIONS = [
  { id: 'bottom-left', name: 'Bottom Left', x: 50, y: 85 },
  { id: 'bottom-center', name: 'Bottom Center', x: 50, y: 85 },
  { id: 'bottom-right', name: 'Bottom Right', x: 85, y: 85 },
  { id: 'top-left', name: 'Top Left', x: 15, y: 15 },
  { id: 'top-center', name: 'Top Center', x: 50, y: 15 },
  { id: 'top-right', name: 'Top Right', x: 85, y: 15 },
  { id: 'center-left', name: 'Center Left', x: 15, y: 50 },
  { id: 'center-right', name: 'Center Right', x: 85, y: 50 }
];

export class LowerThird {
  constructor(options = {}) {
    this.id = options.id || `lt_${Date.now()}`;
    this.presetId = options.presetId || 'name-title';
    this.position = options.position || 'bottom-left';
    this.animation = options.animation || 'fade-in-out';
    this.duration = options.duration || 4000;
    this.startTime = options.startTime || 0;
    this.endTime = options.endTime || (this.startTime + this.duration);
    this.data = options.data || {};
    this.style = options.style || {};
    this.trackId = options.trackId || 'text-1';
  }

  // Get the preset configuration
  getPreset() {
    return LOWER_THIRD_PRESETS.find(p => p.id === this.presetId) || LOWER_THIRD_PRESETS[0];
  }

  // Get position coordinates
  getPosition() {
    return LOWER_THIRD_POSITIONS.find(p => p.id === this.position) || LOWER_THIRD_POSITIONS[0];
  }

  // Get animation configuration
  getAnimation() {
    return LOWER_THIRD_ANIMATIONS.find(a => a.id === this.animation) || LOWER_THIRD_ANIMATIONS[0];
  }

  // Generate timeline clip data
  toTimelineClip() {
    const preset = this.getPreset();
    const position = this.getPosition();

    return {
      id: this.id,
      assetId: this.id,
      type: 'lower-third',
      start: this.startTime,
      end: this.endTime,
      sourceStart: 0,
      sourceEnd: this.duration,
      lane: 0,
      trimIn: 0,
      trimOut: this.duration,
      volume: 1,
      playbackRate: 1,
      effects: [],
      opacity: 1,
      name: `${preset.name} - ${this.data.name || 'Unnamed'}`,
      lowerThirdData: {
        preset: preset,
        position: position,
        animation: this.getAnimation(),
        data: this.data,
        style: { ...preset.style, ...this.style }
      }
    };
  }

  // Create from timeline clip
  static fromTimelineClip(clip) {
    if (clip.type !== 'lower-third' || !clip.lowerThirdData) return null;

    return new LowerThird({
      id: clip.id,
      presetId: clip.lowerThirdData.preset.id,
      position: clip.lowerThirdData.position.id,
      animation: clip.lowerThirdData.animation.id,
      duration: clip.end - clip.start,
      startTime: clip.start,
      endTime: clip.end,
      data: clip.lowerThirdData.data,
      style: clip.lowerThirdData.style
    });
  }
}

// Lower Third Manager
export class LowerThirdManager {
  constructor() {
    this.lowerThirds = [];
  }

  createLowerThird(options) {
    const lt = new LowerThird(options);
    this.lowerThirds.push(lt);
    return lt;
  }

  getLowerThird(id) {
    return this.lowerThirds.find(lt => lt.id === id);
  }

  updateLowerThird(id, updates) {
    const lt = this.getLowerThird(id);
    if (lt) {
      Object.assign(lt, updates);
      lt.endTime = lt.startTime + lt.duration;
    }
    return lt;
  }

  deleteLowerThird(id) {
    const index = this.lowerThirds.findIndex(lt => lt.id === id);
    if (index > -1) {
      this.lowerThirds.splice(index, 1);
      return true;
    }
    return false;
  }

  getAllLowerThirds() {
    return this.lowerThirds;
  }

  getLowerThirdsInRange(startTime, endTime) {
    return this.lowerThirds.filter(lt =>
      (lt.startTime >= startTime && lt.startTime <= endTime) ||
      (lt.endTime >= startTime && lt.endTime <= endTime) ||
      (lt.startTime <= startTime && lt.endTime >= endTime)
    );
  }

  // Export to timeline format
  exportToTimeline() {
    return this.lowerThirds.map(lt => lt.toTimelineClip());
  }

  // Import from timeline format
  importFromTimeline(clips) {
    const lowerThirdClips = clips.filter(c => c.type === 'lower-third');
    this.lowerThirds = lowerThirdClips.map(c => LowerThird.fromTimelineClip(c)).filter(lt => lt !== null);
  }
}

// Global instance
export const lowerThirdManager = new LowerThirdManager();