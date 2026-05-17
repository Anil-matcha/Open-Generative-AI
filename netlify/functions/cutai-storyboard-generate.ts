const MUAPI_API_KEY = process.env.MUAPI_API_KEY || process.env.OPENAI_API_KEY;

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { projectId, genre, premise, scriptText, numScenes = 5, title } = JSON.parse(event.body);

    // If scriptText is provided, skip generation and use it directly
    let finalScriptText = scriptText;

    if (!finalScriptText) {
      if (!genre || !premise) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Either scriptText or genre + premise is required'
          })
        };
      }

      // Phase 1: Generate script using muapi.ai proxy
      const scriptPrompt = `You are CutAI, a creative screenwriter AI. Generate short, compelling scripts (${Math.max(numScenes - 1, 2)}-7 scenes) based on the user's genre/premise.

Write in standard screenplay format. Each scene should have:
- A clear slug line (INT./EXT. LOCATION - TIME)
- Action descriptions
- Character dialogue (if any)
- Visual moments that translate well to storyboard frames.

Keep scripts under 2 pages. Focus on visual storytelling over heavy dialogue.
Write the screenplay text directly. Do NOT wrap it in JSON.`;

      const scriptResponse = await fetch('https://api.muapi.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': MUAPI_API_KEY
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: scriptPrompt },
            { role: 'user', content: `Write a ${genre} script with ${Math.max(numScenes - 1, 2)} scenes based on this premise:\n\n${premise}\n\nWrite the full screenplay text with proper slug lines, action, and dialogue.` }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!scriptResponse.ok) {
        const error = await scriptResponse.json();
        throw new Error(`muapi.ai API error: ${error.message || 'Unknown error'}`);
      }

      const scriptData = await scriptResponse.json();
      finalScriptText = scriptData.choices[0]?.message?.content;
    }

    // Phase 2: Parse script into structured scenes
    const parsePrompt = `You are CutAI, an expert film director and cinematographer AI. You analyze scripts and break them into detailed, filmable scenes with professional shot-by-shot breakdowns.

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
      "location": "string",
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
        "emotion": "float (0.0-1.0)",
        "energy": "float (0.0-1.0)",
        "darkness": "float (0.0-1.0)",
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

    const parseCompletion = await fetch('https://api.muapi.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MUAPI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: parsePrompt },
            { role: 'user', content: `Analyze this ${genre || 'drama'} script and break it into detailed scenes with shot-by-shot breakdowns.\n\nSCRIPT:\n${finalScriptText}\n\nRespond with a single JSON object matching this EXACT schema:\n${jsonSchema}\n\nRequirements:\n- Each scene MUST have at least 3 shots\n- Each shot MUST have an sd_prompt optimized for Stable Diffusion 1.5\n- All mood scores MUST be floats between 0.0 and 1.0\n- All fields are required, dialogue can be null\n- frame_image_path should be null\n- total_duration_seconds should be realistic` }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    });

    if (!parseCompletion.ok) {
      const error = await parseCompletion.json();
      throw new Error(`muapi.ai API error: ${error.message || 'Unknown error'}`);
    }

    const parseData = await parseCompletion.json();
    let parsedScript;
    try {
      parsedScript = JSON.parse(parseData.choices[0]?.message?.content);
    } catch (e) {
      console.error('Failed to parse storyboard JSON:', e);
      throw new Error('AI returned invalid JSON for storyboard');
    }

    // Fill in any missing defaults with sensible values
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
        } else {
          scene.mood.tension = scene.mood.tension ?? 0.5;
          scene.mood.emotion = scene.mood.emotion ?? 0.5;
          scene.mood.energy = scene.mood.energy ?? 0.5;
          scene.mood.darkness = scene.mood.darkness ?? 0.5;
          scene.mood.overall_mood = scene.mood.overall_mood || 'neutral';
        }

        if (!scene.soundtrack) {
          scene.soundtrack = {
            genre: 'ambient',
            tempo: 'moderate',
            instruments: ['piano'],
            reference_track: 'N/A',
            energy_level: 0.5
          };
        } else {
          scene.soundtrack.genre = scene.soundtrack.genre || 'ambient';
          scene.soundtrack.tempo = scene.soundtrack.tempo || 'moderate';
          scene.soundtrack.instruments = scene.soundtrack.instruments || ['piano'];
          scene.soundtrack.reference_track = scene.soundtrack.reference_track || 'N/A';
          scene.soundtrack.energy_level = scene.soundtrack.energy_level ?? 0.5;
        }

        if (!scene.frame_image_path) {
          scene.frame_image_path = null;
        }
      });
    }

    // Phase 3: Refine SD prompts per scene
    for (let i = 0; i < parsedScript.scenes.length; i++) {
      const scene = parsedScript.scenes[i];
      for (let j = 0; j < scene.shots.length; j++) {
        const shot = scene.shots[j];
        if (shot.sd_prompt) {
          const refinedPrompt = await refineSdPrompt(shot.sd_prompt, scene);
          scene.shots[j] = { ...shot, sd_prompt: refinedPrompt };
        }
      }
    }

    // Final safety check
    if (!parsedScript.scenes || parsedScript.scenes.length === 0) {
      throw new Error('Storyboard generation failed to produce any scenes');
    }

    // Phase 4: Save to database
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const projectTitle = title || parsedScript.title || `${genre || 'Untitled'} Storyboard`;

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('storyboarder_projects')
      .insert([{
        title: projectTitle,
        genre: genre || parsedScript.genre || 'drama'
      }])
      .select()
      .single();

    if (projectError) throw projectError;

    // Create script
    const { data: script, error: scriptError } = await supabase
      .from('storyboarder_scripts')
      .insert([{
        project_id: project.id,
        title: parsedScript.title || projectTitle,
        genre: parsedScript.genre || genre || 'drama',
        logline: parsedScript.logline || '',
        raw_text: finalScriptText,
        total_duration_seconds: parsedScript.total_duration_seconds || 0
      }])
      .select()
      .single();

    if (scriptError) throw scriptError;

    // Create scenes and shots
    for (const sceneData of parsedScript.scenes) {
      const { data: scene, error: sceneError } = await supabase
        .from('storyboarder_scenes')
        .insert([{
          script_id: script.id,
          scene_number: sceneData.scene_number,
          title: sceneData.title,
          location: sceneData.location,
          time_of_day: sceneData.time_of_day,
          description: sceneData.description,
          characters: sceneData.characters || [],
          mood_tension: sceneData.mood?.tension ?? 0.5,
          mood_emotion: sceneData.mood?.emotion ?? 0.5,
          mood_energy: sceneData.mood?.energy ?? 0.5,
          mood_darkness: sceneData.mood?.darkness ?? 0.5,
          mood_overall: sceneData.mood?.overall_mood || 'neutral',
          soundtrack_genre: sceneData.soundtrack?.genre || 'ambient',
          soundtrack_tempo: sceneData.soundtrack?.tempo || 'moderate',
          soundtrack_instruments: sceneData.soundtrack?.instruments || ['piano'],
          soundtrack_reference: sceneData.soundtrack?.reference_track || 'N/A',
          soundtrack_energy: sceneData.soundtrack?.energy_level ?? 0.5
        }])
        .select()
        .single();

      if (sceneError) throw sceneError;

      // Create shots for this scene
      if (sceneData.shots && sceneData.shots.length > 0) {
        const shotsToInsert = sceneData.shots.map(shot => ({
          scene_id: scene.id,
          shot_number: shot.shot_number,
          shot_type: shot.shot_type || 'medium',
          camera_angle: shot.camera_angle || 'eye-level',
          camera_movement: shot.camera_movement || 'static',
          description: shot.description || '',
          dialogue: shot.dialogue || null,
          duration_seconds: shot.duration_seconds || 3,
          sd_prompt: shot.sd_prompt || ''
        }));

        await supabase
          .from('storyboarder_shots')
          .insert(shotsToInsert);
      }
    }

    // Return complete response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: project.id,
        script_id: script.id,
        title: parsedScript.title || projectTitle,
        genre: parsedScript.genre || genre || 'drama',
        logline: parsedScript.logline || '',
        num_scenes: parsedScript.scenes?.length || 0
      })
    };
  } catch (error) {
    console.error('CutAI storyboard generation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Storyboard generation failed',
        message: error.message
      })
    }
  }
}

async function refineSdPrompt(prompt: string, scene: Record<string, unknown>): Promise<string> {
  try {
    const refinementPrompt = `Enhance this Stable Diffusion prompt for an image depicting this scene: "${prompt}"

