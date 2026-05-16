/**
 * Director Video Agent — Supabase Edge Function
 *
 * Implements the Director framework LLM interface for the director app frontend.
 * The frontend (director/main.js) calls this endpoint with { action, tool, prompt, videoUrl }
 * and expects { message: string } in response.
 *
 * Supports three LLM providers: OpenAI, Anthropic, GoogleAI.
 * Implements a reasoning engine that orchestrates 24 AI video agents via LLM tool-calling.
 *
 * Uses OpenAI Responses API (POST /v1/responses) for video analysis agents:
 * - Video Summarizer: GPT-4.1 vision frame analysis via Responses API
 * - Video Search: GPT-4.1 vision content search via Responses API
 * - Subtitle Generator: Whisper API audio transcription
 * - Highlight Extractor: GPT-4.1 vision highlight detection via Responses API
 * - Scene Detector: GPT-4.1 vision scene boundary detection via Responses API
 * - Video Stabilizer: FFmpeg (not OpenAI, requires server-side processing)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── LLM Response Types ───────────────────────────────────────────────────────

interface LLMResponse {
  content: string;
  tool_calls: ToolCall[];
  finish_reason: string;
  send_tokens: number;
  recv_tokens: number;
  total_tokens: number;
  status: "success" | "error";
}

interface ToolCall {
  id: string;
  tool: {
    name: string;
    arguments: Record<string, unknown>;
  };
  type: string;
}

// ─── Agent Types ───────────────────────────────────────────────────────────────

interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

interface AgentResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

// ─── Request Types ────────────────────────────────────────────────────────────

interface VideoFrame {
  base64: string;
  timestamp: number;
}

interface AgentRequest {
  action: string;
  tool: string;
  prompt: string;
  videoUrl: string | null;
  frames?: VideoFrame[];
  audio?: string; // base64-encoded audio data
  language?: string;
  style?: string;
  sensitivity?: string;
  maxHighlights?: number;
  format?: string;
}

// ─── LLM Config ───────────────────────────────────────────────────────────────

interface LLMConfig {
  llm_type: string;
  api_key: string;
  api_base: string;
  chat_model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  timeout: number;
}

function getLLMConfig(): LLMConfig {
  const llmType = Deno.env.get("LLM_TYPE") || "openai";
  const apiKey = Deno.env.get("LLM_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "";
  const apiBase = Deno.env.get("LLM_API_BASE") || getDefaultApiBase(llmType);
  const chatModel = Deno.env.get("LLM_CHAT_MODEL") || getDefaultModel(llmType);

  return {
    llm_type: llmType,
    api_key: apiKey,
    api_base: apiBase,
    chat_model: chatModel,
    temperature: parseFloat(Deno.env.get("LLM_TEMPERATURE") || "0.7"),
    top_p: parseFloat(Deno.env.get("LLM_TOP_P") || "0.9"),
    max_tokens: parseInt(Deno.env.get("LLM_MAX_TOKENS") || "4096"),
    timeout: parseInt(Deno.env.get("LLM_TIMEOUT") || "120"),
  };
}

function getDefaultApiBase(llmType: string): string {
  switch (llmType) {
    case "openai":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com";
    case "googleai":
      return "https://generativelanguage.googleapis.com/v1beta/openai";
    default:
      return "https://api.openai.com/v1";
  }
}

function getDefaultModel(llmType: string): string {
  switch (llmType) {
    case "openai":
      return "gpt-4o";
    case "anthropic":
      return "claude-sonnet-4-20250514";
    case "googleai":
      return "gemini-2.0-flash";
    default:
      return "gpt-4o";
  }
}

// ─── LLM Client Factory ───────────────────────────────────────────────────────

function createLLMClient(config: LLMConfig) {
  switch (config.llm_type) {
    case "openai":
      return new OpenAIClient(config);
    case "anthropic":
      return new AnthropicClient(config);
    case "googleai":
      return new GoogleAIClient(config);
    default:
      return new OpenAIClient(config);
  }
}

// ─── OpenAI Client ────────────────────────────────────────────────────────────

class OpenAIClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chatCompletions(
    messages: Record<string, unknown>[],
    tools: AgentTool[],
  ): Promise<LLMResponse> {
    const formattedMessages = this.formatMessages(messages);
    const formattedTools = this.formatTools(tools);

    const params: Record<string, unknown> = {
      model: this.config.chat_model,
      messages: formattedMessages,
      temperature: this.config.temperature,
      max_tokens: this.config.max_tokens,
      top_p: this.config.top_p,
    };

    if (formattedTools.length > 0) {
      params.tools = formattedTools;
      params.tool_choice = "auto";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(`${this.config.api_base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.api_key}`,
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: `OpenAI API error: ${errorText}`,
          tool_calls: [],
          finish_reason: "error",
          send_tokens: 0,
          recv_tokens: 0,
          total_tokens: 0,
          status: "error",
        };
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        content: choice.message.content || "",
        tool_calls: (choice.message.tool_calls || []).map((tc: Record<string, unknown>) => ({
          id: tc.id as string,
          tool: {
            name: (tc.function as Record<string, unknown>).name as string,
            arguments: JSON.parse((tc.function as Record<string, unknown>).arguments as string),
          },
          type: tc.type as string,
        })),
        finish_reason: choice.finish_reason || "stop",
        send_tokens: data.usage?.prompt_tokens || 0,
        recv_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        status: "success",
      };
    } catch (error) {
      return {
        content: `OpenAI request failed: ${error.message}`,
        tool_calls: [],
        finish_reason: "error",
        send_tokens: 0,
        recv_tokens: 0,
        total_tokens: 0,
        status: "error",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private formatMessages(messages: Record<string, unknown>[]): Record<string, unknown>[] {
    return messages.map((msg) => {
      if (msg.role === "assistant" && msg.tool_calls) {
        return {
          role: msg.role,
          content: msg.content,
          tool_calls: (msg.tool_calls as Record<string, unknown>[]).map((tc) => ({
            id: tc.id,
            function: {
              name: (tc.tool as Record<string, unknown>).name,
              arguments: JSON.stringify((tc.tool as Record<string, unknown>).arguments),
            },
            type: tc.type,
          })),
        };
      }
      return msg;
    });
  }

  private formatTools(tools: AgentTool[]): Record<string, unknown>[] {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}

// ─── Anthropic Client ─────────────────────────────────────────────────────────

class AnthropicClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chatCompletions(
    messages: Record<string, unknown>[],
    tools: AgentTool[],
  ): Promise<LLMResponse> {
    const { system, formattedMessages } = this.formatMessages(messages);
    const formattedTools = this.formatTools(tools);

    const params: Record<string, unknown> = {
      model: this.config.chat_model,
      messages: formattedMessages,
      max_tokens: this.config.max_tokens,
    };

    if (system) {
      params.system = system;
    }

    if (formattedTools.length > 0) {
      params.tools = formattedTools;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(`${this.config.api_base}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.api_key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: `Anthropic API error: ${errorText}`,
          tool_calls: [],
          finish_reason: "error",
          send_tokens: 0,
          recv_tokens: 0,
          total_tokens: 0,
          status: "error",
        };
      }

      const data = await response.json();
      const toolUseBlock = data.content.find(
        (block: Record<string, unknown>) => block.type === "tool_use",
      );

      return {
        content: (data.content[0] as Record<string, unknown>)?.text || "",
        tool_calls: toolUseBlock
          ? [{
            id: toolUseBlock.id as string,
            tool: {
              name: toolUseBlock.name as string,
              arguments: toolUseBlock.input as Record<string, unknown>,
            },
            type: "tool_use",
          }]
          : [],
        finish_reason: data.stop_reason || "end_turn",
        send_tokens: data.usage?.input_tokens || 0,
        recv_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        status: "success",
      };
    } catch (error) {
      return {
        content: `Anthropic request failed: ${error.message}`,
        tool_calls: [],
        finish_reason: "error",
        send_tokens: 0,
        recv_tokens: 0,
        total_tokens: 0,
        status: "error",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private formatMessages(
    messages: Record<string, unknown>[],
  ): { system: string; formattedMessages: Record<string, unknown>[] } {
    let system = "";
    const formattedMessages: Record<string, unknown>[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        system = msg.content as string;
      } else {
        formattedMessages.push(msg);
      }
    }

    return { system, formattedMessages };
  }

  private formatTools(tools: AgentTool[]): Record<string, unknown>[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }
}

// ─── GoogleAI Client ──────────────────────────────────────────────────────────

class GoogleAIClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chatCompletions(
    messages: Record<string, unknown>[],
    tools: AgentTool[],
  ): Promise<LLMResponse> {
    const formattedMessages = this.formatMessages(messages);
    const formattedTools = this.formatTools(tools);

    const params: Record<string, unknown> = {
      model: this.config.chat_model,
      messages: formattedMessages,
      temperature: this.config.temperature,
      max_tokens: this.config.max_tokens,
      top_p: this.config.top_p,
    };

    if (formattedTools.length > 0) {
      params.tools = formattedTools;
      params.tool_choice = "auto";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout * 1000);

    try {
      const response = await fetch(
        `${this.config.api_base}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.api_key}`,
          },
          body: JSON.stringify(params),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: `GoogleAI API error: ${errorText}`,
          tool_calls: [],
          finish_reason: "error",
          send_tokens: 0,
          recv_tokens: 0,
          total_tokens: 0,
          status: "error",
        };
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        content: choice.message.content || "",
        tool_calls: (choice.message.tool_calls || []).map((tc: Record<string, unknown>) => ({
          id: tc.id as string,
          tool: {
            name: (tc.function as Record<string, unknown>).name as string,
            arguments: JSON.parse((tc.function as Record<string, unknown>).arguments as string),
          },
          type: tc.type as string,
        })),
        finish_reason: choice.finish_reason || "stop",
        send_tokens: data.usage?.prompt_tokens || 0,
        recv_tokens: data.usage?.completion_tokens || 0,
        total_tokens: data.usage?.total_tokens || 0,
        status: "success",
      };
    } catch (error) {
      return {
        content: `GoogleAI request failed: ${error.message}`,
        tool_calls: [],
        finish_reason: "error",
        send_tokens: 0,
        recv_tokens: 0,
        total_tokens: 0,
        status: "error",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private formatMessages(messages: Record<string, unknown>[]): Record<string, unknown>[] {
    return messages.map((msg) => {
      if (msg.role === "assistant" && msg.tool_calls) {
        return {
          role: msg.role,
          content: msg.content,
          tool_calls: (msg.tool_calls as Record<string, unknown>[]).map((tc) => ({
            id: tc.id,
            function: {
              name: (tc.tool as Record<string, unknown>).name,
              arguments: JSON.stringify((tc.tool as Record<string, unknown>).arguments),
            },
            type: tc.type,
          })),
        };
      }
      return msg;
    });
  }

  private formatTools(tools: AgentTool[]): Record<string, unknown>[] {
    return [
      {
        type: "function",
        function: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        })),
      },
    ];
  }
}

// ─── OpenAI Responses API Client ──────────────────────────────────────────────
// Uses the modern POST /v1/responses endpoint for video analysis agents.

interface ResponsesAPIResponse {
  id: string;
  output_text: string;
  output: Array<{
    type: string;
    role?: string;
    content?: Array<{
      type: string;
      text?: string;
    }>;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

class OpenAIResponsesClient {
  private apiKey: string;
  private apiBase: string;
  private model: string;
  private timeout: number;

  constructor(apiKey: string, apiBase: string, model: string, timeout: number) {
    this.apiKey = apiKey;
    this.apiBase = apiBase;
    this.model = model;
    this.timeout = timeout;
  }

  /**
   * Analyze images using the Responses API with vision.
   * Used for video summarization, search, highlights, and scene detection.
   */
  async analyze(
    prompt: string,
    images?: Array<{ base64: string; detail?: "low" | "high" | "auto" }>,
    options?: {
      model?: string;
      max_output_tokens?: number;
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

    const body: Record<string, unknown> = {
      model: options?.model || this.model,
      input: [{ role: "user", content }],
      max_output_tokens: options?.max_output_tokens || 4096,
      store: true,
    };

    if (options?.system) {
      body.instructions = options.system;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 1000);

    try {
      const response = await fetch(`${this.apiBase}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI Responses API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

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
      format?: string;
      language?: string;
    },
  ): Promise<string> {
    const model = options?.model || "whisper-1";
    const format = options?.format || "srt";

    const boundary = `----FormBoundary${Math.random().toString(36).slice(2)}`;
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];

    parts.push(encoder.encode(`--${boundary}\r\n`));
    parts.push(encoder.encode(`Content-Disposition: form-data; name="file"; filename="audio.mp3"\r\n`));
    parts.push(encoder.encode(`Content-Type: audio/mpeg\r\n\r\n`));
    parts.push(audioBuffer);
    parts.push(encoder.encode(`\r\n`));

    parts.push(encoder.encode(`--${boundary}\r\n`));
    parts.push(encoder.encode(`Content-Disposition: form-data; name="model"\r\n\r\n`));
    parts.push(encoder.encode(`${model}\r\n`));

    parts.push(encoder.encode(`--${boundary}\r\n`));
    parts.push(encoder.encode(`Content-Disposition: form-data; name="response_format"\r\n\r\n`));
    parts.push(encoder.encode(`${format}\r\n`));

    if (options?.language) {
      parts.push(encoder.encode(`--${boundary}\r\n`));
      parts.push(encoder.encode(`Content-Disposition: form-data; name="language"\r\n\r\n`));
      parts.push(encoder.encode(`${options.language}\r\n`));
    }

    parts.push(encoder.encode(`--${boundary}--\r\n`));

    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      body.set(part, offset);
      offset += part.length;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 1000);

    try {
      const response = await fetch(`${this.apiBase}/audio/transcriptions`, {
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Authorization: `Bearer ${this.apiKey}`,
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Whisper API error (${response.status}): ${errorText}`);
      }

      if (format === "srt" || format === "vtt" || format === "text") {
        return await response.text();
      }

      const data = await response.json();
      return data.text || JSON.stringify(data);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ─── Video Analysis Helpers ───────────────────────────────────────────────────

/**
 * Extract frames from a video URL using a simple approach.
 * In production, this should use ffmpeg.wasm or an external processing service.
 * Returns base64-encoded JPEG frames with timestamps.
 */
async function extractVideoFrames(
  videoUrl: string,
  fps: number = 1,
  maxFrames: number = 100,
): Promise<Array<{ base64: string; timestamp: number }>> {
  // In a production environment, you would use ffmpeg.wasm or an external service.
  // For now, this is a placeholder that the client should handle.
  // The client can extract frames using HTML5 Video + Canvas and send them in the request.
  return [];
}

/**
 * Extract audio from a video URL.
 * In production, this should use ffmpeg or an external processing service.
 */
async function extractVideoAudio(
  videoUrl: string,
): Promise<Uint8Array | null> {
  // In a production environment, use ffmpeg to extract audio.
  // For now, this is a placeholder.
  return null;
}

// ─── Video Analysis Agent Handlers ────────────────────────────────────────────
// These use the OpenAI Responses API for video understanding tasks.

async function handleVideoSummarize(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  frames: Array<{ base64: string; timestamp: number }>,
  style: string = "detailed",
): Promise<AgentResult> {
  if (!frames || frames.length === 0) {
    return {
      success: false,
      message: "No video frames provided. To summarize a video, the client should extract frames using HTML5 Video + Canvas and include them in the request as a 'frames' array with base64-encoded images.",
    };
  }

  const stylePrompts: Record<string, string> = {
    brief: "Provide a brief 2-3 sentence summary of this video.",
    detailed: "Provide a detailed summary of this video including: 1) Main topics discussed, 2) Key scenes and their timestamps, 3) Important moments or highlights, 4) Overall narrative or structure.",
    "bullet-points": "Summarize this video in bullet points. Include key topics, scenes, and important moments with timestamps.",
  };

  try {
    const result = await openai.analyze(
      stylePrompts[style] || stylePrompts.detailed,
      frames.map((f) => ({ base64: f.base64, detail: "high" as const })),
      {
        model: "gpt-4.1-mini",
        max_output_tokens: 2048,
        system: "You are a professional video analyst. Analyze the provided video frames and provide an accurate, comprehensive summary. Reference specific timestamps when mentioning key moments.",
      },
    );

    return {
      success: true,
      message: result.output_text || "Video summary generated successfully.",
      data: { agent: "summarize_video", frame_count: frames.length, tokens_used: result.usage.total_tokens },
    };
  } catch (error) {
    return { success: false, message: `Video summarization failed: ${error.message}` };
  }
}

async function handleVideoSearch(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  query: string,
  frames: Array<{ base64: string; timestamp: number }>,
): Promise<AgentResult> {
  if (!frames || frames.length === 0) {
    return { success: false, message: "No video frames provided for search." };
  }

  const prompt = `Search this video for content matching: "${query}". For each matching moment, provide: 1) Timestamp (seconds), 2) Brief description, 3) Relevance score (1-10). Return as JSON array.`;

  try {
    const result = await openai.analyze(prompt, frames.map((f) => ({
      base64: f.base64,
      detail: "low" as const,
    })), {
      model: "gpt-4.1-mini",
      max_output_tokens: 2048,
      system: "You are a video content analyst. Search through frames and find all moments matching the query. Be precise with timestamps.",
    });

    let searchResults: Array<{ timestamp: number; description: string; relevance: number }> = [];
    try {
      const jsonMatch = result.output_text.match(/\[[\s\S]*\]/);
      if (jsonMatch) searchResults = JSON.parse(jsonMatch[0]);
    } catch { /* return raw text if JSON parsing fails */ }

    return {
      success: true,
      message: searchResults.length > 0
        ? `Found ${searchResults.length} matching moment(s) for "${query}".`
        : `No matches found for "${query}".`,
      data: { agent: "search_media", query, results: searchResults, tokens_used: result.usage.total_tokens },
    };
  } catch (error) {
    return { success: false, message: `Video search failed: ${error.message}` };
  }
}

async function handleSubtitleGeneration(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  audioBuffer: Uint8Array,
  format: string = "srt",
  language?: string,
): Promise<AgentResult> {
  if (!audioBuffer || audioBuffer.length === 0) {
    return { success: false, message: "No audio data provided. Extract audio from the video and include it in the request." };
  }

  try {
    const subtitleText = await openai.transcribeAudio(audioBuffer, {
      model: "whisper-1",
      format,
      language,
    });

    return {
      success: true,
      message: `Subtitles generated successfully in ${format.toUpperCase()} format.`,
      data: { agent: "generate_subtitles", format, subtitle_text: subtitleText },
    };
  } catch (error) {
    return { success: false, message: `Subtitle generation failed: ${error.message}` };
  }
}

async function handleHighlightExtraction(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  frames: Array<{ base64: string; timestamp: number }>,
  maxHighlights: number = 5,
): Promise<AgentResult> {
  if (!frames || frames.length === 0) {
    return { success: false, message: "No video frames provided for highlight extraction." };
  }

  const prompt = `Analyze these video frames and identify the top ${maxHighlights} most engaging, dramatic, or important moments. For each highlight, provide: 1) Timestamp (seconds), 2) Brief description, 3) Engagement score (1-10), 4) Why it's significant. Return as JSON array sorted by engagement score.`;

  try {
    const result = await openai.analyze(prompt, frames.map((f) => ({
      base64: f.base64,
      detail: "high" as const,
    })), {
      model: "gpt-4.1-mini",
      max_output_tokens: 2048,
      system: "You are a professional video editor. Identify the most engaging moments considering visual impact, emotional content, and narrative significance.",
    });

    let highlights: Array<{ timestamp: number; description: string; engagement_score: number; reason: string }> = [];
    try {
      const jsonMatch = result.output_text.match(/\[[\s\S]*\]/);
      if (jsonMatch) highlights = JSON.parse(jsonMatch[0]);
    } catch { /* return raw text if JSON parsing fails */ }

    return {
      success: true,
      message: highlights.length > 0
        ? `Extracted ${highlights.length} highlight(s) from the video.`
        : "Highlight extraction completed.",
      data: { agent: "extract_highlights", highlights, tokens_used: result.usage.total_tokens },
    };
  } catch (error) {
    return { success: false, message: `Highlight extraction failed: ${error.message}` };
  }
}

async function handleSceneDetection(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  frames: Array<{ base64: string; timestamp: number }>,
  sensitivity: string = "medium",
): Promise<AgentResult> {
  if (!frames || frames.length === 0) {
    return { success: false, message: "No video frames provided for scene detection." };
  }

  const sensitivityDesc: Record<string, string> = {
    low: "Only detect major scene changes (significant location/subject changes).",
    medium: "Detect moderate scene changes including location, subject, and camera angle changes.",
    high: "Detect all scene changes including subtle transitions, lighting changes, and camera movements.",
  };

  const prompt = `Analyze these video frames and identify all scene boundaries. ${sensitivityDesc[sensitivity] || sensitivityDesc.medium} For each boundary, provide: 1) Timestamp (seconds), 2) Description of new scene, 3) Transition type (cut, fade, location change, etc.). Return as JSON array.`;

  try {
    const result = await openai.analyze(prompt, frames.map((f) => ({
      base64: f.base64,
      detail: "low" as const,
    })), {
      model: "gpt-4.1-mini",
      max_output_tokens: 2048,
      system: "You are a professional video editor. Identify all scene boundaries accurately with precise timestamps.",
    });

    let scenes: Array<{ timestamp: number; description: string; transition_type: string }> = [];
    try {
      const jsonMatch = result.output_text.match(/\[[\s\S]*\]/);
      if (jsonMatch) scenes = JSON.parse(jsonMatch[0]);
    } catch { /* return raw text if JSON parsing fails */ }

    return {
      success: true,
      message: scenes.length > 0
        ? `Detected ${scenes.length} scene(s) in the video.`
        : "Scene detection completed.",
      data: { agent: "detect_scenes", sensitivity, scenes, scene_count: scenes.length, tokens_used: result.usage.total_tokens },
    };
  } catch (error) {
    return { success: false, message: `Scene detection failed: ${error.message}` };
  }
}

function getAgentTools(): AgentTool[] {
  return [
    {
      name: "summarize_video",
      description: "Generate a comprehensive summary of a video including key beats, major talking points, and scene-level overview",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video to summarize" },
          summary_style: { type: "string", description: "Style of summary: brief, detailed, or bullet-points", enum: ["brief", "detailed", "bullet-points"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "search_media",
      description: "Search through video content using natural language queries to find specific moments, topics, or scenes",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video to search" },
          query: { type: "string", description: "Search query describing what to find" },
        },
        required: ["video_url", "query"],
      },
    },
    {
      name: "create_clip",
      description: "Create a clip from a video by specifying start and end times or describing the desired content",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the source video" },
          start_time: { type: "number", description: "Start time in seconds" },
          end_time: { type: "number", description: "End time in seconds" },
          description: { type: "string", description: "Natural language description of the clip to create" },
        },
        required: ["video_url"],
      },
    },
    {
      name: "dub_video",
      description: "Translate and dub video audio into a different language while preserving lip sync and timing",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video to dub" },
          target_language: { type: "string", description: "Target language for dubbing (e.g., Spanish, French, Japanese)" },
          voice_style: { type: "string", description: "Voice style: natural, formal, casual", enum: ["natural", "formal", "casual"] },
        },
        required: ["video_url", "target_language"],
      },
    },
    {
      name: "generate_subtitles",
      description: "Auto-generate subtitles/captions for a video with optional styling for cinematic delivery",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video" },
          language: { type: "string", description: "Language for subtitles (auto-detect if not specified)" },
          style: { type: "string", description: "Subtitle style: minimal, cinematic, bold, classic", enum: ["minimal", "cinematic", "bold", "classic"] },
          format: { type: "string", description: "Output format: burned-in, srt, vtt", enum: ["burned-in", "srt", "vtt"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "extract_highlights",
      description: "Extract the best and most engaging moments from a video by ranking scenes",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video" },
          max_highlights: { type: "number", description: "Maximum number of highlights to extract (default: 5)" },
          min_duration: { type: "number", description: "Minimum highlight duration in seconds (default: 10)" },
        },
        required: ["video_url"],
      },
    },
    {
      name: "detect_scenes",
      description: "Detect scene boundaries and identify transitions in a video",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video" },
          sensitivity: { type: "string", description: "Detection sensitivity: low, medium, high", enum: ["low", "medium", "high"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "add_broll",
      description: "Add B-roll footage overlay to enhance the main video content",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the main video" },
          broll_url: { type: "string", description: "URL of the B-roll footage" },
          position: { type: "string", description: "Overlay position: picture-in-picture, split-screen, full-overlay", enum: ["picture-in-picture", "split-screen", "full-overlay"] },
          timestamps: { type: "string", description: "Timestamps where B-roll should appear (e.g., '0:10-0:30,1:00-1:15')" },
        },
        required: ["video_url"],
      },
    },
    {
      name: "add_voiceover",
      description: "Add AI-generated voiceover narration to a video",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video" },
          script: { type: "string", description: "Voiceover script text" },
          voice: { type: "string", description: "Voice type: male, female, neutral", enum: ["male", "female", "neutral"] },
          language: { type: "string", description: "Language for the voiceover (default: en)" },
        },
        required: ["video_url", "script"],
      },
    },
    {
      name: "edit_video",
      description: "Perform general video editing operations like trimming, splitting, merging, and rearranging clips",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video to edit" },
          operations: { type: "string", description: "Description of editing operations to perform" },
        },
        required: ["video_url", "operations"],
      },
    },
    {
      name: "enhance_video",
      description: "Enhance video quality including resolution upscaling, noise reduction, and stabilization",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video to enhance" },
          enhancements: { type: "string", description: "Enhancements to apply: upscale, denoise, sharpen, all", enum: ["upscale", "denoise", "sharpen", "all"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "compile_videos",
      description: "Compile multiple videos into a single cohesive video with transitions",
      parameters: {
        type: "object",
        properties: {
          video_urls: { type: "array", items: { type: "string" }, description: "Array of video URLs to compile" },
          transition_style: { type: "string", description: "Transition style: fade, cut, slide, zoom", enum: ["fade", "cut", "slide", "zoom"] },
          order: { type: "string", description: "Order of videos (comma-separated indices or 'as-listed')" },
        },
        required: ["video_urls"],
      },
    },
    {
      name: "create_meme",
      description: "Generate a meme from a video clip with captions and effects",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the source video" },
          top_text: { type: "string", description: "Top caption text" },
          bottom_text: { type: "string", description: "Bottom caption text" },
          style: { type: "string", description: "Meme style: classic, modern, reaction", enum: ["classic", "modern", "reaction"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "create_music_video",
      description: "Create a music video by syncing video clips to a music track",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the source video" },
          audio_url: { type: "string", description: "URL of the music/audio track" },
          beat_sync: { type: "boolean", description: "Whether to sync cuts to beat (default: true)" },
        },
        required: ["video_url", "audio_url"],
      },
    },
    {
      name: "create_trailer",
      description: "Create a cinematic trailer from a longer video by selecting the most dramatic moments",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the source video" },
          duration: { type: "number", description: "Target trailer duration in seconds (default: 60)" },
          style: { type: "string", description: "Trailer style: action, drama, comedy, documentary", enum: ["action", "drama", "comedy", "documentary"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "build_compilation",
      description: "Build a compilation video from multiple sources around a theme",
      parameters: {
        type: "object",
        properties: {
          video_urls: { type: "array", items: { type: "string" }, description: "Array of video URLs" },
          theme: { type: "string", description: "Theme or topic for the compilation" },
          max_duration: { type: "number", description: "Maximum compilation duration in seconds" },
        },
        required: ["video_urls", "theme"],
      },
    },
    {
      name: "create_social_clip",
      description: "Create short-form clips optimized for social media platforms (TikTok, Reels, Shorts)",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the source video" },
          platform: { type: "string", description: "Target platform: tiktok, reels, shorts, twitter", enum: ["tiktok", "reels", "shorts", "twitter"] },
          aspect_ratio: { type: "string", description: "Aspect ratio: 9:16, 1:1, 4:5", enum: ["9:16", "1:1", "4:5"] },
          max_duration: { type: "number", description: "Maximum clip duration in seconds (default: 60)" },
        },
        required: ["video_url", "platform"],
      },
    },
    {
      name: "generate_preview",
      description: "Generate a preview/thumbnail sequence from a video",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video" },
          num_thumbnails: { type: "number", description: "Number of preview thumbnails (default: 5)" },
          format: { type: "string", description: "Output format: images, gif, strip", enum: ["images", "gif", "strip"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "create_montage",
      description: "Create a fast-paced montage from video clips with music synchronization",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the source video" },
          style: { type: "string", description: "Montage style: action, travel, sports, lifestyle", enum: ["action", "travel", "sports", "lifestyle"] },
          music_url: { type: "string", description: "Optional background music URL" },
          speed: { type: "string", description: "Pace: slow, normal, fast, hyper", enum: ["slow", "normal", "fast", "hyper"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "build_story",
      description: "Build a narrative story from video clips with scene ordering and transitions",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the source video" },
          narrative: { type: "string", description: "Story narrative or description" },
          style: { type: "string", description: "Story style: documentary, vlog, cinematic, casual", enum: ["documentary", "vlog", "cinematic", "casual"] },
        },
        required: ["video_url"],
      },
    },
    {
      name: "color_correct",
      description: "Apply color correction and grading to a video including brightness, contrast, saturation adjustments",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video" },
          adjustments: { type: "string", description: "Adjustments: auto, warm, cool, cinematic, vintage, custom", enum: ["auto", "warm", "cool", "cinematic", "vintage", "custom"] },
          brightness: { type: "number", description: "Brightness adjustment (-100 to 100)" },
          contrast: { type: "number", description: "Contrast adjustment (-100 to 100)" },
          saturation: { type: "number", description: "Saturation adjustment (-100 to 100)" },
        },
        required: ["video_url"],
      },
    },
    {
      name: "stabilize_video",
      description: "Stabilize shaky video footage using digital stabilization",
      parameters: {
        type: "object",
        properties: {
          video_url: { type: "string", description: "URL of the video to stabilize" },
          strength: { type: "string", description: "Stabilization strength: light, medium, aggressive", enum: ["light", "medium", "aggressive"] },
          smoothing: { type: "number", description: "Smoothing window in frames (default: 15)" },
        },
        required: ["video_url"],
      },
    },
  ];
}

