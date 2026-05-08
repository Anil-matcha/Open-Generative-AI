import React from 'react';

function WorkflowSettings({ workflow, config, onChange }) {
  const handleInputChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const handlePlatformsChange = (platform, checked) => {
    const newPlatforms = checked
      ? [...config.platforms, platform]
      : config.platforms.filter(p => p !== platform);
    onChange({
      ...config,
      platforms: newPlatforms
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Workflow Configuration</h3>

      <div className="space-y-6">
        {/* Input Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Input Type</label>
          <select
            value={config.inputType}
            onChange={(e) => handleInputChange('inputType', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="text">Text Prompt</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        {/* Output Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Output Type</label>
          <select
            value={config.outputType}
            onChange={(e) => handleInputChange('outputType', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="video">Video</option>
            <option value="social">Social Media Post</option>
            <option value="email">Email Campaign</option>
          </select>
        </div>

        {/* Platforms (for social media) */}
        {config.outputType === 'social' && (
          <div>
            <label className="block text-sm font-medium mb-2">Target Platforms</label>
            <div className="space-y-2">
              {['YouTube', 'TikTok', 'Instagram', 'Twitter', 'LinkedIn'].map(platform => (
                <label key={platform} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.platforms.includes(platform)}
                    onChange={(e) => handlePlatformsChange(platform, e.target.checked)}
                    className="mr-2"
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium mb-2">Schedule</label>
          <select
            value={config.schedule}
            onChange={(e) => handleInputChange('schedule', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="immediate">Run Immediately</option>
            <option value="scheduled">Schedule for Later</option>
            <option value="recurring">Recurring</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default WorkflowSettings;