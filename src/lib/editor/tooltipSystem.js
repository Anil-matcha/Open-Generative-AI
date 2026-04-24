export function createTooltipSystem() {
  const tooltips = {
    'fill-gap': 'AI generates new footage to bridge gaps between clips using adjacent frame context',
    'extend-clip': 'Lengthen clips by generating additional footage before/after using 9 video models',
    'music-gen': 'Generate music from video context with genre, mood, and tempo presets',
    'node-workflow': 'Create AI generation pipelines by connecting nodes on a canvas with 50+ models',
    'sam3-masking': 'Segment objects from images/videos with text, click, or box prompts',
    'elements-lib': 'Reusable media libraries for characters, locations, props, and vehicles',
    'llm-chat': 'Context-aware AI assistant for editorial workflow and project questions',
  };

  const state = {
    tooltipElement: null
  };

  function showTooltip(featureId, position) {
    const text = tooltips[featureId] || '';
    if (!text) return;

    // Create tooltip element
    state.tooltipElement = document.createElement('div');
    state.tooltipElement.className = 'cinegen-tooltip';
    state.tooltipElement.textContent = text;
    state.tooltipElement.style.position = 'absolute';
    state.tooltipElement.style.left = `${position.x}px`;
    state.tooltipElement.style.top = `${position.y}px`;
    state.tooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    state.tooltipElement.style.color = 'white';
    state.tooltipElement.style.padding = '8px 12px';
    state.tooltipElement.style.borderRadius = '4px';
    state.tooltipElement.style.fontSize = '12px';
    state.tooltipElement.style.maxWidth = '300px';
    state.tooltipElement.style.zIndex = '9999';

    document.body.appendChild(state.tooltipElement);
  }

  function hideTooltip() {
    if (state.tooltipElement) {
      state.tooltipElement.remove();
      state.tooltipElement = null;
    }
  }

  function getTooltipText(featureId) {
    return tooltips[featureId] || '';
  }

  return {
    showTooltip,
    hideTooltip,
    getTooltipText,
    // Expose state for testing
    getState: () => state
  };
}