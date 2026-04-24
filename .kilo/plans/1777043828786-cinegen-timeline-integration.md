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

### CineGen Current Custom APIs (To Be Replaced with MuAPI)
Based on analysis of CineGen codebase, current API providers:

#### **fal.ai** (Primary Provider)
- **Image Models**: FLUX Dev, FLUX 2 Max, Fast SDXL, SD3 Medium, GPT-4o Image
- **Video Models**: Kling 3.0, LTX 2.3, Veo 3.1, Runway Gen-4, Sora 2, MiniMax, Wan 2.6
- **Audio Models**: ElevenLabs Music, Suno Music
- **Utility**: Wizper (transcription), Qwen Image Edit, SAM3 segmentation
- **API Pattern**: Direct REST calls with fal.ai client library

#### **kie.ai** (Secondary Provider)
- **Video Models**: Runway Gen-4, Veo 3.1, Kling 3.0
- **Image Models**: Flux 2 Pro, GPT-4o Image
- **Audio Models**: ElevenLabs Music, Suno Music
- **API Pattern**: Custom kie.ai endpoints with different parameter formats

#### **MuAPI Integration** (All Models Available)
- **Complete Model Coverage**: All CineGen models (50+) available through muapi
- **Unified API**: Single muapi interface replaces fal.ai/kie.ai/RunPod/Ollama
- **Existing Infrastructure**: Uses current Netlify + Supabase setup
- **No Additional Services**: All GPU/cloud hosting handled by muapi

#### **Electron IPC Layer**
All API calls go through Electron IPC handlers:
- `electronAPI.fal.*` - fal.ai operations
- `electronAPI.kie.*` - kie.ai operations  
- `electronAPI.llm.*` - LLM chat operations
- `electronAPI.workflows.*` - Workflow execution

### Integration Requirements
1. **Feature Extraction**: Convert React CineGen features to vanilla JS
2. **MuAPI Migration**: Use existing muapi infrastructure (no new providers needed)
3. **Tooltip System**: Add explanatory tooltips for all new features
4. **Superpowers Integration**: Use systematic methodology for OpenAI LLM integration
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
    'node-workflow': 'Create AI generation pipelines by connecting nodes on a canvas with 50+ models',
    'sam3-masking': 'Segment objects from images/videos with text, click, or box prompts',
    'elements-lib': 'Reusable media libraries for characters, locations, props, and vehicles',
    'llm-chat': 'Context-aware AI assistant for editorial workflow and project questions',
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
  // All CineGen models available through existing muapi - no mapping needed
  static async generateVideo(prompt, model = 'wan-2.1') {
    // Direct access to all muapi-supported models
    return muapi.applyWanAIEffect(prompt, model, {});
  }

  static async generateImage(prompt, model = 'flux-dev') {
    // Direct access to all muapi image models
    return muapi.generateImage(prompt, model, {});
  }

  static async applySAM3Segmentation(imageData, prompts) {
    // SAM3 segmentation available through muapi
    return muapi.applySAM3Segmentation(imageData, prompts);
  }

  static async generateMusic(context, options) {
    // Music generation through muapi
    return muapi.generateMusic({ ...context, ...options });
  }

  // All other CineGen models accessible through muapi
}
```

### Phase 2: Node-Based Workflow Integration

#### 2.1 Create Node Editor Canvas
**File**: `src/lib/editor/nodeEditor.js`
```javascript
export function createNodeEditor(container) {
  // Convert CineGen's React Flow canvas to vanilla JS
  // Support all 50+ CineGen models via muapi mapping
  // Node types: Prompt, Model, Element, Composition Plan, File Picker, Asset Output
}
```

#### 2.2 Model Registry Integration
**File**: `src/lib/editor/modelRegistry.js`
```javascript
export const CINEGEN_MODELS = {
  // All models available through muapi - no provider management needed
  video: [
    { id: 'wan-2.1', name: 'Wan 2.1', category: 'video' },
    { id: 'wan-2.2', name: 'Wan 2.2', category: 'video' },
    { id: 'wan-2.5', name: 'Wan 2.5', category: 'video' },
    { id: 'wan-2.6', name: 'Wan 2.6', category: 'video' },
    { id: 'wan-2.7', name: 'Wan 2.7', category: 'video' },
    { id: 'kling-v3.0', name: 'Kling 3.0', category: 'video' },
    { id: 'kling-v2.6', name: 'Kling 2.6', category: 'video' },
    { id: 'veo3.1', name: 'Veo 3.1', category: 'video' },
    { id: 'runway-gen4', name: 'Runway Gen-4', category: 'video' },
    // ... all video models available through muapi
  ],
  image: [
    { id: 'flux-dev', name: 'FLUX Dev', category: 'image' },
    { id: 'flux-2-max', name: 'FLUX 2 Max', category: 'image' },
    { id: 'sd3-medium', name: 'SD3 Medium', category: 'image' },
    // ... all image models available through muapi
  ],
  // ... complete registry of all 50+ muapi models
};
```

#### 2.3 Workflow Execution Engine
**File**: `src/lib/editor/workflowEngine.js`
```javascript
export class WorkflowEngine {
  async executeWorkflow(nodes, edges) {
    // DAG execution using topological sort (same as CineGen)
    // Use CineGenMuAPI for all AI processing
    // Handle dependencies and parallel execution
    for (const node of sortedNodes) {
      const result = await CineGenMuAPI.processNode(node);
      // ... workflow logic
    }
  }
}
```

### Phase 3: AI Editing Tools Integration

#### 3.1 Fill Gap Tool (CineGen: Fill Gap Modal)
**File**: `src/lib/editor/aiTools/fillGap.js`
```javascript
export function createFillGapTool(timelineState) {
  return {
    canApply: (gapStart, gapEnd) => gapEnd - gapStart > 0,
    apply: async (gapStart, gapEnd) => {
      const context = extractFrameContext(timelineState, gapStart, gapEnd);
      // Use CineGen's Kling 3.0 approach but via muapi
      const result = await CineGenMuAPI.generateVideo(context.prompt, 'wan-2.1');
      return createClipFromResult(result, gapStart);
    }
  };
}
```

#### 3.2 Extend Clip Tool (CineGen: Extend Modal)
**File**: `src/lib/editor/aiTools/extendClip.js`
```javascript
export function createExtendClipTool() {
  return {
    extendBefore: async (clip, seconds) => {
      const context = extractAdjacentFrames(clip, 'before');
      // CineGen uses 9 video models, we use muapi with best available
      return await CineGenMuAPI.generateVideo(context.prompt, 'wan-2.1');
    },
    extendAfter: async (clip, seconds) => {
      const context = extractAdjacentFrames(clip, 'after');  
      return await CineGenMuAPI.generateVideo(context.prompt, 'wan-2.1');
    }
  };
}
```

#### 3.3 Music Generation Tool (CineGen: Music Generation Popup)
**File**: `src/lib/editor/aiTools/musicGen.js`
```javascript
export function createMusicGenerationTool() {
  return {
    generateFromVideo: async (videoClip, options) => {
      const context = extractVideoContext(videoClip);
      // CineGen uses ElevenLabs/Suno, we use muapi music generation
      return await muapi.generateMusic({
        ...context,
        ...options // genre, mood, tempo from CineGen UI
      });
    }
  };
}
```

#### 3.4 SAM3 Masking Tool (CineGen: Source Viewer Mask Tool)
**File**: `src/lib/editor/aiTools/samMasking.js`
```javascript
export function createSAM3MaskingTool() {
  return {
    segmentObject: async (imageData, prompts) => {
      // CineGen uses fal.ai SAM3, we use muapi segmentation
      return await muapi.applySAM3Segmentation(imageData, prompts);
    }
  };
}
```

### Phase 4: Elements Library Integration

#### 4.1 Elements Management System (CineGen: Elements Tab)
**File**: `src/lib/editor/elementsLibrary.js`
```javascript
export class ElementsLibrary {
  constructor() {
    this.categories = ['characters', 'locations', 'props', 'vehicles'];
    this.elements = new Map();
  }
  
