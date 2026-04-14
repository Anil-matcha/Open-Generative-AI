import React from 'react';

const PlayTime = () => {
  return (
    <div className="play-time">
      <span className="current-time">00:00:00.00</span>
      <span className="separator">/</span>
      <span className="total-time">01:00:00.00</span>
    </div>
  );
};

export default PlayTime;