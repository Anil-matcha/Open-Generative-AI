import { Component } from '../../../base/Component.js';
import { getStore } from '../../../base/Store.js';
import { POPCORN_ELEMENT_LABELS, POPCORN_ELEMENT_TYPES } from '../../../../lib/constants/popcorn.js';

export class AnimatableElement extends Component {
  constructor(props = {}) {
    super(props);
    this.projectStore = getStore('projectStore');

    this.state = {
      onSelect: props.onSelect,
      item: props.item,
    };

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.state.onSelect) {
      this.state.onSelect(this.state.item);
    }
  }

  render() {
    const { item } = this.state;

    const container = document.createElement('div');
    container.className = 'popcorn-element animatable-element';
    container.title = item.type || item.title || item.htmlText || 'Element';
    container.tabIndex = -1;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'popcorn-element-name';

    if (item.htmlText) {
      const textSpan = document.createElement('span');
      textSpan.className = 'popcorn-element-text';
      textSpan.contentEditable = true;
      textSpan.textContent = item.htmlText;
      nameSpan.appendChild(textSpan);
    } else {
      nameSpan.textContent = POPCORN_ELEMENT_LABELS[item.type] || item.type;
    }

    // Animation sections (simplified)
    const inSection = document.createElement('div');
    inSection.className = 'popcorn-element-part in-animation-element';

    const idleSection = document.createElement('div');
    idleSection.className = 'popcorn-element-part idle-animation-element';

    const outSection = document.createElement('div');
    outSection.className = 'popcorn-element-part out-animation-element';

    container.appendChild(nameSpan);
    container.appendChild(inSection);
    container.appendChild(idleSection);
    container.appendChild(outSection);

    this.addEventListener(container, 'click', this.handleClick);

    return container;
  }
}

export default AnimatableElement;