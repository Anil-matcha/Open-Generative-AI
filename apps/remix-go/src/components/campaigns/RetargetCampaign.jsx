import React, { useState } from 'react';

const RetargetCampaign = ({ onCampaignFinished }) => {
  const [campaignData, setCampaignData] = useState({
    name: '',
    audience: 'visitors',
    budget: '',
    duration: '7'
  });

  const handleSubmit = () => {
    // In a real implementation, this would create retargeting campaign
    onCampaignFinished && onCampaignFinished();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Opt-In/Retarget Campaign</h3>
        <p className="text-muted mb-6">Retarget visitors and grow your audience.</p>
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
            Target Audience
          </label>
          <select
            value={campaignData.audience}
            onChange={(e) => setCampaignData({...campaignData, audience: e.target.value})}
            className="input-field"
          >
            <option value="visitors">Website Visitors</option>
            <option value="engaged">Highly Engaged Users</option>
            <option value="abandoned">Cart Abandoners</option>
            <option value="similar">Similar Audience</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Daily Budget ($)
          </label>
          <input
            type="number"
            value={campaignData.budget}
            onChange={(e) => setCampaignData({...campaignData, budget: e.target.value})}
            className="input-field"
            placeholder="50"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Campaign Duration (days)
          </label>
          <select
            value={campaignData.duration}
            onChange={(e) => setCampaignData({...campaignData, duration: e.target.value})}
            className="input-field"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Retargeting campaigns help you reach people who have already shown interest in your content.
          Results may vary based on audience size and engagement.
        </p>
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
          Start Campaign
        </button>
      </div>
    </div>
  );
};

export default RetargetCampaign;