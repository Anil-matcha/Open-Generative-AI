import { useEffect, useRef } from 'react'
import type { ToolType } from './types'

interface UseEditorKeyboardProps {
  onUndo: () => void
  onRedo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToView: () => void
  onPlayPause: () => void
  onSelectAll: () => void
  onCopy: () => void
  onPaste: () => void
  onCut: () => void
  onSetInPoint: () => void
  onSetOutPoint: () => void
  onSelectTool: (tool: ToolType) => void
  onSeekLeft: () => void
  onSeekRight: () => void
  onTrimLeft: () => void
  onTrimRight: () => void
}

export function useEditorKeyboard({
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onPlayPause,
  onSelectAll,
  onCopy,
  onPaste,
  onCut,
  onSetInPoint,
  onSetOutPoint,
  onSelectTool,
  onSeekLeft,
  onSeekRight,
  onTrimLeft,
  onTrimRight,
}: UseEditorKeyboardProps) {
  const pressedKeysRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeysRef.current.add(e.key.toLowerCase())

      const meta = e.metaKey || e.ctrlKey
      const shift = e.shiftKey

      if (meta && e.key === 'z') {
        e.preventDefault()
        if (shift) {
          onRedo()
        } else {
          onUndo()
        }
        return
      }

      if (meta && e.key === 'y') {
        e.preventDefault()
        onRedo()
        return
      }

      if (meta && e.key === 'c') {
        e.preventDefault()
        onCopy()
        return
      }

      if (meta && e.key === 'v') {
        e.preventDefault()
        onPaste()
        return
      }

      if (meta && e.key === 'x') {
        e.preventDefault()
        onCut()
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          onPlayPause()
          break
        case 'A':
          if (meta) {
            e.preventDefault()
            onSelectAll()
          }
          break
        case 'I':
          if (shift) {
            e.preventDefault()
            onSetInPoint()
          }
          break
        case 'O':
          if (shift) {
            e.preventDefault()
            onSetOutPoint()
          }
          break
        case '1':
          e.preventDefault()
          onSelectTool('select')
          break
        case '2':
          e.preventDefault()
          onSelectTool('move')
          break
        case '3':
          e.preventDefault()
          onSelectTool('razor')
          break
        case '+':
          e.preventDefault()
          onZoomIn()
          break
        case '-':
          e.preventDefault()
          onZoomOut()
          break
        case '0':
          e.preventDefault()
          onFitToView()
          break
        case 'ArrowLeft':
          if (shift) {
            onSeekLeft()
          } else {
            onTrimLeft()
          }
          break
        case 'ArrowRight':
          if (shift) {
            onSeekRight()
          } else {
            onTrimRight()
          }
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeysRef.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    onUndo,
    onRedo,
    onZoomIn,
    onZoomOut,
    onFitToView,
    onPlayPause,
    onSelectAll,
    onCopy,
    onPaste,
    onCut,
    onSetInPoint,
    onSetOutPoint,
    onSelectTool,
    onSeekLeft,
    onSeekRight,
    onTrimLeft,
    onTrimRight,
  ])

  return { pressedKeys: pressedKeysRef.current }
}