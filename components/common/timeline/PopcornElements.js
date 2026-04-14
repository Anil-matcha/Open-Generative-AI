import { Component } from '../../base/Component.js';
import { getStore } from '../../base/Store.js';
import PopcornElement from './PopcornElement.js';
import TransitionButton from './TransitionButton.js';

export class PopcornElements extends Component {
  constructor(props = {}) {
    super(props);
    this.projectStore = getStore('projectStore');
    this.state = props;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'popcorn-elements';

    // Get elements from project store
    const { elements } = this.projectStore.getState();

    // Create timeline rows for each layer
    const layers = this.projectStore.getState().layers || [];

    layers.forEach(layer => {
      const layerRow = document.createElement('div');
      layerRow.className = 'timeline-layer-row';
      layerRow.dataset.layerId = layer.id;

      // Filter elements for this layer
      const layerElements = elements.filter(elem => elem.track === layer.id);

      // Render elements in this layer
      layerElements.forEach((element, index) => {
        const elementContainer = document.createElement('div');
        elementContainer.className = 'timeline-element-container';
        elementContainer.style.left = `${(element.start / this.projectStore.getState().duration) * 100}%`;
        elementContainer.style.width = `${((element.end - element.start) / this.projectStore.getState().duration) * 100}%`;

        // Create PopcornElement
        const popcornElement = new PopcornElement({
          item: element,
          onSelect: (item) => {
            console.log('Selected element:', item);
          }
        });
        elementContainer.appendChild(popcornElement.render());

        // Add transition button if not the last element
        if (index < layerElements.length - 1) {
          const transitionButton = new TransitionButton({
            type: 'FROM',
            onClick: () => {
              console.log('Add transition between elements');
            }
          });
          elementContainer.appendChild(transitionButton.render());
        }

        layerRow.appendChild(elementContainer);
      });

      container.appendChild(layerRow);
    });

    return container;
  }
}

export default PopcornElements;