Scene context: ${scene.description || 'No description available'}
Location: ${scene.location || 'Unknown'}
Time: ${scene.time_of_day || 'Day'}
Mood: ${scene.mood?.overall_mood || 'Neutral'}

Create a vivid, cinematic description optimized for Stable Diffusion 1.5. Include:
- Art style (cinematic, photorealistic, etc.)
- Lighting (golden hour, dramatic shadows, etc.)
- Color palette
- Composition and framing

Return ONLY the enhanced prompt, nothing else.`;

    const completion = await fetch('https://api.muapi.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MUAPI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert at writing Stable Diffusion prompts.' },
          { role: 'user', content: refinementPrompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!completion.ok) {
      const error = await completion.json();
      throw new Error(`muapi.ai API error: ${error.message || 'Unknown error'}`);
    }

    const data = await completion.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('SD prompt refinement error:', error);
    return prompt; // Return original prompt on error
  }
}

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    const { projectId, genre, premise, scriptText, numScenes = 5, title } = JSON.parse(event.body);

    // If scriptText is provided, skip generation and use it directly
    let finalScriptText = scriptText;

    if (!finalScriptText) {
      if (!genre || !premise) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Either scriptText or genre + premise is required'
          })
        };
      }

      // Phase 1: Generate script using OpenAI
      const scriptPrompt = `You are CutAI, a creative screenwriter AI. Generate short, compelling scripts (${Math.max(numScenes - 1, 2)}-7 scenes) based on the user's genre/premise.

