import { describe, it, expect } from 'vitest';
import { formatTime, pixelsToTime, timeToPixels, clamp, debounce } from '../timeline/timeline-utils.js';

describe('Timeline Utils', () => {
  describe('Time Formatting', () => {
    it('should format time correctly', () => {
      expect(formatTime(0)).toBe('00:00.00');
      expect(formatTime(59)).toBe('00:59.00');
      expect(formatTime(60)).toBe('01:00.00');
      expect(formatTime(61.5)).toBe('01:01.50');
      expect(formatTime(3661.75)).toBe('61:01.75');
    });
  });

  describe('Time/Pixel Conversion', () => {
    const timelineWidth = 1000;
    const duration = 60; // seconds

    it('should convert pixels to time correctly', () => {
      expect(pixelsToTime(0, timelineWidth, duration)).toBe(0);
      expect(pixelsToTime(500, timelineWidth, duration)).toBe(30);
      expect(pixelsToTime(1000, timelineWidth, duration)).toBe(60);
    });

    it('should convert time to pixels correctly', () => {
      expect(timeToPixels(0, timelineWidth, duration)).toBe(0);
      expect(timeToPixels(30, timelineWidth, duration)).toBe(500);
      expect(timeToPixels(60, timelineWidth, duration)).toBe(1000);
    });

    it('should handle edge cases', () => {
      expect(timeToPixels(-5, timelineWidth, duration)).toBe(-83.33333333333333);
      expect(pixelsToTime(-100, timelineWidth, duration)).toBe(-6);
    });
  });

  describe('Math Utilities', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('Debounce Function', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(callCount).toBe(0); // Should not have called yet

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(callCount).toBe(1); // Should have called once after delay
    });
  });
});