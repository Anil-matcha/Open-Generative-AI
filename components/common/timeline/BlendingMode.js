import { Component } from '../../base/Component.js';
import Menu from '../Menu.js';
import blendModeConstants from '../../../lib/constants/blendMode.js';

const BLEND_MODE = 'blendMode';

export class BlendingMode extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      layer: props.layer || {}
    };

    // Mock project store
    this.projectStore = {
      setLayerStyle: (layerId, style) => {
        console.log('Setting layer style', layerId, style);
      }
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(value) {
    this.projectStore.setLayerStyle(this.state.layer.id, {
      name: BLEND_MODE,
      value,
    });
  }

  render() {
    const { layer } = this.state;
    const toggleElement = (layer.blendMode && blendModeConstants[layer.blendMode]?.title) || blendModeConstants.normal.title;

    // For now, return a simple select
    const container = document.createElement('div');
    container.className = 'blend-mode-select';

    const select = document.createElement('select');
    select.className = 'blend-mode-dropdown';
    select.value = layer.blendMode || 'normal';
    this.addEventListener(select, 'change', (e) => this.onChange(e.target.value));

    Object.values(blendModeConstants).forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.value;
      option.textContent = mode.title;
      select.appendChild(option);
    });

    container.appendChild(select);
    return container;
  }
}

export default BlendingMode;