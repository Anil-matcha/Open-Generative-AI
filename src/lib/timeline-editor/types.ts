export type AssetType = 'video' | 'image' | 'audio' | 'adjustment'

export interface AssetTake {
  url: string
  path: string
  thumbnail?: string
  createdAt: number
}

export interface Asset {
  id: string
  type: AssetType
  path: string
  url: string
  prompt?: string
  resolution?: string
  duration?: number
  createdAt: number
  thumbnail?: string
  favorite?: boolean
  bin?: string
  generationParams?: GenerationParams
  takes?: AssetTake[]
  activeTakeIndex?: number
  colorLabel?: string
}

export interface GenerationParams {
  mode: 'text-to-video' | 'image-to-video' | 'audio-to-video' | 'text-to-image' | 'retake' | 'ic-lora'
  prompt: string
  model: string
  duration: number
  resolution: string
  fps: number
  audio: boolean
  cameraMotion: string
  imageAspectRatio?: string
  imageSteps?: number
  inputImageUrl?: string
  inputAudioUrl?: string
  retakeVideoPath?: string
  retakeStartTime?: number
  retakeDuration?: number
  retakeMode?: string
  icLoraVideoPath?: string
  icLoraConditioningType?: string
  icLoraConditioningStrength?: number
}

export type TransitionType = 'none' | 'dissolve' | 'fade-to-black' | 'fade-to-white' | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down'

export interface ClipTransition {
  type: TransitionType
  duration: number
}

export interface ColorCorrection {
  brightness: number
  contrast: number
  saturation: number
  temperature: number
  tint: number
  exposure: number
  highlights: number
  shadows: number
}

export const DEFAULT_COLOR_CORRECTION: ColorCorrection = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
}

export interface TimelineClip {
  id: string
  assetId: string | null
  type: 'video' | 'image' | 'audio' | 'adjustment' | 'text'
  startTime: number
  duration: number
  trimStart: number
  trimEnd: number
  speed: number
  reversed: boolean
  muted: boolean
  volume: number
  trackIndex: number
  asset: Asset | null
  importedUrl?: string
  importedName?: string
  flipH: boolean
  flipV: boolean
  transitionIn: ClipTransition
  transitionOut: ClipTransition
  colorCorrection: ColorCorrection
  opacity: number
  takeIndex?: number
  isRegenerating?: boolean
  linkedClipIds?: string[]
  colorLabel?: string
  effects?: ClipEffect[]
  letterbox?: LetterboxSettings
  textStyle?: TextOverlayStyle
}

export interface LetterboxSettings {
  enabled: boolean
  aspectRatio: '2.35:1' | '2.39:1' | '2.76:1' | '1.85:1' | '4:3' | 'custom'
  customRatio?: number
  color: string
  opacity: number
}

export const DEFAULT_LETTERBOX: LetterboxSettings = {
  enabled: false,
  aspectRatio: '2.35:1',
  color: '#000000',
  opacity: 100,
}

export type EffectType = 'blur' | 'sharpen' | 'glow' | 'vignette' | 'grain' | 'lut-cinematic' | 'lut-vintage' | 'lut-bw' | 'lut-cool' | 'lut-warm' | 'lut-muted' | 'lut-vivid'

export interface EffectMask {
  enabled: boolean
  shape: 'rectangle' | 'ellipse'
  x: number
  y: number
  width: number
  height: number
  feather: number
  invert: boolean
  rotation: number
}

export const DEFAULT_EFFECT_MASK: EffectMask = {
  enabled: false,
  shape: 'ellipse',
  x: 50,
  y: 50,
  width: 40,
  height: 40,
  feather: 20,
  invert: false,
  rotation: 0,
}

export interface ClipEffect {
  id: string
  type: EffectType
  enabled: boolean
  params: Record<string, number>
  mask?: EffectMask
}

export interface Track {
  id: string
  name: string
  muted: boolean
  locked: boolean
  solo?: boolean
  enabled?: boolean
  sourcePatched?: boolean
  type?: 'default' | 'subtitle'
  kind?: 'video' | 'audio'
  subtitleStyle?: Partial<SubtitleStyle>
  height?: number
  color?: string
  items?: any[]
  visible?: boolean
}

