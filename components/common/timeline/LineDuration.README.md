# LineDuration Component

A React component for visual duration control with drag handles for clip trimming in the timeline editor.

## Features

- Visual slider with drag handles for in/out points
- Integration with existing TimeLineSlider component
- Support for from/to time adjustments with timeline updates
- Smooth drag interactions using interact.js
- Connection to useTimelineStore for state management
- Keyboard navigation support
- Grid snapping when enabled
- Accessibility features

## Usage

```jsx
import LineDuration from './components/common/timeline/LineDuration.jsx';

function TimelineClip({ clip }) {
  const handleTrimChange = (updates) => {
    // Handle trim changes
    console.log('Trim updated:', updates);
  };

  const handleDurationChange = (duration) => {
    // Handle duration changes
    console.log('Duration changed:', duration);
  };

  return (
    <div className="timeline-clip">
      {/* Other clip UI */}
      <LineDuration
        clipId={clip.id}
        start={clip.start}
        end={clip.end}
        trimIn={clip.trimIn}
        trimOut={clip.trimOut}
        onTrimChange={handleTrimChange}
        onDurationChange={handleDurationChange}
        width={200}
        height={40}
      />
    </div>
  );
}
```

## Props

- `clipId` (number): Unique identifier for the clip
- `start` (number): Start time of the clip in seconds
- `end` (number): End time of the clip in seconds
- `trimIn` (number): Trim in point in seconds
- `trimOut` (number): Trim out point in seconds
- `onTrimChange` (function): Callback when trim points change
- `onDurationChange` (function): Callback when duration changes
- `width` (number, optional): Width of the component in pixels (default: 200)
- `height` (number, optional): Height of the component in pixels (default: 40)

## Integration with Timeline System

The component integrates with the existing timeline system through:

1. **State Management**: Uses `useTimelineStore` for accessing timeline state and updating clip properties
2. **Timeline Updates**: Calls `timelineStore.updateClipDuration()` to persist changes
3. **Grid Snapping**: Respects the `snapEnabled` setting from the timeline store
4. **Popcorn Compatibility**: Follows existing popcorn element patterns and styling

## Keyboard Navigation

- `Arrow Left/Right`: Move trim handles by 0.1 seconds (or 1 second with Shift)
- `Tab`: Navigate between handles
- All handles are focusable and accessible

## Testing

The component includes comprehensive tests covering:

- Rendering and accessibility
- Drag interactions
- Keyboard navigation
- Boundary constraints
- Timeline integration
- Grid snapping
- Visual feedback

Run tests with: `npm test -- components/common/timeline/LineDuration.test.jsx`

## Dependencies

- React
- interact.js (for drag interactions)
- useTimelineStore (timeline state management)