/**
 * OpenAI Responses API Client
 *
 * Uses the modern POST /v1/responses endpoint for all OpenAI interactions.
 * Supports vision (image inputs), audio transcription (Whisper), and text generation.
 *
 * Key differences from Chat Completions:
 * - Uses `input` instead of `messages`
 * - Uses `input_text` / `input_image` content types
 * - Returns `output_text` helper instead of choices[0].message.content
 * - Supports `previous_response_id` for stateful conversations
 * - Supports built-in tools (web_search, file_search, image_generation, etc.)
 */

export interface ResponsesAPIConfig {
  api_key: string;
  api_base: string;
  model: string;
  timeout: number;
}

export interface ResponsesAPIResponse {
  id: string;
  output_text: string;
  output: Array<{
    type: string;
    role?: string;
    content?: Array<{
      type: string;
      text?: string;
    }>;
    result?: string; // for image_generation_call
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIResponsesClient {
  private config: ResponsesAPIConfig;

  constructor(config: ResponsesAPIConfig) {
    this.config = config;
  }

  /**
   * Call the Responses API with text and optional image inputs.
   * Used for video analysis (summarization, search, highlights, scenes).
   */
  async analyze(
    prompt: string,
    images?: Array<{ base64: string; detail?: "low" | "high" | "auto" }>,
    options?: {
      model?: string;
      max_output_tokens?: number;
      previous_response_id?: string;
      system?: string;
    },
  ): Promise<ResponsesAPIResponse> {
    const content: Array<Record<string, unknown>> = [
      { type: "input_text", text: prompt },
    ];

    if (images) {
      for (const img of images) {
        content.push({
          type: "input_image",
          image_url: `data:image/jpeg;base64,${img.base64}`,
          detail: img.detail || "high",
        });
      }
    }

    const input: Array<Record<string, unknown>> = [
      { role: "user", content },
    ];

    const body: Record<string, unknown> = {
      model: options?.model || this.config.model,
      input,
      max_output_tokens: options?.max_output_tokens || 4096,
      store: true,
    };

    if (options?.system) {
      body.instructions = options.system;
    }

    if (options?.previous_response_id) {
      body.previous_response_id = options.previous_response_id;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(`${this.config.api_base}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.api_key}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Responses API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Extract output_text from the response
      let outputText = "";
      if (data.output_text) {
        outputText = data.output_text;
      } else if (data.output) {
        for (const item of data.output) {
          if (item.type === "message" && item.content) {
            for (const c of item.content) {
              if (c.type === "output_text" && c.text) {
                outputText += c.text;
              }
            }
          }
        }
      }

      return {
        id: data.id || "",
        output_text: outputText,
        output: data.output || [],
        usage: {
          input_tokens: data.usage?.input_tokens || 0,
          output_tokens: data.usage?.output_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Transcribe audio using Whisper via the Audio API.
   * Supports SRT/VTT subtitle output formats.
   */
  async transcribeAudio(
    audioBuffer: Uint8Array,
    options?: {
      model?: string;
      format?: "srt" | "vtt" | "json" | "verbose_json" | "text";
      language?: string;
      prompt?: string;
    },
  ): Promise<string> {
    const model = options?.model || "whisper-1";
    const format = options?.format || "srt";

    // Build multipart form data manually (Deno compatible)
    const boundary = `----FormBoundary${Math.random().toString(36).slice(2)}`;
    const encoder = new TextEncoder();

    const parts: Uint8Array[] = [];

    // Add file field
    parts.push(encoder.encode(`--${boundary}\r\n`));
    parts.push(encoder.encode(`Content-Disposition: form-data; name="file"; filename="audio.mp3"\r\n`));
    parts.push(encoder.encode(`Content-Type: audio/mpeg\r\n\r\n`));
    parts.push(audioBuffer);
    parts.push(encoder.encode(`\r\n`));

    // Add model field
    parts.push(encoder.encode(`--${boundary}\r\n`));
    parts.push(encoder.encode(`Content-Disposition: form-data; name="model"\r\n\r\n`));
    parts.push(encoder.encode(`${model}\r\n`));

    // Add response_format field
    parts.push(encoder.encode(`--${boundary}\r\n`));
    parts.push(encoder.encode(`Content-Disposition: form-data; name="response_format"\r\n\r\n`));
    parts.push(encoder.encode(`${format}\r\n`));

    // Add optional language field
    if (options?.language) {
      parts.push(encoder.encode(`--${boundary}\r\n`));
      parts.push(encoder.encode(`Content-Disposition: form-data; name="language"\r\n\r\n`));
      parts.push(encoder.encode(`${options.language}\r\n`));
    }

    // Add optional prompt field
    if (options?.prompt) {
      parts.push(encoder.encode(`--${boundary}\r\n`));
      parts.push(encoder.encode(`Content-Disposition: form-data; name="prompt"\r\n\r\n`));
      parts.push(encoder.encode(`${options.prompt}\r\n`));
    }

    // Close boundary
    parts.push(encoder.encode(`--${boundary}--\r\n`));

    // Combine all parts
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      body.set(part, offset);
      offset += part.length;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(`${this.config.api_base}/audio/transcriptions`, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${this.config.api_key}`,
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error (${response.status}): ${errorText}`);
      }

      // For SRT/VTT/text formats, return raw text
      if (format === "srt" || format === "vtt" || format === "text") {
        return await response.text();
      }

      // For JSON formats, parse and return
      const data = await response.json();
      return data.text || JSON.stringify(data);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generate speech from text using TTS.
   * Used for voiceover generation.
   */
  async generateSpeech(
    text: string,
    options?: {
      model?: string;
      voice?: string;
      instructions?: string;
    },
  ): Promise<Uint8Array> {
    const body: Record<string, unknown> = {
      model: options?.model || "gpt-4o-mini-tts",
      input: text,
      voice: options?.voice || "alloy",
      response_format: "mp3",
    };

    if (options?.instructions) {
      body.instructions = options.instructions;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(`${this.config.api_base}/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.api_key}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TTS API error (${response.status}): ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
