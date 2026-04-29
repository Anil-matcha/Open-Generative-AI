import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const muapiKey = process.env.MUAPI_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function handler(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const pathParts = event.path.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    const secondLastPart = pathParts[pathParts.length - 2]

    switch (event.httpMethod) {
      case 'GET':
        if (secondLastPart === 'scenes') {
          // Get scenes for script
          const scriptId = event.queryStringParameters?.script_id
          if (!scriptId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'script_id query parameter required' })
            }
          }

          const { data, error } = await supabase
            .from('storyboarder_scenes')
            .select(`
              *,
              storyboarder_shots (*)
            `)
            .eq('script_id', scriptId)
            .order('scene_number', { ascending: true })

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          }
        }
        break

      case 'POST':
        if (lastPart === 'generate-image') {
          // Generate image for scene
          return await handleImageGeneration(event, headers)
        }
        break

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('Scenes API error:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    }
  }
}

async function handleImageGeneration(event, headers) {
  try {
    const body = JSON.parse(event.body)
    const { scene_id } = body

    if (!scene_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'scene_id is required' })
      }
    }

    // Get scene data
    const { data: scene, error: sceneError } = await supabase
      .from('storyboarder_scenes')
      .select('*')
      .eq('id', scene_id)
      .single()

    if (sceneError || !scene) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Scene not found' })
      }
    }

    // Get shots for this scene
    const { data: shots, error: shotsError } = await supabase
      .from('storyboarder_shots')
      .select('*')
      .eq('scene_id', scene_id)
      .order('shot_number', { ascending: true })

    if (shotsError) throw shotsError

    // Create detailed prompt for MuAPI
    const prompt = createStoryboardPrompt(scene, shots)

    // Generate image using MuAPI
    const imageResponse = await fetch('https://api.muapi.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muapiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: 'flux-dev',
        width: 1024,
        height: 576, // 16:9 aspect ratio for storyboards
        steps: 20,
        guidance_scale: 7.5,
        num_images: 1
      })
    })

    if (!imageResponse.ok) {
      const errorData = await imageResponse.text()
      throw new Error(`MuAPI request failed: ${errorData}`)
    }

    const imageData = await imageResponse.json()
    const imageUrl = imageData.images[0].url

    // Update scene with generated image URL
    const { error: updateError } = await supabase
      .from('storyboarder_scenes')
      .update({
        frame_image_path: imageUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', scene_id)

    if (updateError) throw updateError

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        image_url: imageUrl,
        scene_id,
        message: 'Storyboard image generated successfully'
      })
    }

  } catch (error) {
    console.error('Image generation error:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Image generation failed',
        message: error.message
      })
    }
  }
}

function createStoryboardPrompt(scene, shots) {
  let prompt = `Professional film storyboard image for scene ${scene.scene_number}: "${scene.title}"

Location: ${scene.location || 'Unknown'}
Time: ${scene.time_of_day || 'Day'}
Description: ${scene.description}

`

  // Add mood and atmosphere
  if (scene.mood_emotion) {
    prompt += `Mood: ${scene.mood_emotion}`
    if (scene.mood_energy > 0.7) prompt += ', high energy'
    if (scene.mood_tension > 0.7) prompt += ', tense atmosphere'
    if (scene.mood_darkness > 0.7) prompt += ', dark and moody'
    prompt += '. '
  }

  // Add characters
  if (scene.characters && scene.characters.length > 0) {
    prompt += `Characters: ${scene.characters.join(', ')}. `
  }

  // Add shot details
  if (shots && shots.length > 0) {
    const firstShot = shots[0]
    prompt += `Camera: ${firstShot.camera_angle || 'eye level'} ${firstShot.shot_type || 'medium shot'}. `
    if (firstShot.description) {
      prompt += `Action: ${firstShot.description}. `
    }
  }

  // Add cinematic styling
  prompt += `Cinematic lighting, professional storyboard style, detailed, high quality, film industry standard, clear composition, dramatic shadows, ${scene.mood_overall || 'balanced'} tone.`

  return prompt
}