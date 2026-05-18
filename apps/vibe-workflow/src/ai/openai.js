// OpenAI LLM client for prompt enhancement (Task 5 Step 2)
// Supports LLM nodes in workflow for text/prompt improvement
// Integrates with Vite env: VITE_OPENAI_KEY
// Fresh implementation, no Higgsfield duplication

const OPENAI_BASE_URL = 'https://api.openai.com/v1'

export async function enhancePrompt(prompt, model = 'gpt-4o-mini') {
  const apiKey = import.meta.env.VITE_OPENAI_KEY
  if (!apiKey) {
    throw new Error('VITE_OPENAI_KEY is not configured')
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a creative prompt engineer. Enhance user prompts for better image/video generation results. Make them detailed, vivid, and optimized.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI Error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

export async function callOpenAI(prompt, options = {}) {
  const apiKey = import.meta.env.VITE_OPENAI_KEY
  if (!apiKey) {
    throw new Error('VITE_OPENAI_KEY is not configured')
  }

  const { model = 'gpt-4o-mini', ...rest } = options

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      ...rest
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI Error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
