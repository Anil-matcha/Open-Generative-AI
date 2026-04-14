/**
 * Keyframe Animation System
 * Professional keyframe animation system for timeline clips
 */

export class KeyframeSystem {
  constructor() {
    this.keyframes = new Map(); // clipId -> keyframes
    this.animations = new Map(); // clipId -> animation state
    this.easingFunctions = {
      linear: t => t,
      'ease-in': t => t * t,
      'ease-out': t => 1 - Math.pow(1 - t, 2),
      'ease-in-out': t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
      bezier: (t, p1x, p1y, p2x, p2y) => this.bezierCurve(t, p1x, p1y, p2x, p2y)
    };
  }

  // Keyframe data structure
  createKeyframe(clipId, time, property, value, easing = 'linear', interpolation = 'smooth') {
    if (!this.keyframes.has(clipId)) {
      this.keyframes.set(clipId, new Map());
    }

    const clipKeyframes = this.keyframes.get(clipId);
    if (!clipKeyframes.has(property)) {
      clipKeyframes.set(property, []);
    }

    const propertyKeyframes = clipKeyframes.get(property);

    // Insert keyframe at correct time position
    const insertIndex = propertyKeyframes.findIndex(kf => kf.time > time);
    const keyframe = {
      id: `${clipId}-${property}-${Date.now()}`,
      time,
      value,
      easing,
      interpolation,
      bezierPoints: easing === 'bezier' ? [0.25, 0.1, 0.25, 1] : null
    };

    if (insertIndex === -1) {
      propertyKeyframes.push(keyframe);
    } else {
      propertyKeyframes.splice(insertIndex, 0, keyframe);
    }

    return keyframe;
  }

  removeKeyframe(clipId, property, keyframeId) {
    const clipKeyframes = this.keyframes.get(clipId);
    if (!clipKeyframes || !clipKeyframes.has(property)) return false;

    const propertyKeyframes = clipKeyframes.get(property);
    const index = propertyKeyframes.findIndex(kf => kf.id === keyframeId);
    if (index === -1) return false;

    propertyKeyframes.splice(index, 1);

    // Remove property if no keyframes left
    if (propertyKeyframes.length === 0) {
      clipKeyframes.delete(property);
    }

    return true;
  }

  getKeyframes(clipId, property) {
    const clipKeyframes = this.keyframes.get(clipId);
    if (!clipKeyframes) return [];

    return clipKeyframes.get(property) || [];
  }

  getAllKeyframes(clipId) {
    const clipKeyframes = this.keyframes.get(clipId);
    if (!clipKeyframes) return new Map();

    return clipKeyframes;
  }

  // Animation evaluation
  evaluateAtTime(clipId, property, time) {
    const keyframes = this.getKeyframes(clipId, property);
    if (keyframes.length === 0) return null;
    if (keyframes.length === 1) return keyframes[0].value;

    // Find keyframes before and after current time
    const beforeIndex = keyframes.findLastIndex(kf => kf.time <= time);
    const afterIndex = keyframes.findIndex(kf => kf.time > time);

    if (beforeIndex === -1) return keyframes[0].value;
    if (afterIndex === -1) return keyframes[keyframes.length - 1].value;

    const before = keyframes[beforeIndex];
    const after = keyframes[afterIndex];

    const duration = after.time - before.time;
    const t = duration > 0 ? (time - before.time) / duration : 0;

    // Apply easing
    const easedT = this.applyEasing(before.easing, t, before.bezierPoints);

    // Interpolate between values
    return this.interpolate(before.value, after.value, easedT, before.interpolation);
  }

  applyEasing(easing, t, bezierPoints) {
    if (easing === 'bezier' && bezierPoints) {
      return this.bezierCurve(t, ...bezierPoints);
    }
    return this.easingFunctions[easing] ? this.easingFunctions[easing](t) : t;
  }

  bezierCurve(t, p1x, p1y, p2x, p2y) {
    // Cubic Bezier curve implementation
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;

    // Solve for x = t
    let x = t;
    for (let i = 0; i < 10; i++) {
      const x1 = ax * x * x * x + bx * x * x + cx * x;
      const x1Prime = 3 * ax * x * x + 2 * bx * x + cx;
      x -= (x1 - t) / x1Prime;
    }

    return ay * x * x * x + by * x * x + cy * x;
  }

  interpolate(value1, value2, t, interpolation) {
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      switch (interpolation) {
        case 'step':
          return t < 1 ? value1 : value2;
        case 'hold':
          return value1;
        default:
          return value1 + (value2 - value1) * t;
      }
    }

    if (Array.isArray(value1) && Array.isArray(value2)) {
      return value1.map((v, i) => this.interpolate(v, value2[i], t, interpolation));
    }

