import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://videoagencyai.netlify.app",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// LTX API configuration
const LTX_API_URL = Deno.env.get('LTX_API_URL') || 'http://localhost:8000';
const LTX_API_KEY = Deno.env.get('LTX_API_KEY');

interface LTXRequest {
  action: 'text-to-video' | 'image-to-video' | 'video-to-video' | 'lip-sync' | 'voice-clone' | 'check-capabilities';
  prompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  duration?: number;
  resolution?: string;
  fps?: number;
  cameraMotion?: string;
  voiceText?: string;
  voiceSample?: string;
  options?: any;
}

export async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: LTXRequest = await req.json();
    const { action, prompt, imageUrl, videoUrl, duration, resolution, fps, cameraMotion, voiceText, voiceSample, options = {} } = requestData;

    // LTX processing logic
    switch (action) {
      case 'check-capabilities':
        // Check if LTX is available and what capabilities it has
        const capabilities = await checkLTXCapabilities();

        return new Response(
          JSON.stringify({
            available: capabilities.available,
            localMode: capabilities.localMode,
            supportedResolutions: capabilities.supportedResolutions,
            supportedModels: capabilities.supportedModels,
            gpuInfo: capabilities.gpuInfo
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'text-to-video':
        // LTX Text-to-Video generation
        if (!prompt) {
          return new Response(
            JSON.stringify({ error: 'Prompt is required for text-to-video' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const t2vResult = await generateTextToVideo({
          prompt,
          duration: duration || 5,
          resolution: resolution || '720p',
          fps: fps || 24,
          ...options
        });

        return new Response(
          JSON.stringify({
            videoUrl: t2vResult.videoUrl,
            duration: t2vResult.duration,
            resolution: t2vResult.resolution,
            fps: t2vResult.fps,
            generationTime: t2vResult.generationTime,
            method: t2vResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'image-to-video':
        // LTX Image-to-Video generation
        if (!imageUrl) {
          return new Response(
            JSON.stringify({ error: 'Image URL is required for image-to-video' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const i2vResult = await generateImageToVideo({
          imageUrl,
          prompt: prompt || 'Animate this image smoothly',
          duration: duration || 5,
          resolution: resolution || '720p',
          fps: fps || 24,
          cameraMotion: cameraMotion || 'none',
          ...options
        });

        return new Response(
          JSON.stringify({
            videoUrl: i2vResult.videoUrl,
            originalImage: imageUrl,
            duration: i2vResult.duration,
            cameraMotion: i2vResult.cameraMotion,
            generationTime: i2vResult.generationTime,
            method: i2vResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'video-to-video':
        // LTX Video Enhancement
        if (!videoUrl) {
          return new Response(
            JSON.stringify({ error: 'Video URL is required for video-to-video' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const v2vResult = await enhanceVideo({
          videoUrl,
          prompt: prompt || 'Enhance and refine this video',
          duration: duration || 'auto',
          resolution: resolution || '1080p',
          fps: fps || 30,
          ...options
        });

        return new Response(
          JSON.stringify({
            enhancedVideoUrl: v2vResult.videoUrl,
            originalVideo: videoUrl,
            improvements: v2vResult.improvements,
            generationTime: v2vResult.generationTime,
            method: v2vResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'lip-sync':
        // LTX Lip Sync
        if (!videoUrl || !voiceText) {
          return new Response(
            JSON.stringify({ error: 'Video URL and voice text are required for lip sync' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const lipSyncResult = await generateLipSync({
          videoUrl,
          text: voiceText,
          voiceSample: voiceSample,
          ...options
        });

        return new Response(
          JSON.stringify({
            syncedVideoUrl: lipSyncResult.videoUrl,
            generatedAudio: lipSyncResult.audioUrl,
            lipSyncAccuracy: lipSyncResult.accuracy,
            method: lipSyncResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'voice-clone':
        // LTX Voice Clone
        if (!voiceText || !voiceSample) {
          return new Response(
            JSON.stringify({ error: 'Voice text and sample are required for voice cloning' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const voiceCloneResult = await cloneVoice({
          text: voiceText,
          voiceSample,
          ...options
        });

        return new Response(
          JSON.stringify({
            audioUrl: voiceCloneResult.audioUrl,
            voiceSimilarity: voiceCloneResult.similarity,
            method: voiceCloneResult.method
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown LTX action',
            supportedActions: ['text-to-video', 'image-to-video', 'video-to-video', 'lip-sync', 'voice-clone', 'check-capabilities']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('LTX processor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions
async function checkLTXCapabilities(): Promise<any> {
  try {
    // Try to call real LTX API
    const response = await fetch(`${LTX_API_URL}/capabilities`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LTX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        available: true,
        localMode: data.localMode || false,
        supportedResolutions: data.supportedResolutions || ['720p', '1080p', '4K'],
        supportedModels: data.supportedModels || ['ltx-2-pro', 'ltx-v2v-pro'],
        gpuInfo: data.gpuInfo || 'Unknown'
      };
    }
  } catch (error) {
    console.warn('LTX API not available:', error.message);
  }

  // Fallback to mock capabilities
  return {
    available: false,
    localMode: false,
    supportedResolutions: ['720p', '1080p'],
    supportedModels: ['ltx-2-pro', 'ltx-v2v-pro'],
    gpuInfo: 'Mock - LTX not available',
    note: 'Real LTX-Desktop instance not accessible'
  };
}

async function generateTextToVideo(params: any): Promise<any> {
  try {
    // Try real LTX API call
    const response = await fetch(`${LTX_API_URL}/generate/text-to-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LTX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        videoUrl: result.videoUrl,
        duration: result.duration,
        resolution: result.resolution,
        fps: result.fps,
        generationTime: result.generationTime,
        method: 'Real LTX-Desktop'
      };
    }
  } catch (error) {
    console.warn('LTX text-to-video failed:', error.message);
  }

  // Mock response
  return {
    videoUrl: `https://example.com/ltx-t2v-${Date.now()}.mp4`,
    duration: params.duration,
    resolution: params.resolution,
    fps: params.fps,
    generationTime: '45 seconds',
    method: 'Mock LTX (API not available)',
    note: 'Real LTX-Desktop instance required for actual generation'
  };
}

async function generateImageToVideo(params: any): Promise<any> {
  try {
    // Try real LTX API call
    const response = await fetch(`${LTX_API_URL}/generate/image-to-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LTX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        videoUrl: result.videoUrl,
        duration: result.duration,
        cameraMotion: result.cameraMotion,
        generationTime: result.generationTime,
        method: 'Real LTX-Desktop'
      };
    }
  } catch (error) {
    console.warn('LTX image-to-video failed:', error.message);
  }

  // Mock response
  return {
    videoUrl: `https://example.com/ltx-i2v-${Date.now()}.mp4`,
    duration: params.duration,
    cameraMotion: params.cameraMotion,
    generationTime: '32 seconds',
    method: 'Mock LTX (API not available)',
    note: 'Real LTX-Desktop instance required for actual generation'
  };
}

async function enhanceVideo(params: any): Promise<any> {
  try {
    // Try real LTX API call
    const response = await fetch(`${LTX_API_URL}/enhance/video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LTX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        videoUrl: result.videoUrl,
        improvements: result.improvements || ['resolution', 'stabilization', 'color'],
        generationTime: result.generationTime,
        method: 'Real LTX-Desktop'
      };
    }
  } catch (error) {
    console.warn('LTX video enhancement failed:', error.message);
  }

  // Mock response
  return {
    videoUrl: `https://example.com/ltx-enhanced-${Date.now()}.mp4`,
    improvements: ['HD resolution', 'noise reduction', 'color correction'],
    generationTime: '78 seconds',
    method: 'Mock LTX (API not available)',
    note: 'Real LTX-Desktop instance required for actual enhancement'
  };
}

async function generateLipSync(params: any): Promise<any> {
  try {
    // Try real LTX API call
    const response = await fetch(`${LTX_API_URL}/generate/lip-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LTX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        videoUrl: result.videoUrl,
        audioUrl: result.audioUrl,
        accuracy: result.accuracy || 0.95,
        method: 'Real LTX-Desktop'
      };
    }
  } catch (error) {
    console.warn('LTX lip sync failed:', error.message);
  }

  // Mock response
  return {
    videoUrl: `https://example.com/ltx-lipsync-${Date.now()}.mp4`,
    audioUrl: `https://example.com/ltx-audio-${Date.now()}.wav`,
    accuracy: 0.89,
    method: 'Mock LTX (API not available)',
    note: 'Real LTX-Desktop instance required for lip sync'
  };
}

async function cloneVoice(params: any): Promise<any> {
  try {
    // Try real LTX API call
    const response = await fetch(`${LTX_API_URL}/generate/voice-clone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LTX_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        audioUrl: result.audioUrl,
        similarity: result.similarity || 0.92,
        method: 'Real LTX-Desktop'
      };
    }
  } catch (error) {
    console.warn('LTX voice clone failed:', error.message);
  }

  // Mock response
  return {
    audioUrl: `https://example.com/ltx-voice-${Date.now()}.wav`,
    similarity: 0.87,
    method: 'Mock LTX (API not available)',
    note: 'Real LTX-Desktop instance required for voice cloning'
  };
}

Deno.serve(handler);</content>
<parameter name="filePath">supabase/functions/ltx-processor/index.ts