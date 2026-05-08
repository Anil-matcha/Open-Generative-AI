import React from 'react';
import { observer } from 'mobx-react';
import { Type, Palette, Move, RotateCw, Trash2 } from 'lucide-react';
import { useVideoEditorStore } from '../stores/StoreProvider';

const ElementToolbar = observer(() => {
  const videoEditorStore = useVideoEditorStore();

  if (!videoEditorStore.activeElement) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-center text-muted">
          <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select an element to edit</p>
        </div>
      </div>
    );
  }

  const element = videoEditorStore.activeElement;
  const isText = element.type === 'i-text' || element.type === 'text';

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Edit {isText ? 'Text' : 'Image'}
      </h3>

      <div className="space-y-4">
        {/* Element Type */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Element Type
          </label>
          <div className="flex gap-2">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                isText ? 'bg-primary text-white' : 'bg-secondary text-muted hover:bg-secondary/80'
              }`}
            >
              <Type className="w-4 h-4" />
              Text
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                !isText ? 'bg-primary text-white' : 'bg-secondary text-muted hover:bg-secondary/80'
              }`}
            >
              <Move className="w-4 h-4" />
              Image
            </button>
          </div>
        </div>

        {/* Text Properties */}
        {isText && (
          <>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Text Content
              </label>
              <input
                type="text"
                value={element.text || ''}
                onChange={(e) => videoEditorStore.setElementProperty('text', e.target.value)}
                className="input-field"
                placeholder="Enter text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Font Size
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={element.fontSize || 24}
                onChange={(e) => videoEditorStore.setElementProperty('fontSize', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-muted mt-1">
                {element.fontSize || 24}px
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Font Family
              </label>
              <select
                value={element.fontFamily || 'Arial'}
                onChange={(e) => videoEditorStore.setElementProperty('fontFamily', e.target.value)}
                className="input-field"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
          </>
        )}

        {/* Color Properties */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Text Color
          </label>
          <input
            type="color"
            value={element.fill || '#ffffff'}
            onChange={(e) => videoEditorStore.setElementProperty('fill', e.target.value)}
            className="w-full h-10 rounded border border-border cursor-pointer"
          />
        </div>

        {/* Stroke/Outline */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Outline Color
          </label>
          <input
            type="color"
            value={element.stroke || '#000000'}
            onChange={(e) => videoEditorStore.setElementProperty('stroke', e.target.value)}
            className="w-full h-10 rounded border border-border cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Outline Width
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={element.strokeWidth || 1}
            onChange={(e) => videoEditorStore.setElementProperty('strokeWidth', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Transform Properties */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Scale X
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="3"
              value={element.scaleX?.toFixed(1) || 1}
              onChange={(e) => videoEditorStore.setElementProperty('scaleX', parseFloat(e.target.value))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Scale Y
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="3"
              value={element.scaleY?.toFixed(1) || 1}
              onChange={(e) => videoEditorStore.setElementProperty('scaleY', parseFloat(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Rotation
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={element.angle || 0}
            onChange={(e) => videoEditorStore.setElementProperty('angle', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-sm text-muted mt-1">
            {element.angle || 0}°
          </div>
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              X Position
            </label>
            <input
              type="number"
              value={Math.round(element.left || 0)}
              onChange={(e) => videoEditorStore.setElementProperty('left', parseInt(e.target.value))}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Y Position
            </label>
            <input
              type="number"
              value={Math.round(element.top || 0)}
              onChange={(e) => videoEditorStore.setElementProperty('top', parseInt(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <button
            onClick={() => {
              if (element) {
                element.bringToFront();
                videoEditorStore.canvas.renderAll();
              }
            }}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Move className="w-4 h-4" />
            Bring to Front
          </button>
          <button
            onClick={() => {
              if (element) {
                element.sendToBack();
                videoEditorStore.canvas.renderAll();
              }
            }}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Move className="w-4 h-4" />
            Send to Back
          </button>
        </div>

        <button
          onClick={() => videoEditorStore.removeElement(element.id)}
          className="w-full btn-secondary flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
          Delete Element
        </button>
      </div>
    </div>
  );
});

export default ElementToolbar;