import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://your-production-domain.com",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const MUAPI_API_KEY = Deno.env.get('MUAPI_API_KEY');
const MUAPI_BASE_URL = 'https://api.muapi.ai/api/v1';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[videoagent] Missing required environment variables');
}

if (!MUAPI_API_KEY) {
  console.error('[videoagent] Missing MUAPI_API_KEY environment variable');
}

interface ProcessRequest {
  action: 'auto-edit' | 'create-shorts' | 'scene-detection' | 'clip-segmentation' | 'highlight-detection' | 'compile-frames';
  videoId?: string;
  videoUrl: string;
  options?: Record<string, any>;
  frameUrls?: string[];
  duration?: number;
  transition?: string;
  preset?: any;
}

interface JobRecord {
  id: string;
  action: string;
  videoId?: string;
  videoUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  steps: string[];
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const jobsStore = new Map<string, JobRecord>();

const PIPELINE_STEPS = {
  'auto-edit': [
    'Scene Detection',
    'Highlight Detection', 
    'Clip Generation',
    'Subtitle Generation',
    'B-Roll & Overlays',
    'Final Export'
  ],
  'create-shorts': [
    'Video Analysis',
    'Highlight Extraction',
    'Clip Generation',
    'Caption Generation',
    'Thumbnail Creation',
    'Social Export'
  ],
  'scene-detection': ['Scene Detection', 'Scene Segmentation', 'Export Results'],
  'clip-segmentation': ['Video Analysis', 'Clip Boundaries', 'Clip Extraction'],
  'highlight-detection': ['Video Analysis', 'Highlight Detection', 'Highlight Extraction']
};

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');

  if (req.method === "GET" && jobId) {
    const job = jobsStore.get(jobId);
    
    if (!job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        jobId: job.id,
        status: job.status,
        currentStep: job.currentStep,
        totalSteps: job.totalSteps,
        steps: job.steps,
        result: job.result,
        error: job.error
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (req.method === "POST") {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body: ProcessRequest = await req.json();
      const { action, videoId, videoUrl, options } = body;

      if (!action || !videoUrl) {
        return new Response(
          JSON.stringify({ error: 'action and videoUrl are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const validActions = ['auto-edit', 'create-shorts', 'scene-detection', 'clip-segmentation', 'highlight-detection'];
      if (!validActions.includes(action)) {
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const newJobId = generateJobId();
      const steps = PIPELINE_STEPS[action] || PIPELINE_STEPS['auto-edit'];

      const job: JobRecord = {
        id: newJobId,
        action,
        videoId: videoId || '',
        videoUrl,
        status: 'processing',
        currentStep: 0,
        totalSteps: steps.length,
        steps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      jobsStore.set(newJobId, job);

      processJobAsync(newJobId, action, videoUrl, options);

      console.log(`[videoagent] Created job: ${newJobId} for action: ${action}`);

      return new Response(
        JSON.stringify({
          success: true,
          jobId: newJobId,
          status: 'processing',
          message: `Started ${action} pipeline`
        }),
        { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('[videoagent] Error:', error);

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

async function processJobAsync(jobId: string, action: string, videoUrl: string, options?: Record<string, any>) {
  const job = jobsStore.get(jobId);
  if (!job) return;

  try {
    let result: any = null;

    switch (action) {
      case 'auto-edit':
      case 'create-shorts':
        result = await processVideoWithMuAPI(jobId, action, videoUrl, options);
        break;
      case 'scene-detection':
        result = await detectScenesWithMuAPI(jobId, videoUrl, options);
        break;
      case 'clip-segmentation':
        result = await segmentClipsWithMuAPI(jobId, videoUrl, options);
        break;
      case 'highlight-detection':
        result = await detectHighlightsWithMuAPI(jobId, videoUrl, options);
        break;
      case 'compile-frames':
        result = await compileFramesWithMuAPI(jobId, options?.frameUrls || [], options);
        break;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    job.status = 'completed';
    job.result = result;
    job.updatedAt = new Date().toISOString();
    jobsStore.set(jobId, job);

    console.log(`[videoagent] Job ${jobId} completed successfully`);

  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    job.updatedAt = new Date().toISOString();
    jobsStore.set(jobId, job);
    console.error(`[videoagent] Job ${jobId} failed:`, error);
  }
}

async function callMuAPI(endpoint: string, params: Record<string, any>): Promise<any> {
  if (!MUAPI_API_KEY) {
    throw new Error('MUAPI_API_KEY not configured');
  }

  const url = `${MUAPI_BASE_URL}/${endpoint}`;

  console.log(`[videoagent] Calling MuAPI endpoint: ${endpoint}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': MUAPI_API_KEY
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MuAPI call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

async function processVideoWithMuAPI(jobId: string, action: string, videoUrl: string, options?: Record<string, any>): Promise<any> {
  const job = jobsStore.get(jobId);
  if (!job) throw new Error('Job not found');

  const steps = PIPELINE_STEPS[action] || PIPELINE_STEPS['auto-edit'];

  // Step 1: Scene Detection
  job.currentStep = 1;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const sceneDetection = await callMuAPI('scene-detection', {
    video_url: videoUrl,
    ...options
  });

  // Step 2: Highlight Detection
  job.currentStep = 2;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const highlights = await callMuAPI('highlight-detection', {
    video_url: videoUrl,
    scenes: sceneDetection.scenes,
    ...options
  });

  // Step 3: Clip Generation
  job.currentStep = 3;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const clips = await callMuAPI('clip-generation', {
    video_url: videoUrl,
    highlights: highlights.highlights,
    action: action,
    ...options
  });

  // Step 4: Subtitle Generation
  job.currentStep = 4;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const subtitles = await callMuAPI('subtitle-generation', {
    video_url: videoUrl,
    clips: clips.clips,
    ...options
  });

  // Step 5: B-Roll & Overlays
  job.currentStep = 5;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const broll = await callMuAPI('b-roll-overlay', {
    video_url: videoUrl,
    clips: clips.clips,
    ...options
  });

  // Step 6: Final Export
  job.currentStep = 6;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const finalVideo = await callMuAPI('video-export', {
    video_url: videoUrl,
    clips: clips.clips,
    subtitles: subtitles.subtitles,
    broll: broll.overlays,
    format: options?.format || 'mp4',
    quality: options?.quality || 'high',
    ...options
  });

  return {
    outputUrl: finalVideo.url,
    scenes: sceneDetection.scenes,
    highlights: highlights.highlights,
    clips: clips.clips,
    subtitles: subtitles.subtitles,
    broll: broll.overlays,
    format: finalVideo.format,
    quality: finalVideo.quality,
    duration: finalVideo.duration,
    timestamp: new Date().toISOString()
  };
}

async function detectScenesWithMuAPI(jobId: string, videoUrl: string, options?: Record<string, any>): Promise<any> {
  const job = jobsStore.get(jobId);
  if (!job) throw new Error('Job not found');

  job.currentStep = 1;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const result = await callMuAPI('scene-detection', {
    video_url: videoUrl,
    sensitivity: options?.sensitivity || 'medium',
    ...options
  });

  return {
    scenes: result.scenes || [],
    sceneCount: result.scenes?.length || 0,
    videoUrl: videoUrl,
    timestamp: new Date().toISOString()
  };
}

async function segmentClipsWithMuAPI(jobId: string, videoUrl: string, options?: Record<string, any>): Promise<any> {
  const job = jobsStore.get(jobId);
  if (!job) throw new Error('Job not found');

  job.currentStep = 1;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const result = await callMuAPI('clip-segmentation', {
    video_url: videoUrl,
    min_duration: options?.minDuration || 5,
    max_duration: options?.maxDuration || 30,
    ...options
  });

  return {
    clips: result.clips || [],
    clipCount: result.clips?.length || 0,
    videoUrl: videoUrl,
    timestamp: new Date().toISOString()
  };
}

async function detectHighlightsWithMuAPI(jobId: string, videoUrl: string, options?: Record<string, any>): Promise<any> {
  const job = jobsStore.get(jobId);
  if (!job) throw new Error('Job not found');

  job.currentStep = 1;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const result = await callMuAPI('highlight-detection', {
    video_url: videoUrl,
    algorithm: options?.algorithm || 'engagement',
    threshold: options?.threshold || 0.7,
    ...options
  });

  return {
    highlights: result.highlights || [],
    highlightCount: result.highlights?.length || 0,
    videoUrl: videoUrl,
    timestamp: new Date().toISOString()
  };
}

async function compileFramesWithMuAPI(jobId: string, frameUrls: string[], options?: Record<string, any>): Promise<any> {
  const job = jobsStore.get(jobId);
  if (!job) throw new Error('Job not found');

  if (!frameUrls || frameUrls.length === 0) {
    throw new Error('No frame URLs provided for compilation');
  }

  job.currentStep = 1;
  job.updatedAt = new Date().toISOString();
  jobsStore.set(jobId, job);

  const result = await callMuAPI('frame-compilation', {
    frame_urls: frameUrls,
    duration_per_frame: options?.duration || 3,
    transition: options?.transition || 'fade',
    output_format: options?.format || 'mp4',
    quality: options?.quality || 'high',
    ...options
  });

  return {
    compiledVideoUrl: result.url,
    frameCount: frameUrls.length,
    totalDuration: result.duration,
    format: result.format,
    quality: result.quality,
    timestamp: new Date().toISOString()
  };
}
