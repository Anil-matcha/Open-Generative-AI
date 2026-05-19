// netlify/functions/muapi-generate.js
const MUAPI_KEY = process.env.MUAPI_API_KEY;

export async function handler(event) {
  const body = JSON.parse(event.body);
  const res = await fetch('https://api.muapi.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': MUAPI_KEY
    },
    body: JSON.stringify(body)
  });
  return {
    statusCode: 200,
    body: JSON.stringify(await res.json())
  };
}