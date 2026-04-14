# Director App Integration Plan

## Current State
The Director app is located in `src/components/DirectorPage.js` and handles video directing and storyboarding functionality.

## Integration Targets

### 1. CutAI Features
**Source**: https://github.com/Swapnil-bo/CutAI
**Key Features to Integrate**:
- AI script generation from genre and premise
- Shot-by-shot breakdown analysis
- Camera angle suggestions (wide, close-up, tracking, etc.)
- Mood scoring (tension, emotion, energy, darkness)
- Soundtrack vibes generation
- Visual timeline with React Flow
- Recharts mood arc visualization

**Integration Points**:
- Add script generation UI to DirectorPage.js
- Integrate shot breakdown analysis
- Add mood analysis and visualization
- Implement visual timeline with React Flow

### 2. CineGen Features
**Source**: https://github.com/christopherjohnogden/CineGen
**Key Features to Integrate**:
- Elements library (characters, locations, props, vehicles)
- Spaces workflow editor with storyboarder node
- Storyboard generation from scenes
- AI-powered scene analysis

**Integration Points**:
- Add elements management to director workflow
- Integrate storyboarder node functionality
- Add character/location reference system
- Implement scene breakdown tools

### 3. timeline-studio Features
**Source**: https://github.com/chatman-media/timeline-studio
**Key Features to Integrate**:
- AI-powered project creation and planning
- Timeline analysis and suggestions
- Scene planning and pacing tools

**Integration Points**:
- Add AI project planning features
- Integrate timeline analysis tools
- Add pacing and scene planning UI

### 4. chatvideo-yucut Features
**Source**: https://github.com/laozuzhen/chatvideo-yucut
**Key Features to Integrate**:
- AI Agent system for directing workflow
- Multi-stage planning (plan→execute→verify→fix)
- Context-aware AI assistant
- MCP protocol for external AI tool integration

**Integration Points**:
- Add AI agent runtime to director workflow
- Implement multi-stage directing process
- Add context-aware AI chat
- Integrate MCP bridge for external tools

### 5. Cap Features
**Source**: https://github.com/CapSoftware/Cap
**Key Features to Integrate**:
- Screen recording capabilities
- Video messaging tools
- Professional storyboard layouts

**Integration Points**:
- Add screen recording for reference
- Implement video messaging in director workflow
- Add professional storyboard templates

## Implementation Plan

### Phase 1: Script & Story Development (Week 1-2)
1. Add AI script generation from prompts
2. Implement script parsing and scene extraction
3. Add character and location elements library
4. Create basic storyboard canvas

### Phase 2: Shot Planning & Analysis (Week 3-4)
1. Add shot-by-shot breakdown analysis
2. Implement camera angle suggestions
3. Add mood scoring and visualization
4. Create visual timeline with React Flow

### Phase 3: AI Agent Integration (Week 5-6)
1. Integrate AI agent system for directing
2. Add multi-stage workflow (plan→execute→verify→fix)
3. Implement context-aware AI chat
4. Add MCP protocol support

### Phase 4: Advanced Features (Week 7-8)
1. Add soundtrack vibes generation
2. Implement scene detection and analysis
3. Add professional storyboard templates
4. Integrate screen recording for reference

## Testing Strategy (TDD Approach)

### Unit Tests
- Script parsing and scene extraction
- Mood analysis algorithms
- Camera angle suggestion logic
- AI agent workflow states

### Integration Tests
- Complete script-to-storyboard workflow
- AI agent interactions
- Mood visualization accuracy
- MCP protocol communication

### E2E Tests
- Full directing workflow from script to timeline
- AI-assisted scene planning
- Storyboard export and sharing
- Multi-user collaboration features

## Dependencies & Compatibility

### New Dependencies to Add
- `@reactflow/core` - Visual timeline
- `recharts` - Mood arc visualization
- `@anthropic-ai/sdk` - AI script generation
- `react-beautiful-dnd` - Drag-and-drop storyboards

### Vite Configuration Updates
- Add React Flow dependencies
- Configure AI SDK integration
- Add MCP server proxy configuration

## Success Metrics

### Functional Metrics
- Script generation works for all major genres
- Mood analysis accurate within 20%
- Camera suggestions relevant for scenes
- AI agent responses helpful in 90% of cases

### Performance Metrics
- Storyboard generation completes in <30 seconds
- Visual timeline renders smoothly at 60fps
- AI responses within 3 seconds
- Memory usage stable during long sessions

### User Experience Metrics
- Intuitive script-to-storyboard workflow
- Clear mood visualizations
- Helpful AI suggestions
- Seamless integration with timeline editor</content>
<parameter name="filePath">DIRECTOR_INTEGRATION_PLAN.md