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

const DIRECTOR_API_BASE_URL = Deno.env.get('DIRECTOR_API_BASE_URL') || 'https://api.director.ai/v1';
const DIRECTOR_API_KEY = Deno.env.get('DIRECTOR_API_KEY');

if (!DIRECTOR_API_BASE_URL) {
  console.error('[rendiv-render] Missing DIRECTOR_API_BASE_URL environment variable');
}

if (!DIRECTOR_API_KEY) {
  console.error('[rendiv-render] Missing DIRECTOR_API_KEY environment variable');
}

interface RendivRenderRequest {
  action: 'export-video' | 'render-composition' | 'generate-preview';
  videoUrl?: string;
  composition?: any;
  format?: 'mp4' | 'webm' | 'gif';
  resolution?: string;
  duration?: number;
  quality?: 'low' | 'medium' | 'high';
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

    const requestData: RendivRenderRequest = await req.json();
    const { action, videoUrl, composition, format = 'mp4', resolution = '1920x1080', duration = 10, quality = 'high' } = requestData;

    // Rendiv-style rendering logic using Director API
    switch (action) {
      case 'export-video':
        // Start video rendering process with Director API
        if (!videoUrl) {
          return new Response(
            JSON.stringify({ error: 'Video URL is required for export' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const renderJob = {
          id: `render_${Date.now()}`,
          status: 'processing',
          userId: user.id,
          input: { videoUrl, format, resolution, quality },
          output: null,
          progress: 0,
          estimatedCompletion: new Date(Date.now() + 300000).toISOString() // 5 minutes
        };

        // Store render job in database
        const { data: jobRecord, error: jobError } = await supabase
          .from('render_jobs')
          .insert({
            id: renderJob.id,
            user_id: user.id,
            status: renderJob.status,
            input_data: renderJob.input,
            progress: renderJob.progress,
            estimated_completion: renderJob.estimatedCompletion
          })
          .select()
          .single();

        if (jobError) {
          console.error('[rendiv-render] Error storing render job:', jobError);
        }

        // Call Director API for video rendering
        try {
          const renderResult = await callDirectorAPI('video/render', {
            video_url: videoUrl,
            format: format,
            resolution: resolution,
            quality: quality,
            job_id: renderJob.id,
            callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/render-callback`
          });

          // Update job with Director API job ID
          await supabase
            .from('render_jobs')
            .update({
              external_job_id: renderResult.job_id,
              status: 'processing'
            })
            .eq('id', renderJob.id);

        } catch (apiError) {
          console.error('[rendiv-render] Director API call failed:', apiError);

          // Mark job as failed
          await supabase
            .from('render_jobs')
            .update({
              status: 'failed',
              error_message: apiError.message
            })
            .eq('id', renderJob.id);

          return new Response(
            JSON.stringify({
              error: 'Failed to start rendering process',
              details: apiError.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            jobId: renderJob.id,
            status: 'processing',
            message: 'Video rendering started with Director API',
            estimatedDuration: '5 minutes'
          }),
          { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'render-composition':
        // Render a specific composition/configuration using Director API
        if (!composition) {
          return new Response(
            JSON.stringify({ error: 'Composition data is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const compositionResult = await callDirectorAPI('composition/render', {
          composition: composition,
          format: format,
          resolution: resolution,
          duration: duration,
          quality: quality,
          user_id: user.id
        });

        const compositionRender = {
          compositionId: `comp_${Date.now()}`,
          status: 'completed',
          renderedUrl: compositionResult.url,
          metadata: {
            format,
            resolution,
            duration,
            quality,
            compositionData: composition,
            directorJobId: compositionResult.job_id
          }
        };

        return new Response(
          JSON.stringify({
            renderResult: compositionRender,
            message: 'Composition rendered successfully with Director API'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'generate-preview':
        // Generate a quick preview/thumbnail using Director API
        if (!videoUrl) {
          return new Response(
            JSON.stringify({ error: 'Video URL is required for preview generation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const previewResult = await callDirectorAPI('video/preview', {
          video_url: videoUrl,
          duration: Math.min(duration || 10, 5), // Preview limited to 5 seconds
          format: 'jpg',
          quality: 'medium',
          include_thumbnail: true
        });

        const preview = {
          previewUrl: previewResult.preview_url,
          thumbnailUrl: previewResult.thumbnail_url,
          duration: previewResult.duration,
          format: previewResult.format,
          quality: previewResult.quality
        };

        return new Response(
          JSON.stringify({
            preview,
            message: 'Preview generated successfully with Director API'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get-render-status':
        // Check status of a render job
        const jobId = requestData.jobId;
        if (!jobId) {
          return new Response(
            JSON.stringify({ error: 'Job ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: job, error: statusError } = await supabase
          .from('render_jobs')
          .select('*')
          .eq('id', jobId)
          .eq('user_id', user.id)
          .single();

        if (statusError || !job) {
          return new Response(
            JSON.stringify({ error: 'Job not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            outputUrl: job.output_url,
            estimatedCompletion: job.estimated_completion
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown action',
            supportedActions: ['export-video', 'render-composition', 'generate-preview', 'get-render-status']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Rendiv render error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Helper functions for API calls
async function callDirectorAPI(endpoint: string, params: Record<string, any>): Promise<any> {
  if (!DIRECTOR_API_BASE_URL || !DIRECTOR_API_KEY) {
    throw new Error('Director API not configured');
  }

  const url = `${DIRECTOR_API_BASE_URL}/${endpoint}`;

  console.log(`[rendiv-render] Calling Director API: ${endpoint}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIRECTOR_API_KEY}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Director API call failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

Deno.serve(handler);