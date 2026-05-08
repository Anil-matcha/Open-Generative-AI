import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Video {
  id: string;
  landing_page_url: string | null;
  thumbnail_url: string | null;
  campaigns: { name: string; cta_text: string; cta_url: string; offer: string | null };
  contacts: { first_name: string; last_name: string };
}

interface VideoEvent {
  id: string;
  event_type: string;
  created_at: string;
}

export function PublicVideoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [events, setEvents] = useState<VideoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    if (slug) loadVideo();
  }, [slug]);

  async function loadVideo() {
    try {
      // Fetch video by slug (public endpoint, no auth needed)
      const res = await fetch(`/api/video-by-slug/${slug}`);
      if (!res.ok) throw new Error('Video not found');
      const data = await res.json();
      setVideo(data.video);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading video:', error);
    } finally {
      setLoading(false);
    }
  }

  async function trackEvent(eventType: string, metadata: any = {}) {
    try {
      await fetch('/track-video-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          event_type: eventType,
          metadata
        })
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/submit-lead-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message
        })
      });

      if (!res.ok) throw new Error('Submission failed');

      setSubmitted(true);
      trackEvent('form_submit', { name: formData.name, email: formData.email });
    } catch (error: any) {
      alert('Error submitting form: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Track view on mount
  useEffect(() => {
    if (video) {
      trackEvent('view');
    }
  }, [video]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Video Not Found</h1>
          <p className="text-slate-400">This video page may have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950" onMouseEnter={() => trackEvent('hover')}>
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-white font-bold">Video Outreach</div>
          {video.campaigns?.name && (
            <div className="text-sm text-slate-400">{video.campaigns.name}</div>
          )}
        </div>
      </div>

      {/* Video Player */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="rounded-2xl overflow-hidden bg-slate-900/50">
          {video.landing_page_url ? (
            <div className="aspect-video bg-black">
              <video
                className="w-full h-full"
                controls
                autoPlay
                onPlay={() => trackEvent('play')}
                onPause={() => trackEvent('pause')}
                onEnded={() => trackEvent('complete')}
              >
                <source src={video.landing_page_url} type="video/mp4" />
              </video>
            </div>
          ) : video.thumbnail_url ? (
            <div className="aspect-video bg-slate-800 flex items-center justify-center">
              <img src={video.thumbnail_url} alt="Video thumbnail" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video bg-slate-800 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <div className="text-4xl mb-2">🎥</div>
                <div>Video processing...</div>
              </div>
            </div>
          )}
        </div>

        {/* Personalized Greeting */}
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Hi {video.contacts?.first_name || 'there'}! 👋
          </h1>
          {video.campaigns?.offer && (
            <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
              {video.campaigns.offer}
            </p>
          )}
        </div>

        {/* CTA Button */}
        {video.campaigns?.cta_url && (
          <div className="mt-8 text-center">
            <a
              href={video.campaigns.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-cyan-400 text-slate-900 font-bold rounded-full hover:bg-cyan-300 transition text-lg"
              onClick={() => trackEvent('cta_click', { url: video.campaigns?.cta_url })}
            >
              {video.campaigns?.cta_text || 'Book a Call'} →
            </a>
          </div>
        )}

        {/* Lead Capture Form */}
        {!submitted ? (
          <div className="mt-12 max-w-lg mx-auto">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-xl font-semibold text-white mb-2">Get In Touch</h2>
              <p className="text-sm text-slate-400 mb-6">Fill out the form below and we'll get back to you.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Name</label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-400/50"
                    rows={4}
                    placeholder="Tell us about your project..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-cyan-400 text-slate-900 font-medium rounded-lg hover:bg-cyan-300 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="mt-12 max-w-lg mx-auto text-center">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-8">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-white mb-2">Thank You!</h2>
              <p className="text-slate-400">
                We've received your information and will get back to you soon.
              </p>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {events.length > 0 && (
          <div className="mt-12 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white capitalize">{event.event_type}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(event.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center text-sm text-slate-400">
          Powered by Video Outreach Platform
        </div>
      </div>
    </div>
  );
}
