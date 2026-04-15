import React, { useState } from 'react'
import { X, Image, Wand2 } from 'lucide-react'

function DynamicBackground({ isOpen, onClose, onSave }) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('modern')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBackground, setGeneratedBackground] = useState(null)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setTimeout(() => {
      setGeneratedBackground('/sample-background.jpg')
      setIsGenerating(false)
    }, 3000)
  }

  const handleSave = () => {
    onSave?.({ prompt, style, backgroundUrl: generatedBackground })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">AI Dynamic Background</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="Describe the background you want (e.g., 'modern office with city view')..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Style
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="input-field"
            >
              <option value="modern">Modern</option>
              <option value="corporate">Corporate</option>
              <option value="creative">Creative</option>
              <option value="minimal">Minimal</option>
              <option value="nature">Nature</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Background...' : 'Generate Background'}</span>
          </button>

          {generatedBackground && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Background
              </label>
              <div className="bg-gray-100 rounded-lg p-4">
                <img src={generatedBackground} alt="Generated background" className="w-full rounded" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          {generatedBackground && (
            <button onClick={handleSave} className="btn-primary">
              Use This Background
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DynamicBackground
