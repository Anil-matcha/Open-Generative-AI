import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getCampaigns, getVideos, getVideoEvents, getLeads } from '../lib/supabase-client';

interface VideoStat {
  id: string;
  name: string;
  views: number;
  plays: number;
  ctaClicks: number;
  conversions: number;
}

interface CampaignStat {
  id: string;
  name: string;
  totalVideos: number;
  totalViews: number;
  conversions: number;
}

export function Analytics() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignStat[]>([]);
  const [videoStats, setVideoStats] = useState<VideoStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

  useEffect(() => {
    if (campaignId) loadAnalytics();
  }, [campaignId, timeRange]);

  async function loadAnalytics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!workspaces) return;

      // Get campaigns
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('workspace_id', workspaces.id);

      if (!campaignData) return;

      // Calculate stats for each campaign
      const campaignStats: CampaignStat[] = [];
      const allVideoStats: VideoStat[] = [];

      for (const campaign of campaignData) {
        // Get videos for this campaign
        const { data: videos } = await supabase
          .from('personalized_videos')
          .select('id, campaigns(name)')
          .eq('campaign_id', campaign.id);

        if (!videos || videos.length === 0) continue;

        let campaignViews = 0;
        let campaignConversions = 0;

        for (const video of videos) {
          // Get events for this video
          const { data: events } = await supabase
            .from('video_events')
            .select('event_type')
            .eq('video_id', video.id);

          const views = events?.filter(e => e.event_type === 'view').length || 0;
          const plays = events?.filter(e => e.event_type === 'play').length || 0;
          const ctaClicks = events?.filter(e => e.event_type === 'cta_click').length || 0;
          const conversions = events?.filter(e => 
            e.event_type === 'form_submit' || e.event_type === 'calendar_click'
          ).length || 0;

          allVideoStats.push({
            id: video.id,
            name: video.campaigns?.name || 'Untitled',
            views,
            plays,
            ctaClicks,
            conversions
          });

          campaignViews += views;
          campaignConversions += conversions;
        }

        campaignStats.push({
          id: campaign.id,
          name: campaign.name,
          totalVideos: videos.length,
          totalViews: campaignViews,
          conversions: campaignConversions
        });
      }

      setCampaigns(campaignStats);
      setVideoStats(allVideoStats);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalViews = videoStats.reduce((sum, v) => sum + v.views, 0);
  const totalPlays = videoStats.reduce((sum, v) => sum + v.plays, 0);
  const totalClicks = videoStats.reduce((sum, v) => sum + v.ctaClicks, 0);
  const totalConversions = videoStats.reduce((sum, v) => sum + v.conversions, 0);
  const conversionRate = totalViews > 0 ? ((totalConversions / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="text-sm text-cyan-400 hover:text-cyan-300 mb-4"
        >
          ← Back to Campaigns
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="mt-2 text-slate-400">Track video performance and engagement</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-slate-400">Total Views</div>
              <div className="mt-2 text-3xl font-bold text-white">{totalViews}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-slate-400">Total Plays</div>
              <div className="mt-2 text-3xl font-bold text-cyan-400">{totalPlays}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-slate-400">CTA Clicks</div>
              <div className="mt-2 text-3xl font-bold text-emerald-400">{totalClicks}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm text-slate-400">Conversion Rate</div>
              <div className="mt-2 text-3xl font-bold text-yellow-400">{conversionRate}%</div>
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Campaign Performance</h2>
            {campaigns.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
                No campaign data yet
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                {campaigns.map((camp, idx) => (
                  <div
                    key={camp.id}
                    className={`p-4 hover:bg-white/5 transition ${idx < campaigns.length - 1 ? 'border-b border-white/5' : ''}`}
                    onClick={() => navigate(`/campaigns/${camp.id}/videos`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{camp.name}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          {camp.totalVideos} videos · {camp.totalViews} views
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-400">{camp.conversions}</div>
                        <div className="text-xs text-slate-400">conversions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performing Videos */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Top Performing Videos</h2>
            {videoStats.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400">
                No video data yet
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="grid grid-cols-5 gap-4 p-4 border-b border-white/5 text-xs font-medium text-slate-400 uppercase">
                  <div>Video</div>
                  <div className="text-center">Views</div>
                  <div className="text-center">Plays</div>
                  <div className="text-center">CTA Clicks</div>
                  <div className="text-center">Conversions</div>
                </div>
                {videoStats
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 10)
                  .map((video, idx) => (
                    <div
                      key={video.id}
                      className={`grid grid-cols-5 gap-4 p-4 ${idx < videoStats.length - 1 ? 'border-b border-white/5' : ''}`}
                    >
                      <div className="font-medium text-white">{video.name}</div>
                      <div className="text-center text-slate-300">{video.views}</div>
                      <div className="text-center text-cyan-300">{video.plays}</div>
                      <div className="text-center text-emerald-300">{video.ctaClicks}</div>
                      <div className="text-center text-yellow-300">{video.conversions}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
