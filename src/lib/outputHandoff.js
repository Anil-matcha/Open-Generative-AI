import { supabase } from './supabase-client';
import { uploadFile } from './muapiAdapter';

export async function saveGeneratedAsset(metadata) {
  const { data, error } = await supabase
    .from('generated_assets')
    .insert({
      ...metadata,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function sendToLibrary(output) {
  const asset = await saveGeneratedAsset({
    app_id: output.app_id,
    app_name: output.app_name,
    source_project_id: output.source_project_id,
    type: output.type,
    title: output.title,
    prompt: output.prompt,
    model: output.model,
    provider: output.provider,
    output_url: output.output_url,
    thumbnail_url: output.thumbnail_url,
    settings: output.settings,
    handoff_targets: ['library']
  });
  // Trigger Higgsfield Library refresh via event or storage
  window.dispatchEvent(new CustomEvent('higgsfield:library:add', { detail: asset }));
  return asset;
}

export async function sendToRender(output) { /* similar handoff to Render */ }
export async function sendToDirector(output) { /* ... */ }
export async function sendToTimeline(output) { /* ... */ }
export async function sendToEditStudio(output) { /* ... */ }
export async function sendToVideoAgent(output) { /* ... */ }