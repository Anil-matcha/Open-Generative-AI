import React, { useState, useEffect } from 'react'
import { X, Play, Pause, Settings } from 'lucide-react'

function Teleprompter({ isOpen, onClose, script }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [fontSize, setFontSize] = useState(24)
  const [scrollPosition, setScrollPosition] = useState(0)

  if (!isOpen) return null

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setScrollPosition(prev => prev + speed)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [isPlaying, speed])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <span className="text-sm">Speed: {speed}x</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-20"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm">Size: {fontSize}px</span>
          <input
            type="range"
            min="16"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-20"
          />
          <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Script Display */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="absolute inset-0 p-8 text-center text-white leading-relaxed"
          style={{
            fontSize: `${fontSize}px`,
            transform: `translateY(-${scrollPosition}px)`,
            transition: isPlaying ? 'none' : 'transform 0.3s ease'
          }}
        >
          {script || 'No script loaded. Add a script in the Script Writer tool.'}
        </div>
        
        {/* Center line guide */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500 opacity-50 transform -translate-x-0.5"></div>
      </div>
    </div>
  )
}

export default Teleprompter
