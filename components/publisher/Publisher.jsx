import React, { useState, useEffect } from 'react';
import SocialPublisherModal from '../modals/SocialPublisherModal';

const Publisher = ({ projectData, onPublishComplete }) => {
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishHistory, setPublishHistory] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    loadPublishHistory();
  }, []);

  const loadPublishHistory = () => {
    try {
      const history = localStorage.getItem('publishHistory');
      if (history) {
        setPublishHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load publish history:', error);
    }
  };

  const handlePublish = async (publishData) => {
    setIsPublishing(true);

    try {
      // Simulate publishing to platforms
      for (const platform of publishData.platforms) {
        await publishToPlatform(platform, publishData);
      }

      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        platforms: publishData.platforms,
        title: publishData.settings.title,
        timestamp: new Date().toISOString(),
        status: 'published',
        url: generateMockUrl(publishData.platforms[0])
      };

      const updatedHistory = [historyItem, ...publishHistory];
      setPublishHistory(updatedHistory);
      localStorage.setItem('publishHistory', JSON.stringify(updatedHistory));

      onPublishComplete?.(publishData);
    } catch (error) {
      console.error('Publishing failed:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const publishToPlatform = async (platform, data) => {
    // Mock API calls to different platforms
    console.log(`Publishing to ${platform}:`, data);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, this would call actual platform APIs
    switch (platform) {
      case 'youtube':
        return mockYouTubePublish(data);
      case 'facebook':
        return mockFacebookPublish(data);
      case 'instagram':
        return mockInstagramPublish(data);
      case 'twitter':
        return mockTwitterPublish(data);
      case 'tiktok':
        return mockTikTokPublish(data);
      case 'linkedin':
        return mockLinkedInPublish(data);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  };

  const mockYouTubePublish = (data) => {
    console.log('Mock YouTube publish:', data.settings.title);
    return { success: true, url: 'https://youtube.com/watch?v=mock123' };
  };

  const mockFacebookPublish = (data) => {
    console.log('Mock Facebook publish:', data.settings.title);
    return { success: true, url: 'https://facebook.com/post/mock123' };
  };

  const mockInstagramPublish = (data) => {
    console.log('Mock Instagram publish:', data.settings.title);
    return { success: true, url: 'https://instagram.com/p/mock123' };
  };

  const mockTwitterPublish = (data) => {
    console.log('Mock Twitter publish:', data.settings.title);
    return { success: true, url: 'https://twitter.com/status/mock123' };
  };

  const mockTikTokPublish = (data) => {
    console.log('Mock TikTok publish:', data.settings.title);
    return { success: true, url: 'https://tiktok.com/@user/video/mock123' };
  };

  const mockLinkedInPublish = (data) => {
    console.log('Mock LinkedIn publish:', data.settings.title);
    return { success: true, url: 'https://linkedin.com/feed/update/mock123' };
  };

  const generateMockUrl = (platform) => {
    const mockId = Math.random().toString(36).substr(2, 9);
    switch (platform) {
      case 'youtube': return `https://youtube.com/watch?v=${mockId}`;
      case 'facebook': return `https://facebook.com/post/${mockId}`;
      case 'instagram': return `https://instagram.com/p/${mockId}`;
      case 'twitter': return `https://twitter.com/status/${mockId}`;
      case 'tiktok': return `https://tiktok.com/@user/video/${mockId}`;
      case 'linkedin': return `https://linkedin.com/feed/update/${mockId}`;
      default: return '#';
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      youtube: '📺',
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      tiktok: '🎵',
      linkedin: '💼'
    };
    return icons[platform] || '📱';
  };

  return (
    <div className="publisher">
      <div className="publisher-header">
        <h2>Social Media Publisher</h2>
        <p>Share your video content across multiple platforms</p>
      </div>

      <div className="publisher-content">
        <div className="publish-actions">
          <button
            onClick={() => setIsPublishModalOpen(true)}
            disabled={isPublishing}
            className="publish-main-btn"
          >
            {isPublishing ? 'Publishing...' : 'Publish Video'}
          </button>

          <div className="quick-actions">
            <button className="quick-action-btn">
              📅 Schedule Post
            </button>
            <button className="quick-action-btn">
              📊 Analytics
            </button>
            <button className="quick-action-btn">
              🎯 Target Audience
            </button>
          </div>
        </div>

        <div className="publish-history">
          <h3>Recent Publications</h3>
          {publishHistory.length === 0 ? (
            <div className="no-history">
              <div className="empty-icon">📤</div>
              <p>No publications yet. Share your first video!</p>
            </div>
          ) : (
            <div className="history-list">
              {publishHistory.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-content">
                    <div className="history-title">{item.title}</div>
                    <div className="history-platforms">
                      {item.platforms.map(platform => (
                        <span key={platform} className="platform-badge">
                          {getPlatformIcon(platform)} {platform}
                        </span>
                      ))}
                    </div>
                    <div className="history-meta">
                      <span className="history-date">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                      <span className={`history-status ${item.status}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="history-actions">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-link"
                    >
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SocialPublisherModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        projectData={projectData}
        onPublish={handlePublish}
      />
    </div>
  );
};

export default Publisher;