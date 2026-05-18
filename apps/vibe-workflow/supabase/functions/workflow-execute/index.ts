import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { workflow, params } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get MuAPI key from secrets
    const muapiKey = Deno.env.get('MUAPI_KEY')
    if (!muapiKey) {
      throw new Error('MUAPI_KEY not configured')
    }

    // Execute workflow by calling MuAPI (example for image generation)
    const muapiResponse = await fetch('https://api.muapi.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${muapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params?.prompt || 'default prompt',
        workflow: workflow,
        ...params
      })
    })

    const result = await muapiResponse.json()

    // Store execution result in Supabase
    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        workflow_id: workflow.id || 'default',
        result: result,
        status: 'completed'
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, result, execution: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