    // Handle curve interpolation for color grading
    if (value1 && value2 && typeof value1 === 'object' && value1.points && value2.points) {
      return this.interpolateCurve(value1, value2, t);
    }

    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const result = {};
      for (const key in value1) {
        if (value2.hasOwnProperty(key)) {
          result[key] = this.interpolate(value1[key], value2[key], t, interpolation);
        } else {
          result[key] = value1[key];
        }
      }
      return result;
    }

    // Handle string interpolation (for LUT paths)
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return t < 0.5 ? value1 : value2;
    }

    // Default to step interpolation for non-numeric types
    return t < 1 ? value1 : value2;
  }

  interpolateCurve(curve1, curve2, t) {
    // Interpolate between two curves by interpolating their control points
    const points1 = curve1.points || [];
    const points2 = curve2.points || [];
    const maxPoints = Math.max(points1.length, points2.length);

    const interpolatedPoints = [];

    for (let i = 0; i < maxPoints; i++) {
      const p1 = points1[i] || {x: (i / (maxPoints - 1)) * 255, y: (i / (maxPoints - 1)) * 255};
      const p2 = points2[i] || {x: (i / (maxPoints - 1)) * 255, y: (i / (maxPoints - 1)) * 255};

      interpolatedPoints.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t
      });
    }

    return { points: interpolatedPoints };
  }

  // Animation state management
  startAnimation(clipId, duration, loop = false, reverse = false) {
    this.animations.set(clipId, {
      startTime: Date.now(),
      duration,
      loop,
      reverse,
      paused: false,
      completed: false
    });
  }

  pauseAnimation(clipId) {
    const animation = this.animations.get(clipId);
    if (animation) {
      animation.paused = true;
    }
  }

  resumeAnimation(clipId) {
    const animation = this.animations.get(clipId);
    if (animation) {
      animation.paused = false;
      animation.startTime = Date.now() - (animation.elapsed || 0);
    }
  }

  stopAnimation(clipId) {
    this.animations.delete(clipId);
  }

  getAnimationProgress(clipId, currentTime) {
    const animation = this.animations.get(clipId);
    if (!animation) return 0;

    if (animation.paused) return animation.elapsed / animation.duration;

    const elapsed = currentTime - animation.startTime;
    const progress = elapsed / animation.duration;

    if (animation.loop && progress >= 1) {
      animation.startTime = currentTime;
      return animation.reverse ? 1 - (progress % 1) : progress % 1;
    }

    return Math.min(Math.max(progress, 0), 1);
  }

  // Keyframe copying and manipulation
  copyKeyframes(clipId, properties = null) {
    const clipKeyframes = this.keyframes.get(clipId);
    if (!clipKeyframes) return {};

    const result = {};

    if (properties) {
      properties.forEach(prop => {
        if (clipKeyframes.has(prop)) {
          result[prop] = JSON.parse(JSON.stringify(clipKeyframes.get(prop)));
        }
      });
    } else {
      for (const [prop, keyframes] of clipKeyframes) {
        result[prop] = JSON.parse(JSON.stringify(keyframes));
      }
    }

    return result;
  }

  pasteKeyframes(clipId, keyframesData, offset = 0) {
    for (const [property, keyframes] of Object.entries(keyframesData)) {
      keyframes.forEach(kf => {
        this.createKeyframe(clipId, kf.time + offset, property, kf.value, kf.easing, kf.interpolation);
      });
    }
  }

  // Bulk operations
  selectKeyframes(clipId, timeRange, properties = null) {
    const clipKeyframes = this.keyframes.get(clipId);
    if (!clipKeyframes) return [];

    const selected = [];

    const checkProperty = properties ? (prop) => properties.includes(prop) : () => true;

    for (const [property, keyframes] of clipKeyframes) {
      if (!checkProperty(property)) continue;

      keyframes.forEach(kf => {
        if (kf.time >= timeRange.start && kf.time <= timeRange.end) {
          selected.push({ property, keyframe: kf });
        }
      });
    }

    return selected;
  }

  deleteSelectedKeyframes(clipId, selectedKeyframes) {
    selectedKeyframes.forEach(({ property, keyframe }) => {
      this.removeKeyframe(clipId, property, keyframe.id);
    });
  }

  moveSelectedKeyframes(clipId, selectedKeyframes, timeOffset) {
    selectedKeyframes.forEach(({ property, keyframe }) => {
      keyframe.time = Math.max(0, keyframe.time + timeOffset);
    });
  }

  // Serialization
  serialize() {
    const data = {};
    for (const [clipId, clipKeyframes] of this.keyframes) {
      data[clipId] = {};
      for (const [property, keyframes] of clipKeyframes) {
        data[clipId][property] = keyframes.map(kf => ({
          id: kf.id,
          time: kf.time,
          value: kf.value,
          easing: kf.easing,
          interpolation: kf.interpolation,
          bezierPoints: kf.bezierPoints
        }));
      }
    }
    return data;
  }

  deserialize(data) {
    this.keyframes.clear();
    for (const [clipId, clipData] of Object.entries(data)) {
      for (const [property, keyframes] of Object.entries(clipData)) {
        keyframes.forEach(kf => {
          this.createKeyframe(clipId, kf.time, property, kf.value, kf.easing, kf.interpolation);
          const clipKeyframes = this.keyframes.get(clipId);
          const propertyKeyframes = clipKeyframes.get(property);
          const keyframe = propertyKeyframes.find(k => k.time === kf.time);
          if (keyframe && kf.bezierPoints) {
            keyframe.bezierPoints = kf.bezierPoints;
          }
        });
      }
    }
  }
}

