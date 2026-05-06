import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { genre, premise, numScenes = 5 } = JSON.parse(event.body);

    if (!genre || !premise) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Missing required fields: genre and premise are required'
        })
      };
    }

    const systemPrompt = `You are CutAI, a creative screenwriter AI. Generate short, compelling scripts (${Math.max(numScenes - 1, 2)}-7 scenes) based on the user's genre/premise.

Write in standard screenplay format. Each scene should have:
- A clear slug line (INT/EXT. LOCATION - TIME)
- Action descriptions
- Character dialogue (if any)
- Visual moments that translate well to storyboard frames

Keep scripts under 2 pages. Focus on visual storytelling over heavy dialogue.
Write the screenplay text directly. Do NOT wrap it in JSON.`;

    const userPrompt = `Write a ${genre} script with ${Math.max(numScenes - 1, 2)} scenes based on this premise:

${premise}

Write the full screenplay text with proper slug lines, action, and dialogue.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const scriptText = completion.choices[0].message.content;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: scriptText,
        genre,
        premise,
        numScenes: Math.max(numScenes - 1, 2)
      })
    };
  } catch (error) {
    console.error('CutAI script generation error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Script generation failed',
        message: error.message
      })
    };
  }
}