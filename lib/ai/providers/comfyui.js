import { assertTask } from './types';

const DEFAULT_BASE = 'http://127.0.0.1:8188';

function baseUrl() {
  return (process.env.COMFYUI_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
}

function workflowFor(task) {
  const raw = task === 'video'
    ? process.env.COMFYUI_VIDEO_WORKFLOW_JSON
    : process.env.COMFYUI_IMAGE_WORKFLOW_JSON;

  if (!raw) {
    throw new Error(`COMFYUI_${task.toUpperCase()}_WORKFLOW_JSON is not configured`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`COMFYUI_${task.toUpperCase()}_WORKFLOW_JSON is not valid JSON`);
  }
}

function injectPrompt(workflow, prompt) {
  const promptNodeId = process.env.COMFYUI_PROMPT_NODE_ID;
  const promptInput = process.env.COMFYUI_PROMPT_INPUT || 'text';

  if (!promptNodeId || !workflow[promptNodeId]) return workflow;
  const node = workflow[promptNodeId];
  node.inputs = { ...(node.inputs || {}), [promptInput]: prompt };
  return workflow;
}

async function jsonFetch(path, init) {
  const response = await fetch(`${baseUrl()}${path}`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || data?.error || `ComfyUI request failed (${response.status})`);
  }
  return data;
}

async function generate(request) {
  assertTask(request.task);
  if (request.task !== 'image' && request.task !== 'video') {
    throw new Error('ComfyUI provider currently implements image and video generation.');
  }

  const workflow = injectPrompt(workflowFor(request.task), request.prompt);
  const queued = await jsonFetch('/prompt', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt: workflow,
      client_id: request.options?.clientId,
    }),
  });

  const promptId = queued.prompt_id;
  if (!promptId) throw new Error('ComfyUI did not return a prompt_id');

  const timeoutMs = Number(request.options?.timeoutMs || process.env.COMFYUI_TIMEOUT_MS || 900000);
  const intervalMs = Number(request.options?.pollIntervalMs || 1500);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const history = await jsonFetch(`/history/${encodeURIComponent(promptId)}`, { method: 'GET' });
    const item = history?.[promptId];
    if (item) {
      if (item.status?.status_str === 'error' || item.status?.completed === false && item.status?.status_str === 'error') {
        throw new Error('ComfyUI workflow failed');
      }

      const outputs = Object.values(item.outputs || {});
      const files = outputs.flatMap((output) => [
        ...(output.images || []),
        ...(output.gifs || []),
        ...(output.videos || []),
      ]);

      if (files.length) {
        const first = files[0];
        const params = new URLSearchParams({
          filename: first.filename,
          subfolder: first.subfolder || '',
          type: first.type || 'output',
        });
        return {
          provider: 'comfyui',
          model: request.model || 'workflow',
          task: request.task,
          url: `${baseUrl()}/view?${params.toString()}`,
          data: { promptId, outputs: files },
        };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`ComfyUI generation timed out after ${timeoutMs}ms`);
}

async function health() {
  try {
    const response = await fetch(`${baseUrl()}/system_stats`);
    return response.ok
      ? { ok: true }
      : { ok: false, message: `ComfyUI returned ${response.status}` };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export default {
  id: 'comfyui',
  label: 'ComfyUI (Local)',
  supports: ({ task }) => task === 'image' || task === 'video',
  generate,
  health,
};
