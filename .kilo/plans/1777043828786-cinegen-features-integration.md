# Integrate CineGen Features into Timeline Editor

## Overview
Extract and integrate advanced CineGen features directly into the existing TimelineEditorPage.js, using muapi for AI operations and superpowers methodology for OpenAI API integration. Add comprehensive tooltips explaining feature functionality.

## Current State Analysis

### Existing Timeline Editor
**Location**: `src/components/TimelineEditorPage.js`
- Vanilla JS implementation with ~3147 lines
- Basic timeline functionality with drag/drop, playback controls
- Enhanced with some features from remix-new-editor
- Uses existing design system and muapi integration

### CineGen Advanced Features to Extract
**Source**: `modules/CineGen/` (React-based, ~50+ AI models, node workflows)
- **Node-based Workflows**: 50+ AI models for image/video/audio generation
- **AI Editing Tools**: Fill gaps, extend clips, music generation, SAM3 masking
- **Elements Library**: Reusable assets (characters, locations, props)
- **LLM Chat Assistant**: Context-aware AI for editorial workflow
- **Advanced Timeline**: Multi-track NLE with dual viewers, 10 editing tools
- **Export System**: Professional rendering with presets

### Integration Requirements
1. **Feature Extraction**: Convert React CineGen features to vanilla JS
2. **API Migration**: Replace CineGen's custom APIs with muapi
3. **Tooltip System**: Add explanatory tooltips for all new features
4. **Superpowers Integration**: Use systematic methodology for OpenAI API
5. **UI Consistency**: Match existing timeline editor design patterns

## Implementation Plan

### Phase 1: Core Infrastructure Setup

#### 1.1 Extract CineGen Feature Modules
Convert React components to vanilla JS equivalents:

```javascript
// New files in src/lib/editor/cinegen-features/
// - nodeWorkflow.js - Node-based AI generation workflows  
// - aiEditingTools.js - Fill gaps, extend, music gen, masking
// - elementsLibrary.js - Reusable asset management
// - llmAssistant.js - Context-aware AI chat integration
// - advancedTimeline.js - Multi-track NLE enhancements
// - exportSystem.js - Professional rendering presets
```

#### 1.2 Setup Tooltip System
**File**: `src/lib/editor/tooltipSystem.js`
```javascript
export function createTooltipSystem() {
  // Comprehensive tooltip explanations for all features
  const tooltips = {
    'fill-gap': 'AI generates new footage to bridge gaps between clips using adjacent frame context',
    'extend-clip': 'Lengthen clips by generating additional footage before/after using 9 video models',
    'music-gen': 'Generate music from video context with genre, mood, and tempo presets',
    // ... comprehensive tooltip library
  };
  
  return { showTooltip, hideTooltip, getTooltipText };
}
```

#### 1.3 Initialize MuAPI Integration
**File**: `src/lib/editor/cinegenMuapi.js`
```javascript
import { muapi } from '../muapi.js';

export class CineGenMuAPI {
  // Map CineGen models to muapi endpoints
  static async generateVideo(prompt, model = 'wan-2.1') {
    return muapi.applyWanAIEffect(prompt, model, {});
  }
  
  // ... complete mapping of 50+ CineGen models to muapi
}
```

### Phase 2: Node-Based Workflow Integration

#### 2.1 Create Node Editor Canvas
**File**: `src/lib/editor/nodeEditor.js`
```javascript
export function createNodeEditor(container) {
  // Convert CineGen's React Flow canvas to vanilla JS
  // Support 50+ AI models via muapi
  // Node types: Prompt, Model, Element, Composition Plan, etc.
}
```

#### 2.2 Model Registry Integration
**File**: `src/lib/editor/modelRegistry.js`
```javascript
export const CINEGEN_MODELS = {
  // Map to muapi supported models
  video: ['wan-2.1', 'kling-3.0', 'runway-gen4', 'veo-3.1'],
  image: ['flux-dev', 'sd3-medium', 'gpt4o-image'],
  audio: ['elevenlabs-music', 'suno-music'],
  // ... complete registry
};
```

#### 2.3 Workflow Execution Engine
**File**: `src/lib/editor/workflowEngine.js`
```javascript
export class WorkflowEngine {
  async executeWorkflow(nodes, edges) {
    // DAG execution using topological sort
    // Integrate with muapi for AI processing
    // Handle dependencies and parallel execution
  }
}
```

### Phase 3: AI Editing Tools Integration

#### 3.1 Fill Gap Tool
**File**: `src/lib/editor/aiTools/fillGap.js`
```javascript
export function createFillGapTool(timelineState) {
  return {
    canApply: (gapStart, gapEnd) => gapEnd - gapStart > 0,
    apply: async (gapStart, gapEnd) => {
      const context = extractFrameContext(timelineState, gapStart, gapEnd);
      const result = await CineGenMuAPI.generateVideo(context.prompt, 'wan-2.1');
      return createClipFromResult(result, gapStart);
    }
  };
}
```

