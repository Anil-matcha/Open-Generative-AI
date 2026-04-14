import React, { useState } from 'react';

const SocialPublisherModal = ({ isOpen, onClose, projectData, onPublish }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [publishSettings, setPublishSettings] = useState({
    title: projectData?.title || '',
    description: projectData?.description || '',
    tags: [],
    schedule: false,
    scheduleDate: '',
    privacy: 'public'
  });

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺', color: '#FF0000' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#000000' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0077B5' }
  ];

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handlePublish = () => {
    const publishData = {
      platforms: selectedPlatforms,
      settings: publishSettings,
      projectData
    };
    onPublish(publishData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="social-publisher-modal-overlay">
      <div className="social-publisher-modal">
        <div className="modal-header">
          <h2>Publish to Social Media</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-body">
          <div className="publish-form">
            <div className="form-section">
              <h3>Content Details</h3>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={publishSettings.title}
                  onChange={(e) => setPublishSettings(prev => ({
                    ...prev,
                    title: e.target.value
                  }))}
                  placeholder="Enter video title..."
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={publishSettings.description}
                  onChange={(e) => setPublishSettings(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Enter video description..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  value={publishSettings.tags.join(', ')}
                  onChange={(e) => setPublishSettings(prev => ({
                    ...prev,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  placeholder="video, tutorial, education..."
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Select Platforms</h3>
              <div className="platforms-grid">
                {platforms.map(platform => (
                  <div
                    key={platform.id}
                    className={`platform-option ${selectedPlatforms.includes(platform.id) ? 'selected' : ''}`}
                    onClick={() => handlePlatformToggle(platform.id)}
                  >
                    <div className="platform-icon" style={{ color: platform.color }}>
                      {platform.icon}
                    </div>
                    <div className="platform-name">{platform.name}</div>
                    <div className="platform-checkbox">
                      {selectedPlatforms.includes(platform.id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h3>Publishing Options</h3>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={publishSettings.schedule}
                    onChange={(e) => setPublishSettings(prev => ({
                      ...prev,
                      schedule: e.target.checked
                    }))}
                  />
                  Schedule for later
                </label>
              </div>

              {publishSettings.schedule && (
                <div className="form-group">
                  <label>Schedule Date & Time</label>
                  <input
                    type="datetime-local"
                    value={publishSettings.scheduleDate}
                    onChange={(e) => setPublishSettings(prev => ({
                      ...prev,
                      scheduleDate: e.target.value
                    }))}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Privacy Setting</label>
                <select
                  value={publishSettings.privacy}
                  onChange={(e) => setPublishSettings(prev => ({
                    ...prev,
                    privacy: e.target.value
                  }))}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={selectedPlatforms.length === 0}
            className="publish-btn"
          >
            {publishSettings.schedule ? 'Schedule Post' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SocialPublisherModal;