import { useState, useCallback } from 'react'
import type { TimelineClip } from './types'

interface GapGenerationParams {
  trackIndex: number
  startTime: number
  endTime: number
  prompt: string
  settings: {
    aspectRatio: string
    duration: number
    motion: number
    style: string
  }
}

interface UseGapGenerationProps {
  clips: TimelineClip[]
  setClips: (clips: TimelineClip[]) => void
  onGenerate: (params: GapGenerationParams) => Promise<void>
}

export function useGapGeneration({
  clips,
  tracks,
  setClips,
  onGenerate,
}: UseGapGenerationProps) {
  const [selectedGap, setSelectedGap] = useState<{ trackIndex: number; startTime: number; endTime: number } | null>(null)
  const [gapPrompt, setGapPrompt] = useState('')
  const [gapSettings, setGapSettings] = useState({
    aspectRatio: '16:9',
    duration: 2,
    motion: 5,
    style: '',
  })
  const [generatingGap, setGeneratingGap] = useState(false)
  const [gapError, setGapError] = useState<string | null>(null)

  const handleGapGenerate = useCallback(async () => {
    if (!selectedGap || !gapPrompt.trim()) return

    setGeneratingGap(true)
    setGapError(null)

    try {
      await onGenerate({
        trackIndex: selectedGap.trackIndex,
        startTime: selectedGap.startTime,
        endTime: selectedGap.endTime,
        prompt: gapPrompt,
        settings: gapSettings,
      })
    } catch (error) {
      setGapError(error instanceof Error ? error.message : 'Generation failed')
    } finally {
      setGeneratingGap(false)
    }
  }, [selectedGap, gapPrompt, gapSettings, onGenerate])

  const insertGapClip = useCallback((
    trackIndex: number,
    startTime: number,
    endTime: number,
    generatedUrl: string
  ) => {
    const newClip: TimelineClip = {
      id: `gap-${Date.now()}`,
      assetId: null,
      type: 'video',
      startTime,
      duration: endTime - startTime,
      trimStart: 0,
      trimEnd: endTime - startTime,
      speed: 1,
      reversed: false,
      muted: false,
      volume: 1,
      trackIndex,
      asset: {
        id: `temp-${Date.now()}`,
        type: 'video',
        path: generatedUrl,
        url: generatedUrl,
        duration: endTime - startTime,
        createdAt: Date.now(),
      },
      importedUrl: generatedUrl,
      flipH: false,
      flipV: false,
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
      colorCorrection: {
        brightness: 0, contrast: 0, saturation: 0,
        temperature: 0, tint: 0, exposure: 0, highlights: 0, shadows: 0,
      },
      opacity: 100,
    }

    const newClips = [...clips]
    const insertIndex = newClips.findIndex(c => c.trackIndex === trackIndex && c.startTime > startTime)
    
    if (insertIndex !== -1) {
      newClips.splice(insertIndex, 0, newClip)
    } else {
      newClips.push(newClip)
    }

    setClips(newClips)
  }, [clips, setClips])

  const deleteGap = useCallback((trackIndex: number, startTime: number, endTime: number) => {
    const newClips = clips.filter(c => 
      !(c.trackIndex === trackIndex && c.startTime >= startTime && c.endTime <= endTime)
    )
    setClips(newClips)
  }, [clips, setClips])

  return {
    selectedGap,
    setSelectedGap,
    gapPrompt,
    setGapPrompt,
    gapSettings,
    setGapSettings,
    generatingGap,
    gapError,
    handleGapGenerate,
    insertGapClip,
    deleteGap,
  }
}