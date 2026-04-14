# Timeline Editor Enhancement Plan

## Overview

This document outlines the missing functionality and implementation steps for enhancing the timeline editor's drag/drop, tooltips, tool operations, and timeline interactions. The current implementation provides a solid foundation, but several key features are missing or incomplete to match professional NLE (Non-Linear Editor) functionality.

## 1. DRAG/DROP ENHANCEMENTS

### 1.1 Multi-Clip Drag Feedback
**Status:** Partial - Basic grouped move exists
**Missing:**
- Visual feedback during multi-clip drag showing affected clips
- Drag preview showing clip arrangement changes
- Collision detection and resolution during drag
- Group selection bounding box during drag

**Implementation Steps:**
1. Add `multiClipDragPreview` state to show bounding box around selected clips
2. Implement collision detection in `handleDocPointerMove` for grouped clips
3. Add visual indicators for clips that will be affected by move
4. Show preview of new arrangement during drag

### 1.2 Keyframe Drag Support
**Status:** Not implemented
**Missing:**
- Drag keyframe points on timeline to adjust timing
- Visual feedback for keyframe interpolation curves
- Snap keyframes to other keyframes or clip edges

**Implementation Steps:**
1. Add keyframe drag handlers in `TrackRow` component
2. Implement keyframe timeline visualization overlay
3. Add snap logic for keyframes in `snapMoveTime` function
4. Update `moveKeyframe` operations with drag preview

### 1.3 Transition Drag Support
**Status:** Partial - Transition UI exists
**Missing:**
- Drag transition boundaries to adjust duration
- Visual preview of transition effects during drag
- Snap transitions to clip edges

**Implementation Steps:**
1. Add transition handle drag in transition overlay components
2. Implement transition duration adjustment with real-time preview
3. Add transition snap logic in move handlers
4. Update transition state during drag operations

### 1.4 Track Reordering Drag
**Status:** Not implemented
**Missing:**
- Drag track headers to reorder track stacking
- Visual feedback for track drop zones
- Automatic track pairing maintenance (video/audio pairs)

**Implementation Steps:**
1. Add track header drag handlers
2. Implement track drop zone indicators
3. Update track ordering in timeline state
4. Maintain linked track relationships during reorder

## 2. TOOLTIP ENHANCEMENTS

### 2.1 Clip Hover Tooltips
**Status:** Basic context menus exist
**Missing:**
- Hover tooltips showing clip metadata (duration, source time, effects)
- Thumbnail preview on hover
- Keyboard shortcut hints
- Property summaries (speed, volume, opacity)

**Implementation Steps:**
1. Add hover event handlers to `ClipCard` component
2. Create `ClipTooltip` component with metadata display
3. Implement tooltip positioning logic (avoid viewport edges)
4. Add thumbnail generation/loading for tooltip previews

### 2.2 Keyframe Tooltips
**Status:** Not implemented
**Missing:**
- Hover tooltips showing keyframe values
- Interpolation curve information
- Time and value display
- Easing function details

**Implementation Steps:**
1. Add keyframe hover detection in keyframe overlay
2. Create `KeyframeTooltip` component
3. Display interpolated values and timing information
4. Show easing curve visualization in tooltip

### 2.3 Timeline Marker Tooltips
**Status:** Basic title attribute
**Missing:**
- Rich tooltips with marker notes
- Color coding in tooltip
- Navigation options (jump to marker)
- Edit marker properties from tooltip

**Implementation Steps:**
1. Extend marker hover handlers
2. Create `MarkerTooltip` component with rich content
3. Add quick actions (rename, delete, jump)
4. Implement tooltip positioning and auto-hide

### 2.4 Tool Operation Tooltips
**Status:** Minimal tool indicators
**Missing:**
- Dynamic tooltips showing current tool mode
- Keyboard shortcut reminders
- Tool-specific help text
- Visual cursor changes with tool explanations

**Implementation Steps:**
1. Add tool state tracking for tooltip content
2. Create `ToolTooltip` component
3. Update tooltips based on active tool and modifiers
4. Add keyboard shortcut overlay

## 3. TOOL OPERATIONS ENHANCEMENTS

### 3.1 Advanced Edit Tools
**Status:** Partial - Previews exist for some
**Missing:**
- **Ripple Edit Tool**: Insert/delete time affecting subsequent clips
- **Roll Edit Tool**: Adjust transition timing between adjacent clips
- **Slide Edit Tool**: Move clip content within fixed duration
- **Slip Edit Tool**: Adjust clip content timing without moving boundaries

**Implementation Steps:**
1. Add tool modes to `ToolType` enum
2. Implement tool activation in toolbar
3. Add preview logic in `useTimelineDrag` hook
4. Create commit functions for each tool operation

### 3.2 Precision Editing Tools
**Status:** Basic trim exists
**Missing:**
- **Nudge Tools**: Frame-by-frame movement with arrow keys
- **Slip Tools**: Content adjustment within fixed boundaries
- **Extend Tools**: Grow/shrink clips from edges
- **Split Tools**: Divide clips at specific points

**Implementation Steps:**
1. Add keyboard shortcut handlers for nudge operations
2. Implement slip tool with content offset tracking
3. Add extend handles with direction-specific behavior
4. Create split tool with snap-to-grid options

