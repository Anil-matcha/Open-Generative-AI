import { useState, useRef, useEffect, useCallback } from 'react'
import type { TimelineClip } from './types'

interface UsePlaybackEngineProps {
  clips: TimelineClip[]
  onTimeChange: (time: number) => void
}

export function usePlaybackEngine({
  clips,
  onTimeChange,
}: UsePlaybackEngineProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [shuttleSpeed, setShuttleSpeed] = useState(0)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>()
  const videoPoolRef = useRef<Map<string, HTMLVideoElement>>(new Map())

  const getClipAtTime = useCallback((time: number): TimelineClip | null => {
    const videoClips = clips.filter(c => c.type !== 'audio' && c.type !== 'adjustment')
    const clipsAtTime = videoClips
      .map((clip, index) => ({ clip, index }))
      .filter(({ clip }) => time >= clip.startTime && time < clip.startTime + clip.duration)
    
    if (clipsAtTime.length === 0) return null
    
    clipsAtTime.sort((a, b) => b.clip.trackIndex - a.clip.trackIndex)
    return clipsAtTime[0].clip
  }, [clips])

  const playbackLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp
      animationRef.current = requestAnimationFrame(playbackLoop)
      return
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000
    lastTimeRef.current = timestamp

    if (shuttleSpeed !== 0) {
      const newTime = currentTime + deltaTime * shuttleSpeed
      const maxTime = Math.max(...clips.map(c => c.startTime + c.duration), 0)
      const clampedTime = Math.max(0, Math.min(newTime, maxTime))
      
      onTimeChange(clampedTime)
      setCurrentTime(clampedTime)
    }

    animationRef.current = requestAnimationFrame(playbackLoop)
  }, [currentTime, shuttleSpeed, clips, onTimeChange])

  useEffect(() => {
    if (isPlaying && shuttleSpeed !== 0) {
      animationRef.current = requestAnimationFrame(playbackLoop)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, shuttleSpeed, playbackLoop])

  const play = useCallback(() => {
    setIsPlaying(true)
    lastTimeRef.current = undefined as any
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
    setShuttleSpeed(0)
  }, [])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setShuttleSpeed(0)
    onTimeChange(0)
    setCurrentTime(0)
  }, [onTimeChange])

  const shuttle = useCallback((speed: number) => {
    setShuttleSpeed(speed)
    setIsPlaying(speed !== 0)
  }, [])

  const seek = useCallback((time: number) => {
    onTimeChange(time)
    setCurrentTime(time)
  }, [onTimeChange])

  const getVideoPool = useCallback(() => videoPoolRef.current, [])

  const preloadVideo = useCallback((url: string) => {
    if (videoPoolRef.current.has(url)) return videoPoolRef.current.get(url)!

    const video = document.createElement('video')
    video.src = url
    video.preload = 'auto'
    video.muted = true
    video.style.display = 'none'
    document.body.appendChild(video)
    videoPoolRef.current.set(url, video)
    return video
  }, [])

  return {
    isPlaying,
    currentTime,
    shuttleSpeed,
    play,
    pause,
    stop,
    shuttle,
    seek,
    getClipAtTime,
    getVideoPool,
    preloadVideo,
  }
}