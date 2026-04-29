import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
    const projectId = pathParts[pathParts.length - 1]

    switch (event.httpMethod) {
      case 'GET':
        if (projectId && projectId !== 'storyboarder-projects') {
          // Get single project
          const { data, error } = await supabase
            .from('storyboarder_projects')
            .select(`
              *,
              storyboarder_scripts (
                id,
                title,
                created_at,
                storyboarder_scenes (
                  id,
                  scene_number,
                  title,
                  frame_image_path
                )
              )
            `)
            .eq('id', projectId)
            .single()

          if (error) throw error

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
          }
        } else {
          // List all projects
          const { data, error } = await supabase
            .from('storyboarder_projects')
            .select(`
              *,
              storyboarder_scripts!inner (
                storyboarder_scenes (count)
              )
            `)
            .order('created_at', { ascending: false })

          if (error) throw error

          // Calculate scene counts
          const projectsWithCounts = data.map(project => ({
            ...project,
            scene_count: project.storyboarder_scripts?.[0]?.storyboarder_scenes?.[0]?.count || 0
          }))

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(projectsWithCounts)
          }
        }

      case 'POST':
        const body = JSON.parse(event.body)

        const { data, error } = await supabase
          .from('storyboarder_projects')
          .insert([{
            title: body.title,
            genre: body.genre,
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

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('storyboarder_projects')
          .delete()
          .eq('id', projectId)

        if (deleteError) throw deleteError

        return {
          statusCode: 204,
          headers,
          body: ''
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error('Projects API error:', error)

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