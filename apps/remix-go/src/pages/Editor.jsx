import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  Upload,
  Download,
  Eye,
  Share,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  MessageSquare,
  Image,
  Mic,
  Palette,
  Zap
} from 'lucide-react';

const PHASES = [
  { id: 'getting-started', label: 'Getting Started', icon: Settings },
  { id: 'customize', label: 'Customize Video', icon: Palette },
  { id: 'publish', label: 'Publish & Share', icon: Share }
];

function Editor() {
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handlePhaseChange = (phaseIndex) => {
    setCurrentPhase(phaseIndex);
  };

  const handleNextPhase = () => {
    if (currentPhase < PHASES.length) {
      setCurrentPhase(currentPhase + 1);
    } else {
      navigate('/publisher');
    }
  };

  const handlePrevPhase = () => {
    if (currentPhase > 1) {
      setCurrentPhase(currentPhase - 1);
    } else {
      navigate('/');
    }
  };

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Getting Started</h3>
            <div className="space-y-3">
              <button className="w-full glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Import Media</span>
                </div>
              </button>
              <button className="w-full glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Add Images</span>
                </div>
              </button>
              <button className="w-full glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Record Audio</span>
                </div>
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Customize Video</h3>
            <div className="space-y-3">
              <button className="w-full glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Add Text</span>
                </div>
              </button>
              <button className="w-full glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <span className="text-foreground">Effects</span>
                </div>
              </button>
              <button className="w-full glass p-4 rounded-lg hover:shadow-glass-sm transition-all duration-200">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-foreground">AI Enhancements</span>
                </div>
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Publish & Share</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/publisher')}
                className="w-full btn-primary flex items-center justify-center gap-3"
              >
                <Share className="w-5 h-5" />
                <span>Go to Publisher</span>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Phase Navigation Sidebar */}
      <div className="w-64 bg-card border-r border-border p-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-6">Video Editor</h2>

          {/* Phase Indicators */}
          <div className="space-y-3">
            {PHASES.map((phase, index) => {
              const phaseNumber = index + 1;
              const Icon = phase.icon;
              const isActive = phaseNumber === currentPhase;
              const isCompleted = phaseNumber < currentPhase;

              return (
                <button
                  key={phase.id}
                  onClick={() => handlePhaseChange(phaseNumber)}
                  className={`phase-indicator w-full justify-start ${
                    isActive ? 'active' : isCompleted ? 'completed' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{phase.label}</span>
                  {isCompleted && <Check className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* Phase Actions */}
          <div className="mt-8 space-y-3">
            {renderPhaseContent()}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="btn-secondary flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Import Media</span>
              </button>
              <button className="btn-ghost flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePlayPause}
                className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={handleStop}
                className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevPhase}
                className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
                disabled={currentPhase === 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextPhase}
                className="btn-primary px-4 py-2"
              >
                {currentPhase === PHASES.length ? 'Publish' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-secondary/20 flex items-center justify-center p-8">
          <div className="relative max-w-4xl w-full aspect-video bg-card rounded-lg overflow-hidden shadow-glass">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>

            {!videoRef.current?.src && (
              <div className="absolute inset-0 flex items-center justify-center text-foreground">
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Import a video to start editing</p>
                  <p className="text-sm opacity-75 mt-2">Drag and drop or click to browse</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions Pane */}
      <div className="w-80 bg-card border-l border-border p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary flex items-center gap-3">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button className="w-full btn-ghost flex items-center gap-3">
                <Share className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Libraries</h3>
            <div className="space-y-3">
              <button className="w-full btn-ghost flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span>CTA Library</span>
              </button>
              <button className="w-full btn-ghost flex items-center gap-3">
                <Mic className="w-4 h-4" />
                <span>Niche Scripts</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Personalizer</h3>
            <div className="space-y-3">
              <button className="w-full btn-ghost">
                <span>Dynamic Elements</span>
              </button>
              <button className="w-full btn-ghost">
                <span>Brand Colors</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;
