import { NextResponse } from "next/server";
import { getReplicateModel, sanitizeReplicateInput } from "@/src/lib/replicateVideoModels";

const API_BASE = "https://api.replicate.com/v1";

function getToken(request, body) {
  const header = request.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return body?.token?.trim();
}

async function replicateFetch(token, path, options = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "wait=3",
    ...(options.headers || {}),
  };

  Object.keys(headers).forEach((key) => {
    if (headers[key] === undefined) delete headers[key];
  });

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  return { response, data };
}

function errorResponse(message, status = 400, detail = null) {
  return NextResponse.json({ error: message, detail }, { status });
}

async function createWithLatestVersion(token, model, input) {
  const modelMeta = await replicateFetch(token, `/models/${model.owner}/${model.name}`, {
    method: "GET",
    headers: { Prefer: undefined },
  });

  if (!modelMeta.response.ok) {
    return modelMeta;
  }

  const version = modelMeta.data?.latest_version?.id;
  if (!version) {
    return {
      response: { ok: false, status: 404 },
      data: { error: `No latest version found for ${model.owner}/${model.name}.` },
    };
  }

  return replicateFetch(token, "/predictions", {
    method: "POST",
    body: JSON.stringify({ version, input }),
  });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const token = getToken(request, body);
  const model = getReplicateModel(body?.modelId);

  if (!token) return errorResponse("Add a Replicate API token first.", 401);
  if (!model) return errorResponse("Unknown model.", 404);

  const input = sanitizeReplicateInput(model, body?.input);

  if (!input.prompt || !String(input.prompt).trim()) {
    return errorResponse("Prompt is required.");
  }

  if (model.mode === "image-to-video" && model.inputMap?.firstFrame && !input[model.inputMap.firstFrame]) {
    return errorResponse(`${model.label} needs a first-frame image or image URL.`);
  }

  let result;
  if (model.version) {
    result = await replicateFetch(token, "/predictions", {
      method: "POST",
      body: JSON.stringify({ version: model.version, input }),
    });
  } else {
    result = await replicateFetch(token, `/models/${model.owner}/${model.name}/predictions`, {
      method: "POST",
      body: JSON.stringify({ input }),
    });

    if (!result.response.ok && [404, 405, 422].includes(result.response.status)) {
      result = await createWithLatestVersion(token, model, input);
    }
  }

  if (!result.response.ok) {
    return errorResponse("Replicate request failed.", result.response.status, result.data);
  }

  return NextResponse.json(result.data);
}
