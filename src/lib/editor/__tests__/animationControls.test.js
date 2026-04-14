import { describe, it, expect, vi } from 'vitest';
import {
  interpolate,
  spring,
  blendColors,
  getSpringDuration,
  noise2D,
  noise3D,
  useSequence,
  useSeries,
  AnimationControls
} from '../animationControls.jsx';

// Mock DOM elements for AnimationControls tests
const mockContainer = {
  innerHTML: '',
  querySelector: vi.fn(),
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn()
};

const mockKeyframeSystem = {
  serialize: vi.fn(),
  deserialize: vi.fn(),
  setProperty: vi.fn()
};

const mockTimelineState = {
  playheadPercent: 50,
  timelineSeconds: 10
};

describe('Animation Primitives', () => {
  describe('interpolate', () => {
    it('should interpolate between two values', () => {
      const result = interpolate(5, [0, 10], [0, 100]);
      expect(result).toBe(50);
    });

    it('should handle color interpolation', () => {
      const result = interpolate(0.5, [0, 1], ['#000000', '#ffffff']);
      expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it('should clamp values outside input range', () => {
      const result = interpolate(15, [0, 10], [0, 100]);
      expect(result).toBe(100);
    });

    it('should apply easing functions', () => {
      const linear = interpolate(0.5, [0, 1], [0, 100], 'linear');
      const easeOut = interpolate(0.5, [0, 1], [0, 100], 'ease-out');
      expect(linear).toBe(50);
      expect(easeOut).toBeGreaterThan(50);
    });
  });

  describe('spring', () => {
  it('should return spring animation value', () => {
    const result = spring({ frame: 10, fps: 30, config: { damping: 12 } });
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    // Spring can overshoot, so we don't test upper bound
  });

    it('should reach target value over time', () => {
      const early = spring({ frame: 5, fps: 30 });
      const late = spring({ frame: 50, fps: 30 });
      expect(late).toBeGreaterThan(early);
    });
  });

  describe('blendColors', () => {
    it('should blend two hex colors', () => {
      const result = blendColors(0.5, '#000000', '#ffffff');
      expect(result).toBe('rgb(128, 128, 128)');
    });

    it('should handle edge cases', () => {
      const result = blendColors(0, '#ff0000', '#00ff00');
      expect(result).toBe('rgb(255, 0, 0)');
    });
  });

  describe('getSpringDuration', () => {
    it('should estimate spring duration', () => {
      const duration = getSpringDuration({ damping: 12, stiffness: 100 });
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('noise functions', () => {
    it('should generate 2D noise', () => {
      const result = noise2D(1, 2);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should generate 3D noise', () => {
      const result = noise3D(1, 2, 3);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should be deterministic', () => {
      const result1 = noise2D(1, 2);
      const result2 = noise2D(1, 2);
      expect(result1).toBe(result2);
    });
  });

  describe('sequence utilities', () => {
    it('should create sequence object', () => {
      const seq = useSequence(10, 30);
      expect(seq).toEqual({
        from: 10,
        durationInFrames: 30,
        to: 40
      });
    });

    it('should chain sequences in series', () => {
      const sequences = [
        { durationInFrames: 10 },
        { durationInFrames: 20 },
        { durationInFrames: 15 }
      ];
      const result = useSeries(sequences);
      expect(result[0].from).toBe(0);
      expect(result[0].to).toBe(10);
      expect(result[1].from).toBe(10);
      expect(result[1].to).toBe(30);
      expect(result[2].from).toBe(30);
      expect(result[2].to).toBe(45);
    });
  });

  describe('AnimationControls', () => {
    let controls;

    beforeEach(() => {
      // Reset mocks
      mockContainer.querySelector.mockReturnValue({
        addEventListener: vi.fn(),
        checked: false,
        value: '1',
        textContent: '',
        style: {}
      });
      mockContainer.innerHTML = '';

      controls = new AnimationControls(mockContainer, mockKeyframeSystem, mockTimelineState);
    });

    it('should initialize correctly', () => {
      expect(controls.container).toBe(mockContainer);
      expect(controls.keyframeSystem).toBe(mockKeyframeSystem);
      expect(controls.timelineState).toBe(mockTimelineState);
    });

    it('should apply spring animation', () => {
      const result = controls.applySpringAnimation('opacity', { damping: 12 });
      expect(typeof result).toBe('number');
      expect(mockKeyframeSystem.setProperty).toHaveBeenCalledWith('opacity', result);
    });

    it('should apply noise animation', () => {
      const result = controls.applyNoiseAnimation('rotation', 0.1, 45);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(-45);
      expect(result).toBeLessThanOrEqual(45);
      expect(mockKeyframeSystem.setProperty).toHaveBeenCalledWith('rotation', result);
    });

    it('should export animation data', () => {
      const data = controls.exportAnimation();
      expect(data).toHaveProperty('keyframes');
      expect(data).toHaveProperty('settings');
      expect(data.settings).toHaveProperty('loop');
      expect(data.settings).toHaveProperty('reverse');
      expect(data.settings).toHaveProperty('speed');
    });

    it('should import animation data', () => {
      const data = {
        keyframes: 'mock-data',
        settings: {
          loop: true,
          reverse: true,
          speed: 2.0
        }
      };

      controls.importAnimation(data);

      expect(mockKeyframeSystem.deserialize).toHaveBeenCalledWith('mock-data');
      expect(controls.loop).toBe(true);
      expect(controls.reverse).toBe(true);
      expect(controls.speed).toBe(2.0);
    });
  });
});