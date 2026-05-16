import { useEffect, useState } from 'react';
import PersonalizerDialog from '../components/personalizer/PersonalizerDialog';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getVideos, getMuapiWorkflows, createGenerationJob } from '../lib/supabase-client';

interface Video {
  id: string;
  status: string;
  thumbnail_url: string | null;
  campaigns: { name: string };
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  workflow_id: string;
}

export function VideoGenerator() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPersonalizer, setShowPersonalizer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) loadData();
  }, [campaignId]);

  async function loadData() {
    try {
      // Load videos
      const videoData = await getVideos(campaignId!);
      setVideos(videoData);

      // Load MuAPI workflows
      const { data: workflowData } = await supabase
        .from('muapi_workflows')
        .select('*')
        .eq('is_active', true);
      
      setWorkflows(workflowData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!selectedWorkflow) {
      alert('Please select a workflow');
      return;
    }

    setGenerating(true);
    try {
      // Get contacts for this campaign
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('campaign_id', campaignId!);

      if (!contacts || contacts.length === 0) {
        alert('No contacts found. Please import contacts first.');
        return;
      }

      // Create generation jobs for each contact
      for (const contact of contacts) {
        await createGenerationJob({
          workspace_id: (await supabase.from('campaigns').select('workspace_id').eq('id', campaignId!).single())?.data?.workspace_id || '',
          campaign_id: campaignId!,
          contact_id: contact.id,
          provider: 'muapi',
          workflow_id: selectedWorkflow,
          status: 'queued',
          input: {},
          output: {}
        });
      }

      alert(`Started generation for ${contacts.length} contacts! Check back in a few minutes.`);
      loadData();
    } catch (error: any) {
      alert('Error generating videos: ' + error.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/campaigns/${campaignId}`)}
          className="text-sm text-cyan-400 hover:text-cyan-300 mb-4"
        >
          ← Back to Campaign
        </button>
        <h1 className="text-3xl font-bold text-white">Video Generator</h1>
        <p className="mt-2 text-slate-400">
          Generate personalized videos using MuAPI workflows
        </p>
      </div>

      {/* Workflow Selection */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Select Workflow</h2>
        {workflows.length === 0 ? (
          <p className="text-slate-400">No workflows available. Please add MuAPI workflows in settings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf.workflow_id)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedWorkflow === wf.workflow_id
                    ? 'border-cyan-400 bg-cyan-400/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/5'
                }`}
              >
                <h3 className="font-medium text-white">{wf.name}</h3>
                {wf.description && (
                  <p className="mt-2 text-sm text-slate-400">{wf.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="mb-8">
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedWorkflow || videos.length === 0}
            className="px-6 py-3 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : `Generate Videos for {videos.length} Contacts`}
          </button>
          <button
            onClick={() => setShowPersonalizer(true)}
            className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition border border-white/10"
          >
            🤖 Personalize Content
          </button>
        </div>
      </div>

      {/* Videos List */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white">
            Generated Videos ({videos.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : videos.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No videos generated yet.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {videos.map((video) => (
              <div key={video.id} className="p-4 hover:bg-white/5 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">
                      {video.campaigns?.name || 'Untitled'}
                    </div>
                    <div className="text-sm text-slate-400">
                      Created {new Date(video.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    video.status === 'ready' ? 'bg-emerald-400/20 text-emerald-200' :
                    video.status === 'processing' ? 'bg-yellow-400/20 text-yellow-200' :
                    'bg-slate-400/20 text-slate-200'
                  }`}>
                    {video.status}
                  </span>
                </div>
                {video.thumbnail_url && (
                  <div className="mt-3">
                    <img 
                      src={video.thumbnail_url} 
                      alt="Thumbnail" 
                      className="w-32 h-18 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {showPersonalizer && (
        <PersonalizerDialog
          open={showPersonalizer}
          onClose={() => setShowPersonalizer(false)}
          appId="video-outreach"
          mode="cold-email"
        />
      )}
    </div>
  );
}
