import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import { useVideoEditorStore } from '../stores/StoreProvider';

const Timeline = observer(({ className = '' }) => {
  const videoEditorStore = useVideoEditorStore();
  const timelineRef = useRef(null);

  // Timeline dimensions
  const TRACK_HEIGHT = 60;
  const HEADER_HEIGHT = 40;
  const PIXELS_PER_SECOND = 10;

  const totalWidth = videoEditorStore.duration * PIXELS_PER_SECOND;

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = x / PIXELS_PER_SECOND;

    if (time >= 0 && time <= videoEditorStore.duration) {
      videoEditorStore.seek(time);
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg ${className}`}>
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Timeline</h3>
      </div>

      <div className="p-4">
        <div
          ref={timelineRef}
          className="relative bg-secondary/20 rounded border border-border cursor-pointer"
          style={{ height: TRACK_HEIGHT + HEADER_HEIGHT }}
          onClick={handleTimelineClick}
        >
          {/* Time ruler */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-secondary/10 border-b border-border">
            <div className="flex items-center h-full px-2">
              {Array.from({ length: Math.ceil(videoEditorStore.duration / 10) + 1 }, (_, i) => (
                <div key={i} className="flex items-center" style={{ marginLeft: i === 0 ? 0 : PIXELS_PER_SECOND * 10 - 40 }}>
                  <div className="w-px h-4 bg-border"></div>
                  <span className="text-xs text-muted ml-1">{i * 10}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video track */}
          <div
            className="absolute top-8 left-0 bg-primary/20 border border-primary/40 rounded mx-2"
            style={{
              height: TRACK_HEIGHT - 16,
              width: Math.max(100, videoEditorStore.duration * PIXELS_PER_SECOND - 16),
              top: HEADER_HEIGHT + 8
            }}
          >
            <div className="flex items-center h-full px-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-foreground">Video Track</div>
                <div className="text-xs text-muted">Main video content</div>
              </div>
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{
                left: `${(videoEditorStore.currentTime / videoEditorStore.duration) * 100}%`
              }}
            >
              <div className="absolute -top-2 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>

          {/* Time indicator */}
          <div className="absolute bottom-2 right-2 text-xs text-muted bg-black/50 px-2 py-1 rounded">
            {videoEditorStore.formattedCurrentTime}
          </div>
        </div>

        {/* Timeline controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => videoEditorStore.setTimelineZoom(Math.max(0.1, videoEditorStore.timelineZoom - 0.5))}
              className="px-3 py-1 text-sm bg-secondary text-muted rounded hover:bg-secondary/80 transition-colors"
            >
              Zoom Out
            </button>
            <span className="text-sm text-muted">{videoEditorStore.timelineZoom.toFixed(1)}x</span>
            <button
              onClick={() => videoEditorStore.setTimelineZoom(Math.min(5, videoEditorStore.timelineZoom + 0.5))}
              className="px-3 py-1 text-sm bg-secondary text-muted rounded hover:bg-secondary/80 transition-colors"
            >
              Zoom In
            </button>
          </div>

          <div className="text-sm text-muted">
            Duration: {videoEditorStore.formattedDuration}
          </div>
        </div>

        {/* Clips list (if any) */}
        {videoEditorStore.clips.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Clips</h4>
            <div className="space-y-2">
              {videoEditorStore.clips.map((clip) => (
                <div
                  key={clip.id}
                  className="flex items-center gap-3 p-2 bg-secondary/10 rounded"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Clip {clip.id}</div>
                    <div className="text-xs text-muted">
                      {clip.start}s - {clip.end}s ({clip.duration}s)
                    </div>
                  </div>
                  <button
                    onClick={() => videoEditorStore.removeClip(clip.id)}
                    className="text-muted hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default Timeline;