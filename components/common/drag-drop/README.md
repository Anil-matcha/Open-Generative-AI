# Advanced Drag-and-Drop System

A comprehensive drag-and-drop system for the timeline editor that provides professional-grade file upload and asset management functionality.

## Features

- **Advanced Drag Zones**: Visual feedback zones throughout the timeline interface
- **File Upload**: Direct drag-and-drop from desktop/folders to timeline
- **Asset Preview**: Live thumbnails and file information during drag operations
- **Validation**: Real-time validation with visual indicators
- **Progress Tracking**: Upload progress bars and status updates
- **Multiple Files**: Batch upload processing with error isolation
- **Accessibility**: Keyboard navigation and screen reader support
- **Performance**: Optimized for large file handling and smooth animations

## Components

### `useAdvancedDragDrop` Hook

The main hook that manages all drag-and-drop state and events.

```jsx
import { useAdvancedDragDrop } from '../hooks/useAdvancedDragDrop.jsx';

const MyComponent = () => {
  const {
    isDragging,
    dragPosition,
    activeZone,
    isValidDrop,
    preview,
    uploadProgress,
    errors,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    cancelUpload,
    clearCompletedUploads,
    resetDragState
  } = useAdvancedDragDrop({
    onFileDrop: (files, zoneId) => {
      console.log('Files dropped:', files, 'in zone:', zoneId);
    },
    onZoneEnter: (zoneId) => {
      console.log('Entered zone:', zoneId);
    },
    onZoneLeave: (zoneId) => {
      console.log('Left zone:', zoneId);
    },
    dropZones: [
      {
        id: 'video-track-1',
        bounds: { left: 0, top: 100, right: 800, bottom: 200 },
        type: 'track',
        metadata: { trackType: 'video', trackId: 'track-1' }
      }
    ]
  });

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Your timeline content */}
    </div>
  );
};
```

### `DragZone` Component

Reusable drop zone component with visual feedback.

```jsx
import { DragZone } from '../components/common/drag-drop';

const TimelineTrack = ({ trackId, trackType, isActive, isValid }) => {
  return (
    <DragZone
      id={`track-${trackId}`}
      zoneType="track"
      isActive={isActive}
      isValid={isValid}
      metadata={{ trackType, trackId }}
      onDragEnter={(zoneId, zoneType, metadata) => {
        console.log('Entered track zone:', zoneId);
      }}
      onDrop={(files, zoneId, zoneType, metadata) => {
        console.log('Dropped files on track:', files);
      }}
    >
      <div className="track-content">
        {/* Track content */}
      </div>
    </DragZone>
  );
};
```

### `AssetPreview` Component

Shows preview of dragged files with thumbnails and metadata.

```jsx
import { AssetPreview } from '../components/common/drag-drop';

const TimelineCanvas = () => {
  const dragHook = useAdvancedDragDrop({ /* config */ });

  return (
    <div className="timeline-canvas">
      {/* Timeline content */}

      <AssetPreview
        preview={dragHook.preview}
        files={dragHook.files}
        position={dragHook.dragPosition}
        isVisible={dragHook.isDragging}
      />
    </div>
  );
};
```

### `UploadProgress` Component

Displays upload progress for multiple files.

```jsx
import { UploadProgress } from '../components/common/drag-drop';

const UploadPanel = () => {
  const dragHook = useAdvancedDragDrop({ /* config */ });

  return (
    <UploadProgress
      uploadProgress={dragHook.uploadProgress}
      onCancel={dragHook.cancelUpload}
      onClearCompleted={dragHook.clearCompletedUploads}
      showSummary={true}
    />
  );
};
```

### `DropValidator` Utility

Validation service for drop operations.

```jsx
import { DropValidator, ValidationPresets } from '../components/common/drag-drop';

// Basic validation
const result = DropValidator.validateDrop(files, zoneId, zoneType, metadata);

// Using presets
const strictValidation = ValidationPresets.strict;
const result = DropValidator.validateDrop(files, zoneId, zoneType, metadata, {
  customValidators: [/* custom validation functions */]
});
```

