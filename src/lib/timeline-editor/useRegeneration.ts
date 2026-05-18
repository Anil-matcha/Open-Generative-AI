import { useState, useCallback } from 'react'
import type { TimelineClip, GenerationParams } from './types'

interface UseRegenerationProps {
  clips: TimelineClip[]
  setClips: (clips: TimelineClip[]) => void
  onRegenerate: (params: GenerationParams) => Promise<{ url?: string; path?: string; error?: string }>
}

export function useRegeneration({
  clips,
  assets,
  setClips,
  onRegenerate,
}: UseRegenerationProps) {
  const [regeneratingClipId, setRegeneratingClipId] = useState<string | null>(null)
  const [i2vClipId, setI2vClipId] = useState<string | null>(null)
  const [i2vPrompt, setI2vPrompt] = useState('')
  const [i2vSettings, setI2vSettings] = useState({
    aspectRatio: '16:9',
    duration: 4,
    motion: 5,
  })
  const [regenProgress, setRegenProgress] = useState(0)
  const [regenStatusMessage, setRegenStatusMessage] = useState('')
  const [regenError, setRegenError] = useState<string | null>(null)
  const [regenPreError, setRegenPreError] = useState<string | null>(null)

  const handleRegenerate = useCallback(async (clipId: string, prompt: string, params: Partial<GenerationParams> = {}) => {
    const clip = clips.find(c => c.id === clipId)
    const asset = clip?.asset
    if (!clip || !asset) return

    setRegeneratingClipId(clipId)
    setRegenError(null)
    setRegenPreError(null)
    setRegenProgress(0)
    setRegenStatusMessage('Preparing generation...')

    try {
      const generationParams: GenerationParams = {
        mode: 'retake',
        prompt,
        model: 'ltx',
        duration: clip.duration,
        resolution: params.resolution || '512x512',
        fps: 30,
        audio: false,
        cameraMotion: params.cameraMotion || 'auto',
        retakeVideoPath: asset.path,
        retakeStartTime: clip.trimStart,
        retakeDuration: clip.duration,
        ...params,
      }

      const result = await onRegenerate(generationParams)

      if (result.error) {
        throw new Error(result.error)
      }

      setRegenStatusMessage('Updating clip...')

      const newClips = clips.map(c => {
        if (c.id === clipId) {
          return {
            ...c,
            importedUrl: result.url,
            isRegenerating: false,
            asset: {
              ...(c.asset || {}),
              url: result.url,
              path: result.path,
            },
          }
        }
        return c
      })

      setClips(newClips)
    } catch (error) {
      setRegenError(error instanceof Error ? error.message : 'Regeneration failed')
    } finally {
      setRegeneratingClipId(null)
      setRegenStatusMessage('')
    }
  }, [clips, onRegenerate, setClips])

  const handleCancelRegeneration = useCallback(() => {
    setRegeneratingClipId(null)
    setI2vClipId(null)
    setRegenProgress(0)
    setRegenStatusMessage('')
  }, [])

  const handleI2vGenerate = useCallback(async (clipId: string, prompt: string) => {
    setI2vClipId(clipId)
    setI2vPrompt(prompt)
    await handleRegenerate(clipId, prompt, { mode: 'image-to-video' })
  }, [handleRegenerate])

  const handleClipTakeChange = useCallback((clipId: string, takeIndex: number) => {
    const newClips = clips.map(c => {
      if (c.id === clipId) {
        const asset = c.asset
        if (asset?.takes && asset.takes[takeIndex]) {
          return {
            ...c,
            takeIndex,
            importedUrl: asset.takes[takeIndex].url,
            asset: { ...asset, url: asset.takes[takeIndex].url },
          }
        }
      }
      return c
    })
    setClips(newClips)
  }, [clips, setClips])

  const handleDeleteTake = useCallback((clipId: string, takeIndex: number) => {
    const clip = clips.find(c => c.id === clipId)
    const asset = clip?.asset
    if (!asset?.takes) return

    const newTakes = asset.takes.filter((_, i) => i !== takeIndex)
    const newClips = clips.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          asset: { ...asset, takes: newTakes },
          takeIndex: Math.min(c.takeIndex ?? 0, newTakes.length - 1),
        }
      }
      return c
    })
    setClips(newClips)
  }, [clips, setClips])

  return {
    regeneratingClipId,
    i2vClipId,
    i2vPrompt,
    setI2vPrompt,
    i2vSettings,
    setI2vSettings,
    regenProgress,
    regenStatusMessage,
    regenError,
    regenPreError,
    handleI2vGenerate,
    handleRegenerate,
    handleCancelRegeneration,
    handleClipTakeChange,
    handleDeleteTake,
  }
}