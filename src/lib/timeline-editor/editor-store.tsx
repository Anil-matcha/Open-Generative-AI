import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { Project, Timeline, TimelineClip, Track } from './types'
import { DEFAULT_TRACKS } from './types'

interface EditorState {
  project: Project | null
  currentTimelineId: string | null
  clips: TimelineClip[]
  tracks: Track[]
  currentTime: number
  isPlaying: boolean
  zoom: number
  selectedClipIds: Set<string>
  inPoint: number | null
  outPoint: number | null
  undoStack: TimelineClip[][]
  redoStack: TimelineClip[][]
  clipboard: TimelineClip[] | null
}

type EditorAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'SET_TIMELINE'; payload: Timeline }
  | { type: 'UPDATE_CLIP'; payload: { clipId: string; updates: Partial<TimelineClip> } }
  | { type: 'ADD_CLIP'; payload: TimelineClip }
  | { type: 'DELETE_CLIP'; payload: string }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SELECT_CLIP'; payload: string }
  | { type: 'SELECT_CLIPS'; payload: string[] }
  | { type: 'SET_IN_POINT'; payload: number | null }
  | { type: 'SET_OUT_POINT'; payload: number | null }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_CLIPS'; payload: TimelineClip[] }
  | { type: 'SET_TRACKS'; payload: Track[] }
  | { type: 'COPY' }
  | { type: 'PASTE' }
  | { type: 'CUT' }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'FIT_TO_VIEW' }

const initialState: EditorState = {
  project: null,
  currentTimelineId: null,
  clips: [],
  tracks: [],
  currentTime: 0,
  isPlaying: false,
  zoom: 1,
  selectedClipIds: new Set(),
  inPoint: null,
  outPoint: null,
  undoStack: [],
  redoStack: [],
  clipboard: null,
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        project: action.payload,
        clips: action.payload.timelines[0]?.clips || [],
        tracks: action.payload.timelines[0]?.tracks || [],
        currentTimelineId: action.payload.activeTimelineId || action.payload.timelines[0]?.id || null,
      }
    case 'SET_TIMELINE':
      return {
        ...state,
        clips: action.payload.clips,
        tracks: action.payload.tracks,
        currentTimelineId: action.payload.id,
      }
    case 'UPDATE_CLIP':
      return {
        ...state,
        clips: state.clips.map(c => c.id === action.payload.clipId ? { ...c, ...action.payload.updates } : c),
      }
    case 'ADD_CLIP':
      return {
        ...state,
        clips: [...state.clips, action.payload],
      }
    case 'DELETE_CLIP':
      return {
        ...state,
        clips: state.clips.filter(c => c.id !== action.payload),
        selectedClipIds: new Set([...state.selectedClipIds].filter(id => id !== action.payload)),
      }
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.payload }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.payload }
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(10, action.payload)) }
    case 'SELECT_CLIP':
      return { ...state, selectedClipIds: new Set([action.payload]) }
    case 'SELECT_CLIPS':
      return { ...state, selectedClipIds: new Set(action.payload) }
    case 'SET_IN_POINT':
      return { ...state, inPoint: action.payload }
    case 'SET_OUT_POINT':
      return { ...state, outPoint: action.payload }
    case 'SET_CLIPS':
      return { ...state, clips: action.payload }
    case 'SET_TRACKS':
      return { ...state, tracks: action.payload }
    case 'UNDO': {
      if (state.undoStack.length === 0) return state
      const prevClips = state.undoStack[state.undoStack.length - 1]
      return {
        ...state,
        clips: prevClips,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.clips],
      }
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state
      const nextClips = state.redoStack[state.redoStack.length - 1]
      return {
        ...state,
        clips: nextClips,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.clips],
      }
    }
    case 'COPY': {
      const selected = state.clips.filter(c => state.selectedClipIds.has(c.id))
      return { ...state, clipboard: selected }
    }
    case 'PASTE': {
      if (!state.clipboard) return state
      const newClips = state.clipboard.map(clip => ({
        ...clip,
        id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: state.currentTime,
      }))
      return {
        ...state,
        clips: [...state.clips, ...newClips],
        selectedClipIds: new Set(newClips.map(c => c.id)),
      }
    }
    case 'CUT': {
      const cutClips = state.clips.filter(c => state.selectedClipIds.has(c.id))
      if (cutClips.length === 0) return state
      return {
        ...state,
        clips: state.clips.filter(c => !state.selectedClipIds.has(c.id)),
        clipboard: cutClips,
        selectedClipIds: new Set(),
      }
    }
    case 'ZOOM_IN':
      return { ...state, zoom: Math.min(10, state.zoom + 0.1) }
    case 'ZOOM_OUT':
      return { ...state, zoom: Math.max(0.1, state.zoom - 0.1) }
    case 'FIT_TO_VIEW':
      return { ...state, zoom: 1 }
    case 'EXPORT_PROJECT':
      return { ...state, exportData: action.payload }
  }
}

interface EditorContextValue extends EditorState {
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void
  addClip: (clip: TimelineClip) => void
  deleteClip: (clipId: string) => void
  selectClip: (clipId: string | null) => void
  selectClips: (clipIds: string[]) => void
  setTime: (time: number) => void
  setPlaying: (playing: boolean) => void
  setZoom: (zoom: number) => void
  setInPoint: (point: number | null) => void
  setOutPoint: (point: number | null) => void
  getSelectedClip: () => TimelineClip | null
  undo: () => void
  redo: () => void
  copy: () => void
  paste: () => void
  cut: () => void
  zoomIn: () => void
  zoomOut: () => void
  fitToView: () => void
  setState: (project: Project) => void
  exportProject: () => any
  importProject: (data: any) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const updateClip = useCallback((clipId: string, updates: Partial<TimelineClip>) => {
    dispatch({ type: 'UPDATE_CLIP', payload: { clipId, updates } })
  }, [])

  const addClip = useCallback((clip: TimelineClip) => {
    dispatch({ type: 'ADD_CLIP', payload: clip })
  }, [])

  const deleteClip = useCallback((clipId: string) => {
    dispatch({ type: 'DELETE_CLIP', payload: clipId })
  }, [])

  const selectClip = useCallback((clipId: string | null) => {
    dispatch({ type: 'SELECT_CLIP', payload: clipId || '' })
  }, [])

  const selectClips = useCallback((clipIds: string[]) => {
    dispatch({ type: 'SELECT_CLIPS', payload: clipIds })
  }, [])

  const setTime = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', payload: time })
  }, [])

  const setPlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_PLAYING', payload: playing })
  }, [])

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom })
  }, [])

  const setInPoint = useCallback((point: number | null) => {
    dispatch({ type: 'SET_IN_POINT', payload: point })
  }, [])

  const setOutPoint = useCallback((point: number | null) => {
    dispatch({ type: 'SET_OUT_POINT', payload: point })
  }, [])

  const getSelectedClip = useCallback(() => {
    if (state.selectedClipIds.size !== 1) return null
    const id = [...state.selectedClipIds][0]
    return state.clips.find(c => c.id === id) || null
  }, [state.selectedClipIds, state.clips])

  const pushUndo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const pushRedo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [])

  const copy = useCallback(() => {
    dispatch({ type: 'COPY' })
  }, [])

  const paste = useCallback(() => {
    dispatch({ type: 'PASTE' })
  }, [])

  const cut = useCallback(() => {
    dispatch({ type: 'CUT' })
  }, [])

  const zoomIn = useCallback(() => {
    dispatch({ type: 'ZOOM_IN' })
  }, [])

  const zoomOut = useCallback(() => {
    dispatch({ type: 'ZOOM_OUT' })
  }, [])

  const fitToView = useCallback(() => {
    dispatch({ type: 'FIT_TO_VIEW' })
  }, [])

  const exportProject = useCallback(() => {
    const data = {
      project: {
        name: state.project?.name,
        assets: state.project?.assets || [],
        settings: {
          fps: 30,
          duration: state.project?.timelines?.[0]?.clips.reduce((max, clip) => Math.max(max, clip.startTime + clip.duration), 60) || 60,
        },
        tracks: state.tracks,
        clips: state.clips,
      },
      clips: state.clips,
      settings: {
        zoom: state.zoom,
        currentTime: state.currentTime,
      },
    }
    return data
  }, [state])

  const importProject = useCallback((data: any) => {
    if (!data) return
    const projectData = {
      id: `project-${Date.now()}`,
      name: data.project?.name || 'Imported Project',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assets: data.project?.assets || [],
      timelines: [{
        id: 'timeline-1',
        name: 'Timeline 1',
        createdAt: Date.now(),
        tracks: data.project?.tracks || DEFAULT_TRACKS,
        clips: data.clips || [],
      }],
      activeTimelineId: 'timeline-1',
    }
    dispatch({ type: 'SET_PROJECT', payload: projectData })
  }, [])

  const setState = useCallback((project: Project) => {
    dispatch({ type: 'SET_PROJECT', payload: project })
  }, [])

  return (
    <EditorContext.Provider
      value={{
        ...state,
        updateClip,
        addClip,
        deleteClip,
        selectClip,
        selectClips,
        setTime,
        setPlaying,
        setZoom,
        setInPoint,
        setOutPoint,
        getSelectedClip,
        undo: pushUndo,
        redo: pushRedo,
        copy,
        paste,
        cut,
        zoomIn,
        zoomOut,
        fitToView,
        setState,
        exportProject,
        importProject,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export const useEditor = () => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}