export interface SubtitleStyle {
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  color: string
  backgroundColor: string
  position: 'bottom' | 'top' | 'center'
  italic: boolean
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontSize: 32,
  fontFamily: 'sans-serif',
  fontWeight: 'normal',
  color: '#FFFFFF',
  backgroundColor: 'transparent',
  position: 'bottom',
  italic: false,
}

export interface SubtitleClip {
  id: string
  text: string
  startTime: number
  endTime: number
  trackIndex: number
  style?: Partial<SubtitleStyle>
}

export interface TextOverlayStyle {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle: 'normal' | 'italic'
  color: string
  backgroundColor: string
  textAlign: 'left' | 'center' | 'right'
  positionX: number
  positionY: number
  strokeColor: string
  strokeWidth: number
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  letterSpacing: number
  lineHeight: number
  maxWidth: number
  padding: number
  borderRadius: number
  opacity: number
}

export const DEFAULT_TEXT_STYLE: TextOverlayStyle = {
  text: 'Title Text',
  fontFamily: 'Inter, Arial, sans-serif',
  fontSize: 64,
  fontWeight: 'bold',
  fontStyle: 'normal',
  color: '#FFFFFF',
  backgroundColor: 'transparent',
  textAlign: 'center',
  positionX: 50,
  positionY: 50,
  strokeColor: 'transparent',
  strokeWidth: 0,
  shadowColor: 'rgba(0,0,0,0.5)',
  shadowBlur: 4,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  letterSpacing: 0,
  lineHeight: 1.2,
  maxWidth: 80,
  padding: 0,
  borderRadius: 0,
  opacity: 100,
}

export interface Timeline {
  id: string
  name: string
  createdAt: number
  tracks: Track[]
  clips: TimelineClip[]
  subtitles?: SubtitleClip[]
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  assets: Asset[]
  thumbnail?: string
  timelines: Timeline[]
  activeTimelineId?: string
}

export const DEFAULT_TRACKS: Track[] = [
  { id: 'track-v1', name: 'V1', muted: false, locked: false, sourcePatched: true, kind: 'video' },
  { id: 'track-v2', name: 'V2', muted: false, locked: false, sourcePatched: false, kind: 'video' },
  { id: 'track-v3', name: 'V3', muted: false, locked: false, sourcePatched: false, kind: 'video' },
  { id: 'track-a1', name: 'A1', muted: false, locked: false, sourcePatched: true, kind: 'audio' },
  { id: 'track-a2', name: 'A2', muted: false, locked: false, sourcePatched: false, kind: 'audio' },
]

export type ToolType = 'select' | 'move' | 'trim-left' | 'trim-right' | 'razor' | 'slit' | 'hand' | 'zoom' | 'text' | 'transition' | 'effect'

export const PRIMARY_TOOLS: ToolType[] = ['select', 'move', 'razor', 'slit', 'hand', 'zoom']
export const TRIM_TOOLS: ToolType[] = ['trim-left', 'trim-right']

export interface Gap {
  id: string
  trackIndex: number
  startTime: number
  endTime: number
  prompt: string
  status: 'pending' | 'generating' | 'complete' | 'error'
  videoUrl?: string
  error?: string
}

export interface LayoutPreset {
  id: string
  name: string
  layout: EditorLayout
}

export interface EditorLayout {
  leftPanelWidth: number
  rightPanelWidth: number
  timelineHeight: number
  assetsHeight: number
}

export const DEFAULT_LAYOUT: EditorLayout = {
  leftPanelWidth: 280,
  rightPanelWidth: 320,
  timelineHeight: 200,
  assetsHeight: 180,
}

export const LAYOUT_LIMITS = {
  leftPanelWidth: { min: 180, max: 480 },
  rightPanelWidth: { min: 200, max: 500 },
  timelineHeight: { min: 80, max: 400 },
  assetsHeight: { min: 80, max: 300 },
}