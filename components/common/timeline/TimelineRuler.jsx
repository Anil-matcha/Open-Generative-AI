import React from 'react';

const TimelineRuler = ({ state, zoom = 1 }) => {
  const { timelineSeconds } = state;
  const majorTicks = Math.ceil(timelineSeconds / 10); // Every 10 seconds

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timeline-ruler">
      {Array.from({ length: majorTicks + 1 }, (_, i) => {
        const seconds = i * 10;
        const percentage = (seconds / timelineSeconds) * 100 * zoom;

        return (
          <div
            key={i}
            className="ruler-tick"
            style={{ left: `${percentage}%` }}
          >
            <div className="ruler-label">
              {formatTime(seconds)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineRuler;