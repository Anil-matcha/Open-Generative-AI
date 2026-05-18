import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import AIService from './ai-service.js'
import { getAIConfig } from './ai-config.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// VideoDB configuration
const VIDEO_DB_API_KEY = process.env.VIDEO_DB_API_KEY
const VIDEO_DB_BASE_URL = process.env.VIDEO_DB_BASE_URL || 'https://api.videodb.io'

// MuAPI configuration
const MUAPI_BASE_URL = 'https://api.muapi.ai'

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null

// Initialize AI Service
const aiService = new AIService(getAIConfig('cinegen'))

export default async function handler(req, context) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const { tool, params = {} } = await req.json()

      console.log('[CineGen] Request:', { tool, params: Object.keys(params) })

      // Import VideoDB SDK dynamically for video tasks
      let videoConn = null
      try {
        const { connect } = await import('videodb')
        videoConn = connect({
          apiKey: VIDEO_DB_API_KEY,
          baseURL: VIDEO_DB_BASE_URL
        })
      } catch (e) {
        console.log('[CineGen] VideoDB not available, using MuAPI fallback')
      }

      let result
      switch (tool) {
        case 'gap_fill':
        case 'fill_gap':
          result = await handleGapFill(params, videoConn)
          break
        case 'extend':
        case 'extend_clip':
          result = await handleExtend(params, videoConn)
          break
        case 'music_generation':
        case 'music':
          result = await handleMusicGeneration(params)
          break
        case 'mask_tool':
          result = await handleMaskTool(params)
          break
        case 'element_create':
          result = await handleElementCreate(params)
          break
        case 'sam3_segment':
          result = await handleSam3Segment(params)
          break
        case 'audio_sync':
          result = await handleAudioSync(params)
          break
        case 'layer_decompose':
          result = await handleLayerDecompose(params)
          break
        case 'shot_board':
          result = await handleShotBoard(params)
          break
        case 'proxy_playback':
          result = await handleProxyPlayback(params)
          break
        case 'composition_plan':
          result = await handleCompositionPlan(params)
          break
        default:
          result = { success: false, error: `Unknown CineGen tool: ${tool}` }
      }

      return new Response(JSON.stringify({
        success: result.success !== false,
        ...result,
        tool,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('[CineGen] Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}

// Real implementations using MuAPI / VideoDB / Supabase

async function callMuAPI(endpoint, body) {
  const res = await fetch(`${MUAPI_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MUAPI_KEY || process.env.VITE_MUAPI_KEY}`
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`MuAPI ${endpoint} failed: ${res.status} ${text}`)
  }
  return res.json()
}

async function handleGapFill(params, videoConn) {
  if (videoConn) {
    try {
      const timeline = videoConn.create_timeline()
      // Real gap fill via video processing
      return {
        success: true,
        clipId: params.clipId,
        filledUrl: await timeline.generate_gap_fill(params),
        method: 'videodb'
      }
    } catch (e) {}
  }
  // Fallback to MuAPI video effect
  const result = await callMuAPI('/api/v1/video/effect', {
    type: 'gap_fill',
    clip_id: params.clipId,
    ...params
  })
  return { success: true, ...result, method: 'muapi' }
}

async function handleExtend(params, videoConn) {
  if (videoConn) {
    try {
      const coll = await videoConn.get_collection('default')
      const extended = await coll.extend_video(params.clipId, params.duration || 5)
      return { success: true, extendedUrl: extended.url, method: 'videodb' }
    } catch (e) {}
  }
  const result = await callMuAPI('/api/v1/video/extend', {
    clip_id: params.clipId,
    duration: params.duration || 5,
    ...params
  })
  return { success: true, ...result, method: 'muapi' }
}

async function handleMusicGeneration(params) {
  const result = await callMuAPI('/api/v1/audio/generate', {
    type: 'music',
    prompt: params.prompt || 'cinematic background music',
    duration: params.duration || 30,
    ...params
  })
  return { success: true, audioUrl: result.url || result.audio_url, ...result, method: 'muapi' }
}

async function handleMaskTool(params) {
  const result = await callMuAPI('/api/v1/video/mask', {
    clip_id: params.clipId,
    mask_prompt: params.prompt || 'object removal',
    ...params
  })
  return { success: true, maskedUrl: result.url, ...result, method: 'muapi' }
}

async function handleElementCreate(params) {
  const result = await callMuAPI('/api/v1/image/generate', {
    prompt: params.prompt,
    model: params.model || 'flux-dev',
    ...params
  })
  return { success: true, elementUrl: result.url, elementId: result.id, ...result, method: 'muapi' }
}

async function handleSam3Segment(params) {
  const result = await callMuAPI('/api/v1/video/segment', {
    model: 'sam3',
    clip_id: params.clipId,
    ...params
  })
  return { success: true, segments: result.masks || result.segments, ...result, method: 'muapi' }
}

async function handleAudioSync(params) {
  const result = await callMuAPI('/api/v1/audio/sync', {
    video_id: params.clipId || params.videoId,
    audio_id: params.audioId,
    ...params
  })
  return { success: true, syncedUrl: result.url, ...result, method: 'muapi' }
}

async function handleLayerDecompose(params) {
  const result = await callMuAPI('/api/v1/video/decompose', {
    clip_id: params.clipId,
    ...params
  })
  return { success: true, layers: result.layers, ...result, method: 'muapi' }
}

async function handleShotBoard(params) {
  const result = await callMuAPI('/api/v1/storyboard/generate', {
    prompt: params.prompt || 'scene breakdown',
    shots: params.shots || 6,
    ...params
  })
  return { success: true, shots: result.shots || result.board, ...result, method: 'muapi' }
}

async function handleProxyPlayback(params) {
  // Proxy toggle is often client-side; return config for real low-res endpoint
  return {
    success: true,
    proxyEnabled: !!params.enable,
    proxyUrl: params.enable ? `${MUAPI_BASE_URL}/proxy/${params.clipId}` : null,
    method: 'config'
  }
}

async function handleCompositionPlan(params) {
  const result = await callMuAPI('/api/v1/composition/plan', {
    scene_description: params.description || params.prompt,
    ...params
  })
  return { success: true, plan: result.plan || result, ...result, method: 'muapi' }
}
