import React from 'react';

const PopcornElements = ({
  startDate,
  endDate,
  startDateWithZoom,
  endDateWithZoom,
  zoom,
  sortableWidth,
  layersRef
}) => {
  return (
    <div ref={layersRef} className="popcorn-elements">
      {/* Timeline clips and elements will be rendered here */}
    </div>
  );
};

export default PopcornElements;