### 3.3 Selection Tools
**Status:** Basic marquee exists
**Missing:**
- **Range Selection**: Select all clips in time range
- **Track-based Selection**: Select entire tracks
- **Linked Selection**: Auto-select linked clips
- **Smart Selection**: AI-assisted clip grouping

**Implementation Steps:**
1. Add selection mode variants to marquee tool
2. Implement range selection with time boundaries
3. Add track header click selection
4. Create linked clip selection logic

### 3.4 Transform Tools
**Status:** Not implemented
**Missing:**
- **Speed Ramp Tool**: Gradual speed changes
- **Volume Automation**: Audio level adjustments
- **Color Correction Tools**: Basic grade adjustments
- **Crop/Pan Tools**: Frame composition changes

**Implementation Steps:**
1. Add transform panel integration
2. Implement speed ramp keyframe creation
3. Add volume automation curves
4. Create basic correction tool UI

## 4. TIMELINE INTERACTIONS ENHANCEMENTS

### 4.1 Advanced Navigation
**Status:** Basic scrubbing exists
**Missing:**
- **J/K/L Playback**: Standard NLE playback controls
- **Spacebar Toggle**: Play/pause with spacebar
- **Modifier Scrubbing**: Frame-by-frame with modifier keys
- **Loop Regions**: Define and loop playback segments

**Implementation Steps:**
1. Add keyboard event handlers for J/K/L navigation
2. Implement frame-accurate scrubbing with modifiers
3. Add loop region definition UI
4. Create playback state management for loops

### 4.2 Zoom and Navigation
**Status:** Basic zoom exists
**Missing:**
- **Fit to Content**: Auto-zoom to show all clips
- **Zoom to Selection**: Focus on selected clips
- **Bird's Eye View**: Mini-map navigation
- **Smooth Zoom Animation**: Animated zoom transitions

**Implementation Steps:**
1. Add zoom calculation functions for fit operations
2. Implement selection bounds calculation
3. Create mini-map component overlay
4. Add smooth zoom transitions with easing

### 4.3 Snapping and Guides
**Status:** Basic edge snapping exists
**Missing:**
- **Guide Lines**: User-defined snap points
- **Grid Snapping**: Time grid alignment
- **Magnetic Edges**: Stronger snap to important boundaries
- **Snap Indicators**: Visual feedback for snap targets

**Implementation Steps:**
1. Add guide line storage and rendering
2. Implement grid overlay with customizable intervals
3. Enhance snap strength based on context
4. Add visual snap target highlighting

### 4.4 Time Display and Modes
**Status:** Basic timecode exists
**Missing:**
- **Multiple Time Formats**: SMPTE, frames, seconds
- **Time Reference**: Display relative to markers/playhead
- **Duration Display**: Show clip durations on hover
- **Time Selection**: Click and drag to select time ranges

**Implementation Steps:**
1. Add time format preferences
2. Implement relative time calculations
3. Add duration overlays on clips
4. Create time range selection tool

## 5. IMPLEMENTATION PRIORITY

### Phase 1: Core Interaction Improvements (Week 1-2)
1. Multi-clip drag feedback and collision detection
2. Clip hover tooltips with metadata
3. J/K/L keyboard navigation
4. Enhanced snapping with visual indicators

### Phase 2: Advanced Tools (Week 3-4)
1. Ripple, roll, slide, slip edit tools
2. Keyframe drag support
3. Precision editing tools (nudge, slip, extend)
4. Range and smart selection tools

### Phase 3: Navigation and UX (Week 5-6)
1. Fit-to-content zoom and mini-map
2. Guide lines and advanced snapping
3. Multiple time formats and displays
4. Loop regions and advanced playback

### Phase 4: Polish and Integration (Week 7-8)
1. Rich tooltips for all interactive elements
2. Transform tools integration
3. Keyboard shortcut customization
4. Accessibility improvements

## 6. DEPENDENCIES AND INTEGRATION

### Required State Updates
- Extend `ToolType` enum with new tool modes
- Add tooltip state management
- Enhance timeline interaction state
- Update clip and keyframe data structures

### UI Component Updates
- `TrackRow`: Add keyframe and transition drag handles
- `ClipCard`: Add hover tooltip triggers
- `TimelineEditor`: Add advanced interaction handlers
- `ToolPanel`: Add new tool buttons and indicators

### Performance Considerations
- Debounce tooltip updates during drag operations
- Virtualize tooltip rendering for large timelines
- Optimize snap calculations for real-time feedback
- Cache expensive metadata calculations

## 7. TESTING AND VALIDATION

### Unit Tests
- Drag operation state changes
- Tooltip positioning logic
- Tool activation and deactivation
- Snap calculation accuracy

### Integration Tests
- Multi-clip operations maintain timeline integrity
- Tooltips display correct information
- Keyboard shortcuts work across different contexts
- Performance during complex drag operations

### User Acceptance Criteria
- Professional NLE workflow familiarity
- Responsive interaction feedback (<16ms)
- Intuitive tool discovery and usage
- Accessible keyboard navigation</content>
<parameter name="filePath">timeline-editor-enhancement-plan.md