#### 3.2 Extend Clip Tool
**File**: `src/lib/editor/aiTools/extendClip.js`
```javascript
export function createExtendClipTool() {
  return {
    extendBefore: async (clip, seconds) => {
      const context = extractAdjacentFrames(clip, 'before');
      return await CineGenMuAPI.generateVideo(context.prompt, 'kling-3.0');
    },
    extendAfter: async (clip, seconds) => {
      const context = extractAdjacentFrames(clip, 'after');  
      return await CineGenMuAPI.generateVideo(context.prompt, 'veo-3.1');
    }
  };
}
```

#### 3.3 Music Generation Tool
**File**: `src/lib/editor/aiTools/musicGen.js`
```javascript
export function createMusicGenerationTool() {
  return {
    generateFromVideo: async (videoClip, options) => {
      const context = extractVideoContext(videoClip);
      return await muapi.generateMusic({
        ...context,
        ...options // genre, mood, tempo
      });
    }
  };
}
```

#### 3.4 SAM3 Masking Tool
**File**: `src/lib/editor/aiTools/samMasking.js`
```javascript
export function createSAM3MaskingTool() {
  return {
    segmentObject: async (imageData, prompts) => {
      // Use muapi segmentation endpoint
      return await muapi.applySAM3Segmentation(imageData, prompts);
    }
  };
}
```

### Phase 4: Elements Library Integration

#### 4.1 Elements Management System
**File**: `src/lib/editor/elementsLibrary.js`
```javascript
export class ElementsLibrary {
  constructor() {
    this.categories = ['characters', 'locations', 'props', 'vehicles'];
    this.elements = new Map();
  }
  
  async createElement(category, name, referenceImages) {
    // Generate AI reference panels for consistency
    const aiPanels = await this.generateReferencePanels(referenceImages);
    return { id: generateId(), category, name, panels: aiPanels };
  }
}
```

#### 4.2 Reference Panel Generation
**File**: `src/lib/editor/elementsAI.js`
```javascript
export function generateReferencePanels(baseImages, category) {
  // Generate 7 AI reference panels per category
  const angles = getCategoryAngles(category); // front, profile, back, etc.
  return Promise.all(
    angles.map(angle => CineGenMuAPI.generateImage(`${angle} view`, 'flux-dev'))
  );
}
```

### Phase 5: LLM Assistant Integration

#### 5.1 Context-Aware Chat System
**File**: `src/lib/editor/llmAssistant.js`
```javascript
export class LLMAssistant {
  constructor(timelineState) {
    this.timelineState = timelineState;
    this.modes = ['ask', 'search', 'cut', 'timeline'];
  }
  
  async query(question, mode = 'ask') {
    const context = this.buildProjectContext();
    return await this.callSuperpowersLLM(question, context, mode);
  }
  
  buildProjectContext() {
    // Extract assets, timelines, transcripts for LLM context
    return {
      assets: this.timelineState.assets,
      timelines: this.timelineState.timelines,
      // ... comprehensive project context
    };
  }
}
```

#### 5.2 Superpowers LLM Integration
**File**: `src/lib/editor/superpowersLLM.js`
```javascript
export async function callSuperpowersLLM(query, context, mode) {
  // Use superpowers methodology for systematic LLM interaction
  // Implement proper prompting, context management, and response processing
  
  const systemPrompt = buildSystemPrompt(mode);
  const fullPrompt = `${systemPrompt}\n\nContext: ${JSON.stringify(context)}\n\nQuery: ${query}`;
  
  // Use superpowers:llm-query skill for OpenAI integration
  return await superpowers.queryOpenAI(fullPrompt, {
    model: 'gpt-4o',
    temperature: getTemperatureForMode(mode)
  });
}
```

### Phase 6: Advanced Timeline Enhancements

#### 6.1 Multi-Track NLE Features
**File**: `src/lib/editor/advancedTimeline.js`
```javascript
export function enhanceTimelineWithNLE(timelineState) {
  // Add CineGen's 10 editing tools
  const tools = {
    select: createSelectTool(),
    blade: createBladeTool(),
    rippleTrim: createRippleTrimTool(),
    // ... all 10 tools
  };
  
  // Add dual viewer support
  const viewers = {
    source: createSourceViewer(),
    timeline: enhanceTimelineViewer()
  };
  
  return { tools, viewers };
}
```