Write in standard screenplay format. Each scene should have:
- A clear slug line (INT/EXT. LOCATION - TIME)
- Action descriptions
- Character dialogue (if any)
- Visual moments that translate well to storyboard frames

Keep scripts under 2 pages. Focus on visual storytelling over heavy dialogue.
Write the screenplay text directly. Do NOT wrap it in JSON.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: scriptPrompt },
          { role: 'user', content: `Write a ${genre} script with ${Math.max(numScenes - 1, 2)} scenes based on this premise:\n\n${premise}\n\nWrite the full screenplay text with proper slug lines, action, and dialogue.` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      finalScriptText = completion.choices[0].message.content;
    }

    // Phase 2: Parse script into structured scenes
    const parsePrompt = `You are CutAI, an expert film director and cinematographer AI. You analyze scripts and break them into detailed, filmable scenes with professional shot-by-shot breakdowns.

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
      "location": "string",
      "time_of_day": "string",
      "description": "string",
      "characters": ["string"],
      "shots": [
        {
          "shot_number": "integer",
          "shot_type": "string",
          "camera_angle": "string",
          "camera_movement": "string",
          "description": "string",
          "dialogue": "string or null",
          "duration_seconds": "integer",
          "sd_prompt": "string"
        }
      ],
      "mood": {
        "tension": "float (0.0-1.0)",
        "emotion": "float (0.0-1.0)",
        "energy": "float (0.0-1.0)",
        "darkness": "float (0.0-1.0)",
        "overall_mood": "string"
      },
      "soundtrack": {
        "genre": "string",
        "tempo": "string",
        "instruments": ["string"],
        "reference_track": "string",
        "energy_level": "float (0.0-1.0)"
      },
      "frame_image_path": null
    }
  ]
}`;

    const parseCompletion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: parsePrompt },
        { role: 'user', content: `Analyze this ${genre || 'drama'} script and break it into detailed scenes with shot-by-shot breakdowns.\n\nSCRIPT:\n${finalScriptText}\n\nRespond with a single JSON object matching this EXACT schema:\n${jsonSchema}\n\nRequirements:\n- Each scene MUST have at least 2 shots\n- Each shot MUST have an sd_prompt optimized for Stable Diffusion 1.5\n- All mood scores MUST be floats between 0.0 and 1.0\n- All fields are required, dialogue can be null` }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const parsedScript = JSON.parse(parseCompletion.choices[0].message.content);

    // Fill in any missing defaults
    if (parsedScript.scenes) {
      parsedScript.scenes.forEach(scene => {
        if (!scene.mood) {
          scene.mood = { tension: 0.5, emotion: 0.5, energy: 0.5, darkness: 0.5, overall_mood: 'neutral' };
        }
        if (!scene.soundtrack) {
          scene.soundtrack = { genre: 'ambient', tempo: 'moderate', instruments: ['piano'], reference_track: 'N/A', energy_level: 0.5 };
        }
        if (!scene.frame_image_path) {
          scene.frame_image_path = null;
        }
      });
    }

    // Phase 3: Refine SD prompts per scene
    for (let i = 0; i < parsedScript.scenes.length; i++) {
      const scene = parsedScript.scenes[i];
      for (let j = 0; j < scene.shots.length; j++) {
        const shot = scene.shots[j];
        if (shot.sd_prompt) {
          const refinedPrompt = await refineSdPrompt(shot.sd_prompt, scene);
          scene.shots[j] = { ...shot, sd_prompt: refinedPrompt };
        }
      }
    }

    // Phase 4: Save to database
    const projectTitle = title || parsedScript.title || `${genre || 'Untitled'} Storyboard`;

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('storyboarder_projects')
      .insert([{
        title: projectTitle,
        genre: genre || parsedScript.genre || 'drama'
      }])
      .select()
      .single();

    if (projectError) throw projectError;

    // Create script
    const { data: script, error: scriptError } = await supabase
      .from('storyboarder_scripts')
      .insert([{
        project_id: project.id,
        title: parsedScript.title || projectTitle,
        genre: parsedScript.genre || genre || 'drama',
        logline: parsedScript.logline || '',
        raw_text: finalScriptText,
        total_duration_seconds: parsedScript.total_duration_seconds || 0
      }])
      .select()
      .single();

    if (scriptError) throw scriptError;

    // Create scenes and shots
    for (const sceneData of parsedScript.scenes) {
      const { data: scene, error: sceneError } = await supabase
        .from('storyboarder_scenes')
        .insert([{
          script_id: script.id,
          scene_number: sceneData.scene_number,
          title: sceneData.title,
          location: sceneData.location,
          time_of_day: sceneData.time_of_day,
          description: sceneData.description,
          characters: sceneData.characters || [],
          mood_tension: sceneData.mood?.tension ?? 0.5,
          mood_emotion: sceneData.mood?.emotion ?? 0.5,
          mood_energy: sceneData.mood?.energy ?? 0.5,
          mood_darkness: sceneData.mood?.darkness ?? 0.5,
          mood_overall: sceneData.mood?.overall_mood || 'neutral',
          soundtrack_genre: sceneData.soundtrack?.genre || 'ambient',
          soundtrack_tempo: sceneData.soundtrack?.tempo || 'moderate',
          soundtrack_instruments: sceneData.soundtrack?.instruments || ['piano'],
          soundtrack_reference: sceneData.soundtrack?.reference_track || 'N/A',
          soundtrack_energy: sceneData.soundtrack?.energy_level ?? 0.5
        }])
        .select()
        .single();

      if (sceneError) throw sceneError;

      // Create shots for this scene
      if (sceneData.shots && sceneData.shots.length > 0) {
        const shotsToInsert = sceneData.shots.map(shot => ({
          scene_id: scene.id,
          shot_number: shot.shot_number,
          shot_type: shot.shot_type || 'medium',
          camera_angle: shot.camera_angle || 'eye-level',
          camera_movement: shot.camera_movement || 'static',
          description: shot.description || '',
          dialogue: shot.dialogue || null,
          duration_seconds: shot.duration_seconds || 3,
          sd_prompt: shot.sd_prompt || ''
        }));

        const { error: shotsError } = await supabase
          .from('storyboarder_shots')
          .insert(shotsToInsert);

        if (shotsError) throw shotsError;
      }
    }

    // Return complete response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: project.id,
        script_id: script.id,
        title: parsedScript.title || projectTitle,
        genre: parsedScript.genre || genre || 'drama',
        logline: parsedScript.logline || '',
        num_scenes: parsedScript.scenes?.length || 0
      })
    };
  } catch (error) {
    console.error('CutAI storyboard generation error:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Storyboard generation failed',
        message: error.message
      })
    };
  }
}

async function refineSdPrompt(prompt: string, scene: Record<string, unknown>): Promise<string> {
  try {
    const refinementPrompt = `Enhance this Stable Diffusion prompt for an image depicting this scene: "${prompt}"

Scene context: ${scene.description || 'No description available'}
Location: ${scene.location || 'Unknown'}
Time: ${scene.time_of_day || 'Day'}
Mood: ${scene.mood?.overall_mood || 'Neutral'}

Create a vivid, cinematic description optimized for Stable Diffusion 1.5. Include:
- Art style (cinematic, photorealistic, etc.)
- Lighting (golden hour, dramatic shadows, etc.)
- Color palette
- Composition and framing

Return ONLY the enhanced prompt, nothing else.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert at writing Stable Diffusion prompts.' },
        { role: 'user', content: refinementPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('SD prompt refinement error:', error);
    return prompt; // Return original prompt on error
  }
}