import React from 'react';
import Menu from '../Menu.js';

const BLEND_MODE = 'blendMode';

const blendModeConstants = {
  normal: { title: 'Normal', value: 'normal' },
  multiply: { title: 'Multiply', value: 'multiply' },
  screen: { title: 'Screen', value: 'screen' },
  overlay: { title: 'Overlay', value: 'overlay' },
  darken: { title: 'Darken', value: 'darken' },
  lighten: { title: 'Lighten', value: 'lighten' },
  'color-dodge': { title: 'Color Dodge', value: 'color-dodge' },
  'color-burn': { title: 'Color Burn', value: 'color-burn' },
  'hard-light': { title: 'Hard Light', value: 'hard-light' },
  'soft-light': { title: 'Soft Light', value: 'soft-light' },
  difference: { title: 'Difference', value: 'difference' },
  exclusion: { title: 'Exclusion', value: 'exclusion' },
  hue: { title: 'Hue', value: 'hue' },
  saturation: { title: 'Saturation', value: 'saturation' },
  color: { title: 'Color', value: 'color' },
  luminosity: { title: 'Luminosity', value: 'luminosity' }
};

const BlendingMode = ({ layer }) => {
  // Mock project store - will be replaced with actual store integration
  const projectStore = {
    setLayerStyle: (layerId, style) => {
      console.log('Setting layer style', layerId, style);
    }
  };

  const onChange = (value) => {
    projectStore.setLayerStyle(layer.id, {
      name: BLEND_MODE,
      value,
    });
  };

  const toggleElement = (layer.blendMode && blendModeConstants[layer.blendMode]?.title) || blendModeConstants.normal.title;

  return (
    <Menu
      toggleElement={toggleElement}
      items={Object.values(blendModeConstants)}
      useButton={true}
      className="blend-mode-select"
      onClick={onChange}
    />
  );
};

export default BlendingMode;