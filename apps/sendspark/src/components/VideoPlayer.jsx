import React, { useRef } from 'react';

function VideoPlayer({ videoUrl }) {
  const videoRef = useRef(null);

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = 'ai-vfx-generated-video.mp4';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Generated Video</h3>

      <div className="space-y-4">
        {/* Video Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
            poster="/placeholder-video.png"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={() => videoRef.current?.play()}
            className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Play
          </button>
          <button
            onClick={() => videoRef.current?.pause()}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Pause
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Download
          </button>
        </div>

        {/* Video URL */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Video URL</label>
          <div className="flex">
            <input
              type="text"
              value={videoUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l-lg focus:outline-none text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(videoUrl)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-r-lg transition-colors"
              title="Copy URL"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;