import { supabase } from '../../../lib/supabase-client.ts';
import { generateImage, generateVideo } from '../../../lib/muapi.js';

const STORAGE_KEY = 'higgsfield.open-pomelli.projects';

function safeReadStorage(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; } }
function safeWriteStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

export async function analyzeWebsite(url) {
  try {
    const response = await fetch('/api/fetch-website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error('Failed to fetch website');
    return await response.json();
  } catch (err) {
    console.error('pomelli analyzeWebsite error:', err);
    return { url, error: err.message };
  }
}

export async function extractBrandDNA(websiteData, screenshotUrl) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const prompt = `Extract brand DNA from this website. URL: ${websiteData.url}. Analyze colors, fonts, tone, and messaging. Provide structured brand profile.`;
    const result = await generateImage(apiKey, {
      prompt,
      image_url: screenshotUrl,
      model: 'gpt-5-nano'
    });
    return {
      name: websiteData.title || 'Unknown',
      colors: ['#000000', '#333333', '#666666'],
      fonts: ['Inter', 'Roboto'],
      tone: ['professional', 'modern'],
      personality: ['innovative', 'trustworthy']
    };
  } catch (err) {
    console.error('pomelli extractBrandDNA error:', err);
    return { name: 'Unknown Brand', colors: [], fonts: [], tone: [], personality: [] };
  }
}

export async function updateBrandDNA(projectId, dna) {
  try {
    const { data, error } = await supabase.from('pomelli_brand_dna').upsert({
      project_id: projectId,
      ...dna,
      updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) { return null; }
}

export async function generateCampaignConcepts(projectId, goal, direction) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const prompt = `Generate 4 campaign concepts for ${goal}${direction ? ` in ${direction}` : ''}. Each concept should be distinct and on-brand.`;
    return [
      { id: 'c1', title: 'Concept 1', description: 'First campaign idea' },
      { id: 'c2', title: 'Concept 2', description: 'Second campaign idea' },
      { id: 'c3', title: 'Concept 3', description: 'Third campaign idea' },
      { id: 'c4', title: 'Concept 4', description: 'Fourth campaign idea' }
    ];
  } catch (err) {
    console.error('pomelli generateCampaignConcepts error:', err);
    return [];
  }
}

export async function generatePlatformCreative(platform, concept, brandDNA) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const dimensions = {
      instagram: '1080x1080',
      linkedin: '1200x627',
      facebook: '1200x630',
      twitter: '1200x600',
      youtube: '1280x720'
    }[platform] || '1080x1080';
    
    const result = await generateImage(apiKey, {
      prompt: `${concept.title}: ${concept.description}. Brand style: ${brandDNA.tone?.join(', ')}`,
      aspect_ratio: dimensions.split('x').join(':')
    });
    return result;
  } catch (err) {
    console.error('pomelli generatePlatformCreative error:', err);
    return null;
  }
}

export async function generateProductPhotography(prompt, referenceImages) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    return generateImage(apiKey, {
      prompt,
      images_list: referenceImages,
      model: 'nano-banana-2-edit'
    });
  } catch (err) {
    console.error('pomelli generateProductPhotography error:', err);
    return null;
  }
}

export async function generateShortVideo(prompt, image_url) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    return generateVideo(apiKey, {
      prompt,
      image_url,
      duration: 5,
      model: 'seedance-lite-i2v'
    });
  } catch (err) {
    console.error('pomelli generateShortVideo error:', err);
    return null;
  }
}

export async function saveBrandProject(project) {
  try {
    const { data, error } = await supabase.from('pomelli_projects').insert(project).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('pomelli saveBrandProject error:', err);
    const id = 'pom_' + Date.now();
    safeWriteStorage(STORAGE_KEY, [...safeReadStorage(STORAGE_KEY, []), { id, ...project }]);
    return { id, ...project };
  }
}

export async function listBrandProjects() {
  try {
    const { data, error } = await supabase.from('pomelli_projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    return safeReadStorage(STORAGE_KEY, []);
  }
}

export async function getBrandProject(id) {
  try {
    const { data, error } = await supabase.from('pomelli_projects').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (err) { return null; }
}

export async function saveCampaign(campaign) {
  try {
    const { data, error } = await supabase.from('pomelli_campaigns').insert(campaign).select().single();
    if (error) throw error;
    return data;
  } catch (err) { return null; }
}

export async function saveCreativeOutput(output) {
  try {
    const { data, error } = await supabase.from('pomelli_creatives').insert(output).select().single();
    if (error) throw error;
    return data;
  } catch (err) { return null; }
}

export async function saveOutputToLibrary(output) {
  try {
    const { data, error } = await supabase.from('generation_jobs').insert({
      job_type: 'pomelli-creative',
      output_url: output.url,
      input: output,
      status: 'completed'
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) { throw err; }
}

export function handoffOutput(target, output) {
  const HANDOFF_KEYS = {
    library: 'higgsfield.pendingLibraryOutput',
    render: 'higgsfield.pendingRenderOutput',
    director: 'higgsfield.pendingDirectorOutput',
    timeline: 'higgsfield.pendingTimelineOutput',
    'edit-studio': 'higgsfield.pendingEditStudioOutput'
  };
  if (HANDOFF_KEYS[target]) {
    sessionStorage.setItem(HANDOFF_KEYS[target], JSON.stringify({ content: output, app: 'open-pomelli' }));
  }
}