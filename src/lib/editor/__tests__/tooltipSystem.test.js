import { describe, it, expect, vi } from 'vitest';
import { createTooltipSystem } from '../tooltipSystem.js';

describe('Tooltip System', () => {
  it('should create a tooltip system with show/hide methods', () => {
    const tooltipSystem = createTooltipSystem();

    expect(tooltipSystem).toHaveProperty('showTooltip');
    expect(tooltipSystem).toHaveProperty('hideTooltip');
    expect(tooltipSystem).toHaveProperty('getTooltipText');
    expect(typeof tooltipSystem.showTooltip).toBe('function');
    expect(typeof tooltipSystem.hideTooltip).toBe('function');
    expect(typeof tooltipSystem.getTooltipText).toBe('function');
  });

  it('should return correct tooltip text for known features', () => {
    const tooltipSystem = createTooltipSystem();

    expect(tooltipSystem.getTooltipText('fill-gap')).toContain('AI generates new footage');
    expect(tooltipSystem.getTooltipText('extend-clip')).toContain('Lengthen clips by generating');
    expect(tooltipSystem.getTooltipText('music-gen')).toContain('Generate music from video context');
    expect(tooltipSystem.getTooltipText('node-workflow')).toContain('Create AI generation pipelines');
    expect(tooltipSystem.getTooltipText('sam3-masking')).toContain('Segment objects from images');
    expect(tooltipSystem.getTooltipText('elements-lib')).toContain('Reusable media libraries');
    expect(tooltipSystem.getTooltipText('llm-chat')).toContain('Context-aware AI assistant');
  });

  it('should return empty string for unknown features', () => {
    const tooltipSystem = createTooltipSystem();

    expect(tooltipSystem.getTooltipText('unknown-feature')).toBe('');
  });

  it('should show tooltip with text content', () => {
    const tooltipSystem = createTooltipSystem();
    const mockElement = { style: {} };

    // Mock DOM element for testing
    global.document = {
      createElement: () => mockElement,
      body: { appendChild: () => {} }
    };

    tooltipSystem.showTooltip('fill-gap', { x: 100, y: 200 });

    expect(mockElement.textContent).toContain('AI generates new footage');
    expect(mockElement.style.position).toBe('absolute');
  });

  it('should hide tooltip by removing element', () => {
    const tooltipSystem = createTooltipSystem();
    const mockElement = { remove: vi.fn() };

    // Set the tooltip element in state for testing
    tooltipSystem.getState().tooltipElement = mockElement;

    tooltipSystem.hideTooltip();

    expect(mockElement.remove).toHaveBeenCalled();
    expect(tooltipSystem.getState().tooltipElement).toBeNull();
  });
});