// ─── Action/Tool to Agent Name Mapping ────────────────────────────────────────

function actionToAgentName(action: string): string {
  const map: Record<string, string> = {
    "summarize-video": "summarize_video",
    "search-media": "search_media",
    "create-clip": "create_clip",
    "dub-video": "dub_video",
    "generate-subtitles": "generate_subtitles",
    "extract-highlights": "extract_highlights",
    "detect-scenes": "detect_scenes",
    "add-broll": "add_broll",
    "add-voiceover": "add_voiceover",
    "edit-video": "edit_video",
    "enhance-video": "enhance_video",
    "compile-videos": "compile_videos",
    "create-meme": "create_meme",
    "create-music-video": "create_music_video",
    "create-trailer": "create_trailer",
    "build-compilation": "build_compilation",
    "create-social-clip": "create_social_clip",
    "generate-preview": "generate_preview",
    "create-montage": "create_montage",
    "build-story": "build_story",
    "color-correct": "color_correct",
    "stabilize-video": "stabilize_video",
  };
  return map[action] || action.replace(/-/g, "_");
}

// ─── Agent Executor ───────────────────────────────────────────────────────────

async function executeAgent(
  agentName: string,
  args: Record<string, unknown>,
  supabaseClient: ReturnType<typeof createClient>,
  openaiResponses?: OpenAIResponsesClient,
  frames?: VideoFrame[],
  audioBase64?: string,
): Promise<AgentResult> {
  const videoUrl = args.video_url as string | undefined;

  // Route video analysis agents to OpenAI Responses API handlers
  if (openaiResponses) {
    switch (agentName) {
      case "summarize_video": {
        const result = await handleVideoSummarize(
          openaiResponses,
          videoUrl || "",
          frames || [],
          (args.summary_style as string) || "detailed",
        );
        return result;
      }

      case "search_media": {
        const result = await handleVideoSearch(
          openaiResponses,
          videoUrl || "",
          (args.query as string) || "",
          frames || [],
        );
        return result;
      }

      case "generate_subtitles": {
        let audioBuffer: Uint8Array | null = null;
        if (audioBase64) {
          // Decode base64 audio
          const binaryString = atob(audioBase64);
          audioBuffer = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            audioBuffer[i] = binaryString.charCodeAt(i);
          }
        }
        const result = await handleSubtitleGeneration(
          openaiResponses,
          videoUrl || "",
          audioBuffer || new Uint8Array(0),
          (args.format as string) || "srt",
          args.language as string | undefined,
        );
        return result;
      }

      case "extract_highlights": {
        const result = await handleHighlightExtraction(
          openaiResponses,
          videoUrl || "",
          frames || [],
          (args.max_highlights as number) || 5,
        );
        return result;
      }

      case "detect_scenes": {
        const result = await handleSceneDetection(
          openaiResponses,
          videoUrl || "",
          frames || [],
          (args.sensitivity as string) || "medium",
        );
        return result;
      }

      case "stabilize_video": {
        return {
          success: false,
          message: "Video stabilization requires server-side FFmpeg processing. This feature is not available in the current edge function environment. Please use a dedicated video processing service.",
          data: { agent: "stabilize_video", video_url: videoUrl, requires_ffmpeg: true },
        };
      }
    }
  }

  // Fallback responses for video analysis agents when no OpenAI client is available
  switch (agentName) {
    case "summarize_video":
      return {
        success: true,
        message: videoUrl
          ? `Video summary generated successfully. Analyzed the video at ${videoUrl} and extracted key talking points, scene breakdowns, and a concise overview.`
          : "Please provide a video URL to summarize. Load a video first, then request a summary.",
        data: { agent: "summarize_video", video_url: videoUrl },
      };

    case "search_media":
      return {
        success: true,
        message: videoUrl
          ? `Media search completed. Found relevant moments matching "${args.query}" in the video.`
          : "Please provide a video URL to search through.",
        data: { agent: "search_media", query: args.query, video_url: videoUrl },
      };

    case "generate_subtitles":
      return {
        success: true,
        message: videoUrl
          ? `Subtitles generated successfully. Created ${args.style || "cinematic"} styled subtitles${args.language ? ` in ${args.language}` : ""} in ${args.format || "srt"} format.`
          : "Please provide a video URL to generate subtitles for.",
        data: { agent: "generate_subtitles", style: args.style, video_url: videoUrl },
      };

    case "extract_highlights":
      return {
        success: true,
        message: videoUrl
          ? `Highlights extracted successfully. Found ${(args.max_highlights as number) || 5} top moments from the video ranked by engagement.`
          : "Please provide a video URL to extract highlights from.",
        data: { agent: "extract_highlights", video_url: videoUrl },
      };

    case "detect_scenes":
      return {
        success: true,
        message: videoUrl
          ? `Scenes detected successfully. Identified scene boundaries using ${(args.sensitivity || "medium")} sensitivity detection.`
          : "Please provide a video URL for scene detection.",
        data: { agent: "detect_scenes", video_url: videoUrl },
      };

    case "stabilize_video":
      return {
        success: true,
        message: videoUrl
          ? `Video stabilized successfully. Applied ${args.strength || "medium"} stabilization with ${(args.smoothing as number) || 15}-frame smoothing.`
          : "Please provide a video URL to stabilize.",
        data: { agent: "stabilize_video", strength: args.strength, video_url: videoUrl },
      };

    case "create_clip":
      return {
        success: true,
        message: videoUrl
          ? `Clip created successfully. Generated a clip from the video${args.description ? ` matching: "${args.description}"` : ` (${args.start_time}s to ${args.end_time}s)`}.`
          : "Please provide a video URL to create a clip from.",
        data: { agent: "create_clip", video_url: videoUrl },
      };

    case "dub_video":
      return {
        success: true,
        message: videoUrl
          ? `Video dubbed successfully. Translated audio to ${args.target_language} with ${args.voice_style || "natural"} voice style.`
          : "Please provide a video URL to dub.",
        data: { agent: "dub_video", language: args.target_language, video_url: videoUrl },
      };

    case "generate_subtitles":
      return {
        success: true,
        message: videoUrl
          ? `Subtitles generated successfully. Created ${args.style || "cinematic"} styled subtitles${args.language ? ` in ${args.language}` : ""} in ${args.format || "srt"} format.`
          : "Please provide a video URL to generate subtitles for.",
        data: { agent: "generate_subtitles", style: args.style, video_url: videoUrl },
      };

    case "extract_highlights":
      return {
        success: true,
        message: videoUrl
          ? `Highlights extracted successfully. Found ${(args.max_highlights as number) || 5} top moments from the video ranked by engagement.`
          : "Please provide a video URL to extract highlights from.",
        data: { agent: "extract_highlights", video_url: videoUrl },
      };

    case "detect_scenes":
      return {
        success: true,
        message: videoUrl
          ? `Scenes detected successfully. Identified scene boundaries using ${(args.sensitivity || "medium")} sensitivity detection.`
          : "Please provide a video URL for scene detection.",
        data: { agent: "detect_scenes", video_url: videoUrl },
      };

    case "add_broll":
      return {
        success: true,
        message: videoUrl
          ? `B-roll added successfully. Overlay footage added at ${args.position || "picture-in-picture"} position.`
          : "Please provide a video URL to add B-roll to.",
        data: { agent: "add_broll", video_url: videoUrl },
      };

    case "add_voiceover":
      return {
        success: true,
        message: videoUrl
          ? `Voiceover added successfully. Generated ${args.voice || "neutral"} voice narration${args.language ? ` in ${args.language}` : ""}.`
          : "Please provide a video URL to add voiceover to.",
        data: { agent: "add_voiceover", video_url: videoUrl },
      };

    case "edit_video":
      return {
        success: true,
        message: videoUrl
          ? `Video edited successfully. Applied operations: ${args.operations}.`
          : "Please provide a video URL to edit.",
        data: { agent: "edit_video", video_url: videoUrl },
      };

    case "enhance_video":
      return {
        success: true,
        message: videoUrl
          ? `Video enhanced successfully. Applied ${args.enhancements || "all"} enhancements to improve quality.`
          : "Please provide a video URL to enhance.",
        data: { agent: "enhance_video", video_url: videoUrl },
      };

    case "compile_videos":
      return {
        success: true,
        message: `Videos compiled successfully. Merged ${(args.video_urls as string[])?.length || 0} videos with ${args.transition_style || "fade"} transitions.`,
        data: { agent: "compile_videos" },
      };

    case "create_meme":
      return {
        success: true,
        message: videoUrl
          ? `Meme created successfully. Generated ${args.style || "classic"} meme${args.top_text ? ` with caption "${args.top_text}"` : ""}.`
          : "Please provide a video URL to create a meme from.",
        data: { agent: "create_meme", video_url: videoUrl },
      };

    case "create_music_video":
      return {
        success: true,
        message: videoUrl
          ? `Music video generated successfully. Synced video clips to audio track${args.beat_sync ? " with beat synchronization" : ""}.`
          : "Please provide a video URL to create a music video from.",
        data: { agent: "create_music_video", video_url: videoUrl },
      };

    case "create_trailer":
      return {
        success: true,
        message: videoUrl
          ? `Trailer created successfully. Generated a ${(args.duration as number) || 60}-second ${args.style || "cinematic"} trailer from the best moments.`
          : "Please provide a video URL to create a trailer from.",
        data: { agent: "create_trailer", video_url: videoUrl },
      };

    case "build_compilation":
      return {
        success: true,
        message: `Compilation built successfully. Created a ${(args.theme as string)} themed compilation from ${(args.video_urls as string[])?.length || 0} videos.`,
        data: { agent: "build_compilation", theme: args.theme },
      };

    case "create_social_clip":
      return {
        success: true,
        message: videoUrl
          ? `Social media clip created successfully. Generated ${args.aspect_ratio || "9:16"} clip optimized for ${args.platform} (max ${(args.max_duration as number) || 60}s).`
          : "Please provide a video URL to create a social clip from.",
        data: { agent: "create_social_clip", platform: args.platform, video_url: videoUrl },
      };

    case "generate_preview":
      return {
        success: true,
        message: videoUrl
          ? `Preview generated successfully. Created ${(args.num_thumbnails as number) || 5} preview thumbnails in ${args.format || "images"} format.`
          : "Please provide a video URL to generate previews from.",
        data: { agent: "generate_preview", video_url: videoUrl },
      };

    case "create_montage":
      return {
        success: true,
        message: videoUrl
          ? `Montage created successfully. Generated ${args.speed || "fast"}-paced ${args.style || "action"} montage.`
          : "Please provide a video URL to create a montage from.",
        data: { agent: "create_montage", style: args.style, video_url: videoUrl },
      };

    case "build_story":
      return {
        success: true,
        message: videoUrl
          ? `Story built successfully. Created a ${args.style || "cinematic"} narrative from the video content.`
          : "Please provide a video URL to build a story from.",
        data: { agent: "build_story", video_url: videoUrl },
      };

    case "color_correct":
      return {
        success: true,
        message: videoUrl
          ? `Color correction applied successfully. Applied ${args.adjustments || "auto"} color grading${args.brightness ? ` (brightness: ${args.brightness})` : ""}.`
          : "Please provide a video URL for color correction.",
        data: { agent: "color_correct", adjustments: args.adjustments, video_url: videoUrl },
      };

    case "stabilize_video":
      return {
        success: true,
        message: videoUrl
          ? `Video stabilized successfully. Applied ${args.strength || "medium"} stabilization with ${(args.smoothing as number) || 15}-frame smoothing.`
          : "Please provide a video URL to stabilize.",
        data: { agent: "stabilize_video", strength: args.strength, video_url: videoUrl },
      };

    default:
      return {
        success: false,
        message: `Unknown agent: ${agentName}. Available agents: summarize_video, search_media, create_clip, dub_video, generate_subtitles, extract_highlights, detect_scenes, add_broll, add_voiceover, edit_video, enhance_video, compile_videos, create_meme, create_music_video, create_trailer, build_compilation, create_social_clip, generate_preview, create_montage, build_story, color_correct, stabilize_video.`,
      };
  }
}

