// Simple test version of keyframeSystem.js
export class KeyframeSystem {
  constructor() {
    this.keyframes = new Map();
  }

  createKeyframe(clipId, time, property, value) {
    return { clipId, time, property, value };
  }
}

// Animation properties
export const ANIMATION_PROPERTIES = {
  x: { type: 'number', unit: 'px', default: 0 },
  y: { type: 'number', unit: 'px', default: 0 },
  scale: { type: 'number', unit: '%', default: 100 },
  rotation: { type: 'number', unit: '°', default: 0 },
  opacity: { type: 'number', unit: '%', default: 100 }
};