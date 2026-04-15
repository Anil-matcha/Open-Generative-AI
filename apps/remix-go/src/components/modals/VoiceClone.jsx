import React, { useState, useRef } from 'react'
import { X, Mic, Play, Pause, Upload } from 'lucide-react'

function VoiceClone({ isOpen, onClose, onSave }) {
  const [selectedVoice, setSelectedVoice] = useState('')
  const [script, setScript] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAudio, setGeneratedAudio] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const voices = [
    { id: 'male-professional', name: 'Male Professional', sample: 'Hello, this is a professional voice.' },
    { id: 'female-friendly', name: 'Female Friendly', sample: 'Hi there! I\'m excited to help you.' },
    { id: 'male-enthusiastic', name: 'Male Enthusiastic', sample: 'Wow! This is absolutely amazing!' },
    { id: 'female-calm', name: 'Female Calm', sample: 'Let me explain this step by step.' }
  ]

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!selectedVoice || !script.trim()) return
    
    setIsGenerating(true)
    // Simulate voice generation
    setTimeout(() => {
      setGeneratedAudio('/sample-voice.mp3') // This would be the actual generated audio URL
      setIsGenerating(false)
    }, 3000)
  }

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSave = () => {
    onSave?.({ voice: selectedVoice, script, audioUrl: generatedAudio })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Voice Clone & Generation</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select a Voice
            </label>
            <div className="grid grid-cols-2 gap-3">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedVoice === voice.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{voice.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{voice.sample}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Voice Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Upload Custom Voice Sample
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Drop audio file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">MP3, WAV up to 10MB</p>
            </div>
          </div>

          {/* Script Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Script to Generate
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="input-field h-32 resize-none"
              placeholder="Enter the text you want to convert to speech..."
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!selectedVoice || !script.trim() || isGenerating}
            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Voice...' : 'Generate Voice'}</span>
          </button>

          {/* Generated Audio Preview */}
          {generatedAudio && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Audio Preview
              </label>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-1/4"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">0:15 / 1:23</span>
                </div>
                <audio ref={audioRef} src={generatedAudio} onEnded={() => setIsPlaying(false)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          {generatedAudio && (
            <button onClick={handleSave} className="btn-primary">
              Use This Voice
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VoiceClone