#### 6.2 Timeline Tabs System
**File**: `src/lib/editor/timelineTabs.js`
```javascript
export function createTimelineTabsSystem() {
  return {
    createTab: (timeline) => ({ id: generateId(), timeline, name: timeline.name }),
    switchTab: (tabId) => { /* switch active timeline */ },
    closeTab: (tabId) => { /* remove timeline tab */ }
  };
}
```

### Phase 7: Export System Integration

#### 7.1 Professional Export Presets
**File**: `src/lib/editor/exportSystem.js`
```javascript
export const EXPORT_PRESETS = {
  draft: { resolution: '720p', fps: 24 },
  standard: { resolution: '1080p', fps: 30 },
  high: { resolution: '4K', fps: 60 }
};

export function createExportSystem(timelineState) {
  return {
    render: async (preset, options) => {
      // Use FFmpeg integration with presets
      return await renderTimeline(timelineState, preset, options);
    }
  };
}
```

### Phase 8: UI Integration and Tooltips

#### 8.1 Feature Toolbar Integration
**File**: `src/components/TimelineEditorPage.js` (modify)
```javascript
// Add CineGen features to existing toolbar
function createEnhancedToolbar(state) {
  const toolbar = createTimelineToolbar(state);
  
  // Add CineGen AI tools
  toolbar.addSection('ai-tools', [
    { id: 'fill-gap', label: 'Fill Gap', tooltip: getTooltipText('fill-gap') },
    { id: 'extend-clip', label: 'Extend', tooltip: getTooltipText('extend-clip') },
    { id: 'music-gen', label: 'Music', tooltip: getTooltipText('music-gen') },
    // ... all tools with tooltips
  ]);
  
  return toolbar;
}
```

#### 8.2 Node Editor Modal
**File**: `src/lib/editor/modals/nodeEditorModal.js`
```javascript
export function createNodeEditorModal() {
  return {
    open: () => showModal(createNodeEditor(container)),
    close: () => hideModal(),
    getCanvas: () => nodeEditorCanvas
  };
}
```

#### 8.3 Elements Library Panel
**File**: `src/lib/editor/panels/elementsPanel.js`
```javascript
export function createElementsPanel() {
  return {
    render: (container) => {
      // Display elements by category with tooltips
      renderElementCategories(container, {
        onSelect: (element) => insertElementIntoTimeline(element),
        tooltipProvider: getTooltipText
      });
    }
  };
}
```

## Success Criteria

### Feature Integration ✅
- [ ] Node-based workflows accessible from timeline toolbar
- [ ] AI editing tools (fill gap, extend, music, masking) integrated
- [ ] Elements library panel available in timeline UI
- [ ] LLM assistant accessible via chat interface
- [ ] Advanced timeline features (10 editing tools, dual viewers)
- [ ] Professional export presets

### API Integration ✅
- [ ] All AI operations use muapi instead of CineGen APIs
- [ ] Superpowers methodology used for OpenAI LLM integration
- [ ] Proper error handling and fallbacks

### User Experience ✅
- [ ] Comprehensive tooltips explain every feature
- [ ] UI matches existing timeline editor design
- [ ] Features feel native to the timeline workflow
- [ ] Performance meets existing standards

### Testing & Quality ✅
- [ ] All new features have unit tests
- [ ] Integration tests verify timeline + CineGen features work together
- [ ] Tooltips display correctly for all features
- [ ] No breaking changes to existing functionality

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Infrastructure** | 4 hours | Feature modules, tooltips, muapi setup |
| **Phase 2: Node Workflows** | 6 hours | Canvas editor, model registry, execution engine |
| **Phase 3: AI Tools** | 8 hours | Fill gap, extend, music, SAM3 masking |
| **Phase 4: Elements Library** | 4 hours | Asset management, AI reference generation |
| **Phase 5: LLM Assistant** | 6 hours | Chat system, superpowers integration |
| **Phase 6: Timeline Enhancements** | 6 hours | NLE tools, dual viewers, tabs |
| **Phase 7: Export System** | 3 hours | Professional presets, FFmpeg integration |
| **Phase 8: UI Integration** | 4 hours | Toolbar, modals, panels, tooltips |

**Total Time**: 41 hours

## Risk Mitigation

### API Compatibility
- **Risk**: Muapi doesn't support all CineGen models
- **Mitigation**: Map available models, provide fallbacks, document limitations

### Performance Impact
- **Risk**: Adding features slows down timeline editor
- **Mitigation**: Lazy load features, optimize rendering, monitor performance

### UI Complexity
- **Risk**: Too many features overwhelm users
- **Mitigation**: Progressive disclosure, clear tooltips, organized toolbar sections

### OpenAI Integration
- **Risk**: Superpowers methodology adds complexity
- **Mitigation**: Follow established patterns, thorough testing, clear documentation</content>
<parameter name="filePath">.kilo/plans/1777043828786-cinegen-timeline-integration.md