import { describe, it, expect } from 'vitest';
import { createTooltipSystem } from '../tooltipSystem.js';
import { AiMuAPI } from '../aiMuapi.js';
import { createNodeEditor } from '../ai-features/nodeWorkflow.js';
import { AIEditingTools } from '../ai-features/aiEditingTools.js';
import { ElementsLibrary } from '../ai-features/elementsLibrary.js';
import { LLMAssistant } from '../ai-features/llmAssistant.js';
import { enhanceTimelineWithNLE } from '../ai-features/advancedTimeline.js';
import { createExportSystem, EXPORT_PRESETS } from '../ai-features/exportSystem.js';

describe('AI Integration - Phase 1', () => {
  it('should create all core infrastructure components', () => {
    // Tooltip system
    const tooltipSystem = createTooltipSystem();
    expect(tooltipSystem).toHaveProperty('showTooltip');
    expect(tooltipSystem).toHaveProperty('hideTooltip');
    expect(tooltipSystem).toHaveProperty('getTooltipText');

    // AiMuAPI
    expect(AiMuAPI).toHaveProperty('generateVideo');
    expect(AiMuAPI).toHaveProperty('generateImage');
    expect(AiMuAPI).toHaveProperty('applySAM3Segmentation');
    expect(AiMuAPI).toHaveProperty('generateMusic');

    // Feature modules
    const nodeEditor = createNodeEditor();
    expect(nodeEditor).toHaveProperty('init');

    const aiTools = new AIEditingTools();
    expect(aiTools).toHaveProperty('selectTool');

    const elementsLib = new ElementsLibrary();
    expect(elementsLib).toHaveProperty('elements');

    const llmAssistant = new LLMAssistant();
    expect(llmAssistant).toHaveProperty('modes');

    const advancedTimeline = enhanceTimelineWithNLE();
    expect(advancedTimeline).toHaveProperty('tools');

    const exportSystem = createExportSystem();
    expect(exportSystem).toHaveProperty('render');
  });

  it('should provide comprehensive tooltip coverage', () => {
    const tooltipSystem = createTooltipSystem();
    const aiFeatures = [
      'fill-gap', 'extend-clip', 'music-gen', 'node-workflow',
      'sam3-masking', 'elements-lib', 'llm-chat'
    ];

    aiFeatures.forEach(feature => {
      const tooltip = tooltipSystem.getTooltipText(feature);
      expect(tooltip).not.toBe('');
      expect(tooltip.length).toBeGreaterThan(10);
    });
  });

  it('should define export presets', () => {
    expect(EXPORT_PRESETS).toHaveProperty('draft');
    expect(EXPORT_PRESETS).toHaveProperty('standard');
    expect(EXPORT_PRESETS).toHaveProperty('high');

    expect(EXPORT_PRESETS.draft.resolution).toBe('720p');
    expect(EXPORT_PRESETS.high.resolution).toBe('4K');
  });

  it('should initialize all feature modules without errors', () => {
    expect(() => {
      createTooltipSystem();
      AiMuAPI.generateVideo('test', 'wan2.1-text-to-video');
      createNodeEditor();
      new AIEditingTools();
      new ElementsLibrary();
      new LLMAssistant();
      enhanceTimelineWithNLE();
      createExportSystem();
    }).not.toThrow();
  });
});