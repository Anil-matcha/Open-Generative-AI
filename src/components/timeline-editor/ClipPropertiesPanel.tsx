import React, { useState } from 'react'
import { Trash2, Video, Eye, Contrast, Droplets, Thermometer, SunDim, RotateCcw, Palette, ChevronDown, ChevronRight, FlipHorizontal2, FlipVertical2 } from 'lucide-react'
import type { TimelineClip, Track, ColorCorrection } from '../lib/timeline-editor/types'
import { DEFAULT_COLOR_CORRECTION } from '../lib/timeline-editor/types'
import { TooltipWrapper } from './TooltipWrapper'

interface ClipPropertiesPanelProps {
  selectedClip: TimelineClip | null
  tracks: Track[]
  rightPanelWidth: number
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void
  onDeleteClip: (clipId: string) => void
}

export function ClipPropertiesPanel({ selectedClip, tracks, rightPanelWidth, onUpdateClip, onDeleteClip }: ClipPropertiesPanelProps) {
  const [showFlip, setShowFlip] = useState(false)
  const [showTransitions, setShowTransitions] = useState(false)
  const [showColorCorrection, setShowColorCorrection] = useState(false)

  if (!selectedClip) {
    return (
      <div className="flex-shrink-0 border-l border-slate-700 bg-slate-800 p-4 overflow-auto" style={{ width: rightPanelWidth }}>
        <div className="text-center py-8 text-slate-500">
          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No clip selected</p>
          <p className="text-xs mt-1">Select a clip to edit its properties</p>
        </div>
      </div>
    )
  }

  const handleColorCorrectionChange = (property: keyof ColorCorrection, value: number) => {
    onUpdateClip(selectedClip.id, {
      colorCorrection: {
        ...(selectedClip.colorCorrection || DEFAULT_COLOR_CORRECTION),
        [property]: value,
      },
    })
  }

  return (
    <div className="flex-shrink-0 border-l border-slate-700 bg-slate-900 p-4 overflow-auto" style={{ width: rightPanelWidth }}>
      <div className="mb-4">
        <h2 className="font-semibold text-sm mb-2">Clip Properties</h2>
        <p className="text-xs text-slate-400 truncate">{selectedClip.name || 'Untitled Clip'}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Duration</label>
          <p className="text-sm text-white">{selectedClip.duration.toFixed(2)}s</p>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Start Time</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={selectedClip.startTime.toFixed(2)}
              onChange={(e) => onUpdateClip(selectedClip.id, { startTime: parseFloat(e.target.value) || 0 })}
              min={0}
              step={0.1}
              className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white text-sm"
            />
            <span className="text-xs text-slate-500">sec</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Speed</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.25}
              max={4}
              step={0.25}
              value={selectedClip.speed || 1}
              onChange={(e) => onUpdateClip(selectedClip.id, { speed: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-white w-12 text-right">{(selectedClip.speed || 1).toFixed(2)}x</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Volume</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={selectedClip.volume ?? 1}
              onChange={(e) => onUpdateClip(selectedClip.id, { volume: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs text-white w-12 text-right">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">Visibility</span>
            <label className="switch ml-auto">
              <input
                type="checkbox"
                checked={!selectedClip.muted}
                onChange={(e) => onUpdateClip(selectedClip.id, { muted: !e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full relative transition-colors">
                <span className="absolute top-0.5 left-0.5 bottom-0.5 w-4 h-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></span>
              </div>
            </label>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedClip.reversed || false}
              onChange={(e) => onUpdateClip(selectedClip.id, { reversed: e.target.checked })}
              className="rounded bg-slate-800 border-slate-600"
            />
            <span className="text-sm text-slate-300">Reverse playback</span>
          </label>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <button
            className="flex items-center gap-2 w-full text-left text-sm text-slate-300 hover:text-white transition-colors mb-2"
            onClick={() => setShowFlip(!showFlip)}
          >
            {showFlip ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <FlipHorizontal2 className="h-4 w-4" />
            Flip
          </button>
          {showFlip && (
            <div className="space-y-2 pl-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClip.flipH || false}
                  onChange={(e) => onUpdateClip(selectedClip.id, { flipH: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-600"
                />
                <FlipHorizontal2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">Horizontal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClip.flipV || false}
                  onChange={(e) => onUpdateClip(selectedClip.id, { flipV: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-600"
                />
                <FlipVertical2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">Vertical</span>
              </label>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800">
          <button
            className="flex items-center gap-2 w-full text-left text-sm text-slate-300 hover:text-white transition-colors mb-2"
            onClick={() => setShowColorCorrection(!showColorCorrection)}
          >
            {showColorCorrection ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Palette className="h-4 w-4" />
            Color Correction
            {selectedClip.colorCorrection && Object.values(selectedClip.colorCorrection).some(v => v !== 0) && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </button>
          {showColorCorrection && (
            <div className="space-y-3 pl-5">
              <button
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                onClick={() => onUpdateClip(selectedClip.id, { colorCorrection: { ...DEFAULT_COLOR_CORRECTION } })}
              >
                <RotateCcw className="h-3 w-3" />
                Reset All
              </button>

              <ColorControl
                icon={Eye}
                label="Exposure"
                value={selectedClip.colorCorrection?.exposure || 0}
                onChange={(v) => handleColorCorrectionChange('exposure', v)}
              />
              <ColorControl
                icon={SunDim}
                label="Brightness"
                value={selectedClip.colorCorrection?.brightness || 0}
                onChange={(v) => handleColorCorrectionChange('brightness', v)}
              />
              <ColorControl
                icon={Contrast}
                label="Contrast"
                value={selectedClip.colorCorrection?.contrast || 0}
                onChange={(v) => handleColorCorrectionChange('contrast', v)}
              />
              <ColorControl
                icon={Droplets}
                label="Saturation"
                value={selectedClip.colorCorrection?.saturation || 0}
                onChange={(v) => handleColorCorrectionChange('saturation', v)}
              />
              <ColorControl
                icon={Thermometer}
                label="Temperature"
                value={selectedClip.colorCorrection?.temperature || 0}
                onChange={(v) => handleColorCorrectionChange('temperature', v)}
              />
            </div>
          )}
        </div>

        <TooltipWrapper content="Delete this clip">
          <button
            onClick={() => onDeleteClip(selectedClip.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete Clip
          </button>
        </TooltipWrapper>
      </div>
    </div>
  )
}

function ColorControl({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: React.ElementType
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-300">{label}</span>
        </div>
        <span className="text-xs text-slate-400 tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={-100}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 accent-blue-500"
      />
    </div>
  )
}