// MuAPI client for image/video generation (Task 5 Step 1)
// Integrates with Vite env: VITE_MUAPI_KEY
// No duplication from Higgsfield - fresh vanilla impl

const MUAPI_BASE_URL = 'https://api.muapi.ai'

export async function generateImage(prompt, options = {}) {
  const apiKey = import.meta.env.VITE_MUAPI_KEY
  if (!apiKey) {
    throw new Error('VITE_MUAPI_KEY is not configured')
  }

  const response = await fetch(`${MUAPI_BASE_URL}/v1/generate/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      ...options
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MuAPI Image Error ${response.status}: ${errorText}`)
  }

  return response.json()
}

export async function generateVideo(prompt, options = {}) {
  const apiKey = import.meta.env.VITE_MUAPI_KEY
  if (!apiKey) {
    throw new Error('VITE_MUAPI_KEY is not configured')
  }

  const response = await fetch(`${MUAPI_BASE_URL}/v1/generate/video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      ...options
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MuAPI Video Error ${response.status}: ${errorText}`)
  }

  return response.json()
}

export async function callMuAPI(endpoint, payload) {
  const apiKey = import.meta.env.VITE_MUAPI_KEY
  if (!apiKey) {
    throw new Error('VITE_MUAPI_KEY is not configured')
  }

  const response = await fetch(`${MUAPI_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MuAPI Error ${response.status}: ${errorText}`)
  }

  return response.json()
}
