import React from 'react';

function GenerationProgress({ progress }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Generating Video</h3>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress Text */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{progress}%</div>
          <div className="text-sm text-gray-400 mt-1">
            {progress < 20 && "Initializing generation..."}
            {progress >= 20 && progress < 50 && "Processing image..."}
            {progress >= 50 && progress < 80 && "Applying effects..."}
            {progress >= 80 && progress < 100 && "Finalizing video..."}
            {progress === 100 && "Complete!"}
          </div>
        </div>

        {/* Animated Dots */}
        <div className="flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        This may take 1-3 minutes depending on the effect complexity
      </div>
    </div>
  );
}

export default GenerationProgress;