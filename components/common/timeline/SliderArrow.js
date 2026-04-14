import { Component } from '../../base/Component.js';

export class SliderArrow extends Component {
  constructor(props = {}) {
    super(props);
    this.state = props;
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.state.onClick) {
      this.state.onClick();
    }
  }

  render() {
    const { direction = 'right' } = this.state;
    const container = document.createElement('button');
    container.className = `slider-arrow slider-arrow-${direction}`;
    container.title = `Navigate ${direction}`;

    const arrow = document.createElement('span');
    arrow.className = 'slider-arrow-icon';
    arrow.textContent = direction === 'left' ? '◀' : '▶';
    container.appendChild(arrow);

    this.addEventListener(container, 'click', this.handleClick);

    return container;
  }
}

export default SliderArrow;