  async createElement(category, name, referenceImages) {
    // Generate AI reference panels (CineGen's 7-panel approach)
    const aiPanels = await this.generateReferencePanels(referenceImages);
    return { id: generateId(), category, name, panels: aiPanels };
  }
  
  async generateReferencePanels(baseImages, category) {
    // CineGen generates 7 AI panels per element for consistency
    const angles = getCategoryAngles(category); // front, profile, back, detail, etc.
    return Promise.all(
      angles.map(angle => CineGenMuAPI.generateImage(`${angle} view`, 'flux-dev'))
    );
  }
}
```

### Phase 5: LLM Assistant Integration

#### 5.1 Context-Aware Chat System (CineGen: LLM Tab)
**File**: `src/lib/editor/llmAssistant.js`
```javascript
export class LLMAssistant {
  constructor(timelineState) {
    this.timelineState = timelineState;
    this.modes = ['ask', 'search', 'cut', 'timeline']; // Same as CineGen
  }
  
  async query(question, mode = 'ask') {
    const context = this.buildProjectContext();
    return await this.callSuperpowersLLM(question, context, mode);
  }
  
  buildProjectContext() {
    // CineGen builds comprehensive context from assets, timelines, transcripts
    return {
      assets: this.timelineState.assets,
      timelines: this.timelineState.timelines,
      transcripts: this.timelineState.transcripts,
      // ... full project context like CineGen
    };
  }
}
```

#### 5.2 Superpowers LLM Integration
**File**: `src/lib/editor/superpowersLLM.js`
```javascript
export async function callSuperpowersLLM(query, context, mode) {
  // Use superpowers methodology for systematic LLM interaction
  // CineGen uses fal.ai for cloud LLM, we use superpowers for OpenAI
  
  const systemPrompt = buildSystemPrompt(mode);
  const fullPrompt = `${systemPrompt}\n\nContext: ${JSON.stringify(context)}\n\nQuery: ${query}`;
  
  // Use superpowers:llm-query skill for OpenAI integration
  return await superpowers.queryOpenAI(fullPrompt, {
    model: 'gpt-4o',
    temperature: getTemperatureForMode(mode),
    maxTokens: 4000
  });
}
```

### Phase 6: Advanced Timeline Enhancements

#### 6.1 Multi-Track NLE Features (CineGen: Edit Tab)
**File**: `src/lib/editor/advancedTimeline.js`
```javascript
export function enhanceTimelineWithNLE(timelineState) {
  // Add CineGen's 10 editing tools
  const tools = {
    select: createSelectTool(),
    blade: createBladeTool(), // Cut at cursor
    rippleTrim: createRippleTrimTool(),
    rollTrim: createRollTrimTool(),
    slip: createSlipTool(),
    slide: createSlideTool(),
    music: createMusicTool(),
    fillGap: createFillGapTool(),
    extend: createExtendClipTool(),
    mask: createSAM3MaskingTool(),
  };
  
  // Add dual viewer support (source + timeline)
  const viewers = {
    source: createSourceViewer(),
    timeline: enhanceTimelineViewer()
  };
  
  return { tools, viewers };
}
```

#### 6.2 Timeline Tabs System (CineGen: Timeline Tabs)
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

#### 7.1 Professional Export Presets (CineGen: Export Tab)
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
      // Use FFmpeg integration with presets (same as CineGen)
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
  
  // Add CineGen AI tools with tooltips
  toolbar.addSection('ai-tools', [
    { id: 'fill-gap', label: 'Fill Gap', tooltip: getTooltipText('fill-gap') },
    { id: 'extend-clip', label: 'Extend', tooltip: getTooltipText('extend-clip') },
    { id: 'music-gen', label: 'Music', tooltip: getTooltipText('music-gen') },
    { id: 'sam3-mask', label: 'Mask', tooltip: getTooltipText('sam3-masking') },
    // ... all tools with tooltips
  ]);
  
  // Add Node Workflow button
  toolbar.addButton({
    id: 'node-workflow',
    label: 'AI Workflow',
    tooltip: getTooltipText('node-workflow'),
    action: () => openNodeEditorModal()
  });
  
  // Add Elements Library button  
  toolbar.addButton({
    id: 'elements-lib',
    label: 'Elements',
    tooltip: getTooltipText('elements-lib'),
    action: () => openElementsPanel()
  });
  
  // Add LLM Chat button
  toolbar.addButton({
    id: 'llm-chat',
    label: 'AI Assistant',
    tooltip: getTooltipText('llm-chat'),
    action: () => openLLMChat()
  });
  
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
- [ ] All CineGen features use existing muapi infrastructure
- [ ] Superpowers methodology used for OpenAI LLM integration
- [ ] All 50+ CineGen models available through muapi

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

## Dependencies

### Package Updates
- Existing muapi integration extended for CineGen models
- No new external dependencies needed

### File Changes
- `src/lib/editor/cinegenMuapi.js`: New muapi mapping layer
- `src/lib/editor/tooltipSystem.js`: Comprehensive tooltip system
- `src/lib/editor/nodeEditor.js`: Node-based workflow canvas
- `src/lib/editor/aiTools/`: Fill gap, extend, music, masking tools
- `src/lib/editor/elementsLibrary.js`: Asset management system
- `src/lib/editor/llmAssistant.js`: Context-aware AI chat
- `src/lib/editor/advancedTimeline.js`: NLE enhancements
- `src/lib/editor/exportSystem.js`: Professional presets
- `src/components/TimelineEditorPage.js`: UI integration

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Infrastructure** | 4 hours | Feature modules, tooltips, muapi mapping |
| **Phase 2: Node Workflows** | 6 hours | Canvas editor, model registry, execution engine |
| **Phase 3: AI Tools** | 8 hours | Fill gap, extend, music, SAM3 masking |
| **Phase 4: Elements Library** | 4 hours | Asset management, AI reference generation |
| **Phase 5: LLM Assistant** | 6 hours | Chat system, superpowers integration |
| **Phase 6: Timeline Enhancements** | 6 hours | NLE tools, dual viewers, tabs |
| **Phase 7: Export System** | 3 hours | Professional presets, FFmpeg integration |
| **Phase 8: UI Integration** | 4 hours | Toolbar, modals, panels, tooltips |

**Total Time**: 41 hours

## Risk Mitigation

### MuAPI Compatibility
- **Risk**: Some CineGen features may need slight adaptation for muapi
- **Mitigation**: Test all features, provide fallbacks, use existing muapi patterns

### Performance Impact
- **Risk**: Adding features slows down timeline editor
- **Mitigation**: Lazy load features, optimize rendering, monitor performance

### UI Complexity
- **Risk**: Too many features overwhelm users
- **Mitigation**: Progressive disclosure, clear tooltips, organized toolbar sections

### OpenAI Integration
- **Risk**: Superpowers methodology adds complexity
- **Mitigation**: Follow established patterns, thorough testing, clear documentation</content>
<parameter name="filePath">.kilo/plans/1777043828786-cinegen-features-integration.md