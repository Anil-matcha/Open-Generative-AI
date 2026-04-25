import React, { useState } from 'react';
import {
  Mail,
  Share2,
  Target,
  Copy,
  ExternalLink,
  Play,
  Settings,
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';

function Publisher() {
  const [projectDetails, setProjectDetails] = useState({
    title: 'My Video Project',
    description: 'A personalized video created with VideoRemix Go',
    tags: 'marketing, video, personalized'
  });

  const [embedUrl, setEmbedUrl] = useState('https://vidcloud.com/embed/abc123');
  const [embedCode, setEmbedCode] = useState('<iframe src="https://vidcloud.com/embed/abc123" width="560" height="315" frameborder="0" allowfullscreen></iframe>');
  const [showModal, setShowModal] = useState(null);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const campaignButtons = [
    {
      id: 'email',
      title: 'Email Campaign',
      description: 'Send personalized email campaigns',
      icon: Mail,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'social',
      title: 'Social Media',
      description: 'Publish to Facebook, LinkedIn, and more',
      icon: Share2,
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      id: 'retarget',
      title: 'Opt-In/Retarget',
      description: 'Retargeting campaigns and lead generation',
      icon: Target,
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  const renderModal = () => {
    if (!showModal) return null;

    const campaign = campaignButtons.find(c => c.id === showModal);

    return (
      <div className="modal-overlay" onClick={() => setShowModal(null)}>
        <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${campaign.color.replace('hover:', '')}`}>
              <campaign.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{campaign.title}</h2>
              <p className="text-muted">{campaign.description}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter campaign name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Target Audience
              </label>
              <select className="input-field">
                <option>All Contacts</option>
                <option>Recent Visitors</option>
                <option>Subscribed Users</option>
                <option>Custom Segment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Schedule
              </label>
              <input
                type="datetime-local"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowModal(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button className="btn-primary">
              Create Campaign
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Publish & Share</h1>
          <p className="text-muted">Share your video with the world through multiple channels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details & Video Preview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Details */}
            <div className="glass-card">
              <h2 className="text-xl font-semibold text-foreground mb-6">Project Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    value={projectDetails.title}
                    onChange={(e) => setProjectDetails({...projectDetails, title: e.target.value})}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={projectDetails.description}
                    onChange={(e) => setProjectDetails({...projectDetails, description: e.target.value})}
                    className="input-field h-24 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={projectDetails.tags}
                    onChange={(e) => setProjectDetails({...projectDetails, tags: e.target.value})}
                    className="input-field"
                    placeholder="Separate tags with commas"
                  />
                </div>
              </div>
            </div>

            {/* Video Preview */}
            <div className="glass-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">Video Preview</h2>
                <button className="btn-secondary flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Preview
                </button>
              </div>

              <div className="aspect-video bg-secondary/20 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Video Preview</p>
                  <p className="text-sm">Click preview to watch your video</p>
                </div>
              </div>
            </div>

            {/* Embed Section */}
            <div className="glass-card">
              <h2 className="text-xl font-semibold text-foreground mb-6">Embed & Share</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Embed URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={embedUrl}
                      readOnly
                      className="input-field flex-1"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(embedUrl)}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button className="btn-secondary flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Embed Code
                  </label>
                  <div className="relative">
                    <textarea
                      value={embedCode}
                      readOnly
                      className="input-field h-24 font-mono text-sm resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-2 right-2 btn-secondary p-2"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Campaign Actions */}
          <div className="space-y-6">
            <div className="glass-card">
              <h2 className="text-xl font-semibold text-foreground mb-6">Campaign Actions</h2>

              <div className="space-y-4">
                {campaignButtons.map((campaign) => {
                  const Icon = campaign.icon;
                  return (
                    <button
                      key={campaign.id}
                      onClick={() => setShowModal(campaign.id)}
                      className={`w-full p-4 rounded-lg transition-all duration-200 ${campaign.color} text-white`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <div className="text-left">
                          <div className="font-semibold">{campaign.title}</div>
                          <div className="text-sm opacity-90">{campaign.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Social Conductor Integration */}
            <div className="glass-card">
              <h2 className="text-xl font-semibold text-foreground mb-6">Social Conductor</h2>

              <div className="aspect-video bg-secondary/20 rounded-lg overflow-hidden">
                <iframe
                  src="https://example.com/social-conductor" // Placeholder URL
                  className="w-full h-full border-0"
                  title="Social Conductor"
                />
              </div>

              <p className="text-sm text-muted mt-4">
                Manage your social media campaigns and track performance in real-time.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="glass-card">
              <h2 className="text-xl font-semibold text-foreground mb-6">Performance</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted">Views</span>
                  </div>
                  <span className="font-semibold text-foreground">1,234</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted">Engagement</span>
                  </div>
                  <span className="font-semibold text-foreground">89%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted">Published</span>
                  </div>
                  <span className="font-semibold text-foreground">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}

export default Publisher;
