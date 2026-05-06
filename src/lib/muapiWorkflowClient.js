const DEFAULT_BASE = 'https://api.muapi.ai';
const PROXY_BASE = import.meta.env.VITE_MUAPI_PROXY_URL || '';

function buildUrl(path) {
  return `${PROXY_BASE || DEFAULT_BASE}${path}`;
}

function getSafeApiKey(providedKey) {
  return providedKey || localStorage.getItem('muapi_user_api_key') || '';
}

export async function runWorkflow({ workflowId, inputs, apiKey }) {
  const key = getSafeApiKey(apiKey);
  if (!key && !PROXY_BASE) throw new Error('Missing MuAPI key. Add it in /workflows/settings for MVP.');
  const response = await fetch(buildUrl(`/workflow/${workflowId}/api-execute`), {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(key ? { 'x-api-key': key } : {}) }, body: JSON.stringify(inputs)
  });
  if (!response.ok) throw new Error(`Workflow execute failed (${response.status})`);
  return response.json();
}

export async function getWorkflowOutputs({ runId, apiKey }) {
  const key = getSafeApiKey(apiKey);
  const response = await fetch(buildUrl(`/workflow/run/${runId}/api-outputs`), { headers: { ...(key ? { 'x-api-key': key } : {}) } });
  if (!response.ok) throw new Error(`Output fetch failed (${response.status})`);
  return response.json();
}

export async function pollWorkflowUntilComplete({ runId, apiKey, intervalMs = 2000, maxAttempts = 120 }) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const data = await getWorkflowOutputs({ runId, apiKey });
    const status = String(data?.status || '').toLowerCase();
    if (['success', 'succeeded', 'completed'].includes(status) || data?.outputs?.length) return data;
    if (['failed', 'error', 'cancelled'].includes(status)) throw new Error(data?.error || 'Workflow failed');
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Workflow polling timed out');
}

// TODO(prod): Route through backend proxy with per-user entitlements + Stripe gating + credit tracking.
// TODO(supabase): plan tables workflow_apps, workflow_runs, workflow_entitlements, user_api_keys.
