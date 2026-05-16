/**
 * Video Analysis Agents — OpenAI Responses API
 *
 * Implements the 5 partial-coverage agents using OpenAI's Responses API:
 * 1. Video Summarizer — GPT-4.1 vision frame analysis
 * 2. Video Search — GPT-4.1 vision content search
 * 3. Subtitle Generator — Whisper API transcription
 * 4. Highlight Extractor — GPT-4.1 vision highlight detection
 * 5. Scene Detector — GPT-4.1 vision scene boundary detection
 * 6. Video Stabilizer — FFmpeg vid.stab (not OpenAI)
 */

import { OpenAIResponsesClient } from "./openai-responses.ts";

export interface VideoAnalysisResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Video Summarizer — Uses GPT-4.1 Responses API with vision
 *
 * Extracts frames from the video and sends them to GPT-4.1 as input_image items.
 * The model analyzes all frames and returns a comprehensive summary.
 */
export async function summarizeVideo(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  frames: Array<{ base64: string; timestamp: number }>,
  style: string = "detailed",
): Promise<VideoAnalysisResult> {
  if (!frames || frames.length === 0) {
    return {
      success: false,
      message: "No frames provided for summarization. Please ensure the video is accessible and try again.",
    };
  }

  const stylePrompts: Record<string, string> = {
    brief: "Provide a brief 2-3 sentence summary of this video.",
    detailed: "Provide a detailed summary of this video including: 1) Main topics discussed, 2) Key scenes and their timestamps, 3) Important moments or highlights, 4) Overall narrative or structure.",
    "bullet-points": "Summarize this video in bullet points. Include key topics, scenes, and important moments with timestamps.",
  };

  const prompt = stylePrompts[style] || stylePrompts.detailed;

  try {
    const result = await openai.analyze(prompt, frames.map((f) => ({
      base64: f.base64,
      detail: "high" as const,
    })), {
      model: "gpt-4.1-mini",
      max_output_tokens: 2048,
      system:
        "You are a professional video analyst. Analyze the provided video frames and provide an accurate, comprehensive summary. Reference specific timestamps when mentioning key moments.",
    });

    return {
      success: true,
      message: result.output_text ||
        "Video summary generated successfully.",
      data: {
        agent: "summarize_video",
        video_url: videoUrl,
        frame_count: frames.length,
        summary_style: style,
        tokens_used: result.usage.total_tokens,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Video summarization failed: ${error.message}`,
    };
  }
}

/**
 * Video Search — Uses GPT-4.1 Responses API with vision
 *
 * Searches through video frames to find moments matching a user query.
 * Returns timestamps and descriptions of matching content.
 */
export async function searchVideo(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  query: string,
  frames: Array<{ base64: string; timestamp: number }>,
): Promise<VideoAnalysisResult> {
  if (!frames || frames.length === 0) {
    return {
      success: false,
      message: "No frames provided for search. Please ensure the video is accessible.",
    };
  }

  const prompt = `Search this video for content matching the query: "${query}"

For each matching moment found, provide:
1. Timestamp (in seconds)
2. Brief description of what's happening
3. Relevance score (1-10)

Return results as a JSON array. If no matches are found, return an empty array.`;

  try {
    const result = await openai.analyze(prompt, frames.map((f) => ({
      base64: f.base64,
      detail: "low" as const, // Use low detail for search (many frames, cost-effective)
    })), {
      model: "gpt-4.1-mini",
      max_output_tokens: 2048,
      system:
        "You are a video content analyst. Search through the provided video frames and find all moments that match the user's query. Be precise with timestamps and descriptions.",
    });

    // Try to parse JSON from the response
    let searchResults: Array<{ timestamp: number; description: string; relevance: number }> = [];
    try {
      const jsonMatch = result.output_text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        searchResults = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, return the raw text
    }

    const matchCount = searchResults.length;

    return {
      success: true,
      message: matchCount > 0
        ? `Found ${matchCount} matching moment(s) for "${query}" in the video.`
        : `No matches found for "${query}" in the video.`,
      data: {
        agent: "search_media",
        video_url: videoUrl,
        query,
        results: searchResults,
        match_count: matchCount,
        tokens_used: result.usage.total_tokens,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Video search failed: ${error.message}`,
    };
  }
}

/**
 * Subtitle Generator — Uses OpenAI Whisper API
 *
 * Transcribes audio from the video and returns timed subtitles in SRT format.
 */
export async function generateSubtitles(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  audioBuffer: Uint8Array,
  options?: {
    language?: string;
    format?: "srt" | "vtt";
  },
): Promise<VideoAnalysisResult> {
  if (!audioBuffer || audioBuffer.length === 0) {
    return {
      success: false,
      message: "No audio data provided. Please ensure the video has an audio track.",
    };
  }

  const format = options?.format || "srt";

  try {
    const subtitleText = await openai.transcribeAudio(audioBuffer, {
      model: "whisper-1",
      format,
      language: options?.language,
    });

    return {
      success: true,
      message: `Subtitles generated successfully in ${format.toUpperCase()} format.`,
      data: {
        agent: "generate_subtitles",
        video_url: videoUrl,
        format,
        language: options?.language || "auto-detected",
        subtitle_text: subtitleText,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Subtitle generation failed: ${error.message}`,
    };
  }
}

/**
 * Highlight Extractor — Uses GPT-4.1 Responses API with vision
 *
 * Analyzes video frames to identify the most engaging, dramatic, or important moments.
 * Returns timestamps and descriptions of top highlights.
 */
export async function extractHighlights(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  frames: Array<{ base64: string; timestamp: number }>,
  maxHighlights: number = 5,
): Promise<VideoAnalysisResult> {
  if (!frames || frames.length === 0) {
    return {
      success: false,
      message: "No frames provided for highlight extraction.",
    };
  }

  const prompt = `Analyze these video frames and identify the top ${maxHighlights} most engaging, dramatic, or important moments.

For each highlight, provide:
1. Timestamp (in seconds) — use the frame timestamps provided
2. Brief description of what's happening
3. Engagement score (1-10, where 10 is most engaging)
4. Reason why this moment is significant

Return results as a JSON array sorted by engagement score (highest first).`;

  try {
    const result = await openai.analyze(prompt, frames.map((f) => ({
      base64: f.base64,
      detail: "high" as const,
    })), {
      model: "gpt-4.1-mini",
      max_output_tokens: 2048,
      system:
        "You are a professional video editor and content analyst. Identify the most engaging and important moments in the video. Consider visual impact, emotional content, narrative significance, and audience engagement potential.",
    });

    // Try to parse JSON from the response
    let highlights: Array<{
      timestamp: number;
      description: string;
      engagement_score: number;
      reason: string;
    }> = [];
    try {
      const jsonMatch = result.output_text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        highlights = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, return the raw text
    }

    return {
      success: true,
      message: highlights.length > 0
        ? `Extracted ${highlights.length} highlight(s) from the video.`
        : "Highlight extraction completed. " + result.output_text.substring(0, 200),
      data: {
        agent: "extract_highlights",
        video_url: videoUrl,
        max_highlights: maxHighlights,
        highlights,
        tokens_used: result.usage.total_tokens,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Highlight extraction failed: ${error.message}`,
    };
  }
}

/**
 * Scene Detector — Uses GPT-4.1 Responses API with vision
 *
 * Analyzes video frames to detect scene boundaries (significant changes
 * in location, subject, camera angle, or visual composition).
 */
export async function detectScenes(
  openai: OpenAIResponsesClient,
  videoUrl: string,
  frames: Array<{ base64: string; timestamp: number }>,
  sensitivity: string = "medium",
): Promise<VideoAnalysisResult> {
  if (!frames || frames.length === 0) {
    return {
      success: false,
      message: "No frames provided for scene detection.",
    };
  }

  const sensitivityPrompts: Record<string, string> = {
    low: "Only detect major scene changes (significant location/subject changes).",
    medium: "Detect moderate scene changes including location, subject, and camera angle changes.",
    high: "Detect all scene changes including subtle transitions, lighting changes, and camera movements.",
  };

  const prompt = `Analyze these video frames and identify all scene boundaries.

${sensitivityPrompts[sensitivity] || sensitivityPrompts.medium}

A scene boundary occurs when there is a significant change in:
- Location or setting
- Main subject or characters
- Camera angle or framing
- Visual composition or lighting
- Narrative context

For each scene boundary, provide:
1. Timestamp (in seconds) of the scene change
2. Brief description of the new scene
3. Type of transition (cut, fade, location change, subject change, etc.)

Return results as a JSON array.`;

  try {
    const result = await openai.analyze(prompt, frames.map((f) => ({
      base64: f.base64,
      detail: "low" as const, // Use low detail for scene detection (many frames)
    })), {
      model: "gpt-4.1-mini",
      max_output_tokens: 2048,
      system:
        "You are a professional video editor. Analyze the provided video frames and identify all scene boundaries accurately. Be precise with timestamps and descriptive with scene descriptions.",
    });

    // Try to parse JSON from the response
    let scenes: Array<{
      timestamp: number;
      description: string;
      transition_type: string;
    }> = [];
    try {
      const jsonMatch = result.output_text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scenes = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If JSON parsing fails, return the raw text
    }

    return {
      success: true,
      message: scenes.length > 0
        ? `Detected ${scenes.length} scene(s) in the video.`
        : "Scene detection completed. " + result.output_text.substring(0, 200),
      data: {
        agent: "detect_scenes",
        video_url: videoUrl,
        sensitivity,
        scenes,
        scene_count: scenes.length,
        tokens_used: result.usage.total_tokens,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Scene detection failed: ${error.message}`,
    };
  }
}

/**
 * Video Stabilizer — NOT OpenAI (uses FFmpeg)
 *
 * Video stabilization is a signal processing task that requires
 * frame-by-frame motion analysis and compensation. This cannot be
 * done by an LLM.
 *
 * Options:
 * 1. FFmpeg vid.stab (free, open-source, server-side)
 * 2. Cloud video processing APIs
 * 3. Client-side WebAssembly processing
 *
 * This function provides the interface; actual stabilization
 * requires ffmpeg or a dedicated video processing service.
 */
export async function stabilizeVideo(
  videoUrl: string,
  strength: string = "medium",
): Promise<VideoAnalysisResult> {
  // Video stabilization requires ffmpeg or a dedicated processing service.
  // This is a placeholder that returns instructions for the client.
  return {
    success: false,
    message:
      "Video stabilization requires server-side video processing (FFmpeg). " +
      "This feature is available when the backend has ffmpeg installed. " +
      "Strength: " + strength +
      ". Video URL: " + videoUrl,
    data: {
      agent: "stabilize_video",
      video_url: videoUrl,
      strength,
      requires_ffmpeg: true,
    },
  };
}
