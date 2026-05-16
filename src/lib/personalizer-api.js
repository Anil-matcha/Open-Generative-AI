import { supabase } from './supabase-client';

const API_BASE = '/api/personalizer';

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Unauthorized');
  return session.access_token;
}

async function apiFetch(path, options = {}) {
  const token = await getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function scanProfile(targetName, options = {}) {
  return apiFetch('/scan', {
    method: 'POST',
    body: JSON.stringify({ targetName, ...options })
  });
}

export async function generateContent({ appId, mode, targetName, targetCompany, manualNotes, offer, goal, tone, cta, scanResults, projectId, visualStyle, aspectRatio, storyType, durationSeconds }) {
  return apiFetch('/generate', {
    method: 'POST',
    body: JSON.stringify({ 
      appId, mode, targetName, targetCompany, manualNotes, offer, goal, tone, cta, scanResults, projectId,
      visualStyle, aspectRatio, storyType, durationSeconds 
    })
  });
}

export async function generateVisualContent(params) {
  return apiFetch('/generate-visual', {
    method: 'POST',
    body: JSON.stringify(params)
  });
}

export async function saveProject(projectId) {
  return apiFetch('/save', {
    method: 'POST',
    body: JSON.stringify({ projectId })
  });
}

export async function getApps() {
  return apiFetch('/apps');
}

export async function getHistory(limit = 20, offset = 0) {
  return apiFetch(`/history?limit=${limit}&offset=${offset}`);
}

export async function getOutput(projectId) {
  return apiFetch(`/output/${projectId}`);
}

export async function sendToApp(projectId, appId) {
  return apiFetch('/send-to-app', {
    method: 'POST',
    body: JSON.stringify({ projectId, appId })
  });
}

export async function getProject(projectId) {
  const { data, error } = await supabase
    .from('personalization_projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) throw error;
  return data;
}

export async function getProjectOutputs(projectId) {
  const { data, error } = await supabase
    .from('personalization_outputs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export default {
  scanProfile,
  generateContent,
  saveProject,
  getApps,
  getHistory,
  getOutput,
  sendToApp,
  getProject,
  getProjectOutputs
};