## Integration Example

Here's a complete example of integrating the drag-and-drop system into a timeline component:

```jsx
import React from 'react';
import {
  useAdvancedDragDrop,
  DragZone,
  AssetPreview,
  UploadProgress
} from '../components/common/drag-drop';

const TimelineEditor = () => {
  const dragHook = useAdvancedDragDrop({
    onFileDrop: (files, zoneId) => {
      // Handle file drop - add to timeline
      files.forEach(file => {
        addClipToTimeline(file, zoneId);
      });
    },
    dropZones: [
      {
        id: 'video-track-1',
        bounds: calculateTrackBounds('video-track-1'),
        type: 'track',
        metadata: { trackType: 'video' }
      },
      {
        id: 'timeline-canvas',
        bounds: calculateCanvasBounds(),
        type: 'canvas',
        metadata: {}
      }
    ]
  });

  return (
    <div
      className="timeline-editor"
      onDragEnter={dragHook.handleDragEnter}
      onDragLeave={dragHook.handleDragLeave}
      onDragOver={dragHook.handleDragOver}
      onDrop={dragHook.handleDrop}
    >
      {/* Timeline tracks */}
      <div className="tracks-container">
        <DragZone
          id="video-track-1"
          zoneType="track"
          isActive={dragHook.activeZone === 'video-track-1'}
          isValid={dragHook.isValidDrop}
          metadata={{ trackType: 'video' }}
        >
          <VideoTrack trackId="video-track-1" />
        </DragZone>

        <DragZone
          id="audio-track-1"
          zoneType="track"
          isActive={dragHook.activeZone === 'audio-track-1'}
          isValid={dragHook.isValidDrop}
          metadata={{ trackType: 'audio' }}
        >
          <AudioTrack trackId="audio-track-1" />
        </DragZone>
      </div>

      {/* Timeline canvas */}
      <DragZone
        id="timeline-canvas"
        zoneType="canvas"
        isActive={dragHook.activeZone === 'timeline-canvas'}
        isValid={dragHook.isValidDrop}
      >
        <TimelineCanvas />
      </DragZone>

      {/* Drag preview */}
      <AssetPreview
        preview={dragHook.preview}
        files={dragHook.files}
        position={dragHook.dragPosition}
        isVisible={dragHook.isDragging}
      />

      {/* Upload progress */}
      {dragHook.uploadProgress.length > 0 && (
        <div className="upload-panel">
          <UploadProgress
            uploadProgress={dragHook.uploadProgress}
            onCancel={dragHook.cancelUpload}
            onClearCompleted={dragHook.clearCompletedUploads}
          />
        </div>
      )}

      {/* Error display */}
      {dragHook.errors.length > 0 && (
        <div className="error-panel">
          {dragHook.errors.map((error, index) => (
            <div key={index} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineEditor;
```

## Configuration Options

### Hook Options

- `onFileDrop(files, zoneId)`: Called when files are dropped
- `onZoneEnter(zoneId)`: Called when entering a drop zone
- `onZoneLeave(zoneId)`: Called when leaving a drop zone
- `dropZones`: Array of drop zone configurations
- `validation`: Custom validation options

### Validation Presets

- `ValidationPresets.strict`: Strict validation for production
- `ValidationPresets.relaxed`: Relaxed validation for development
- `ValidationPresets.imagesOnly`: Images only
- `ValidationPresets.videosOnly`: Videos only

## Accessibility

The system includes comprehensive accessibility features:

- Screen reader announcements for drag states
- Keyboard navigation support (ESC to cancel)
- High contrast visual feedback
- ARIA labels and roles
- Reduced motion support

## Performance Considerations

- Debounced drag position updates
- Efficient thumbnail generation
- Memory cleanup for video elements
- Chunked file processing for large uploads
- RequestAnimationFrame for smooth animations

## Browser Support

- Modern browsers with File API support
- Drag and Drop API
- ES6+ features
- CSS Grid/Flexbox for layouts

## Error Handling

- File type validation
- Size limit checking
- Network failure recovery
- Graceful degradation
- User-friendly error messages