import { supabase } from '../../../lib/supabase-client.ts';
import { generateVideo, uploadFile, getUserBalance } from '../../../lib/muapi.js';

const STORAGE_KEY = 'higgsfield.remix-go.projects';

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function safeWriteStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export async function loadProjects() {
  try {
    const { data, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('job_type', 'remix-go')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('RemixGo loadProjects error:', err);
    return safeReadStorage(STORAGE_KEY, []);
  }
}

export async function saveProject(project) {
  try {
    const { data, error } = await supabase
      .from('generation_jobs')
      .insert({
        workspace_id: project.workspace_id || null,
        user_id: project.user_id || null,
        job_type: 'remix-go',
        input: project,
        status: 'draft'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('RemixGo saveProject error:', err);
    safeWriteStorage(STORAGE_KEY, [...safeReadStorage(STORAGE_KEY, []), project]);
    return project;
  }
}

export async function generateOutput(apiKey, projectId, params) {
  try {
    const result = await generateVideo(apiKey, {
      prompt: params.prompt || 'professional video edit',
      duration: params.duration || 5,
      aspect_ratio: params.aspect_ratio || '16:9'
    });
    return result;
  } catch (err) {
    console.error('RemixGo generateOutput error:', err);
    throw err;
  }
}

export async function saveOutputToLibrary(apiKey, output) {
  try {
    const { data, error } = await supabase
      .from('generation_jobs')
      .insert({
        job_type: 'remix-go-output',
        output_url: output.url,
        input: { prompt: output.prompt },
        status: 'completed'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('RemixGo saveOutputToLibrary error:', err);
    throw err;
  }
}

export async function handoffOutput(target, output) {
  const HANDOFF_KEYS = {
    library: 'higgsfield.pendingLibraryOutput',
    render: 'higgsfield.pendingRenderOutput',
    director: 'higgsfield.pendingDirectorOutput',
    timeline: 'higgsfield.pendingTimelineOutput',
    'edit-studio': 'higgsfield.pendingEditStudioOutput',
    'video-agent': 'higgsfield.pendingVideoAgentOutput'
  };
  
  if (HANDOFF_KEYS[target]) {
    sessionStorage.setItem(HANDOFF_KEYS[target], JSON.stringify({ 
      content: output,
      app: 'remix-go'
    }));
  }
}