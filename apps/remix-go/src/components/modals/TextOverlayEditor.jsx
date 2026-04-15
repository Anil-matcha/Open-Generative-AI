import React, { useState } from 'react'
import { X, Type, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'

function TextOverlayEditor({ isOpen, onClose, onSave }) {
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(24)
  const [color, setColor] = useState('#ffffff')
  const [fontFamily, setFontFamily] = useState('Arial')
  const [alignment, setAlignment] = useState('center')

  if (!isOpen) return null

  const handleSave = () => {
    onSave?.({
      text,
      fontSize,
      color,
      fontFamily,
      alignment
    })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Text Overlay Editor</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Content
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="Enter your text overlay..."
            />
          </div>

          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="input-field"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="input-field"
                min="8"
                max="120"
              />
            </div>
          </div>

          {/* Color and Alignment */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{color}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alignment
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setAlignment('left')}
                  className={`p-2 rounded ${alignment === 'left' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAlignment('center')}
                  className={`p-2 rounded ${alignment === 'center' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setAlignment('right')}
                  className={`p-2 rounded ${alignment === 'right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="bg-gray-100 rounded-lg p-4 min-h-24 flex items-center justify-center">
              <span
                style={{
                  fontSize: `${fontSize}px`,
                  color,
                  fontFamily,
                  textAlign: alignment
                }}
                className="break-words"
              >
                {text || 'Your text will appear here'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Add Text Overlay
          </button>
        </div>
      </div>
    </div>
  )
}

export default TextOverlayEditor
