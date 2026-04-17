import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

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
      let result = {}

      switch (agentId) {
        case 'faceless_video_creator':
          result = await handleFacelessVideo(collection, content[0].text)
          break
        case 'ai_ad_films':
          result = await handleAIAd(collection, content[0].text)
          break
        case 'tiktok_lyric_video':
          result = await handleLyricVideo(collection, content[0].text)
          break
        case 'ai_voiceovers':
          result = await handleVoiceover(collection, content[0].text)
          break
        case 'kids_storyteller':
          result = await handleKidsStory(collection, content[0].text)
          break
        case 'year_in_frames':
          result = await handlePhotoMontage(collection, content[0].text)
          break
        default:
          result = { error: `Unknown agent: ${agentId}` }
      }

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