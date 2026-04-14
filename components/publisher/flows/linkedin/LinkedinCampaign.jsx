import React, { useState } from 'react';

const LinkedinCampaign = ({ projectData, onComplete, onBack }) => {
  const [campaignData, setCampaignData] = useState({
    postText: '',
    articleTitle: '',
    articleContent: '',
    hashtags: [],
    targetNetwork: 'connections',
    postType: 'text', // 'text', 'article', 'video'
    schedulePost: false,
    scheduleTime: ''
  });

  const [isPosting, setIsPosting] = useState(false);

  const handlePostToLinkedIn = async () => {
    setIsPosting(true);

    try {
      // Mock LinkedIn posting
      await new Promise(resolve => setTimeout(resolve, 2000));

      const campaign = {
        id: Date.now().toString(),
        type: 'linkedin',
        postText: campaignData.postText,
        postType: campaignData.postType,
        articleTitle: campaignData.articleTitle,
        hashtags: campaignData.hashtags,
        targetNetwork: campaignData.targetNetwork,
        status: campaignData.schedulePost ? 'scheduled' : 'posted',
        scheduledTime: campaignData.scheduleTime,
        projectData
      };

      onComplete(campaign);
    } catch (error) {
      console.error('Failed to post to LinkedIn:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const networkOptions = [
    { value: 'connections', label: 'Connections Only' },
    { value: 'anyone', label: 'Anyone on LinkedIn' },
    { value: 'group', label: 'Specific Group' }
  ];

  const postTypeOptions = [
    { value: 'text', label: 'Text Post', icon: '💬' },
    { value: 'article', label: 'Article', icon: '📝' },
    { value: 'video', label: 'Video Post', icon: '🎥' }
  ];

  const handleHashtagChange = (hashtags) => {
    setCampaignData(prev => ({
      ...prev,
      hashtags: hashtags.split(',').map(tag => tag.trim().replace('#', '')).filter(tag => tag)
    }));
  };

  return (
    <div className="campaign-flow linkedin-campaign">
      <div className="campaign-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>LinkedIn Campaign</h2>
      </div>

      <div className="campaign-content">
        <div className="campaign-form">
          <div className="form-section">
            <h3>Post Type</h3>
            <div className="post-type-grid">
              {postTypeOptions.map(type => (
                <div
                  key={type.value}
                  className={`post-type-option ${campaignData.postType === type.value ? 'selected' : ''}`}
                  onClick={() => setCampaignData(prev => ({
                    ...prev,
                    postType: type.value
                  }))}
                >
                  <div className="type-icon">{type.icon}</div>
                  <div className="type-label">{type.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3>Content</h3>

            {(campaignData.postType === 'text' || campaignData.postType === 'video') && (
              <div className="form-group">
                <label>Post Text</label>
                <textarea
                  value={campaignData.postText}
                  onChange={(e) => setCampaignData(prev => ({
                    ...prev,
                    postText: e.target.value
                  }))}
                  placeholder="Share your professional insights..."
                  rows={4}
                  maxLength={3000}
                />
                <div className="char-count">{campaignData.postText.length}/3000</div>
              </div>
            )}

            {campaignData.postType === 'article' && (
              <>
                <div className="form-group">
                  <label>Article Title</label>
                  <input
                    type="text"
                    value={campaignData.articleTitle}
                    onChange={(e) => setCampaignData(prev => ({
                      ...prev,
                      articleTitle: e.target.value
                    }))}
                    placeholder="Enter article title..."
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label>Article Content</label>
                  <textarea
                    value={campaignData.articleContent}
                    onChange={(e) => setCampaignData(prev => ({
                      ...prev,
                      articleContent: e.target.value
                    }))}
                    placeholder="Write your article content..."
                    rows={8}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Hashtags (comma separated)</label>
              <input
                type="text"
                value={campaignData.hashtags.map(tag => `#${tag}`).join(', ')}
                onChange={(e) => handleHashtagChange(e.target.value)}
                placeholder="#professional #career #networking"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Targeting & Scheduling</h3>

            <div className="form-group">
              <label>Target Network</label>
              <select
                value={campaignData.targetNetwork}
                onChange={(e) => setCampaignData(prev => ({
                  ...prev,
                  targetNetwork: e.target.value
                }))}
              >
                {networkOptions.map(option => (
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
            <h3>LinkedIn Post Preview</h3>
            <div className="preview-container linkedin-preview">
              <div className="linkedin-post">
                <div className="post-header">
                  <div className="profile-pic">👤</div>
                  <div className="post-info">
                    <div className="author-name">Your Name</div>
                    <div className="author-title">Professional Title</div>
                    <div className="post-time">Just now</div>
                  </div>
                </div>

                <div className="post-content">
                  {campaignData.postType === 'article' ? (
                    <div className="article-preview">
                      <h3>{campaignData.articleTitle || 'Your Article Title'}</h3>
                      <p>{campaignData.articleContent?.substring(0, 150) || 'Article content preview...'}</p>
                    </div>
                  ) : (
                    <div className="post-text">
                      {campaignData.postText || 'Your professional post content will appear here...'}
                    </div>
                  )}

                  {campaignData.postType === 'video' && (
                    <div className="video-preview">
                      <div className="video-thumbnail">
                        <div className="play-icon">▶</div>
                        <div className="video-title">{projectData?.title || 'Your Video Title'}</div>
                      </div>
                    </div>
                  )}

                  {campaignData.hashtags.length > 0 && (
                    <div className="hashtags">
                      {campaignData.hashtags.map(tag => (
                        <span key={tag} className="hashtag">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="post-engagement">
                  <div className="engagement-btns">
                    <button>👍 Like</button>
                    <button>💬 Comment</button>
                    <button>↗️ Share</button>
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
          onClick={handlePostToLinkedIn}
          disabled={
            (campaignData.postType === 'text' || campaignData.postType === 'video') && !campaignData.postText ||
            (campaignData.postType === 'article' && (!campaignData.articleTitle || !campaignData.articleContent)) ||
            isPosting
          }
          className="post-btn"
        >
          {isPosting
            ? 'Posting...'
            : campaignData.schedulePost
              ? 'Schedule Post'
              : 'Post to LinkedIn'
          }
        </button>
      </div>
    </div>
  );
};

export default LinkedinCampaign;