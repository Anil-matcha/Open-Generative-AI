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
    const { scriptText, genre = 'drama' } = JSON.parse(event.body);

    if (!scriptText) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Missing required field: scriptText is required'
        })
      };
    }

    const systemPrompt = `You are CutAI, an expert film director and cinematographer AI. You analyze scripts and break them into detailed, filmable scenes with professional shot-by-shot breakdowns.

You MUST respond ONLY in valid JSON matching the provided schema. No markdown, no explanation, no preamble. Just pure JSON.

For each scene, think like a real director:
- Choose camera angles that serve the story's emotion
- Vary shot types to create visual rhythm
- Match mood scores to the narrative tension
- Suggest soundtrack vibes that enhance the atmosphere

For SD prompts: Write them as detailed visual descriptions optimized for Stable Diffusion 1.5. Include art style, lighting, color palette, composition. Example: "cinematic wide shot, dimly lit jazz bar, warm amber lighting, smoke haze, 1940s noir aesthetic, film grain, 35mm photography"`;

    const jsonSchema = `{
  "title": "string",
  "genre": "string",
  "logline": "string (one-sentence summary)",
  "total_duration_seconds": "integer",
  "scenes": [
    {
      "scene_number": "integer",
      "title": "string",
      "location": "string (e.g. INT. COFFEE SHOP - NIGHT)",
      "time_of_day": "dawn|morning|afternoon|evening|night",
      "description": "string (full scene description)",
      "characters": ["string"],
      "shots": [
        {
          "shot_number": "integer",
          "shot_type": "wide|close-up|medium|over-the-shoulder|POV|aerial|tracking",
          "camera_angle": "eye-level|low-angle|high-angle|dutch-angle|bird's-eye",
          "camera_movement": "static|pan-left|pan-right|tilt-up|tilt-down|dolly-in|dolly-out|crane",
          "description": "string (what the shot shows)",
          "dialogue": "string or null",
          "duration_seconds": "integer",
          "sd_prompt": "string (detailed visual prompt for Stable Diffusion 1.5, include art style, lighting, color palette)"
        }
      ],
      "mood": {
        "tension": "float (0.0-1.0)",
        "emotion": "float (0.0 sad - 1.0 joyful)",
        "energy": "float (0.0 calm - 1.0 intense)",
        "darkness": "float (0.0 light - 1.0 dark)",
        "overall_mood": "string (melancholic|thrilling|romantic|eerie|triumphant|etc)"
      },
      "soundtrack": {
        "genre": "string (ambient electronic|orchestral|lo-fi|jazz|synthwave|etc)",
        "tempo": "slow|moderate|fast",
        "instruments": ["string"],
        "reference_track": "string (Similar to: Artist - Track)",
        "energy_level": "float (0.0-1.0)"
      },
      "frame_image_path": null
    }
  ]
}`;

    const userPrompt = `Analyze this ${genre} script and break it into detailed scenes with shot-by-shot breakdowns.

SCRIPT:
${scriptText}

Respond with a single JSON object matching this EXACT schema:
${jsonSchema}

Requirements:
- Each scene MUST have at least 2 shots
- Each shot MUST have an sd_prompt optimized for Stable Diffusion 1.5
- All mood scores MUST be floats between 0.0 and 1.0
- All fields are required, dialogue can be null
- frame_image_path should be null`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0].message.content;

    // Parse and validate the JSON response
    let parsedScript;
    try {
      parsedScript = JSON.parse(responseContent);

      // Fill in any missing defaults
      if (parsedScript.scenes) {
        parsedScript.scenes.forEach(scene => {
          if (!scene.mood) {
            scene.mood = {
              tension: 0.5,
              emotion: 0.5,
              energy: 0.5,
              darkness: 0.5,
              overall_mood: 'neutral'
            };
          }
          if (!scene.soundtrack) {
            scene.soundtrack = {
              genre: 'ambient',
              tempo: 'moderate',
              instruments: ['piano'],
              reference_track: 'N/A',
              energy_level: 0.5
            };
          }
          if (!scene.frame_image_path) {
            scene.frame_image_path = null;
          }
        });
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Failed to parse LLM response as valid JSON');
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsedScript)
    };
  } catch (error) {
    console.error('CutAI script parsing error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Script parsing failed',
        message: error.message
      })
    };
  }
}