import { assertTask } from './types';

const DEFAULT_BASE = 'http://127.0.0.1:11434';

function baseUrl() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
}

async function generate(request) {
  assertTask(request.task);
  if (request.task !== 'text') {
    throw new Error('Ollama provider currently implements text generation. Use ComfyUI for local image/video generation.');
  }

  const model = request.model || process.env.OLLAMA_TEXT_MODEL || 'llama3.2';
  const response = await fetch(`${baseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        ...(request.options?.systemInstruction
          ? [{ role: 'system', content: request.options.systemInstruction }]
          : []),
        { role: 'user', content: request.prompt },
      ],
      options: request.options?.options,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Ollama request failed (${response.status})`);
  }

  return {
    provider: 'ollama',
    model,
    task: request.task,
    text: data?.message?.content || '',
    data,
  };
}

async function health() {
  try {
    const response = await fetch(`${baseUrl()}/api/tags`);
    return response.ok
      ? { ok: true }
      : { ok: false, message: `Ollama returned ${response.status}` };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export default {
  id: 'ollama',
  label: 'Ollama (Local)',
  supports: ({ task }) => task === 'text',
  generate,
  health,
};
