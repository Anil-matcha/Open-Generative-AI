import { supabase } from '../../../lib/supabase-client';
import { generateMuAPI } from '../../../lib/muapiAdapter';
import { uploadToStorage } from '../../../lib/mediaStorage';

export async function createProject(project) {
  const { data, error } = await supabase.from('remix_projects').insert(project).select().single();
  if (error) throw error;
  return data;
}

export async function updateProject(id, updates) {
  const { data, error } = await supabase.from('remix_projects').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id) {
  await supabase.from('remix_projects').delete().eq('id', id);
}

export async function uploadMedia(file) {
  return uploadToStorage(file, `remix/${Date.now()}-${file.name}`);
}

export async function generateOutput(projectId, params) {
  return generateMuAPI({
    prompt: params.prompt || 'cinematic video remix',
    duration: params.duration || 8,
    aspect_ratio: params.aspect_ratio || '16:9'
  });
}

export async function saveOutput(projectId, output) {
  const { data } = await supabase.from('remix_outputs').insert({ project_id: projectId, ...output }).select().single();
  return data;
}

export async function saveOutputToLibrary(output) {
  // delegate to shared
  return output;
}

export async function handoffOutput(target, output) {
  // delegate to outputHandoff
  return output;
}
