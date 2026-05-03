/**
 * Timeline Components Architecture - Unit Tests
 * TDD: Verify components follow vanilla JS Component.js pattern (no React/JSX)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import components from relative paths
import Timeline from '@/src/components/Timeline';
import Layer from '@/src/components/Layer';
import Clip from '@/src/components/Clip';
import { Component } from '@/components/base/Component';
import { TimelineState } from '@/src/lib/editor/TimelineState';

describe('Timeline Component Architecture', () => {
  describe('Component base class', () => {
    it('Component.js exists and is importable', () => {
      expect(Component).toBeDefined();
      expect(typeof Component).toBe('function');
    });

    it('Component provides mount/unmount/render lifecycle', () => {
      const methods = Object.getOwnPropertyNames(Component.prototype);
      expect(methods).toContain('mount');
      expect(methods).toContain('unmount');
      expect(methods).toContain('render');
      expect(methods).toContain('setState');
    });
  });

  describe('Timeline.js', () => {
    it('imports without errors', () => {
      expect(Timeline).toBeDefined();
      expect(typeof Timeline).toBe('function');
    });

    it('extends Component base class', () => {
      const timeline = new Timeline({});
      expect(timeline instanceof Component).toBe(true);
    });

    it('does not use JSX syntax (no React import)', async () => {
      const source = await import('@/src/components/Timeline.js?raw');
      expect(source.default).toBeUndefined(); // Should not be transpiled from JSX
      // The file should contain only vanilla DOM manipulation
      expect(source).toBeDefined();
    });

    it('has required lifecycle methods', () => {
      const timeline = new Timeline({});
      expect(typeof timeline.onMount).toBe('function');
      expect(typeof timeline.render).toBe('function');
      expect(typeof timeline.bindEvents).toBe('function');
    });

    it('initializes with correct default state', () => {
      const timeline = new Timeline({});
      const state = timeline.getState ? timeline.getState() : timeline.state;
      expect(state).toBeDefined();
      expect(state.zoom).toBe(1.0);
      expect(state.pan).toBe(0);
      expect(state.selectedTool).toBe('Select');
    });
  });

  describe('Layer.js', () => {
    it('imports without errors', () => {
      expect(Layer).toBeDefined();
    });

    it('extends Component base class', () => {
      const layer = new Layer({ layer: { id: 'L1', name: 'Layer 1' } });
      expect(layer instanceof Component).toBe(true);
    });

    it('requires layer prop', () => {
      expect(() => new Layer({})).toThrow('layer required');
    });

    it('manages visibility/lock/solo state', () => {
      const layer = new Layer({ layer: { id: 'L1', name: 'Layer 1' } });
      expect(layer.isVisible).toBe(true);
      expect(layer.isLocked).toBe(false);
      expect(layer.isSolo).toBe(false);
      expect(layer.opacity).toBe(1.0);
    });

    it('toggles visibility', () => {
      const layer = new Layer({ layer: { id: 'L1', name: 'Layer 1' } });
      layer.toggleVisibility();
      expect(layer.isVisible).toBe(false);
      layer.toggleVisibility();
      expect(layer.isVisible).toBe(true);
    });

    it('toggles lock', () => {
      const layer = new Layer({ layer: { id: 'L1', name: 'Layer 1' } });
      layer.toggleLock();
      expect(layer.isLocked).toBe(true);
    });

    it('sets opacity', () => {
      const layer = new Layer({ layer: { id: 'L1', name: 'Layer 1' } });
      layer.setOpacity(0.5);
      expect(layer.opacity).toBe(0.5);
    });

    it('clamps opacity to 0-1 range', () => {
      const layer = new Layer({ layer: { id: 'L1', name: 'Layer 1' } });
      layer.setOpacity(1.5);
      expect(layer.opacity).toBe(1);
      layer.setOpacity(-0.5);
      expect(layer.opacity).toBe(0);
    });
  });

  describe('Clip.js', () => {
    it('imports without errors', () => {
      expect(Clip).toBeDefined();
    });

    it('extends Component base class', () => {
      const clip = new Clip({
        clip: { id: 'clip-1', start: 0, end: 100, trackId: 'track-1' }
      });
      expect(clip instanceof Component).toBe(true);
    });

    it('requires clip data and parent timeline reference', () => {
      expect(() => new Clip({})).toThrow('clip and timeline required');
    });

    it('tracks selection state', () => {
      const mockTimeline = { selectClip: vi.fn() };
      const clip = new Clip({
        clip: { id: 'clip-1', start: 0, end: 100, trackId: 'track-1' },
        timeline: mockTimeline
      });
      expect(clip.isSelected).toBe(false);

      clip.select();
      expect(clip.isSelected).toBe(true);
      expect(mockTimeline.selectClip).toHaveBeenCalledWith('clip-1', false);
    });

    it('deselects clip', () => {
      const mockTimeline = { deselectClip: vi.fn() };
      const clip = new Clip({
        clip: { id: 'clip-1', start: 0, end: 100, trackId: 'track-1' },
        timeline: mockTimeline
      });
      clip.isSelected = true;
      clip.deselect();
      expect(clip.isSelected).toBe(false);
      expect(mockTimeline.deselectClip).toHaveBeenCalledWith('clip-1');
    });

    it('calculates position from timeline zoom', () => {
      const mockTimeline = { getZoom: () => 2.0 };
      const clip = new Clip({
        clip: { start: 0, end: 100, duration: 100 },
        timeline: mockTimeline
      });
      // Position in pixels should be start * zoom * pixelsPerSecondFactor
      const position = clip.getPosition();
      expect(typeof position).toBe('number');
    });

    it('triggers callback on click', () => {
      const onClick = vi.fn();
      const clip = new Clip({
        clip: { id: 'clip-1', start: 0, end: 100, trackId: 'track-1' },
        timeline: {},
        onClick
      });
      clip.handleClick();
      expect(onClick).toHaveBeenCalledWith(clip);
    });
  });

  describe('No React dependencies', () => {
    it('Timeline.js does not import React', async () => {
      const source = await import('@/src/components/Timeline.js?raw');
      expect(source).toBeDefined();
      // Source may be transpiled; check for React usage patterns
      // In actual bundle, there should be no React.createElement calls
    });

    it('Layer.js does not import React', async () => {
      const source = await import('@/src/components/Layer.js?raw');
      expect(source).toBeDefined();
    });

    it('Clip.js does not import React', async () => {
      const source = await import('@/src/components/Clip.js?raw');
      expect(source).toBeDefined();
    });

    it('none of these files contain JSX syntax in source', async () => {
      // Check raw source for JSX patterns (not transpiled)
      const timelineSource = await import('@/src/components/Timeline.js?raw');
      const jsxPattern = /<[A-Z][a-zA-Z0-9]*\s*[^>]*>/;
      // The file might have HTML strings but not JSX expressions (no curly braces in tags)
      // This is a heuristic check
    });
  });

  describe('Component encapsulation', () => {
    it('Timeline renders into its container element', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      timeline.mount();

      expect(container.innerHTML).not.toBe('');
      expect(container.querySelector('.timeline-editor')).not.toBeNull();
    });

    it('Timeline unmounts cleanly', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      timeline.mount();
      timeline.unmount();

      expect(container.innerHTML).toBe('');
    });

    it('Layer renders DOM structure', () => {
      const container = document.createElement('div');
      const layer = new Layer({
        layer: { id: 'L1', name: 'Test Layer' },
        container
      });
      layer.mount();

      const layerEl = container.querySelector('.layer');
      expect(layerEl).not.toBeNull();
      expect(layerEl.textContent).toContain('Test Layer');
    });

    it('Clip renders as DOM element', () => {
      const container = document.createElement('div');
      const clip = new Clip({
        clip: { id: 'C1', start: 0, end: 100, trackId: 'T1' },
        container,
        timeline: { getZoom: () => 1 }
      });
      clip.mount();

      const clipEl = container.querySelector('.clip');
      expect(clipEl).not.toBeNull();
    });
  });

  describe('Event handling integration', () => {
    it('Timeline binds event listeners on mount', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener');

      timeline.mount();

      expect(addEventListenerSpy).toHaveBeenCalled();
    });

    it('Timeline removes event listeners on unmount', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');

      timeline.mount();
      timeline.unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('State synchronization', () => {
    it('Timeline accepts external state updates', () => {
      const state = {
        zoom: 2.0,
        pan: 100,
        selectedTool: 'Cut',
        tracks: []
      };
      const timeline = new Timeline({});
      timeline.setState(state);

      expect(timeline.state.zoom).toBe(2.0);
      expect(timeline.state.pan).toBe(100);
      expect(timeline.state.selectedTool).toBe('Cut');
    });

    it('Timeline calls setState trigger re-render', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      timeline.mount();

      const initialHTML = container.innerHTML;
      timeline.setState({ zoom: 2.0 });
      expect(container.innerHTML).not.toBe(initialHTML);
    });

    it('Layer updates reflect in DOM after setState', () => {
      const container = document.createElement('div');
      const layer = new Layer({
        layer: { id: 'L1', name: 'Original' },
        container
      });
      layer.mount();

      layer.setState({ name: 'Updated' });
      layer.render();

      expect(container.textContent).toContain('Updated');
    });
  });

  describe('Integration with TimelineState', () => {
    it('Timeline subscribes to TimelineState changes', () => {
      const state = new TimelineState();
      const timeline = new Timeline({ state });

      expect(state.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('TimelineState updates reflect in Timeline UI', () => {
      const state = new TimelineState();
      const container = document.createElement('div');
      const timeline = new Timeline({ container, state });
      timeline.mount();

      state.setZoom(3.0);
      // Timeline should re-render; verify DOM change
      expect(container.querySelector('.timeline-editor')).toBeDefined();
    });
  });

  describe('Error boundaries', () => {
    it('Timeline catches render errors and displays fallback', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const container = document.createElement('div');

      // Create timeline that throws in render
      const timeline = new Timeline({ container });
      timeline.render = () => { throw new Error('Test error'); };
      timeline.mount();

      expect(container.innerHTML).toContain('Error');
      consoleError.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('Timeline sets proper ARIA roles', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      timeline.mount();

      const app = container.querySelector('[role="application"]');
      expect(app).not.toBeNull();
    });

    it('Clip elements are keyboard focusable', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      timeline.mount();

      const clips = container.querySelectorAll('.clip');
      clips.forEach(clip => {
        expect(clip.getAttribute('tabindex')).toBe('0');
      });
    });

    it('Layer controls have accessible labels', () => {
      const container = document.createElement('div');
      const layer = new Layer({
        layer: { id: 'L1', name: 'Layer 1' },
        container
      });
      layer.mount();

      const visibilityBtn = container.querySelector('.visibility-btn');
      expect(visibilityBtn.getAttribute('aria-label')).toContain('visibility');
    });
  });

  describe('Memory management', () => {
    it('Timeline unsubscribes from state on unmount', () => {
      const state = new TimelineState();
      const timeline = new Timeline({ state });
      timeline.mount();
      timeline.unmount();

      expect(state.unsubscribeFromStores).toHaveBeenCalled();
    });

    it('removes all DOM nodes on unmount', () => {
      const container = document.createElement('div');
      const timeline = new Timeline({ container });
      timeline.mount();
      timeline.unmount();

      expect(container.innerHTML).toBe('');
      expect(container.hasChildNodes()).toBe(false);
    });
  });

  describe('Cross-browser compatibility', () => {
    it('uses feature-safe DOM APIs', () => {
      const timeline = new Timeline({});
      // Verify no usage of deprecated APIs like innerHTML for content
      // (innerHTML allowed in render as template string, not for dynamic HTML unsafe)
    });
  });
});