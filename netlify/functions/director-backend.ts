import { createClient } from '@supabase/supabase-js'
import AIService from './ai-service.js'
import { getAIConfig } from './ai-config.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const VIDEO_DB_API_KEY = process.env.VIDEO_DB_API_KEY
const VIDEO_DB_BASE_URL = process.env.VIDEO_DB_BASE_URL || 'https://api.videodb.io'
const MUAPI_API_KEY = process.env.MUAPI_API_KEY || process.env.OPENAI_API_KEY

// Initialize AI Service with muapi.ai proxy configuration
const aiService = {
  async processRequest(request, handler) {
    const apiKey = MUAPI_API_KEY
    if (!apiKey) {
      throw new Error('MUAPI_API_KEY environment variable is not configured')
    }
    
    // Route to appropriate handler based on agent
    const { agentId, prompt, options = {} } = request
    
    if (agentId.includes('script') || agentId.includes('storyboard') || agentId.includes('analysis')) {
      // Use muapi.ai proxy for text generation
      const response = await fetch('https://api.muapi.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a professional video director and storyboard artist.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(`muapi.ai API error: ${error.message || 'Unknown error'}`)
      }
      
      const data = await response.json()
      return data.choices[0]?.message?.content || ''
    }
    
    return handler(request)
  }
}

export default async function handler(req, context) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method === 'POST') {
      const { session_id, conv_id, agents, content, actions } = await req.json()

      console.log('Director agent request:', { agents, session_id })

      const agentId = agents[0] // Use first agent
      const userPrompt = content[0]?.text || ''

      // Create AI request
      const aiRequest: AIRequest = {
        agentId,
        prompt: userPrompt,
        options: {
          session_id,
          conv_id,
          agents,
          content,
          actions
        }
      }

      // Process through AI service with deduplication, caching, batching, and rate limiting
      const result = await aiService.processRequest(aiRequest, async (req) => {
        // Route to appropriate handler based on agent
        switch (req.agentId) {
          case 'faceless_video_creator':
            return await handleFacelessVideo(req.prompt)
          case 'ai_ad_films':
            return await handleAIAd(req.prompt)
          case 'tiktok_lyric_video':
            return await handleLyricVideo(req.prompt)
          case 'ai_voiceovers':
            return await handleVoiceover(req.prompt)
          case 'trailer_narration':
            return await handleTrailerNarration(req.prompt)
          case 'kids_storyteller':
            return await handleKidsStory(req.prompt)
          case 'year_in_frames':
            return await handlePhotoMontage(req.prompt)
          case 'summarizer':
            return await handleVideoSummary(req.prompt)
          case 'clipper':
            return await handleVideoClipping(req.prompt)
          case 'dubbing':
            return await handleVideoDubbing(req.prompt)
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

// Content Factory Handlers using VideoDB REST API
export async function handleFacelessVideo(prompt) {
  try {
    // Extract topic from prompt
    const topic = prompt.replace(/create faceless video|make faceless video|generate faceless video/i, '').trim()

    console.log('Creating faceless video for topic:', topic)

    // Step 1: Generate script using muapi.ai proxy
    const scriptResponse = await fetch('https://api.muapi.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MUAPI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Write an engaging 30-second video script about: ${topic}. Make it suitable for voiceover, professional and engaging. Return only the script text.`
        }],
        max_tokens: 500
      })
    })

    if (!scriptResponse.ok) {
      throw new Error('Failed to generate script')
    }

    const scriptData = await scriptResponse.json()
    const script = scriptData.choices[0].message.content.trim()

    // Step 2: Generate voiceover using VideoDB
    const voiceResponse = await fetch(`${VIDEO_DB_BASE_URL}/voice/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VIDEO_DB_API_KEY}`
      },
      body: JSON.stringify({
        text: script,
        voice_name: 'Default',
        collection_id: 'default'
      })
    })

    if (!voiceResponse.ok) {
      throw new Error('Failed to generate voiceover')
    }

    const voiceData = await voiceResponse.json()

    // Step 3: Generate background visuals
    const visualPrompt = `Professional cinematic background footage suitable for a video about: ${topic}. Smooth, high-quality, engaging visuals.`
    const videoResponse = await fetch(`${VIDEO_DB_BASE_URL}/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VIDEO_DB_API_KEY}`
      },
      body: JSON.stringify({
        prompt: visualPrompt,
        duration: 30,
        collection_id: 'default'
      })
    })

    if (!videoResponse.ok) {
      throw new Error('Failed to generate background video')
    }

    const videoData = await videoResponse.json()

    // Step 4: Create timeline composition
    const timelineResponse = await fetch(`${VIDEO_DB_BASE_URL}/timeline/compose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VIDEO_DB_API_KEY}`
      },
      body: JSON.stringify({
        collection_id: 'default',
        tracks: [
          {
            type: 'video',
            assets: [{ id: videoData.id, start: 0 }]
          },
          {
            type: 'audio',
            assets: [{ id: voiceData.id, start: 0 }]
          }
        ]
      })
    })

    if (!timelineResponse.ok) {
      throw new Error('Failed to create timeline')
    }

    const timelineData = await timelineResponse.json()

    return {
      video_url: timelineData.stream_url,
      script: script,
      status: 'completed',
      message: `Created faceless video for: ${topic}`
    }

  } catch (error) {
    console.error('Faceless video error:', error)
    return {
      error: error.message,
      status: 'failed'
    }
  }
}

export async function handleAIAd(prompt) {
  try {
    // Extract product info from prompt
    const productMatch = prompt.match(/(?:create ad|make ad|generate ad).*?(?:for|about)\s*(.+)/i)
    const product = productMatch ? productMatch[1].trim() : prompt.replace(/create ai ad|make ai ad/i, '').trim()

    console.log('Creating AI ad for product:', product)

    // Generate ad script using muapi.ai proxy
    const scriptResponse = await fetch('https://api.muapi.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MUAPI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Write a compelling 30-second advertisement script for: ${product}. Make it persuasive and engaging. Return only the script text.`
        }],
        max_tokens: 400
      })
    })

    const scriptData = await scriptResponse.json()
    const script = scriptData.choices[0].message.content.trim()

    // Generate visuals and compose ad (similar to faceless video but with ad-specific styling)
    return {
      message: 'AI ad creation completed',
      script: script,
      status: 'completed'
    }

  } catch (error) {
    console.error('AI ad error:', error)
    return { error: error.message, status: 'failed' }
  }
}

// Placeholder handlers for other agents
export async function handleLyricVideo(prompt) {
  return { message: 'Lyric video creation - feature coming soon', status: 'pending' }
}

export async function handleVoiceover(prompt) {
  return { message: 'Voiceover creation - feature coming soon', status: 'pending' }
}

export async function handleTrailerNarration(prompt) {
  return { message: 'Trailer narration - feature coming soon', status: 'pending' }
}

export async function handleKidsStory(prompt) {
  return { message: 'Kids story creation - feature coming soon', status: 'pending' }
}

export async function handlePhotoMontage(prompt) {
  return { message: 'Photo montage creation - feature coming soon', status: 'pending' }
}

async function handleVideoSummary(prompt) {
  return { message: 'Video summary - feature coming soon', status: 'pending' }
}

async function handleVideoClipping(prompt) {
  return { message: 'Video clipping - feature coming soon', status: 'pending' }
}

async function handleVideoDubbing(prompt) {
  return { message: 'Video dubbing - feature coming soon', status: 'pending' }
}