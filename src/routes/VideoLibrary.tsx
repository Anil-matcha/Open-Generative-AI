import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, getVideos } from '../lib/supabase-client';

interface Video {
  id: string;
  landing_page_url: string | null;
  status: string;
  thumbnail_url: string | null;
  campaigns: { name: string };
  contacts: { first_name: string; last_name: string };
}

export function VideoLibrary() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) loadVideos();
  }, [campaignId]);

  async function loadVideos() {
    try {
      const data = await getVideos(campaignId!);
      setVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-white">Video Library</h1>
        <p className="mt-2 text-slate-400">{videos.length} videos generated</p>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-slate-400 mb-4">No videos generated yet.</p>
          <button
            onClick={() => navigate(`/campaigns/${campaignId}/generate`)}
            className="px-6 py-3 bg-cyan-400 text-slate-900 rounded-lg font-medium hover:bg-cyan-300 transition"
          >
            Generate Videos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:bg-white/10 transition">
              {/* Thumbnail */}
              <div className="aspect-video bg-slate-800 flex items-center justify-center">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt="Video thumbnail" 
                    className="w-full h-full object-cover" 
                  />
                ) : video.landing_page_url ? (
                  <a 
                    href={video.landing_page_url} 
                    target="_blank"
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    ▶ Watch Video
                  </a>
                ) : (
                  <span className="text-slate-400 text-sm">{video.status}</span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="font-medium text-white mb-1">
                  {video.campaigns?.name || 'Untitled'}
                </div>
                <div className="text-sm text-slate-400">
                  For {video.contacts?.first_name} {video.contacts?.last_name}
                </div>
                <div className="flex gap-2 mt-3">
                  {video.landing_page_url && (
                    <a
                      href={video.landing_page_url}
                      target="_blank"
                      className="text-sm px-3 py-1 bg-cyan-400/10 text-cyan-200 rounded hover:bg-cyan-400/20 transition"
                    >
                      View Page
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (video.landing_page_url) {
                        navigator.clipboard.writeText(video.landing_page_url);
                        alert('Link copied!');
                      }
                    }}
                    className="text-sm px-3 py-1 bg-white/5 text-white rounded hover:bg-white/10 transition"
                  >
                    Copy Link
                  </button>
                  <span className={`text-xs px-2 py-1 rounded ${
                    video.status === 'ready' ? 'bg-emerald-400/20 text-emerald-200' :
                    video.status === 'processing' ? 'bg-yellow-400/20 text-yellow-200' :
                    'bg-slate-400/20 text-slate-200'
                  }`}>
                    {video.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