// Animation properties configuration
export const ANIMATION_PROPERTIES = {
  // Position
  x: { type: 'number', unit: 'px', min: -1000, max: 1000, default: 0 },
  y: { type: 'number', unit: 'px', min: -1000, max: 1000, default: 0 },

  // Scale
  scale: { type: 'number', unit: '%', min: 0, max: 500, default: 100 },
  scaleX: { type: 'number', unit: '%', min: 0, max: 500, default: 100 },
  scaleY: { type: 'number', unit: '%', min: 0, max: 500, default: 100 },

  // Rotation
  rotation: { type: 'number', unit: '°', min: -360, max: 360, default: 0 },
  anchorX: { type: 'number', unit: '%', min: 0, max: 100, default: 50 },
  anchorY: { type: 'number', unit: '%', min: 0, max: 100, default: 50 },

  // Opacity
  opacity: { type: 'number', unit: '%', min: 0, max: 100, default: 100 },

  // Color effects - Basic Adjustments
  brightness: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  contrast: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  saturation: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  hue: { type: 'number', unit: '°', min: -180, max: 180, default: 0 },

  // White Balance
  temperature: { type: 'number', unit: 'K', min: 2000, max: 12000, default: 6500 },
  tint: { type: 'number', unit: '', min: -50, max: 50, default: 0 },

  // Exposure and Tone
  exposure: { type: 'number', unit: 'EV', min: -4, max: 4, default: 0 },
  gamma: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },
  highlights: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  shadows: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  midtones: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },

  // RGB Channel Adjustments
  redGain: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  greenGain: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  blueGain: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  redGamma: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },
  greenGamma: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },
  blueGamma: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },

  // Color Grading - RGB Curves
  rgbCurve: { type: 'curve', unit: '', default: { points: [{x:0,y:0}, {x:255,y:255}] } },
  redCurve: { type: 'curve', unit: '', default: { points: [{x:0,y:0}, {x:255,y:255}] } },
  greenCurve: { type: 'curve', unit: '', default: { points: [{x:0,y:0}, {x:255,y:255}] } },
  blueCurve: { type: 'curve', unit: '', default: { points: [{x:0,y:0}, {x:255,y:255}] } },

  // Levels Adjustment
  inputBlack: { type: 'number', unit: '', min: 0, max: 255, default: 0 },
  inputWhite: { type: 'number', unit: '', min: 0, max: 255, default: 255 },
  gammaLevels: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },
  outputBlack: { type: 'number', unit: '', min: 0, max: 255, default: 0 },
  outputWhite: { type: 'number', unit: '', min: 0, max: 255, default: 255 },

  // Color Wheels (Lift, Gamma, Gain)
  liftRed: { type: 'number', unit: '', min: -1, max: 1, default: 0 },
  liftGreen: { type: 'number', unit: '', min: -1, max: 1, default: 0 },
  liftBlue: { type: 'number', unit: '', min: -1, max: 1, default: 0 },
  gammaRed: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },
  gammaGreen: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },
  gammaBlue: { type: 'number', unit: '', min: 0.1, max: 4, default: 1 },
  gainRed: { type: 'number', unit: '', min: 0, max: 2, default: 1 },
  gainGreen: { type: 'number', unit: '', min: 0, max: 2, default: 1 },
  gainBlue: { type: 'number', unit: '', min: 0, max: 2, default: 1 },

  // Secondary Color Correction
  secondaryHue: { type: 'number', unit: '°', min: 0, max: 360, default: 0 },
  secondaryRange: { type: 'number', unit: '°', min: 0, max: 180, default: 30 },
  secondarySaturation: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },
  secondaryBrightness: { type: 'number', unit: '%', min: 0, max: 200, default: 100 },

  // LUT Application
  lutStrength: { type: 'number', unit: '%', min: 0, max: 100, default: 100 },
  lutPath: { type: 'string', unit: '', default: '' },

  // Crop/Mask
  cropTop: { type: 'number', unit: '%', min: 0, max: 100, default: 0 },
  cropBottom: { type: 'number', unit: '%', min: 0, max: 100, default: 0 },
  cropLeft: { type: 'number', unit: '%', min: 0, max: 100, default: 0 },
  cropRight: { type: 'number', unit: '%', min: 0, max: 100, default: 0 },

  // Motion blur
  blur: { type: 'number', unit: 'px', min: 0, max: 50, default: 0 },

  // Speed ramping
  playbackRate: { type: 'number', unit: 'x', min: 0.1, max: 4, default: 1 }
};

