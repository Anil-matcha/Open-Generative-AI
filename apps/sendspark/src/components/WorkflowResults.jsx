import React from 'react';

function WorkflowResults({ results }) {
  if (!results) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Workflow Results</h3>

      <div className="space-y-4">
        {/* Generated Content */}
        {results.videos && results.videos.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Generated Videos</h4>
            <div className="grid grid-cols-1 gap-3">
              {results.videos.map((video, index) => (
                <div key={index} className="bg-gray-700 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{video.title || `Video ${index + 1}`}</span>
                    <span className="text-sm text-gray-400">{video.duration}</span>
                  </div>
                  <video
                    src={video.url}
                    controls
                    className="w-full h-32 object-cover rounded"
                  />
                  <div className="mt-2 flex space-x-2">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                      Download
                    </button>
                    <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm">
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publishing Status */}
        {results.publishing && results.publishing.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Publishing Status</h4>
            <div className="space-y-2">
              {results.publishing.map((publish, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      publish.status === 'success' ? 'bg-green-500' :
                      publish.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}></div>
                    <span>{publish.platform}</span>
                  </div>
                  <span className={`text-sm ${
                    publish.status === 'success' ? 'text-green-400' :
                    publish.status === 'pending' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {publish.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {results.analytics && (
          <div>
            <h4 className="font-medium mb-2">Analytics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{results.analytics.views || 0}</div>
                <div className="text-sm text-gray-400">Views</div>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{results.analytics.engagement || 0}%</div>
                <div className="text-sm text-gray-400">Engagement</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Workflow completed in {results.duration || 'N/A'}</span>
            <span>{new Date(results.completedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowResults;