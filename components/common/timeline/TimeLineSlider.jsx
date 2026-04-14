import React from 'react';

const TimeLineSlider = ({
  startDate,
  endDate,
  startDateWithZoom,
  endDateWithZoom,
  setStartDateWithZoom,
  setEndDateWithZoom,
  sortableWidth
}) => {
  // Timeline slider implementation
  return (
    <div className="timeline-slider">
      <div className="timeline-slider-track">
        <div className="timeline-slider-handle"></div>
      </div>
    </div>
  );
};

export default TimeLineSlider;