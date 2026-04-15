import React, { useState } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

function ImageOverlayEditor({ isOpen, onClose, onSave }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [scale, setScale] = useState(100)
  const [opacity, setOpacity] = useState(100)
  const [position, setPosition] = useState({ x: 50, y: 50 })

  if (!isOpen) return null

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    onSave?.({ image: selectedImage, preview, scale, opacity, position })
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Image Overlay Editor</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-48">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-48 object-contain rounded"
                  style={{
                    transform: `scale(${scale / 100})`,
                    opacity: opacity / 100
                  }}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          {preview && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale: {scale}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity: {opacity}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          {preview && (
            <button onClick={handleSave} className="btn-primary">
              Add Image Overlay
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageOverlayEditor
