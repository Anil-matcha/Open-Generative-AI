import React, { useState } from 'react'
import { X, Zap, Image, Video } from 'lucide-react'

function AIGeneratePanel({ isOpen, onClose, onSave }) {
  const [prompt, setPrompt] = useState('')
  const [type, setType] = useState('image')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setTimeout(() => {
      setGeneratedContent(type === 'image' ? '/sample-ai-image.jpg' : '/sample-ai-video.mp4')
      setIsGenerating(false)
    }, 4000)
  }

  const handleSave = () => {
    onSave?.({ prompt, type, contentUrl: generatedContent })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">AI Content Generator</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="image"
                  checked={type === 'image'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                <Image className="w-4 h-4 mr-1" />
                Image
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="video"
                  checked={type === 'video'}
                  onChange={(e) => setType(e.target.value)}
                  className="mr-2"
                />
                <Video className="w-4 h-4 mr-1" />
                Video
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder={`Describe the ${type} you want to generate...`}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>{isGenerating ? `Generating ${type}...` : `Generate ${type}`}</span>
          </button>

          {generatedContent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Content
              </label>
              <div className="bg-gray-100 rounded-lg p-4">
                {type === 'image' ? (
                  <img src={generatedContent} alt="Generated content" className="w-full rounded" />
                ) : (
                  <video controls className="w-full rounded">
                    <source src={generatedContent} type="video/mp4" />
                  </video>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          {generatedContent && (
            <button onClick={handleSave} className="btn-primary">
              Use This Content
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIGeneratePanel
