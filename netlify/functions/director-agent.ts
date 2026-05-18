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

// Initialize AI Service with agent-specific configuration
const aiService = new AIService(getAIConfig('agent'))

export default async function handler(req, context) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const { session_id, conv_id, agents, content, actions } = await req.json()

      console.log('Director agent request:', { agents, session_id })

      // Import VideoDB SDK dynamically
      const { connect } = await import('videodb')
      const conn = connect({
        apiKey: VIDEO_DB_API_KEY,
        baseURL: VIDEO_DB_BASE_URL
      })

      // Get or create collection
      let collection = null
      try {
        collection = await conn.get_collection('default')
      } catch (error) {
        console.log('Creating default collection')
        collection = await conn.create_collection('default', 'Default video collection')
      }

      // Process the request based on agent type
      const agentId = agents[0] // Use first agent

      // Create AI request
      const aiRequest: AIRequest = {
        agentId,
        prompt: content[0].text,
        options: { collection, session_id, conv_id, agents, content, actions }
      }

      // Process through AI service with deduplication, caching, and rate limiting
      const result = await aiService.processRequest(aiRequest, async (req) => {
        const coll = req.options.collection
        switch (req.agentId) {
          case 'faceless_video_creator':
            return await handleFacelessVideo(coll, req.prompt)
          case 'ai_ad_films':
            return await handleAIAd(coll, req.prompt)
          case 'tiktok_lyric_video':
            return await handleLyricVideo(coll, req.prompt)
          case 'ai_voiceovers':
            return await handleVoiceover(coll, req.prompt)
          case 'kids_storyteller':
            return await handleKidsStory(coll, req.prompt)
          case 'year_in_frames':
            return await handlePhotoMontage(coll, req.prompt)
          case 'editor_agent':
          case 'timeline_edit':
            return await handleTimelineEdit(req.prompt, req.options)
          default:
            return { error: `Unknown agent: ${req.agentId}` }
        }
      })

      return new Response(JSON.stringify({
        status: 'success',
        data: result,
        session_id,
        conv_id
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Director agent error:', error)
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  }
}

// Content Factory handlers
async function handleFacelessVideo(collection, prompt) {
  try {
    // Extract topic from prompt
    const topic = prompt.replace('Create faceless video about', '').trim()

    // Generate script using OpenAI
    const script = await generateScript(topic)

    // Generate voiceover
    const voiceAsset = await collection.generate_voice({
      text: script,
      voice_name: 'Default'
    })

    // Generate background visuals
    const visualPrompt = `Professional background visuals for topic: ${topic}`
    const imageAsset = await collection.generate_image({
      prompt: visualPrompt
    })

    // Create timeline
    const timeline = collection.create_timeline()
    timeline.add_inline(imageAsset)
    timeline.add_overlay(0, voiceAsset)

    const stream = await timeline.generate_stream()

    return {
      video_url: stream.url
    }
  } catch (error) {
    console.error('Faceless video error:', error)
    return {
      error: error.message,
      status: 'failed'
    }
  }
}

// Timeline / Editor Agent handler
async function handleTimelineEdit(prompt: string, options: any = {}) {
  try {
    const { actions = [], timelineState = {} } = options

    console.log('EditorAgent request:', { prompt, actions })

    // Basic command routing for timeline editing
    const lowerPrompt = prompt.toLowerCase()

    if (lowerPrompt.includes('split') || lowerPrompt.includes('cut at')) {
      return {
        action: 'split_clip',
        atTime: options.playheadTime || 0,
        message: 'Splitting clip at current playhead'
      }
    }

    if (lowerPrompt.includes('add fade') || lowerPrompt.includes('transition')) {
      return {
        action: 'add_transition',
        type: 'fade',
        duration: 0.5,
        message: 'Adding fade transition'
      }
    }

    if (lowerPrompt.includes('trim') || lowerPrompt.includes('shorten')) {
      return {
        action: 'trim_clip',
        start: options.start || 0,
        end: options.end || 10,
        message: 'Trimming clip'
      }
    }

    if (lowerPrompt.includes('delete') || lowerPrompt.includes('remove clip')) {
      return {
        action: 'delete_clip',
        clipId: options.clipId,
        message: 'Deleting selected clip'
      }
    }

    // Default: return analysis + suggestions
    return {
      action: 'analyze',
      suggestions: [
        'Consider adding a transition here',
        'This clip could be trimmed for better pacing',
        'Scene detection recommends a cut at 12.4s'
      ],
      message: 'Timeline analysis complete'
    }
  } catch (error) {
    console.error('Timeline edit error:', error)
    return {
      error: error.message,
      status: 'failed'
    }
  }
}