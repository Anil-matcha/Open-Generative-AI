import { Component } from '../../base/Component.js';

export class Opacity extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      layer: props.layer || {}
    };

    // Mock project store
    this.projectStore = {
      setLayerStyle: (layerId, style) => {
        console.log('Setting layer opacity', layerId, style);
      }
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(value) {
    this.projectStore.setLayerStyle(this.state.layer.id, {
      name: 'opacity',
      value: value / 100,
    });
  }

  render() {
    const { layer } = this.state;
    const opacityValue = Math.round((layer.opacity || 1) * 100);

    const container = document.createElement('div');
    container.className = 'opacity-control';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = opacityValue;
    slider.className = 'opacity-slider';
    this.addEventListener(slider, 'input', (e) => this.onChange(parseInt(e.target.value)));
    container.appendChild(slider);

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'opacity-value';
    valueDisplay.textContent = `${opacityValue}%`;
    container.appendChild(valueDisplay);

    return container;
  }
}

export default Opacity;