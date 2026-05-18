import React, { useState, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { TooltipWrapper } from './TooltipWrapper'

interface TimelineEditingPanelProps {
  clips: Array<{
    id: string
    startTime: number
    duration: number
    trackIndex: number
  }>
  tracks: Array<{
    id: string
    name: string
    type: string
  }>
  currentTime: number
  isPlaying: boolean
  onPlayPause: () => void
  onSeek: (time: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToView: () => void
  duration: number
}

export function TimelineEditingPanel({
  clips,
  tracks,
  currentTime,
  isPlaying,
  onPlayPause,
  onSeek,
  onZoomIn,
  onZoomOut,
  onFitToView,
  duration,
}: TimelineEditingPanelProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 })

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`
  }

  const handleMouseDown = (e: React.MouseEvent, clipId: string) => {
    setDraggingClipId(clipId)
    setDragStart({ x: e.clientX, time: currentTime })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingClipId) return
    const deltaX = e.clientX - dragStart.x
    const deltaTime = deltaX * 0.01
    onSeek(Math.max(0, dragStart.time + deltaTime))
  }

  const handleMouseUp = () => {
    setDraggingClipId(null)
  }

  const handleTimelineClick = (e: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect()
    if (!rect) return
    const percent = (e.clientX - rect.left) / rect.width
    onSeek(percent * duration)
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900">
      <div className="h-12 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <TooltipWrapper content="Play/Pause">
            <button
              onClick={onPlayPause}
              className="p-1.5 rounded hover:bg-slate-700"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Previous frame">
            <button className="p-1.5 rounded hover:bg-slate-700">
              <SkipBack className="h-4 w-4" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Next frame">
            <button className="p-1.5 rounded hover:bg-slate-700">
              <SkipForward className="h-4 w-4" />
            </button>
          </TooltipWrapper>
          <span className="text-sm text-slate-300">{formatTime(currentTime)}</span>
        </div>

        <div className="flex items-center gap-2">
          <TooltipWrapper content="Zoom in">
            <button onClick={onZoomIn} className="p-1.5 rounded hover:bg-slate-700">
              <ZoomIn className="h-4 w-4" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Zoom out">
            <button onClick={onZoomOut} className="p-1.5 rounded hover:bg-slate-700">
              <ZoomOut className="h-4 w-4" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper content="Fit to view">
            <button onClick={onFitToView} className="p-1.5 rounded hover:bg-slate-700">
              <Maximize className="h-4 w-4" />
            </button>
          </TooltipWrapper>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 p-4 overflow-auto" ref={timelineRef}>
          <div className="relative h-64">
            <div className="absolute inset-0 border border-slate-700 rounded">
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={handleTimelineClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <div className="h-8 border-b border-slate-600 sticky top-0 bg-slate-800 z-10">
                  <div className="relative h-8">
                    <div
                      className="absolute w-0.5 h-full bg-red-500"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="absolute -top-2 w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {clips.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      Drag assets from the library to start editing
                    </div>
                  ) : (
                    clips.map(clip => (
                      <div
                        key={clip.id}
                        className={`absolute h-12 bg-cyan-500/20 border border-cyan-500 rounded cursor-move ${
                          clip.id === draggingClipId ? 'border-cyan-400' : 'border-slate-600'
                        }`}
                        style={{
                          left: `${(clip.startTime / duration) * 100}%`,
                          width: `${(clip.duration / duration) * 100}%`,
                          top: `${clip.trackIndex * 45}px`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, clip.id)}
                      >
                        <div className="p-2 text-xs">
                          Clip {clip.id.slice(-4)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}