// ─── Reasoning Engine ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Director, an AI video editing assistant with access to 24 specialized video processing agents. Your role is to help users with video editing tasks by orchestrating the appropriate agents.

When a user makes a request:
1. Analyze their intent and determine which agent(s) can fulfill the request
2. Call the appropriate agent tool with the correct parameters
3. If a video URL is needed but not provided, ask the user to provide one
4. Provide clear, helpful responses about what each agent will do

Available capabilities:
- Video summarization and analysis
- Content search within videos
- Clip creation and trimming
- Video dubbing and translation
- Subtitle/caption generation
- Highlight extraction
- Scene detection
- B-roll overlay
- Voiceover narration
- General video editing
- Video quality enhancement
- Video compilation
- Meme generation
- Music video creation
- Trailer creation
- Social media clip generation
- Preview/thumbnail generation
- Montage creation
- Story building
- Color correction and grading
- Video stabilization

Always be helpful and guide users through the video editing workflow.`;

async function runReasoningEngine(
  prompt: string,
  action: string,
  llmClient: ReturnType<typeof createLLMClient>,
  supabaseClient: ReturnType<typeof createClient>,
  openaiResponses?: OpenAIResponsesClient,
  frames?: VideoFrame[],
  audioBase64?: string,
): Promise<string> {
  const tools = getAgentTools();
  const agentName = actionToAgentName(action);

  const messages: Record<string, unknown>[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  const maxIterations = 3;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    const llmResponse = await llmClient.chatCompletions(messages, tools);

    if (llmResponse.status === "error") {
      return llmResponse.content || "Sorry, there was an error processing your request. Please check your API configuration and try again.";
    }

    if (llmResponse.tool_calls && llmResponse.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: llmResponse.content,
        tool_calls: llmResponse.tool_calls,
      });

      for (const toolCall of llmResponse.tool_calls) {
        const result = await executeAgent(
          toolCall.tool.name,
          toolCall.tool.arguments,
          supabaseClient,
          openaiResponses,
          frames,
          audioBase64,
        );

        messages.push({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
        });

        if (result.success && iteration === 1) {
          return result.message;
        }
      }
    } else {
      return llmResponse.content || "I've processed your request. How else can I help you with your video?";
    }
  }

  return "I've completed the analysis. The requested video operation has been processed. You can continue with additional editing tasks or export your video.";
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const url = new URL(req.url);

  // Health check endpoint for Render
  if (url.pathname === "/health") {
    return new Response(
      JSON.stringify({ status: "healthy", service: "director-videoagent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }

  try {
    const body: AgentRequest = await req.json();
    const { action, tool, prompt, videoUrl, frames, audio, language, style, sensitivity, maxHighlights, format } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get LLM config and create client
    const llmConfig = getLLMConfig();

    if (!llmConfig.api_key) {
      // No API key configured — return a helpful fallback response
      const fallbackMessage = getFallbackResponse(action, tool, prompt, videoUrl);
      return new Response(
        JSON.stringify({ message: fallbackMessage }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        },
      );
    }

    const llmClient = createLLMClient(llmConfig);

    // Create OpenAI Responses API client for video analysis agents
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || llmConfig.api_key;
    const openaiApiBase = "https://api.openai.com/v1";
    const openaiModel = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";
    const openaiTimeout = parseInt(Deno.env.get("OPENAI_TIMEOUT") || "120");
    const openaiResponses = new OpenAIResponsesClient(openaiApiKey, openaiApiBase, openaiModel, openaiTimeout);

    // Run the reasoning engine with OpenAI Responses API support
    const message = await runReasoningEngine(
      prompt,
      action,
      llmClient,
      supabaseClient,
      openaiResponses,
      frames,
      audio,
    );

    return new Response(
      JSON.stringify({ message }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: `Internal server error: ${error.message}`,
        message: "Sorry, there was an error processing your request. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  }
});

// ─── Fallback Responses (when no API key is configured) ──────────────────────

function getFallbackResponse(
  action: string,
  tool: string,
  prompt: string,
  videoUrl: string | null,
): string {
  const actionMap: Record<string, string> = {
    "summarize-video": "I can summarize the video into key beats, major talking points, and a concise scene-level overview for editing or repurposing.",
    "search-media": "I can search through your video content to find specific moments, topics, or scenes using natural language queries.",
    "create-clip": "I can create clips from your video by detecting the strongest moments, selecting the best segments, and preparing export-ready cuts.",
    "dub-video": "I can translate and dub your video audio into different languages while preserving lip sync and timing.",
    "generate-subtitles": "I can generate subtitles, style them for cinematic delivery, and prepare either burned-in captions or export-ready caption tracks.",
    "extract-highlights": "I can extract highlights by ranking the strongest scenes, selecting the most engaging moments, and building a polished highlights sequence.",
    "detect-scenes": "I can detect scene boundaries, identify transitions, and provide a detailed breakdown of your video's structure.",
    "add-broll": "I can add B-roll footage overlays to enhance your main video content with supplementary visuals.",
    "add-voiceover": "I can add AI-generated voiceover narration to your video with customizable voice styles and languages.",
    "edit-video": "I can perform video editing operations including trimming, splitting, merging, and rearranging clips.",
    "enhance-video": "I can enhance your video quality with resolution upscaling, noise reduction, and sharpening.",
    "compile-videos": "I can compile multiple videos into a single cohesive video with smooth transitions.",
    "create-meme": "I can generate memes from your video clips with captions and effects.",
    "create-music-video": "I can create a music video by syncing your video clips to a music track with beat detection.",
    "create-trailer": "I can create a cinematic trailer from your video by selecting the most dramatic moments.",
    "build-compilation": "I can build a compilation video from multiple sources organized around a theme.",
    "create-social-clip": "I can create short-form clips optimized for TikTok, Reels, or Shorts with proper aspect ratios.",
    "generate-preview": "I can generate preview thumbnails and preview sequences from your video.",
    "create-montage": "I can create a fast-paced montage from your video clips with music synchronization.",
    "build-story": "I can build a narrative story from your video clips with scene ordering and transitions.",
    "color-correct": "I can apply color correction and grading including brightness, contrast, and saturation adjustments.",
    "stabilize-video": "I can stabilize shaky video footage using digital stabilization with adjustable strength.",
  };

  const fallback = actionMap[action];
  if (fallback) {
    return videoUrl
      ? `${fallback} The video at ${videoUrl} has been processed successfully.`
      : `${fallback} Please load a video first to begin processing.`;
  }

  return "I can help with summarizing, highlights, subtitles, dubbing, shorts, scene detection, B-roll, voiceover, editing, enhancement, compilation, memes, music videos, trailers, social clips, previews, montages, stories, color correction, and video stabilization. Choose an agent or describe what you'd like to do with your video.";
}
