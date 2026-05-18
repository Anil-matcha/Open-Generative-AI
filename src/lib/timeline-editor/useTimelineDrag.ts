import { useState, useRef, useCallback, useEffect } from 'react'
import type { TimelineClip, Track } from './types'

interface UseTimelineDragProps {
  clips: TimelineClip[]
  tracks: Track[]
  onClipsChange: (clips: TimelineClip[]) => void
  onTimeChange: (time: number) => void
  snapEnabled: boolean
}

export function useTimelineDrag({
  clips,
  tracks,
  onClipsChange,
  onTimeChange,
  snapEnabled,
}: UseTimelineDragProps) {
  const [draggingClip, setDraggingClip] = useState<string | null>(null)
  const [resizingClip, setResizingClip] = useState<string | null>(null)
  const dragOffsetRef = useRef(0)
  const resizeStartRef = useRef<{ clipId: string; time: number; duration: number } | null>(null)

  const snapToTrack = useCallback((time: number, trackIndex: number) => {
    if (!snapEnabled) return time
    
    const track = tracks[trackIndex]
    if (!track || track.snapToGrid) return time
    
    const grid = 0.1
    return Math.round(time / grid) * grid
  }, [snapEnabled, tracks])

  const handleClipMouseDown = useCallback((clipId: string, clientX: number, trackIndex: number) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return
    
    const rect = (document.querySelector('.timeline-ruler') as HTMLElement)?.getBoundingClientRect()
    if (!rect) return
    
    const scrollLeft = (document.querySelector('.track-container') as HTMLElement)?.scrollLeft || 0
    const pixelsPerSecond = 100
    const time = (clientX - rect.left + scrollLeft) / pixelsPerSecond
    
    setDraggingClip(clipId)
    dragOffsetRef.current = clip.startTime - time
  }, [clips])

  const handleMouseMove = useCallback((clientX: number) => {
    if (!draggingClip) return
    
    const rect = (document.querySelector('.timeline-ruler') as HTMLElement)?.getBoundingClientRect()
    if (!rect) return
    
    const scrollLeft = (document.querySelector('.track-container') as HTMLElement)?.scrollLeft || 0
    const pixelsPerSecond = 100
    const rawTime = (clientX - rect.left + scrollLeft) / pixelsPerSecond
    const snappedTime = snapToTrack(rawTime, 0)
    
    const clip = clips.find(c => c.id === draggingClip)
    if (!clip) return
    
    const newClips = [...clips]
    const clipIndex = newClips.findIndex(c => c.id === draggingClip)
    if (clipIndex !== -1) {
      newClips[clipIndex] = { ...clip, startTime: snappedTime }
      onClipsChange(newClips)
    }
  }, [draggingClip, clips, snapToTrack, onClipsChange])

  const handleMouseUp = useCallback(() => {
    setDraggingClip(null)
    setResizingClip(null)
    resizeStartRef.current = null
  }, [])

  const handleResizeStart = useCallback((clipId: string, edge: 'left' | 'right', clientX: number) => {
    const clip = clips.find(c => c.id === clipId)
    if (!clip) return
    
    const rect = (document.querySelector('.timeline-ruler') as HTMLElement)?.getBoundingClientRect()
    if (!rect) return
    
    const scrollLeft = (document.querySelector('.track-container') as HTMLElement)?.scrollLeft || 0
    const pixelsPerSecond = 100
    const time = (clientX - rect.left + scrollLeft) / pixelsPerSecond
    
    setResizingClip(clipId)
    resizeStartRef.current = { clipId, time, duration: clip.duration }
  }, [clips])

  const handleResizeMove = useCallback((clientX: number) => {
    if (!resizingClip || !resizeStartRef.current) return
    
    const rect = (document.querySelector('.timeline-ruler') as HTMLElement)?.getBoundingClientRect()
    if (!rect) return
    
    const scrollLeft = (document.querySelector('.track-container') as HTMLElement)?.scrollLeft || 0
    const pixelsPerSecond = 100
    const newTime = (clientX - rect.left + scrollLeft) / pixelsPerSecond
    
    const clip = clips.find(c => c.id === resizingClip)
    if (!clip) return
    
    const newClips = [...clips]
    const clipIndex = newClips.findIndex(c => c.id === resizingClip)
    if (clipIndex === -1) return
    
    if (resizeStartRef.current.time < newTime) {
      newClips[clipIndex] = {
        ...clip,
        duration: newTime - clip.startTime,
        trimEnd: clip.trimEnd - (newTime - clip.startTime - clip.duration),
      }
    } else {
      newClips[clipIndex] = {
        ...clip,
        startTime: newTime,
        duration: clip.end - newTime,
        trimStart: clip.trimStart + (clip.startTime - newTime),
      }
    }
    
    onClipsChange(newClips)
  }, [resizingClip, clips, onClipsChange])

  useEffect(() => {
    if (draggingClip || resizingClip) {
      document.addEventListener('mousemove', handleMouseMove as any)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingClip, resizingClip, handleMouseMove, handleMouseUp])

  return {
    draggingClip,
    resizingClip,
    handleClipMouseDown,
    handleResizeStart,
    handleResizeMove,
  }
}