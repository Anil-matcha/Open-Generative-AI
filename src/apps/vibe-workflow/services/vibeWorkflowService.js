import { supabase } from '../../../lib/supabase-client.ts';
import { generateImage, generateVideo, getUserWorkflows, createWorkflow, executeWorkflow } from '../../../lib/muapi.js';

const STORAGE_KEY = 'higgsfield.vibe-workflow.workflows';

function safeReadStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch { return fallback; }
}
function safeWriteStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

export async function listWorkflows() {
  try {
    const { data, error } = await supabase.from('muapi_workflows').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('VibeWorkflow listWorkflows error:', err);
    return safeReadStorage(STORAGE_KEY, []);
  }
}

export async function getWorkflow(id) {
  try {
    const { data, error } = await supabase.from('muapi_workflows').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (err) { return null; }
}

export async function createWorkflowLocal(workflow) {
  try {
    const { data, error } = await supabase.from('muapi_workflows').insert(workflow).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('VibeWorkflow createWorkflow error:', err);
    const id = 'wf_' + Date.now();
    const newWorkflow = { id, ...workflow, created_at: new Date().toISOString() };
    safeWriteStorage(STORAGE_KEY, [...safeReadStorage(STORAGE_KEY, []), newWorkflow]);
    return newWorkflow;
  }
}

export async function updateWorkflow(id, updates) {
  try {
    const { data, error } = await supabase.from('muapi_workflows').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } catch (err) { throw err; }
}

export async function deleteWorkflow(id) {
  try {
    await supabase.from('muapi_workflows').delete().eq('id', id);
  } catch (err) { console.error('VibeWorkflow deleteWorkflow error:', err); }
}

export async function duplicateWorkflow(id) {
  const original = await getWorkflow(id);
  if (!original) throw new Error('Workflow not found');
  const { id: _, created_at, ...rest } = original;
  return createWorkflowLocal({ ...rest, name: `${original.name} (Copy)` });
}

export async function listWorkflowTemplates() {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const templates = await getUserWorkflows(apiKey);
    return templates || [];
  } catch (err) {
    return [
      { id: 'template-1', name: 'Image Generation Pipeline', description: 'Generate images from text prompts' },
      { id: 'template-2', name: 'Video Creation Flow', description: 'Create videos from text or images' },
      { id: 'template-3', name: 'Brand Campaign', description: 'Multi-step campaign generation' }
    ];
  }
}

export async function createWorkflowFromTemplate(templateId) {
  const templates = await listWorkflowTemplates();
  const template = templates.find(t => t.id === templateId);
  if (!template) throw new Error('Template not found');
  return createWorkflowLocal({
    name: template.name,
    description: template.description,
    nodes: [],
    template: templateId
  });
}

export async function runWorkflow(workflow, params = {}) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const result = await executeWorkflow(apiKey, workflow.id, params);
    return result;
  } catch (err) {
    console.error('VibeWorkflow runWorkflow error:', err);
    return { status: 'error', error: err.message };
  }
}

export async function runWorkflowNode(node, input) {
  try {
    const apiKey = import.meta.env.VITE_MUAPI_KEY;
    const label = node.label || node.type || '';
    const prompt = input.prompt || 'creative prompt';
    
    if (label.toLowerCase().includes('image') || node.type === 'image') {
      return generateImage(apiKey, { prompt, ...input });
    }
    if (label.toLowerCase().includes('video') || node.type === 'video') {
      return generateVideo(apiKey, { prompt, duration: 5, ...input });
    }
    
    return { status: 'skipped', reason: 'Unknown node type' };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function saveWorkflowRun(workflowId, run) {
  try {
    const { data, error } = await supabase.from('generation_jobs').insert({
      job_type: 'vibe-workflow-run',
      input: { workflowId, ...run },
      status: 'completed'
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) { return null; }
}

export async function saveWorkflowOutput(workflowId, output) {
  return saveWorkflowRun(workflowId, { output, timestamp: new Date().toISOString() });
}

export async function saveOutputToLibrary(output) {
  try {
    const { data, error } = await supabase.from('generation_jobs').insert({
      job_type: 'vibe-workflow-output',
      output_url: output.url,
      input: { prompt: output.prompt },
      status: 'completed'
    }).select().single();
    if (error) throw error;
    return data;
  } catch (err) { throw err; }
}

export function handoffWorkflowOutput(target, output) {
  const HANDOFF_KEYS = {
    library: 'higgsfield.pendingLibraryOutput',
    render: 'higgsfield.pendingRenderOutput',
    director: 'higgsfield.pendingDirectorOutput',
    timeline: 'higgsfield.pendingTimelineOutput',
    'edit-studio': 'higgsfield.pendingEditStudioOutput',
    'video-agent': 'higgsfield.pendingVideoAgentOutput'
  };
  if (HANDOFF_KEYS[target]) {
    sessionStorage.setItem(HANDOFF_KEYS[target], JSON.stringify({ content: output, app: 'vibe-workflow' }));
  }
}