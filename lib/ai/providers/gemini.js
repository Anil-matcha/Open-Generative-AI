import { assertTask } from './types';

const DEFAULT_BASE = 'https://generativelanguage.googleapis.com';

function getConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return {
    apiKey,
    baseUrl: (process.env.GEMINI_BASE_URL || DEFAULT_BASE).replace(/\/$/, ''),
  };
}

function defaultModel(task) {
  if (task === 'text') return process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  if (task === 'image') return process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  throw new Error(`Gemini provider does not currently implement ${task} in this adapter`);
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }
  if (!response.ok) {
    const message = data?.error?.message || `Gemini request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

function extractText(data) {
  return (data?.candidates || [])
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n');
}

function extractInlineImage(data) {
  for (const candidate of data?.candidates || []) {
    for (const part of candidate?.content?.parts || []) {
      const inline = part?.inlineData || part?.inline_data;
      if (inline?.data) {
        return {
          mimeType: inline.mimeType || inline.mime_type || 'image/png',
          data: inline.data,
        };
      }
    }
  }
  return null;
}

async function generate(request) {
  assertTask(request.task);
  const { apiKey, baseUrl } = getConfig();
  const model = request.model || defaultModel(request.task);

  const parts = [{ text: request.prompt }];
  for (const item of request.input?.parts || []) {
    if (item.inlineData) parts.push({ inlineData: item.inlineData });
  }

  const body = {
    contents: [{ role: 'user', parts }],
  };

  if (request.options?.generationConfig) {
    body.generationConfig = request.options.generationConfig;
  }

  if (request.options?.systemInstruction) {
    body.systemInstruction = { parts: [{ text: request.options.systemInstruction }] };
  }

  const data = await requestJson(
    `${baseUrl}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  const image = extractInlineImage(data);
  return {
    provider: 'gemini',
    model,
    task: request.task,
    text: extractText(data) || undefined,
    data: image || data,
  };
}

async function health() {
  try {
    getConfig();
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export default {
  id: 'gemini',
  label: 'Google Gemini',
  supports: ({ task }) => task === 'text' || task === 'image',
  generate,
  health,
};
