import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser, getCampaigns, getVideos, getLeads } from '../lib/supabase-client';

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
  _count?: {
    contacts?: number;
    personalized_videos?: number;
  };
}

interface Video {
  id: string;
  landing_page_url: string | null;
  status: string;
  created_at: string;
  campaigns: { name: string };
  contacts: { first_name: string; last_name: string };
}

interface Lead {
  id: string;
  name: string | null;
  email: string;
  created_at: string;
  campaigns: { name: string };
}

export function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      // Get user's first workspace
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', currentUser.id)
        .single();

      if (!workspaces) {
        setLoading(false);
        return;
      }

      const workspaceId = workspaces.id;

      // Load campaigns
      const campaignData = await getCampaigns(workspaceId);
      setCampaigns(campaignData);

      // Load recent videos
      const videoData = await getVideos(workspaceId);
      setVideos(videoData.slice(0, 5));

      // Load recent leads
      const leadData = await getLeads(workspaceId);
      setLeads(leadData.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-slate-400">Welcome back, {user?.email}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-slate-400">Total Campaigns</div>
          <div className="mt-2 text-3xl font-bold text-white">{campaigns.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-slate-400">Total Videos</div>
          <div className="mt-2 text-3xl font-bold text-cyan-400">{videos.length}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-slate-400">Total Leads</div>
          <div className="mt-2 text-3xl font-bold text-emerald-400">{leads.length}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/campaigns/new')}
            className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-left hover:bg-cyan-400/20 transition"
          >
            <div className="text-sm font-medium text-cyan-200">Create Campaign</div>
            <div className="text-xs text-slate-400 mt-1">Start a new outreach campaign</div>
          </button>
          <button
            onClick={() => navigate('/campaigns')}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition"
          >
            <div className="text-sm font-medium text-white">View Campaigns</div>
            <div className="text-xs text-slate-400 mt-1">{campaigns.length} campaigns</div>
          </button>
          <button
            onClick={() => navigate('/videos')}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition"
          >
            <div className="text-sm font-medium text-white">Video Library</div>
            <div className="text-xs text-slate-400 mt-1">{videos.length} videos</div>
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10 transition"
          >
            <div className="text-sm font-medium text-white">Analytics</div>
            <div className="text-xs text-slate-400 mt-1">View performance</div>
          </button>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Campaigns</h2>
          <Link to="/campaigns" className="text-sm text-cyan-400 hover:text-cyan-300">View All</Link>
        </div>
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            <p className="mb-4">No campaigns yet</p>
            <button
              onClick={() => navigate('/campaigns/new')}
              className="px-4 py-2 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition"
            >
              Create Your First Campaign
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {campaigns.slice(0, 5).map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 hover:bg-white/5 transition cursor-pointer border-b border-white/5 last:border-0"
                onClick={() => navigate(`/campaigns/${campaign.id}/contacts`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{campaign.name}</div>
                    <div className="text-sm text-slate-400">
                      Created {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-emerald-400/20 text-emerald-200' :
                    campaign.status === 'draft' ? 'bg-slate-400/20 text-slate-200' :
                    'bg-yellow-400/20 text-yellow-200'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Videos */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Videos</h2>
          <Link to="/videos" className="text-sm text-cyan-400 hover:text-cyan-300">View All</Link>
        </div>
        {videos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
            No videos generated yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                {video.landing_page_url ? (
                  <a href={video.landing_page_url} target="_blank" className="block">
                    <div className="aspect-video bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-cyan-400">▶ Watch Video</span>
                    </div>
                  </a>
                ) : (
                  <div className="aspect-video bg-slate-800 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">{video.status}</span>
                  </div>
                )}
                <div className="text-sm font-medium text-white">
                  {video.campaigns?.name || 'Untitled'}
                </div>
                <div className="text-xs text-slate-400">
                  For {video.contacts?.first_name} {video.contacts?.last_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
