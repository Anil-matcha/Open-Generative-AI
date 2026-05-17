import { createClient } from '@supabase/supabase-js';

const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RATE_LIMIT_REQUESTS = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;

async function checkRateLimit(userId) {
  try {
    const windowStart = Date.now() - RATE_LIMIT_WINDOW;
    const { count, error } = await supabaseService
      .from('personalization_projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(windowStart).toISOString());
    if (error) return true;
    return (count || 0) < RATE_LIMIT_REQUESTS;
  } catch { return true; }
}

async function verifyAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Missing or invalid authorization header' };
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseService.auth.getUser(token);
    if (error || !user) return { error: 'Invalid or expired token' };
    return { user };
  } catch { return { error: 'Token verification failed' }; }
}

async function fetchWithTimeout(url, options, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}

async function checkGitHub(username) {
  try {
    const res = await fetchWithTimeout(
      `https://api.github.com/users/${encodeURIComponent(username)}`,
      { headers: { 'User-Agent': 'VideoRemix-Personalizer', ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {}) } },
      5000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { platform: 'github', exists: true, public_repos: data.public_repos, followers: data.followers, bio: data.bio, company: data.company, url: data.html_url };
  } catch { return null; }
}

async function callMaigretWorker(username, options, maigretUrl, maigretSecret) {
  const payload = { username, ...options };
  const res = await fetchWithTimeout(`${maigretUrl}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': maigretSecret },
    body: JSON.stringify(payload)
  }, 60000);
  if (!res.ok) { const text = await res.text(); throw new Error(`Maigret worker failed (${res.status}): ${text}`); }
  return res.json();
}

async function callOpenAI(apiKey, systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.7, max_tokens: 2000 }),
      signal: controller.signal
    });
    if (!res.ok) { const text = await res.text(); throw new Error(`OpenAI API error (${res.status}): ${text}`); }
    const data = await res.json();
    return data.choices[0].message.content;
  } finally { clearTimeout(timeout); }
}

async function callGemini(apiKey, systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2000 } }),
      signal: controller.signal
    });
    if (!res.ok) { const text = await res.text(); throw new Error(`Gemini API error (${res.status}): ${text}`); }
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } finally { clearTimeout(timeout); }
}

function validateInput(value, type, maxLength = 500) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return null;
  if (type === 'username' && !/^[a-zA-Z0-9_\-\s,]+$/.test(trimmed)) return null;
  return trimmed;
}

export async function handler(event, context) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const auth = await verifyAuth(event);
  if (auth.error) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

  const userId = auth.user.id;
  if (!await checkRateLimit(userId)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }) };

  const path = event.path.replace('/api/personalizer', '');
  let body = {};
  try { if (event.body) body = JSON.parse(event.body); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  try {
    // POST /api/personalizer/scan
    if (path === '/scan' && event.httpMethod === 'POST') {
      const targetName = validateInput(body.targetName, 'username');
      if (!targetName) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid targetName required' }) };

      const opts = body.options || body;
      const maigretOptions = {
        top: opts.top ? parseInt(opts.top) : 500,
        tags: opts.tags || undefined,
        proxy: opts.proxy || undefined,
        retries: opts.retries ? parseInt(opts.retries) : 1,
        noRecursion: opts.noRecursion === true || opts.disableRecursive === true,
        isParsingEnabled: opts.isParsingEnabled !== false && opts.disableParsing !== true,
        permute: opts.enablePermutations === true,
        checkDomains: opts.withDomains === true,
      };

      let scanData;
      if (process.env.MAIGRET_WORKER_URL && process.env.MAIGRET_WORKER_SECRET) {
        try {
          scanData = await callMaigretWorker(targetName, maigretOptions, process.env.MAIGRET_WORKER_URL, process.env.MAIGRET_WORKER_SECRET);
        } catch (maigretError) {
          console.error('Maigret worker failed:', maigretError.message);
          const github = await checkGitHub(targetName);
          scanData = github ? { summary: `Public presence on GitHub (${github.public_repos} repos)`, platforms: [github], confidence: 0.8 } : null;
        }
      } else {
        const github = await checkGitHub(targetName);
        scanData = github ? { summary: `Public presence on GitHub (${github.public_repos} repos)`, platforms: [github], confidence: 0.8 } : null;
      }

      if (!scanData) scanData = { summary: 'No public scan data found', platforms: [], confidence: 0.0 };

      const { data: scan, error: scanError } = await supabaseService.from('profile_scan_results').insert({ user_id: userId, target_name: targetName, scan_data: scanData }).select().single();
      if (scanError) throw scanError;

      return { statusCode: 200, headers, body: JSON.stringify({ scanId: scan.id, scanData }) };
    }

    // POST /api/personalizer/generate
    if (path === '/generate' && event.httpMethod === 'POST') {
      const targetName = validateInput(body.targetName, 'username');
      const mode = validateInput(body.mode, 'text', 50);
      if (!targetName || !mode) return { statusCode: 400, headers, body: JSON.stringify({ error: 'targetName and mode required' }) };

      const targetCompany = body.targetCompany ? validateInput(body.targetCompany, 'text', 200) : null;
      const manualNotes = body.manualNotes ? validateInput(body.manualNotes, 'text', 2000) : null;
      const appId = validateInput(body.appId || 'ai-video-agency', 'text', 100);

      let project;
      const { data: existingProject } = await supabaseService.from('personalization_projects').select('*').eq('id', body.projectId || '').eq('user_id', userId).single();
      if (existingProject) {
        project = existingProject;
      } else {
        const { data, error } = await supabaseService.from('personalization_projects').insert({ user_id: userId, app_id: appId, mode, target_name: targetName, target_company: targetCompany, manual_notes: manualNotes, status: 'generating' }).select().single();
        if (error) throw error;
        project = data;
      }

      let scanData = null;
      if (project.scan_id) {
        const { data: scanResult } = await supabaseService.from('profile_scan_results').select('scan_data').eq('id', project.scan_id).eq('user_id', userId).single();
        scanData = scanResult?.scan_data;
      }

      const { data: templates } = await supabaseService.from('personalizer_templates').select('*').eq('app_id', appId).eq('mode', mode);
      const systemPrompt = templates?.find(t => t.template_type === 'system')?.content || 'You are a helpful assistant that generates personalized business content.';
      let userPrompt = templates?.find(t => t.template_type === 'user')?.content || `Generate a ${mode} for ${targetName}`;
      userPrompt = userPrompt
        .replace(/\{\{targetName\}\}/g, targetName)
        .replace(/\{\{targetCompany\}\}/g, targetCompany || 'N/A')
        .replace(/\{\{manualNotes\}\}/g, manualNotes || 'N/A')
        .replace(/\{\{scanData\}\}/g, scanData ? JSON.stringify(scanData, null, 2) : 'No scan data available')
        .replace(/\{\{offer\}\}/g, validateInput(body.offer, 'text', 500) || 'N/A')
        .replace(/\{\{goal\}\}/g, validateInput(body.goal, 'text', 500) || 'N/A')
        .replace(/\{\{tone\}\}/g, validateInput(body.tone, 'text', 50) || 'professional')
        .replace(/\{\{cta\}\}/g, validateInput(body.cta, 'text', 500) || 'N/A')
        // Visual personalization variables
        .replace(/\{\{visualStyle\}\}/g, body.visualStyle || 'cinematic')
        .replace(/\{\{aspectRatio\}\}/g, body.aspectRatio || '16:9')
        .replace(/\{\{storyType\}\}/g, body.storyType || 'founder-story')
        .replace(/\{\{duration\}\}/g, body.durationSeconds || '30');

      let generatedContent;
      try {
        if (process.env.OPENAI_API_KEY) {
          generatedContent = await callOpenAI(process.env.OPENAI_API_KEY, systemPrompt, userPrompt);
        } else { throw new Error('OpenAI API key not configured'); }
      } catch (openaiError) {
        console.error('OpenAI failed:', openaiError.message);
        try {
          if (process.env.GEMINI_API_KEY) {
            generatedContent = await callGemini(process.env.GEMINI_API_KEY, systemPrompt, userPrompt);
          } else { throw new Error('Gemini API key not configured'); }
        } catch (geminiError) {
          console.error('Gemini failed:', geminiError.message);
          generatedContent = `Generated ${mode} for ${targetName} at ${targetCompany || 'N/A'}.\n\nNotes: ${manualNotes || 'None'}\n\nScan Data: ${scanData ? JSON.stringify(scanData, null, 2) : 'None'}`;
        }
      }

      const output = { type: mode, content: generatedContent, metadata: { tone: body.tone || 'professional', offer: body.offer || null, goal: body.goal || null, cta: body.cta || null, scanData: !!scanData } };
      const { error: outputError } = await supabaseService.from('personalization_outputs').insert({ project_id: project.id, output_type: mode, content: output });
      if (outputError) throw outputError;

      await supabaseService.from('personalization_projects').update({ status: 'complete', updated_at: new Date().toISOString() }).eq('id', project.id);

      return { statusCode: 200, headers, body: JSON.stringify({ output, project }) };
    }

    // GET /api/personalizer/apps
    if (path === '/apps' && event.httpMethod === 'GET') {
      const { data, error } = await supabaseService.from('personalizer_apps').select('*');
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data || []) };
    }

    // GET /api/personalizer/history
    if (path === '/history' && event.httpMethod === 'GET') {
      const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100);
      const offset = parseInt(event.queryStringParameters?.offset || '0');
      const { data, error, count } = await supabaseService.from('personalization_projects').select('*', { count: 'exact' }).eq('user_id', userId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify({ data, pagination: { total: count, limit, offset, hasMore: offset + (count || 0) > offset + limit } }) };
    }

    // POST /api/personalizer/save
    if (path === '/save' && event.httpMethod === 'POST') {
      if (!body.projectId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'projectId required' }) };
      const { data, error } = await supabaseService.from('personalization_projects').update({ status: 'saved', updated_at: new Date().toISOString() }).eq('id', body.projectId).eq('user_id', userId).select().single();
      if (error) throw error;
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // POST /api/personalizer/generate-visual
    if (path === '/generate-visual' && event.httpMethod === 'POST') {
      const targetName = validateInput(body.targetName, 'username');
      const mode = body.mode;
      if (!targetName || !mode) return { statusCode: 400, headers, body: JSON.stringify({ error: 'targetName and mode required' }) };

      const appId = validateInput(body.appId || 'ai-video-agency', 'text', 100);
      const targetCompany = body.targetCompany ? validateInput(body.targetCompany, 'text', 200) : null;
      const manualNotes = body.manualNotes ? validateInput(body.manualNotes, 'text', 2000) : null;
      const visualStyle = validateInput(body.visualStyle, 'text', 50) || 'cinematic';
      const aspectRatio = validateInput(body.aspectRatio, 'text', 10) || '16:9';
      const storyType = validateInput(body.storyType, 'text', 50) || 'founder-story';
      const durationSeconds = Math.min(parseInt(body.durationSeconds) || 30, 120);

      // Get or create project
      let project;
      const { data: existingProject } = await supabaseService.from('personalization_projects').select('*').eq('id', body.projectId || '').eq('user_id', userId).single();
      if (existingProject) {
        project = existingProject;
      } else {
        const { data, error } = await supabaseService.from('personalization_projects').insert({
          user_id: userId, app_id: appId, mode, target_name: targetName,
          target_company: targetCompany, manual_notes: manualNotes,
          visual_style: visualStyle, aspect_ratio: aspectRatio,
          duration_seconds: durationSeconds, status: 'generating'
        }).select().single();
        if (error) throw error;
        project = data;
      }

      // Get scan data if available
      let scanData = null;
      if (project.scan_id) {
        const { data: scanResult } = await supabaseService.from('profile_scan_results').select('scan_data').eq('id', project.scan_id).eq('user_id', userId).single();
        scanData = scanResult?.scan_data;
      }

      // Get prompt templates
      const { data: templates } = await supabaseService.from('personalizer_templates').select('*').eq('app_id', appId).eq('mode', mode);
      const systemPrompt = templates?.find(t => t.template_type === 'system')?.content || 'You are an expert at creating highly personalized visual prompts.';
      let userPrompt = templates?.find(t => t.template_type === 'user')?.content || `Generate a ${mode} for ${targetName}`;

      userPrompt = userPrompt
        .replace(/\{\{targetName\}\}/g, targetName)
        .replace(/\{\{targetCompany\}\}/g, targetCompany || 'N/A')
        .replace(/\{\{manualNotes\}\}/g, manualNotes || 'N/A')
        .replace(/\{\{scanData\}\}/g, scanData ? JSON.stringify(scanData, null, 2) : 'No scan data available')
        .replace(/\{\{offer\}\}/g, validateInput(body.offer, 'text', 500) || 'N/A')
        .replace(/\{\{goal\}\}/g, validateInput(body.goal, 'text', 500) || 'N/A')
        .replace(/\{\{tone\}\}/g, validateInput(body.tone, 'text', 50) || 'professional')
        .replace(/\{\{cta\}\}/g, validateInput(body.cta, 'text', 500) || 'N/A')
        .replace(/\{\{visualStyle\}\}/g, visualStyle)
        .replace(/\{\{aspectRatio\}\}/g, aspectRatio)
        .replace(/\{\{storyType\}\}/g, storyType)
        .replace(/\{\{duration\}\}/g, durationSeconds.toString());

      // Generate visual prompt via AI
      let generatedContent;
      try {
        if (process.env.OPENAI_API_KEY) {
          generatedContent = await callOpenAI(process.env.OPENAI_API_KEY, systemPrompt, userPrompt);
        } else { throw new Error('OpenAI API key not configured'); }
      } catch (openaiError) {
        console.error('OpenAI failed:', openaiError.message);
        try {
          if (process.env.GEMINI_API_KEY) {
            generatedContent = await callGemini(process.env.GEMINI_API_KEY, systemPrompt, userPrompt);
          } else { throw new Error('Gemini API key not configured'); }
        } catch (geminiError) {
          console.error('Gemini failed:', geminiError.message);
          generatedContent = `Visual ${mode} prompt for ${targetName} at ${targetCompany || 'N/A'}. Style: ${visualStyle}. Aspect: ${aspectRatio}. Duration: ${durationSeconds}s.`;
        }
      }

      const output = {
        type: mode,
        content: generatedContent,
        metadata: {
          visualStyle, aspectRatio, storyType, durationSeconds,
          scanData: !!scanData, appId, targetName, targetCompany
        }
      };

      // Save output
      const { error: outputError } = await supabaseService.from('personalization_outputs').insert({
        project_id: project.id, output_type: mode, content: output
      });
      if (outputError) throw outputError;

      // Store placeholder asset entry (actual generation happens client-side via MuAPI)
      const { error: assetError } = await supabaseService.from('personalized_assets').insert({
        project_id: project.id,
        asset_type: mode === 'personalized-video' ? 'video' : 'image',
        generation_prompt: generatedContent,
        status: 'pending',
        metadata: { outputId: project.id, mode, visualStyle, aspectRatio }
      });
      if (assetError) console.error('Asset storage error:', assetError.message);

      await supabaseService.from('personalization_projects').update({ status: 'complete', updated_at: new Date().toISOString() }).eq('id', project.id);

      return { statusCode: 200, headers, body: JSON.stringify({ output, project }) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Endpoint not found' }) };
  } catch (err) {
    console.error('API Error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'An internal error occurred. Please try again later.' }) };
  }
}
