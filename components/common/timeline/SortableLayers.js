import { Component } from '../../base/Component.js';
import Layer from './Layer.js';

export class SortableLayers extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      layers: props.layers || [],
      onSortEnd: props.onSortEnd || (() => {}),
      onRemove: props.onRemove || (() => {})
    };
  }

  render() {
    const { layers, onSortEnd, onRemove } = this.state;

    const container = document.createElement('div');
    container.className = 'sortable-layers';

    layers.forEach((layer, index) => {
      const layerComponent = new Layer({
        item: layer,
        onRemove: onRemove,
        index: index
      });
      container.appendChild(layerComponent.render());
    });

    return container;
  }
}

export default SortableLayers;