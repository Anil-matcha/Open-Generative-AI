import { describe, it, expect } from 'vitest';
import { createTooltipSystem } from '../tooltipSystem.js';
import { CineGenMuAPI } from '../cinegenMuapi.js';
import { createNodeWorkflow } from '../cinegen-features/nodeWorkflow.js';
import { createAIEditingTools } from '../cinegen-features/aiEditingTools.js';
import { ElementsLibrary } from '../cinegen-features/elementsLibrary.js';
import { LLMAssistant } from '../cinegen-features/llmAssistant.js';
import { enhanceTimelineWithNLE } from '../cinegen-features/advancedTimeline.js';
import { createExportSystem, EXPORT_PRESETS } from '../cinegen-features/exportSystem.js';

describe('CineGen Integration - Phase 1', () => {
  it('should create all core infrastructure components', () => {
    // Tooltip system
    const tooltipSystem = createTooltipSystem();
    expect(tooltipSystem).toHaveProperty('showTooltip');
    expect(tooltipSystem).toHaveProperty('hideTooltip');
    expect(tooltipSystem).toHaveProperty('getTooltipText');

    // CineGenMuAPI
    expect(CineGenMuAPI).toHaveProperty('generateVideo');
    expect(CineGenMuAPI).toHaveProperty('generateImage');
    expect(CineGenMuAPI).toHaveProperty('applySAM3Segmentation');
    expect(CineGenMuAPI).toHaveProperty('generateMusic');

    // Feature modules
    const nodeWorkflow = createNodeWorkflow();
    expect(nodeWorkflow).toHaveProperty('init');

    const aiTools = createAIEditingTools();
    expect(aiTools).toHaveProperty('fillGap');

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
    const cinegenFeatures = [
      'fill-gap', 'extend-clip', 'music-gen', 'node-workflow',
      'sam3-masking', 'elements-lib', 'llm-chat'
    ];

    cinegenFeatures.forEach(feature => {
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
      CineGenMuAPI.generateVideo('test', 'wan-2.1');
      createNodeWorkflow();
      createAIEditingTools();
      new ElementsLibrary();
      new LLMAssistant();
      enhanceTimelineWithNLE();
      createExportSystem();
    }).not.toThrow();
  });
});