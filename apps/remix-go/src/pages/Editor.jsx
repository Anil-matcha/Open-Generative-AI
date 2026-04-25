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
import PhaseView from '../components/PhaseView';
import ActionsPane from '../components/ActionsPane';

const PHASES = [
  { id: 'getting-started', label: 'Getting Started', icon: Settings },
  { id: 'customize', label: 'Customize Video', icon: Palette },
  { id: 'publish', label: 'Publish & Share', icon: Share }
];

function Editor() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  // Default video for demo
  const defaultVideoSrc = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

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

  const handlePhaseChange = (element) => {
    switch (element.key) {
      case 'getting-started':
        navigate('/');
        break;
      case 'publish':
        navigate('/publisher');
        break;
      default:
        break;
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
    <div className="min-h-screen bg-background">
      {/* Phase Navigation */}
      <PhaseView
        elements={[
          {
            key: 'getting-started',
            title: 'Choose Template',
            active: false,
            available: true,
          },
          {
            key: 'edit',
            title: 'Customize Video',
            active: true,
            available: true,
          },
          {
            key: 'publish',
            title: 'Publish & Share',
            active: false,
            available: true,
          },
        ]}
        onPhaseChanged={handlePhaseChange}
      />

      <div className="flex flex-1">
        {/* Stage Changer Sidebar */}
        <div className="w-64 bg-card border-r border-border p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-6">Video Editor</h2>

            {/* Stage Controls */}
            <div className="space-y-3">
              <button className="nav-item w-full">
                <span className="text-sm">Caption Customize</span>
              </button>
              <button className="nav-item w-full">
                <span className="text-sm">Element Edit</span>
              </button>
              <button className="nav-item w-full">
                <span className="text-sm">Timeline</span>
              </button>
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
                onClick={() => navigate('/')}
                className="p-2 rounded-lg hover:bg-accent/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/publisher')}
                className="btn-primary px-4 py-2"
              >
                Publish & Share
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-secondary/20 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Video Player */}
            <div className="lg:col-span-2 flex items-center justify-center">
              <VideoPlayer
                src={defaultVideoSrc}
                className="w-full max-w-4xl"
              />
            </div>

            {/* Element Toolbar */}
            <div className="lg:col-span-1">
              <ElementToolbar />
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-8">
            <Timeline />
          </div>
        </div>
      </div>

      {/* Right Actions Pane */}
      <ActionsPane className="w-80">
        <button className="go-button action-button w-full">
          Preview
        </button>
        <button
          onClick={() => navigate('/publisher')}
          className="go-button action-button w-full"
        >
          Publish & Share
        </button>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Libraries</h3>
          <button className="addon-button w-full flex items-center gap-3">
            <MessageSquare className="w-4 h-4" />
            <span>CTA Library</span>
          </button>
          <button className="addon-button w-full flex items-center gap-3">
            <Mic className="w-4 h-4" />
            <span>Niche Scripts</span>
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Tools</h3>
          <button className="addon-button w-full flex items-center gap-3">
            <Palette className="w-4 h-4" />
            <span>Add Text</span>
          </button>
          <button className="addon-button w-full flex items-center gap-3">
            <Image className="w-4 h-4" />
            <span>Add Image</span>
          </button>
          <button className="addon-button w-full flex items-center gap-3">
            <Settings className="w-4 h-4" />
            <span>Personalizer</span>
          </button>
        </div>
      </ActionsPane>
    </div>
    </div>
  );
}

export default Editor;
