// OpenAI adapter
export async function generateOpenAI(prompt, options = {}) {
  const res = await fetch('/.netlify/functions/openai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...options })
  });
  return res.json();
}