// Easing presets
export const EASING_PRESETS = {
  linear: { name: 'Linear', points: null },
  'ease-in': { name: 'Ease In', points: null },
  'ease-out': { name: 'Ease Out', points: null },
  'ease-in-out': { name: 'Ease In Out', points: null },
  bezier: { name: 'Custom Bezier', points: [0.25, 0.1, 0.25, 1] }
};

// Interpolation modes
export const INTERPOLATION_MODES = {
  smooth: 'Smooth',
  step: 'Step',
  hold: 'Hold'
};

// Motion blur simulation
export class MotionBlur {
  constructor() {
    this.samples = 8;
    this.shutterAngle = 180; // degrees
  }

  calculateBlur(transform1, transform2, timeDelta) {
    const velocity = {
      x: (transform2.x - transform1.x) / timeDelta,
      y: (transform2.y - transform1.y) / timeDelta,
      rotation: (transform2.rotation - transform1.rotation) / timeDelta,
      scale: (transform2.scale - transform1.scale) / timeDelta
    };

    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const blurAmount = Math.min(speed * 0.01, 20); // Max blur of 20px

    return {
      amount: blurAmount,
      angle: Math.atan2(velocity.y, velocity.x) * 180 / Math.PI,
      samples: this.samples
    };
  }

  applyBlur(context, blurData) {
    if (blurData.amount <= 0) return;

    context.save();
    context.filter = `blur(${blurData.amount}px)`;
    // Additional motion blur implementation would go here
    context.restore();
  }
}

// Speed ramping
export class SpeedRamping {
  constructor() {
    this.keyframes = [];
  }

  addSpeedKeyframe(time, speed) {
    this.keyframes.push({ time, speed });
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  getSpeedAtTime(time) {
    if (this.keyframes.length === 0) return 1;
    if (this.keyframes.length === 1) return this.keyframes[0].speed;

    const before = this.keyframes.findLast(kf => kf.time <= time);
    const after = this.keyframes.find(kf => kf.time > time);

    if (!before) return this.keyframes[0].speed;
    if (!after) return this.keyframes[this.keyframes.length - 1].speed;

    const t = (time - before.time) / (after.time - before.time);
    return before.speed + (after.speed - before.speed) * t;
  }

  calculateTimeMap(duration) {
    const timeMap = [];
    let accumulatedTime = 0;

    for (let i = 0; i <= duration; i += 0.1) {
      const speed = this.getSpeedAtTime(i);
      accumulatedTime += 0.1 * speed;
      timeMap.push({ sourceTime: i, mappedTime: accumulatedTime });
    }

    return timeMap;
  }
}

// Parent-child relationships for layer parenting
export class LayerParenting {
  constructor() {
    this.parentChildMap = new Map(); // childId -> parentId
    this.childParentMap = new Map(); // parentId -> [childIds]
  }

  setParent(childId, parentId) {
    // Remove existing parent relationship
    this.removeParent(childId);

    this.parentChildMap.set(childId, parentId);

    if (!this.childParentMap.has(parentId)) {
      this.childParentMap.set(parentId, []);
    }
    this.childParentMap.get(parentId).push(childId);
  }

  removeParent(childId) {
    const parentId = this.parentChildMap.get(childId);
    if (parentId) {
      const children = this.childParentMap.get(parentId);
      if (children) {
        const index = children.indexOf(childId);
        if (index > -1) {
          children.splice(index, 1);
          if (children.length === 0) {
            this.childParentMap.delete(parentId);
          }
        }
      }
      this.parentChildMap.delete(childId);
    }
  }

  getParent(childId) {
    return this.parentChildMap.get(childId);
  }

  getChildren(parentId) {
    return this.childParentMap.get(parentId) || [];
  }

  getTransformChain(clipId, clipTransforms) {
    const chain = [];
    let currentId = clipId;

    while (currentId) {
      const transform = clipTransforms[currentId];
      if (transform) {
        chain.unshift(transform);
      }
      currentId = this.getParent(currentId);
    }

    return chain;
  }

  combineTransforms(transformChain) {
    return transformChain.reduce((combined, transform) => ({
      x: combined.x + transform.x,
      y: combined.y + transform.y,
      scale: combined.scale * transform.scale,
      rotation: combined.rotation + transform.rotation,
      opacity: combined.opacity * transform.opacity
    }), { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
  }
}</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/src/lib/editor/keyframeSystem.js