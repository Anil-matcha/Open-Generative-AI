import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { useVideoEditorStore } from '../stores/StoreProvider';

const VideoPlayer = observer(({ src, className = '' }) => {
  const videoRef = useRef(null);
  const videoEditorStore = useVideoEditorStore();

  // Default demo video if no src provided
  const defaultSrc = src || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  useEffect(() => {
    if (videoRef.current) {
      videoEditorStore.setVideoElement(videoRef.current);

      // Load video
      videoRef.current.src = defaultSrc;
      videoRef.current.load();
    }

    return () => {
      // Cleanup on unmount
      videoEditorStore.setVideoElement(null);
    };
  }, [defaultSrc, videoEditorStore]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls={false} // We'll implement custom controls
        preload="metadata"
        poster="/api/placeholder/800/450"
      >
        Your browser does not support the video tag.
      </video>

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
        <div className="flex items-center gap-4 text-white">
          <button
            onClick={videoEditorStore.isPlaying ? videoEditorStore.pause : videoEditorStore.play}
            className="p-2 hover:bg-white/20 rounded transition-colors"
          >
            {videoEditorStore.isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button
            onClick={videoEditorStore.handleStop}
            className="p-2 hover:bg-white/20 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>

          <div className="flex-1 mx-4">
            <div className="relative h-1 bg-white/30 rounded">
              <div
                className="absolute top-0 left-0 h-full bg-white rounded"
                style={{
                  width: `${(videoEditorStore.currentTime / videoEditorStore.duration) * 100}%`
                }}
              />
              <input
                type="range"
                min="0"
                max={videoEditorStore.duration || 0}
                value={videoEditorStore.currentTime || 0}
                onChange={(e) => videoEditorStore.seek(parseFloat(e.target.value))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="text-sm">
            {videoEditorStore.formattedCurrentTime} / {videoEditorStore.formattedDuration}
          </div>

          <div className="flex items-center gap-2">
            <button className="text-sm hover:bg-white/20 px-2 py-1 rounded transition-colors">
              🔊
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={videoEditorStore.volume}
              onChange={(e) => videoEditorStore.setVolume(parseFloat(e.target.value))}
              className="w-16"
            />
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {!src && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
          <div className="text-center text-muted">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">No video loaded</p>
            <p className="text-sm">Import a video to start editing</p>
          </div>
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;