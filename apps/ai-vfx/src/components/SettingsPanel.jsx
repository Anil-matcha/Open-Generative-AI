import React from 'react';

function SettingsPanel({ settings, onChange }) {
  const handleChange = (key, value) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Settings</h3>

      <div className="space-y-4">
        {/* Aspect Ratio */}
        <div>
          <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
          <select
            value={settings.aspectRatio}
            onChange={(e) => handleChange('aspectRatio', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Classic)</option>
            <option value="21:9">21:9 (Ultrawide)</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
          <select
            value={settings.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2">2 seconds</option>
            <option value="3">3 seconds</option>
            <option value="5">5 seconds</option>
            <option value="10">10 seconds</option>
          </select>
        </div>

        {/* Resolution */}
        <div>
          <label className="block text-sm font-medium mb-2">Resolution</label>
          <select
            value={settings.resolution}
            onChange={(e) => handleChange('resolution', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="480p">480p (SD)</option>
            <option value="720p">720p (HD)</option>
            <option value="1080p">1080p (Full HD)</option>
            <option value="4K">4K (Ultra HD)</option>
          </select>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm font-medium mb-2">Quality</label>
          <select
            value={settings.quality}
            onChange={(e) => handleChange('quality', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="standard">Standard</option>
            <option value="high">High</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      {/* Settings Summary */}
      <div className="mt-6 p-3 bg-gray-700 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Current Settings:</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <div>Ratio: {settings.aspectRatio}</div>
          <div>Duration: {settings.duration}s</div>
          <div>Resolution: {settings.resolution}</div>
          <div>Quality: {settings.quality}</div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;