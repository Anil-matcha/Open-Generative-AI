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

    // Rendiv-style rendering logic (simulated)
    switch (action) {
      case 'export-video':
        // Simulate video rendering process
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
          // If render_jobs table doesn't exist, create it
          await supabase.rpc('create_render_jobs_table_if_not_exists');
        }

        // Simulate async rendering (in real implementation, this would trigger actual rendering)
        setTimeout(async () => {
          try {
            // Generate a mock rendered video URL
            const mockVideoUrl = `https://example.com/rendered/${renderJob.id}.${format}`;

            // Update job status
            await supabase
              .from('render_jobs')
              .update({
                status: 'completed',
                output_url: mockVideoUrl,
                progress: 100,
                completed_at: new Date().toISOString()
              })
              .eq('id', renderJob.id);
          } catch (error) {
            console.error('Render completion error:', error);
          }
        }, 1000); // Simulate 1 second processing

        return new Response(
          JSON.stringify({
            jobId: renderJob.id,
            status: 'processing',
            message: 'Video rendering started',
            estimatedDuration: '5 minutes'
          }),
          { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'render-composition':
        // Render a specific composition/configuration
        const compositionRender = {
          compositionId: `comp_${Date.now()}`,
          status: 'completed',
          renderedUrl: `https://example.com/compositions/${composition?.id || 'default'}.${format}`,
          metadata: {
            format,
            resolution,
            duration,
            quality,
            compositionData: composition
          }
        };

        return new Response(
          JSON.stringify({
            renderResult: compositionRender,
            message: 'Composition rendered successfully'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'generate-preview':
        // Generate a quick preview/thumbnail
        const preview = {
          previewUrl: `https://example.com/previews/${Date.now()}_preview.jpg`,
          thumbnailUrl: `https://example.com/thumbnails/${Date.now()}_thumb.jpg`,
          duration: Math.min(duration, 5), // Preview limited to 5 seconds
          format: 'jpg',
          quality: 'medium'
        };

        return new Response(
          JSON.stringify({
            preview,
            message: 'Preview generated successfully'
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

Deno.serve(handler);