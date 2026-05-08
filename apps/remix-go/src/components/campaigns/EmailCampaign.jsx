import React, { useState } from 'react';

const EmailCampaign = ({ onCampaignFinished }) => {
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    audience: 'all',
    schedule: ''
  });

  const handleSubmit = () => {
    // In a real implementation, this would create the campaign
    onCampaignFinished && onCampaignFinished();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Email Campaign Setup</h3>
        <p className="text-muted mb-6">Configure your email campaign to reach your audience.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaignData.name}
            onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
            className="input-field"
            placeholder="Enter campaign name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Email Subject
          </label>
          <input
            type="text"
            value={campaignData.subject}
            onChange={(e) => setCampaignData({...campaignData, subject: e.target.value})}
            className="input-field"
            placeholder="Enter email subject line"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Target Audience
          </label>
          <select
            value={campaignData.audience}
            onChange={(e) => setCampaignData({...campaignData, audience: e.target.value})}
            className="input-field"
          >
            <option value="all">All Contacts</option>
            <option value="recent">Recent Visitors</option>
            <option value="subscribed">Subscribed Users</option>
            <option value="segment">Custom Segment</option>
          </select>
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
          Create Campaign
        </button>
      </div>
    </div>
  );
};

export default EmailCampaign;