import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react';
import {
  Play,
  Pause,
  Square,
  Scissors,
  Type,
  Image,
  Layers,
  Settings,
  Save,
  Undo,
  Redo
} from 'lucide-react';
import { useVideoEditorStore } from '../stores/StoreProvider';
import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import ElementToolbar from './ElementToolbar';

const VideoEditor = observer(() => {
  const videoEditorStore = useVideoEditorStore();
  const canvasRef = useRef(null);
  const [selectedTool, setSelectedTool] = useState('select');
  const [showElementToolbar, setShowElementToolbar] = useState(false);

  useEffect(() => {
    // Initialize canvas when component mounts
    if (canvasRef.current) {
      videoEditorStore.initializeCanvas(canvasRef.current);
    }

    return () => {
      // Cleanup on unmount
      videoEditorStore.dispose();
    };
  }, [videoEditorStore]);

  const tools = [
    { id: 'select', icon: Layers, label: 'Select' },
    { id: 'text', icon: Type, label: 'Add Text' },
    { id: 'image', icon: Image, label: 'Add Image' },
    { id: 'cut', icon: Scissors, label: 'Cut Video' },
    { id: 'effects', icon: Settings, label: 'Effects' }
  ];

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);

    switch (toolId) {
      case 'text':
        videoEditorStore.addTextElement();
        setShowElementToolbar(true);
        break;
      case 'image':
        // In real implementation, this would open file picker
        videoEditorStore.addImageElement('https://via.placeholder.com/200x150/4f46e5/ffffff?text=Sample+Image');
        setShowElementToolbar(true);
        break;
      case 'select':
        setShowElementToolbar(!!videoEditorStore.activeElement);
        break;
      default:
        setShowElementToolbar(false);
        break;
    }
  };

  const handleCanvasClick = (e) => {
    if (selectedTool === 'text') {
      videoEditorStore.addTextElement({
        left: e.clientX - canvasRef.current.offsetLeft,
        top: e.clientY - canvasRef.current.offsetTop
      });
      setShowElementToolbar(true);
    }
  };

  return (
    <div className="video-editor h-screen flex flex-col bg-background">
      {/* Editor Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-foreground">Video Editor</h1>

            {/* Tool Selection */}
            <div className="flex items-center gap-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      selectedTool === tool.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-secondary/80 text-muted'
                    }`}
                    title={tool.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Undo/Redo */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-secondary/20 rounded transition-colors" title="Undo">
                <Undo className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-secondary/20 rounded transition-colors" title="Redo">
                <Redo className="w-4 h-4" />
              </button>
            </div>

            {/* Save Button */}
            <button className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Element Toolbar */}
        {showElementToolbar && (
          <div className="w-80 bg-card border-r border-border">
            <ElementToolbar />
          </div>
        )}

        {/* Center - Video and Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Video/Canvas Area */}
          <div className="flex-1 p-8 flex items-center justify-center bg-secondary/10">
            <div className="relative max-w-4xl w-full">
              {/* Video Player */}
              <div className="aspect-video bg-card rounded-lg overflow-hidden shadow-glass mb-4">
                <VideoPlayer className="w-full h-full" />
              </div>

              {/* Canvas Overlay (simulated) */}
              <div className="absolute inset-0 aspect-video pointer-events-none">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full border-2 border-dashed border-primary/30 rounded-lg pointer-events-auto"
                  onClick={handleCanvasClick}
                  style={{ background: 'transparent' }}
                />
              </div>

              {/* Canvas Instructions */}
              {!videoEditorStore.activeElement && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-muted">
                    <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Click to add text or select a tool</p>
                    <p className="text-sm">Use the toolbar above to add elements to your video</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-border">
            <Timeline className="max-h-48" />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-64 bg-card border-l border-border p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">Properties</h3>

          <div className="space-y-4">
            {/* Video Info */}
            <div className="glass p-3 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Video Info</h4>
              <div className="text-sm text-muted space-y-1">
                <p>Duration: {videoEditorStore.formattedDuration}</p>
                <p>Current: {videoEditorStore.formattedCurrentTime}</p>
                <p>Elements: {videoEditorStore.elements.length}</p>
              </div>
            </div>

            {/* Active Element Info */}
            {videoEditorStore.activeElement && (
              <div className="glass p-3 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Selected Element</h4>
                <div className="text-sm text-muted space-y-1">
                  <p>Type: {videoEditorStore.activeElement.type}</p>
                  <p>Position: {Math.round(videoEditorStore.activeElement.left)}, {Math.round(videoEditorStore.activeElement.top)}</p>
                  {videoEditorStore.activeElement.text && (
                    <p>Text: "{videoEditorStore.activeElement.text.substring(0, 20)}..."</p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={() => videoEditorStore.setStage('caption-customise')}
                className="w-full btn-secondary text-left flex items-center gap-2"
              >
                <Type className="w-4 h-4" />
                Caption Mode
              </button>

              <button
                onClick={() => videoEditorStore.setStage('timeline')}
                className="w-full btn-secondary text-left flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Timeline Mode
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoEditor;