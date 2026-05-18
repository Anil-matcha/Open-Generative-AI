import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EditorProvider, useEditor } from '../lib/timeline-editor/editor-store'
import { useTimelineDrag } from '../lib/timeline-editor/useTimelineDrag'
import { usePlaybackEngine } from '../lib/timeline-editor/usePlaybackEngine'
import { useGapGeneration } from '../lib/timeline-editor/useGapGeneration'
import { useRegeneration } from '../lib/timeline-editor/useRegeneration'
import { useEditorKeyboard } from '../lib/timeline-editor/useEditorKeyboard'
import { DEFAULT_TRACKS, type TimelineClip, type Asset, type Project } from '../lib/timeline-editor/types'
import { TooltipWrapper } from '../components/timeline-editor/TooltipWrapper'
import { AssetsPanel } from '../components/timeline-editor/AssetsPanel'
import { ClipPropertiesPanel } from '../components/timeline-editor/ClipPropertiesPanel'
import { TimelineEditingPanel } from '../components/timeline-editor/TimelineEditingPanel'
import { muapi } from '../lib/muapi'
import { getKey } from '../lib/apiKeyManager'
import { supabase } from '../lib/supabase-client'

function EditorContent() {
  const { projectId, timelineId } = useParams<{ projectId: string; timelineId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [showAssetsPanel, setShowAssetsPanel] = useState(true)
  const [rightPanelWidth] = useState(320)
  
  const editor = useEditor()

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      if (projectId && projectId !== 'new') {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        
        if (error) throw error
        
        const loadedProject: Project = {
          id: data.id,
          name: data.name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          assets: data.assets || [],
          timelines: [{
            id: timelineId || data.active_timeline_id || 'timeline-1',
            name: 'Timeline 1',
            createdAt: Date.now(),
            tracks: DEFAULT_TRACKS,
            clips: [],
          }],
          activeTimelineId: timelineId || data.active_timeline_id || 'timeline-1',
        }
        setProject(loadedProject)
        editor.setState(loadedProject)
      } else {
        const mockProject: Project = {
          id: `project-${Date.now()}`,
          name: 'New Project',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          assets: [],
          timelines: [{
            id: timelineId || 'timeline-1',
            name: 'Timeline 1',
            createdAt: Date.now(),
            tracks: DEFAULT_TRACKS,
            clips: [],
          }],
          activeTimelineId: timelineId || 'timeline-1',
        }
        setProject(mockProject)
        editor.setState(mockProject)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const { draggingClip, handleClipMouseDown } = useTimelineDrag({
    clips: editor.clips,
    tracks: editor.tracks,
    onClipsChange: editor.setClips,
    onTimeChange: editor.setTime,
    snapEnabled: true,
  })

  const { isPlaying, currentTime, play, pause, seek, shuttle } = usePlaybackEngine({
    clips: editor.clips,
    tracks: editor.tracks,
    onTimeChange: editor.setTime,
  })

  const { selectedGap, gapPrompt, gapSettings, handleGapGenerate } = useGapGeneration({
    clips: editor.clips,
    tracks: editor.tracks,
    setClips: editor.setClips,
    onGenerate: async (params) => {
      const apiKey = getKey('muapi')
      if (!apiKey) {
        throw new Error('API key not configured')
      }
      const result = await muapi.generateVideo({
        apiKey,
        prompt: gapPrompt,
        duration: params.endTime - params.startTime,
        aspect_ratio: gapSettings.aspectRatio,
        resolution: '512x512',
      })
      if (result.url) {
        const newClip: TimelineClip = {
          id: `gap-${Date.now()}`,
          assetId: null,
          type: 'video',
          startTime: params.startTime,
          duration: params.endTime - params.startTime,
          trimStart: 0,
          trimEnd: params.endTime - params.startTime,
          speed: 1,
          reversed: false,
          muted: false,
          volume: 1,
          trackIndex: params.trackIndex,
          asset: {
            id: `temp-${Date.now()}`,
            type: 'video',
            path: result.url,
            url: result.url,
            duration: params.endTime - params.startTime,
            createdAt: Date.now(),
          },
          importedUrl: result.url,
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
        editor.addClip(newClip)
      }
    },
  })

  const { regeneratingClipId, handleRegenerate } = useRegeneration({
    clips: editor.clips,
    assets: project?.assets || [],
    setClips: editor.setClips,
    onRegenerate: async (params) => {
      const apiKey = getKey('muapi')
      if (!apiKey) {
        throw new Error('API key not configured')
      }
      const clip = editor.clips.find(c => c.id === params.clipId)
      if (!clip?.asset) {
        throw new Error('Clip has no asset')
      }
      const result = await muapi.generateVideo({
        apiKey,
        prompt: params.prompt,
        image_url: clip.asset.url,
        duration: clip.duration,
        mode: 'retake',
        retakeVideoPath: clip.asset.path,
        retakeStartTime: clip.trimStart,
        retakeDuration: clip.duration,
      })
      return { url: result.url, path: result.url }
    },
  })

  useEditorKeyboard({
    onUndo: editor.undo,
    onRedo: editor.redo,
    onZoomIn: editor.zoomIn,
    onZoomOut: editor.zoomOut,
    onFitToView: editor.fitToView,
    onPlayPause: isPlaying ? pause : play,
    onSelectAll: () => editor.selectClips(editor.clips.map(c => c.id)),
    onCopy: editor.copy,
    onPaste: editor.paste,
    onCut: editor.cut,
    onSetInPoint: editor.setInPoint,
    onSetOutPoint: editor.setOutPoint,
    onSelectTool: () => {},
    onSeekLeft: () => seek(Math.max(0, currentTime - 1)),
    onSeekRight: () => seek(currentTime + 1),
    onTrimLeft: () => {},
    onTrimRight: () => {},
  })

  const handleAddAsset = (asset: Asset) => {
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      assetId: asset.id,
      type: asset.type,
      startTime: currentTime,
      duration: asset.duration || 5,
      trimStart: 0,
      trimEnd: asset.duration || 5,
      speed: 1,
      reversed: false,
      muted: false,
      volume: 1,
      trackIndex: 0,
      asset: asset,
      flipH: false,
      flipV: false,
      transitionIn: { type: 'none', duration: 0 },
      transitionOut: { type: 'none', duration: 0 },
      colorCorrection: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        tint: 0,
        exposure: 0,
        highlights: 0,
        shadows: 0,
      },
      opacity: 100,
    }
    editor.addClip(newClip)
  }

  const handleDeleteClip = (clipId: string) => {
    editor.deleteClip(clipId)
  }

  const getSelectedClip = (): TimelineClip | null => {
    if (editor.selectedClipIds.size !== 1) return null
    const id = [...editor.selectedClipIds][0]
    return editor.clips.find(c => c.id === id) || null
  }

  const handleUpdateClip = (clipId: string, updates: Partial<TimelineClip>) => {
    editor.updateClip(clipId, updates)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      {showAssetsPanel && (
        <AssetsPanel
          assets={project?.assets || []}
          onAddAsset={handleAddAsset}
          onImportMedia={() => {}}
          onGenerateMedia={() => {}}
        />
      )}
      
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-slate-800 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <TooltipWrapper content="Go back">
              <button 
                onClick={() => navigate(-1)}
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                ← Back
              </button>
            </TooltipWrapper>
            <h1 className="font-semibold">{project?.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <TooltipWrapper content="Export project">
              <button 
                onClick={() => {
                  const data = editor.exportProject()
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${project?.name || 'project'}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-3 py-1 bg-cyan-500 rounded text-sm hover:bg-cyan-600"
              >
                Export
              </button>
            </TooltipWrapper>
            <TooltipWrapper content="Import project">
              <button 
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.json'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        try {
                          const data = JSON.parse(event.target?.result as string)
                          editor.importProject(data)
                        } catch (err) {
                          console.error('Failed to parse project file:', err)
                        }
                      }
                      reader.readAsText(file)
                    }
                  }
                  input.click()
                }}
                className="px-3 py-1 bg-slate-700 rounded text-sm hover:bg-slate-600"
              >
                Import
              </button>
            </TooltipWrapper>
          </div>
        </div>
        
        <TimelineEditingPanel
          clips={editor.clips}
          tracks={editor.tracks}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPlayPause={isPlaying ? pause : play}
          onSeek={seek}
          onZoomIn={editor.zoomIn}
          onZoomOut={editor.zoomOut}
          onFitToView={editor.fitToView}
          duration={project?.timelines?.[0]?.clips.reduce((max, clip) => Math.max(max, clip.startTime + clip.duration), 60) || 60}
        />
      </div>

      {getSelectedClip() && (
        <ClipPropertiesPanel
          selectedClip={getSelectedClip()}
          tracks={editor.tracks}
          rightPanelWidth={rightPanelWidth}
          onUpdateClip={handleUpdateClip}
          onDeleteClip={handleDeleteClip}
        />
      )}
    </div>
  )
}

export function VideoEditor() {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  )
}