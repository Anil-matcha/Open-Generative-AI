import { Component } from '../../../base/Component.js';
import { POPCORN_ELEMENT_LABELS } from '../../../../lib/constants/popcorn.js';

export class IconElement extends Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      item: props.item,
      className: props.className,
    };
  }

  render() {
    const { item, className } = this.state;

    const container = document.createElement('div');
    container.className = `popcorn-element icon-element popcorn-${item.type}-element ${className || ''}`;
    container.title = item.title || item.htmlText || item.type;
    container.tabIndex = -1;

    // Icon placeholder (simplified)
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'inner-wrapper popcorn-timeline-icon';

    const iconBtn = document.createElement('div');
    iconBtn.className = 'icon-btn--inline';
    // Simple icon representation - could be replaced with actual SVG
    iconBtn.textContent = '📹'; // Default video icon

    iconWrapper.appendChild(iconBtn);
    container.appendChild(iconWrapper);

    // Title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'popcorn-element-title';
    titleDiv.textContent = item.title || POPCORN_ELEMENT_LABELS[item.type] || item.type;
    container.appendChild(titleDiv);

    return container;
  }
}

export default IconElement;