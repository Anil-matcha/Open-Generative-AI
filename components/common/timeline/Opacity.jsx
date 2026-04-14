import React from 'react';

const Opacity = ({ layer }) => {
  // Mock project store - will be replaced with actual store integration
  const projectStore = {
    setLayerStyle: (layerId, style) => {
      console.log('Setting layer opacity', layerId, style);
    }
  };

  const onChange = (value) => {
    projectStore.setLayerStyle(layer.id, {
      name: 'opacity',
      value: value / 100, // Convert percentage to decimal
    });
  };

  const opacityValue = Math.round((layer.opacity || 1) * 100);

  return (
    <div className="opacity-control">
      <input
        type="range"
        min="0"
        max="100"
        value={opacityValue}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="opacity-slider"
      />
      <span className="opacity-value">{opacityValue}%</span>
    </div>
  );
};

export default Opacity;