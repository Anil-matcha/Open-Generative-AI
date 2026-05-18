import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, payload, useOpenAI = false } = await req.json()

    if (useOpenAI) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) throw new Error('OPENAI_API_KEY not configured')

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: payload.prompt || 'Generate workflow description' }],
          ...payload
        })
      })

      const result = await openaiResponse.json()
      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Proxy to MuAPI
    const muapiKey = Deno.env.get('MUAPI_KEY')
    if (!muapiKey) throw new Error('MUAPI_KEY not configured')

    const muapiResponse = await fetch(`https://api.muapi.ai${endpoint || '/v1/generate'}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${muapiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const result = await muapiResponse.json()

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
