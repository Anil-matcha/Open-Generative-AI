import React, { useState } from 'react';

const SocialCampaign = ({ onCampaignFinished }) => {
  const [campaignData, setCampaignData] = useState({
    platform: 'facebook',
    message: '',
    schedule: '',
    title: 'Check out this video!'
  });

  const handleSubmit = () => {
    // In a real implementation, this would post to social media
    alert('Video posted to social media successfully!');
    onCampaignFinished && onCampaignFinished();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Social Media Campaign</h3>
        <p className="text-muted mb-6">Share your video on social media platforms.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Platform
          </label>
          <select
            value={campaignData.platform}
            onChange={(e) => setCampaignData({...campaignData, platform: e.target.value})}
            className="input-field"
          >
            <option value="facebook">Facebook</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter/X</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Post Title
          </label>
          <input
            type="text"
            value={campaignData.title}
            onChange={(e) => setCampaignData({...campaignData, title: e.target.value})}
            className="input-field"
            placeholder="Enter post title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Message
          </label>
          <textarea
            value={campaignData.message}
            onChange={(e) => setCampaignData({...campaignData, message: e.target.value})}
            className="input-field h-24 resize-none"
            placeholder="Enter your message..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Schedule
          </label>
          <input
            type="datetime-local"
            value={campaignData.schedule}
            onChange={(e) => setCampaignData({...campaignData, schedule: e.target.value})}
            className="input-field"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCampaignFinished}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary"
        >
          Post Now
        </button>
      </div>
    </div>
  );
};

export default SocialCampaign;