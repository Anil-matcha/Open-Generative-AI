import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiApiKey = process.env.OPENAI_API_KEY
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
        if (lastPart === 'analyze') {
          // Analyze script endpoint
          return await handleScriptAnalysis(event, headers)
        } else {
          // List scripts for project
          const projectId = event.queryStringParameters?.project_id
          if (!projectId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'project_id query parameter required' })
            }
          }

          const { data, error } = await supabase
            .from('storyboarder_scripts')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          }
        }

      case 'POST':
        const body = JSON.parse(event.body)

        if (lastPart === 'analyze') {
          return await handleScriptAnalysis(event, headers)
        }

        // Create new script
        const { data, error } = await supabase
          .from('storyboarder_scripts')
          .insert([{
            project_id: body.project_id,
            title: body.title,
            genre: body.genre,
            raw_text: body.raw_text,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single()

        if (error) throw error

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(data)
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('Scripts API error:', error)

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

async function handleScriptAnalysis(event, headers) {
  try {
    const body = JSON.parse(event.body)
    const { text, genre, project_id } = body

    if (!text || !project_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'text and project_id are required' })
      }
    }

    // Step 1: Analyze script with OpenAI
    const analysisPrompt = `Analyze this script and break it down into scenes for storyboarding:

SCRIPT:
${text}

${genre ? `GENRE: ${genre}` : ''}

Please provide a JSON response with this structure:
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "Scene Title",
      "location": "INT/EXT LOCATION",
      "time_of_day": "DAY/NIGHT",
      "description": "Brief scene description",
      "characters": ["Character1", "Character2"],
      "mood": {
        "tension": 0.5,
        "emotion": "neutral",
        "energy": 0.7,
        "darkness": 0.3,
        "overall": "balanced"
      },
      "soundtrack": {
        "genre": "dramatic",
        "tempo": "moderate",
        "instruments": ["strings", "piano"],
        "energy": 0.6
      },
      "shots": [
        {
          "shot_number": 1,
          "shot_type": "MS",
          "camera_angle": "eye level",
          "description": "Character enters room",
          "duration_seconds": 3
        }
      ]
    }
  ]
}

Focus on visual storytelling and cinematic elements.`

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 4000
      })
    })

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed')
    }

    const openaiData = await openaiResponse.json()
    const analysisText = openaiData.choices[0].message.content

    // Parse the JSON response
    const analysis = JSON.parse(analysisText.replace(/```json\n?|\n?```/g, ''))

    // Step 2: Create script in database
    const { data: scriptData, error: scriptError } = await supabase
      .from('storyboarder_scripts')
      .insert([{
        project_id,
        title: `Analyzed Script - ${new Date().toLocaleDateString()}`,
        genre,
        raw_text: text,
        total_duration_seconds: analysis.scenes.reduce((total, scene) =>
          total + scene.shots.reduce((sceneTotal, shot) => sceneTotal + shot.duration_seconds, 0), 0
        ),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (scriptError) throw scriptError

    // Step 3: Create scenes and shots
    for (const sceneData of analysis.scenes) {
      const { data: sceneInsert, error: sceneError } = await supabase
        .from('storyboarder_scenes')
        .insert([{
          script_id: scriptData.id,
          scene_number: sceneData.scene_number,
          title: sceneData.title,
          location: sceneData.location,
          time_of_day: sceneData.time_of_day,
          description: sceneData.description,
          characters: sceneData.characters,
          mood_tension: sceneData.mood.tension,
          mood_emotion: sceneData.mood.emotion,
          mood_energy: sceneData.mood.energy,
          mood_darkness: sceneData.mood.darkness,
          mood_overall: sceneData.mood.overall,
          soundtrack_genre: sceneData.soundtrack.genre,
          soundtrack_tempo: sceneData.soundtrack.tempo,
          soundtrack_instruments: sceneData.soundtrack.instruments,
          soundtrack_energy: sceneData.soundtrack.energy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (sceneError) throw sceneError

      // Create shots for this scene
      if (sceneData.shots && sceneData.shots.length > 0) {
        const shotsToInsert = sceneData.shots.map(shot => ({
          scene_id: sceneInsert.id,
          shot_number: shot.shot_number,
          shot_type: shot.shot_type,
          camera_angle: shot.camera_angle,
          description: shot.description,
          duration_seconds: shot.duration_seconds,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const { error: shotsError } = await supabase
          .from('storyboarder_shots')
          .insert(shotsToInsert)

        if (shotsError) throw shotsError
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        script_id: scriptData.id,
        scenes_created: analysis.scenes.length,
        message: 'Script analyzed and scenes created successfully'
      })
    }

  } catch (error) {
    console.error('Script analysis error:', error)

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Script analysis failed',
        message: error.message
      })
    }
  }
}