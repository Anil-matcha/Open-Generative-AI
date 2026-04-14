import React, { useState } from 'react';

const FacebookCampaign = ({ projectData, onComplete, onBack }) => {
  const [campaignData, setCampaignData] = useState({
    postText: '',
    callToAction: 'WATCH_MORE',
    targetAudience: 'everyone',
    boostPost: false,
    budget: '',
    schedulePost: false,
    scheduleTime: ''
  });

  const [isPosting, setIsPosting] = useState(false);

  const handlePostToFacebook = async () => {
    setIsPosting(true);

    try {
      // Mock Facebook posting
      await new Promise(resolve => setTimeout(resolve, 2000));

      const campaign = {
        id: Date.now().toString(),
        type: 'facebook',
        postText: campaignData.postText,
        callToAction: campaignData.callToAction,
        status: campaignData.schedulePost ? 'scheduled' : 'posted',
        scheduledTime: campaignData.scheduleTime,
        boosted: campaignData.boostPost,
        budget: campaignData.budget,
        projectData
      };

      onComplete(campaign);
    } catch (error) {
      console.error('Failed to post to Facebook:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const callToActionOptions = [
    { value: 'WATCH_MORE', label: 'Watch More' },
    { value: 'LEARN_MORE', label: 'Learn More' },
    { value: 'SHOP_NOW', label: 'Shop Now' },
    { value: 'SIGN_UP', label: 'Sign Up' },
    { value: 'CONTACT_US', label: 'Contact Us' }
  ];

  const audienceOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'friends', label: 'Friends' },
    { value: 'custom', label: 'Custom Audience' },
    { value: 'lookalike', label: 'Lookalike Audience' }
  ];

  return (
    <div className="campaign-flow facebook-campaign">
      <div className="campaign-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Facebook Campaign</h2>
      </div>

      <div className="campaign-content">
        <div className="campaign-form">
          <div className="form-section">
            <h3>Post Content</h3>

            <div className="form-group">
              <label>Post Text</label>
              <textarea
                value={campaignData.postText}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  postText: e.target.value
                }))}
                placeholder="Write something engaging about your video..."
                rows={4}
                maxLength={63206}
              />
              <div className="char-count">{campaignData.postText.length}/63206</div>
            </div>

            <div className="form-group">
              <label>Call-to-Action Button</label>
              <select
                value={campaignData.callToAction}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  callToAction: e.target.value
                }))}
              >
                {callToActionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Targeting & Scheduling</h3>

            <div className="form-group">
              <label>Target Audience</label>
              <select
                value={campaignData.targetAudience}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  targetAudience: e.target.value
                }))}
              >
                {audienceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={campaignData.boostPost}
                  onChange={(e) => setCampaignData(prev => ({
                    ...prev,
                    boostPost: e.target.checked
                  }))}
                />
                Boost this post
              </label>
            </div>

            {campaignData.boostPost && (
              <div className="form-group">
                <label>Daily Budget ($)</label>
                <input
                  type="number"
                  value={campaignData.budget}
                  onChange={(e) => setCampaignData(prev => ({
                    ...prev,
                    budget: e.target.value
                  }))}
                  placeholder="5.00"
                  min="1"
                  step="0.01"
                />
              </div>
            )}

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={campaignData.schedulePost}
                  onChange={(e) => setCampaignData(prev => ({
                    ...prev,
                    schedulePost: e.target.checked
                  }))}
                />
                Schedule for later
              </label>
            </div>

            {campaignData.schedulePost && (
              <div className="form-group">
                <label>Schedule Time</label>
                <input
                  type="datetime-local"
                  value={campaignData.scheduleTime}
                  onChange={(e) => setCampaignData(prev => ({
                    ...prev,
                    scheduleTime: e.target.value
                  }))}
                />
              </div>
            )}
          </div>

          <div className="campaign-preview">
            <h3>Facebook Post Preview</h3>
            <div className="preview-container facebook-preview">
              <div className="facebook-post">
                <div className="post-header">
                  <div className="profile-pic">👤</div>
                  <div className="post-info">
                    <div className="page-name">Your Page</div>
                    <div className="post-time">Just now</div>
                  </div>
                </div>

                <div className="post-content">
                  <div className="post-text">
                    {campaignData.postText || 'Your engaging post text will appear here...'}
                  </div>

                  <div className="video-preview">
                    <div className="video-thumbnail">
                      <div className="play-icon">▶</div>
                      <div className="video-title">{projectData?.title || 'Your Video Title'}</div>
                    </div>
                  </div>
                </div>

                <div className="post-actions">
                  <button className={`cta-btn ${campaignData.callToAction.toLowerCase()}`}>
                    {callToActionOptions.find(opt => opt.value === campaignData.callToAction)?.label || 'Watch More'}
                  </button>
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
          onClick={handlePostToFacebook}
          disabled={!campaignData.postText || isPosting}
          className="post-btn"
        >
          {isPosting
            ? 'Posting...'
            : campaignData.schedulePost
              ? 'Schedule Post'
              : 'Post to Facebook'
          }
        </button>
      </div>
    </div>
  );
};

export default FacebookCampaign;