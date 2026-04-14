import { Component } from '../../../base/Component.js';
import { POPCORN_ELEMENT_LABELS } from '../../../../lib/constants/popcorn.js';

export class DefaultElement extends Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      item: props.item,
    };
  }

  render() {
    const { item } = this.state;

    const container = document.createElement('div');
    container.className = 'popcorn-element default-element';
    container.tabIndex = -1;
    container.title = item.type || item.title || item.htmlText || 'Element';

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

    container.appendChild(nameSpan);

    return container;
  }
}

export default DefaultElement;