import React from 'react';

const PlayButton = ({ startDate, endDateWithZoom }) => {
  const handlePlay = () => {
    console.log('Play button clicked');
  };

  return (
    <button
      className="play-button"
      onClick={handlePlay}
    >
      ▶️
    </button>
  );
};

export default PlayButton;