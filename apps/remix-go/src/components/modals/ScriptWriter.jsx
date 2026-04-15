import React, { useState } from 'react'
import { X, Wand2, Copy, Download } from 'lucide-react'

function ScriptWriter({ isOpen, onClose, onSave }) {
  const [prompt, setPrompt] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [generatedScript, setGeneratedScript] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedScript(`Here's a ${tone} script about ${prompt}:

[Opening Scene]
Welcome to this exciting video about ${prompt}. Today we're going to explore the fascinating world of this topic.

[Main Content]
${prompt} is incredibly important because it helps us achieve our goals. Let me break this down for you:

1. First, understanding the basics
2. Then, implementing best practices
3. Finally, seeing real-world results

[Conclusion]
Thank you for watching! If you found this helpful, please like and subscribe for more content about ${prompt}.`)
      setIsGenerating(false)
    }, 2000)
  }

  const handleSave = () => {
    onSave?.({ script: generatedScript, prompt, tone, length })
    onClose()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">AI Script Writer</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What should your script be about?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="Describe your video topic, key points, and target audience..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="input-field"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="educational">Educational</option>
                  <option value="storytelling">Storytelling</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="input-field"
                >
                  <option value="short">Short (30-60 sec)</option>
                  <option value="medium">Medium (2-3 min)</option>
                  <option value="long">Long (5-10 min)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate Script'}</span>
            </button>
          </div>

          {/* Generated Script */}
          {generatedScript && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Generated Script
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {/* Download logic */}}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Download script"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {generatedScript}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          {generatedScript && (
            <button onClick={handleSave} className="btn-primary">
              Use This Script
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ScriptWriter
