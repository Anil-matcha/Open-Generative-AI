import React, { useState } from 'react';

const EmailCampaign = ({ projectData, onComplete, onBack }) => {
  const [campaignData, setCampaignData] = useState({
    subject: '',
    previewText: '',
    recipientList: '',
    sendTime: '',
    template: 'default',
    personalization: false
  });

  const [isSending, setIsSending] = useState(false);

  const handleSendCampaign = async () => {
    setIsSending(true);

    try {
      // Mock email campaign sending
      await new Promise(resolve => setTimeout(resolve, 2000));

      const campaign = {
        id: Date.now().toString(),
        type: 'email',
        subject: campaignData.subject,
        recipientCount: campaignData.recipientList.split(',').length,
        status: 'scheduled',
        sendTime: campaignData.sendTime,
        projectData
      };

      onComplete(campaign);
    } catch (error) {
      console.error('Failed to send email campaign:', error);
    } finally {
      setIsSending(false);
    }
  };

  const emailTemplates = [
    { id: 'default', name: 'Default Template', preview: '📧 Standard email layout' },
    { id: 'newsletter', name: 'Newsletter', preview: '📰 Newsletter style' },
    { id: 'promotional', name: 'Promotional', preview: '🎯 Sales focused' },
    { id: 'educational', name: 'Educational', preview: '📚 Learning content' }
  ];

  return (
    <div className="campaign-flow email-campaign">
      <div className="campaign-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Email Campaign</h2>
      </div>

      <div className="campaign-content">
        <div className="campaign-form">
          <div className="form-section">
            <h3>Campaign Details</h3>

            <div className="form-group">
              <label>Email Subject Line</label>
              <input
                type="text"
                value={campaignData.subject}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  subject: e.target.value
                }))}
                placeholder="Enter compelling subject line..."
                maxLength={78}
              />
              <div className="char-count">{campaignData.subject.length}/78</div>
            </div>

            <div className="form-group">
              <label>Preview Text</label>
              <input
                type="text"
                value={campaignData.previewText}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  previewText: e.target.value
                }))}
                placeholder="Preview text shown in inbox..."
                maxLength={160}
              />
              <div className="char-count">{campaignData.previewText.length}/160</div>
            </div>

            <div className="form-group">
              <label>Recipient Email List</label>
              <textarea
                value={campaignData.recipientList}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  recipientList: e.target.value
                }))}
                placeholder="email1@example.com, email2@example.com..."
                rows={4}
              />
              <div className="recipient-count">
                {campaignData.recipientList.split(',').filter(email => email.trim()).length} recipients
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Email Template</h3>
            <div className="template-grid">
              {emailTemplates.map(template => (
                <div
                  key={template.id}
                  className={`template-option ${campaignData.template === template.id ? 'selected' : ''}`}
                  onClick={() => setCampaignData(prev => ({
                    ...prev,
                    template: template.id
                  }))}
                >
                  <div className="template-preview">
                    {template.preview}
                  </div>
                  <div className="template-name">{template.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Sending Options</h3>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={campaignData.personalization}
                  onChange={(e) => setCampaignData(prev => ({
                    ...prev,
                    personalization: e.target.checked
                  }))}
                />
                Enable personalization (First Name, etc.)
              </label>
            </div>

            <div className="form-group">
              <label>Send Time</label>
              <input
                type="datetime-local"
                value={campaignData.sendTime}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  sendTime: e.target.value
                }))}
              />
            </div>
          </div>

          <div className="campaign-preview">
            <h3>Email Preview</h3>
            <div className="preview-container">
              <div className="email-preview">
                <div className="email-header">
                  <div className="email-subject">{campaignData.subject || 'Your Subject Line'}</div>
                  <div className="email-preview-text">{campaignData.previewText || 'Your preview text...'}</div>
                </div>
                <div className="email-content">
                  <div className="video-placeholder">
                    <div className="video-icon">🎥</div>
                    <div className="video-title">{projectData?.title || 'Your Video Title'}</div>
                  </div>
                  <div className="email-body">
                    <p>Check out this amazing video I created!</p>
                    <p>{projectData?.description || 'Video description will appear here...'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="campaign-footer">
        <button onClick={onBack} className="cancel-btn">
          Cancel
        </button>
        <button
          onClick={handleSendCampaign}
          disabled={!campaignData.subject || !campaignData.recipientList || isSending}
          className="send-btn"
        >
          {isSending ? 'Sending...' : 'Send Campaign'}
        </button>
      </div>
    </div>
  );
};

export default EmailCampaign;