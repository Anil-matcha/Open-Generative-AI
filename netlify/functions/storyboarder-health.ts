import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function handler(event, context) {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('storyboarder_projects')
      .select('count', { count: 'exact', head: true })

    if (error) {
      throw error
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        status: 'healthy',
        service: 'ai-storyboarder-backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        supabase_connected: true,
        record_count: data || 0
      })
    }
  } catch (error) {
    console.error('Health check failed:', error)

    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        service: 'ai-storyboarder-backend',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
  }
}