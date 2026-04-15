import React, { useState } from 'react'
import { X, User, Wand2 } from 'lucide-react'

function AvatarGenerator({ isOpen, onClose, onSave }) {
  const [script, setScript] = useState('')
  const [avatarStyle, setAvatarStyle] = useState('professional')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVideo, setGeneratedVideo] = useState(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!script.trim()) return
    setIsGenerating(true)
    // Simulate avatar generation
    setTimeout(() => {
      setGeneratedVideo('/sample-avatar.mp4')
      setIsGenerating(false)
    }, 5000)
  }

  const handleSave = () => {
    onSave?.({ script, avatarStyle, videoUrl: generatedVideo })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Talking Avatar Generator</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Script for Avatar
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="Enter the script for your talking avatar..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Style
            </label>
            <select
              value={avatarStyle}
              onChange={(e) => setAvatarStyle(e.target.value)}
              className="input-field"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="animated">Animated</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!script.trim() || isGenerating}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Avatar...' : 'Generate Talking Avatar'}</span>
          </button>

          {generatedVideo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Avatar Video
              </label>
              <div className="bg-gray-100 rounded-lg p-4">
                <video controls className="w-full rounded">
                  <source src={generatedVideo} type="video/mp4" />
                </video>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          {generatedVideo && (
            <button onClick={handleSave} className="btn-primary">
              Use This Avatar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AvatarGenerator
