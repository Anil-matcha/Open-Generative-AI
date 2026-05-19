import { supabase } from '../../../lib/supabase-client.ts';
import { generateI2I, uploadFile } from '../../../lib/muapi.js';

const STORAGE_KEY = 'higgsfield.ai-headshot.projects';

function safeReadStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } }
function safeWriteStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

const PRESETS = [
  { id: 'professional', name: 'Professional', prompt: 'professional headshot, crisp white shirt, confident smile, studio lighting' },
  { id: 'creative', name: 'Creative', prompt: 'creative professional headshot, artistic background, modern style' },
  { id: 'linkedin', name: 'LinkedIn', prompt: 'LinkedIn profile photo, professional, approachable, business attire' },
  { id: 'executive', name: 'Executive', prompt: 'executive portrait, suit and tie, boardroom setting, authoritative' },
  { id: 'casual', name: 'Casual', prompt: 'casual professional headshot, relaxed pose, natural lighting' }
];

export async function uploadSourcePhoto(file) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const url = await uploadFile(apiKey, file);
    return { id: 'img_' + Date.now(), url, name: file.name };
  } catch (err) {
    console.error('headshot uploadSourcePhoto error:', err);
    throw err;
  }
}

export async function listHeadshotPresets() {
  return PRESETS;
}

export async function generateHeadshotPrompt(sourcePhoto, preset) {
  const basePrompt = preset.prompt || 'professional headshot';
  return `${basePrompt}. Using photo as reference for face shape and features. High quality, photorealistic.`;
}

export async function generateHeadshot(apiKey, sourcePhoto, preset, options = {}) {
  try {
    const prompt = await generateHeadshotPrompt(sourcePhoto, preset);
    return generateI2I(apiKey, {
      prompt,
      image_url: sourcePhoto.url,
      strength: options.strength || 0.7,
      aspect_ratio: options.aspect_ratio || '3:4'
    });
  } catch (err) {
    console.error('headshot generateHeadshot error:', err);
    throw err;
  }
}

export async function generateHeadshotBatch(apiKey, sourcePhoto, presets) {
  const results = [];
  for (const preset of presets) {
    try {
      const result = await generateHeadshot(apiKey, sourcePhoto, preset);
      results.push({ preset: preset.id, ...result });
    } catch (err) {
      results.push({ preset: preset.id, error: err.message });
    }
  }
  return results;
}

export async function getGenerationStatus(requestId) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const response = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
      headers: { 'x-api-key': apiKey }
    });
    if (!response.ok) throw new Error('Status check failed');
    return await response.json();
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function saveHeadshot(headshot) {
  try {
    const { data, error } = await supabase.from('headshot_outputs').insert({
      ...headshot,
      created_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('headshot saveHeadshot error:', err);
    return null;
  }
}

export async function saveOutputToLibrary(output) {
  try {
    const { data, error } = await supabase.from('generation_jobs').insert({
      job_type: 'ai-headshot',
      output_url: output.url,
      input: { prompt: output.prompt },
      status: 'completed'
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    throw err;
  }
}

export function handoffHeadshotOutput(target, headshot) {
  const HANDOFF_KEYS = {
    library: 'higgsfield.pendingLibraryOutput',
    render: 'higgsfield.pendingRenderOutput',
    'edit-studio': 'higgsfield.pendingEditStudioOutput'
  };
  if (HANDOFF_KEYS[target]) {
    sessionStorage.setItem(HANDOFF_KEYS[target], JSON.stringify({ content: headshot, app: 'ai-headshot-generator' }));
  }
}