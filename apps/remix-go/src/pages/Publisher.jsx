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
import PhaseView from '../components/PhaseView';
import ActionsPane from '../components/ActionsPane';
import EmailCampaign from '../components/campaigns/EmailCampaign';
import SocialCampaign from '../components/campaigns/SocialCampaign';
import RetargetCampaign from '../components/campaigns/RetargetCampaign';

function Publisher() {
  const [projectDetails, setProjectDetails] = useState({
    title: 'Demo Video Project',
    description: 'A personalized video created with VideoRemix Go - now ready to share with your audience!',
    tags: 'marketing, video, personalized, demo'
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
    let CampaignComponent;

    switch (showModal) {
      case 'email':
        CampaignComponent = EmailCampaign;
        break;
      case 'social':
        CampaignComponent = SocialCampaign;
        break;
      case 'retarget':
        CampaignComponent = RetargetCampaign;
        break;
      default:
        return null;
    }

    return (
      <div className="modal-overlay" onClick={() => setShowModal(null)}>
        <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <CampaignComponent onCampaignFinished={() => setShowModal(null)} />
        </div>
      </div>
    );
  };

  const handlePhaseChange = (element) => {
    switch (element.key) {
      case 'getting-started':
        navigate('/');
        break;
      case 'edit':
        navigate('/editor');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Phase Navigation */}
      <PhaseView
        elements={[
          {
            key: 'getting-started',
            title: 'Choose Template',
            active: false,
            available: true,
          },
          {
            key: 'edit',
            title: 'Customize Video',
            active: false,
            available: true,
          },
          {
            key: 'publish',
            title: 'Publish & Share',
            active: true,
            available: true,
          },
        ]}
        onPhaseChanged={handlePhaseChange}
      />

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Publish & Share</h1>
          <p className="text-muted">Share your video with the world through multiple channels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Details & Video Preview */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Details */}
            <div className="glass-card">
              <h2 className="text-xl font-semibold text-foreground mb-6">Your project details</h2>

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
                <h2 className="text-xl font-semibold text-foreground">Preview & Embed</h2>
                <button className="btn-secondary flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Preview
                </button>
              </div>

              <div className="aspect-video bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center text-muted">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Video Preview</p>
                  <p className="text-sm">Click preview to watch your video</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL
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
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Embed
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
          <ActionsPane className="lg:col-span-1">
            <button
              className="go-button action-button w-full"
              onClick={() => setShowModal('email')}
            >
              Email Campaign
            </button>
            <button
              className="go-button action-button w-full"
              onClick={() => setShowModal('social')}
            >
              Social Campaign
            </button>
            <button
              className="go-button action-button w-full"
              onClick={() => setShowModal('retarget')}
            >
              Opt-In/Retarget
            </button>

            {/* Social Conductor Integration */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Social Conductor</h3>

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
          </ActionsPane>
        </div>
      </div>

      {renderModal()}
    </div>
  );
}

export default Publisher;
