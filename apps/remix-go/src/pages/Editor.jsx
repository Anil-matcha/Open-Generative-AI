import React, { useState, useRef } from 'react'
import { Play, Pause, Square, Upload, Download } from 'lucide-react'

function Editor() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const videoRef = useRef(null)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="btn-primary flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import Media</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
          
          {/* Playback Controls */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePlayPause}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleStop}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Square className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1">
        {/* Video Preview */}
        <div className="flex-1 bg-black flex items-center justify-center p-8">
          <div className="relative max-w-4xl w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
            
            {!videoRef.current?.src && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Import a video to start editing</p>
                  <p className="text-sm opacity-75 mt-2">Drag and drop or click to browse</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Properties</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Time
              </label>
              <div className="text-sm text-gray-500">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(2).padStart(5, '0')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tools
              </label>
              <div className="space-y-2">
                <button className="w-full btn-secondary text-left">
                  Add Text Overlay
                </button>
                <button className="w-full btn-secondary text-left">
                  Add Image Overlay
                </button>
                <button className="w-full btn-secondary text-left">
                  Generate Voice
                </button>
                <button className="w-full btn-secondary text-left">
                  AI Background
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor
