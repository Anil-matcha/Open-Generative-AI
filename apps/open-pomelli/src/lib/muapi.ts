import { getMuapiKey, config } from "@higgsfield/api-config";

const BASE = config.api.muapi.baseUrl || "https://api.muapi.ai/api/v1";

function key(): string {
  const k = getMuapiKey();
  return k;
}

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", "x-api-key": key() };
}

type SubmitResponse = { request_id?: string; id?: string };

async function submit(endpoint: string, body: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`MuAPI ${endpoint} ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as SubmitResponse;
  const id = json.request_id ?? json.id;
  if (!id) throw new Error(`MuAPI ${endpoint} returned no request_id: ${JSON.stringify(json)}`);
  return id;
}

type PollResponse = Record<string, unknown> & { status?: string };

async function poll(
  requestId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<PollResponse> {
  const intervalMs = opts.intervalMs ?? 2500;
  const timeoutMs = opts.timeoutMs ?? 300_000;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE}/predictions/${requestId}/result`, {
      headers: { "x-api-key": key() },
    });

    // 400 → task failed (HTTPException with detail)
    if (res.status === 400) {
      throw new Error(`MuAPI ${requestId} failed: ${await res.text()}`);
    }
    if (!res.ok) {
      throw new Error(`MuAPI ${requestId} poll ${res.status}: ${await res.text()}`);
    }

    const json = (await res.json()) as PollResponse;
    const status = (json.status ?? "").toLowerCase();

    if (status === "processing" || status === "pending") {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }
    if (status === "failed" || status === "cancelled") {
      throw new Error(`MuAPI ${requestId} ${status}: ${JSON.stringify(json)}`);
    }
    // No status (or status === "completed"): output_data returned directly
    return json;
  }
  throw new Error(`MuAPI ${requestId} timed out after ${timeoutMs}ms`);
}

async function run(endpoint: string, body: Record<string, unknown>): Promise<PollResponse> {
  const id = await submit(endpoint, body);
  return poll(id);
}

function extractText(r: PollResponse): string {
  if (typeof r.result === "string") return r.result;
  if (typeof r.text === "string") return r.text as string;
  if (typeof r.output === "string") return r.output as string;
  return JSON.stringify(r);
}

function extractMediaUrl(r: PollResponse): string | null {
  const images = r.images;
  if (Array.isArray(images) && typeof images[0] === "string") return images[0] as string;
  const outputs = r.outputs;
  if (Array.isArray(outputs) && typeof outputs[0] === "string") return outputs[0] as string;
  for (const k of ["url", "image_url", "video_url", "output_url"]) {
    const v = (r as Record<string, unknown>)[k];
    if (typeof v === "string") return v;
  }
  if (typeof r.result === "string" && r.result.startsWith("http")) return r.result as string;
  return null;
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "3:2" | "2:3" | "5:4" | "4:5" | "21:9";
export type EditAspect = "Auto" | AspectRatio;
export type VideoResolution = "480p" | "720p" | "1080p";
export type ImageResolution = "1k" | "2k" | "4k";
export type ImageFormat = "jpg" | "png";
export type V2Aspect =
  | "1:1" | "1:4" | "1:8" | "2:3" | "3:2" | "3:4" | "4:1" | "4:3"
  | "4:5" | "5:4" | "8:1" | "9:16" | "16:9" | "21:9" | "Auto";

export const muapi = {
  async uploadFile(data: Buffer | Uint8Array, filename: string, contentType: string): Promise<string> {
    const blob = new Blob([new Uint8Array(data)], { type: contentType });
    const form = new FormData();
    form.append("file", blob, filename);
    const res = await fetch(`${BASE}/upload_file`, {
      method: "POST",
      headers: { "x-api-key": key() },
      body: form,
    });
    if (!res.ok) throw new Error(`MuAPI upload_file ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { url?: string };
    if (!json.url) throw new Error(`MuAPI upload_file returned no url: ${JSON.stringify(json)}`);
    return json.url;
  },

  async text(prompt: string, model: string = "gpt-5-nano"): Promise<string> {
    const r = await run(model, { prompt });
    return extractText(r);
  },

  async vision(prompt: string, imageUrl: string, model: string = "gpt-5-nano"): Promise<string> {
    const r = await run(model, { prompt, image_url: imageUrl });
    return extractText(r);
  },

  async image(prompt: string, aspectRatio: AspectRatio = "1:1"): Promise<string | null> {
    const r = await run("nano-banana", { prompt, aspect_ratio: aspectRatio });
    return extractMediaUrl(r);
  },

  async imageEdit(
    prompt: string,
    imagesList: string[],
    aspectRatio: EditAspect = "Auto",
  ): Promise<string | null> {
    const r = await run("nano-banana-edit", {
      prompt,
      images_list: imagesList,
      aspect_ratio: aspectRatio,
    });
    return extractMediaUrl(r);
  },

  async image2(
    prompt: string,
    opts: { aspectRatio?: V2Aspect; resolution?: ImageResolution; outputFormat?: ImageFormat } = {},
  ): Promise<string | null> {
    const r = await run("nano-banana-2", {
      prompt,
      aspect_ratio: opts.aspectRatio ?? "1:1",
      resolution: opts.resolution ?? "2k",
      output_format: opts.outputFormat ?? "png",
    });
    return extractMediaUrl(r);
  },

  async imageEdit2(
    prompt: string,
    imagesList: string[],
    opts: { aspectRatio?: V2Aspect; resolution?: ImageResolution; outputFormat?: ImageFormat } = {},
  ): Promise<string | null> {
    const r = await run("nano-banana-2-edit", {
      prompt,
      images_list: imagesList,
      aspect_ratio: opts.aspectRatio ?? "Auto",
      resolution: opts.resolution ?? "2k",
      output_format: opts.outputFormat ?? "png",
    });
    return extractMediaUrl(r);
  },

  async videoT2V(
    prompt: string,
    opts: { aspectRatio?: AspectRatio; resolution?: VideoResolution; duration?: number } = {},
  ): Promise<string | null> {
    const r = await run("seedance-lite-t2v", {
      prompt,
      aspect_ratio: opts.aspectRatio ?? "9:16",
      resolution: opts.resolution ?? "480p",
      duration: opts.duration ?? 5,
    });
    return extractMediaUrl(r);
  },

  async videoI2V(
    prompt: string,
    imageUrl: string,
    opts: { resolution?: VideoResolution; duration?: number } = {},
  ): Promise<string | null> {
    const r = await run("seedance-lite-i2v", {
      prompt,
      image_url: imageUrl,
      resolution: opts.resolution ?? "480p",
      duration: opts.duration ?? 5,
    });
    return extractMediaUrl(r);
  },
};
