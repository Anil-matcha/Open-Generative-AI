import { Component } from '../../base/Component.js';

export class PlusButton extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      onClick: props.onClick || (() => {}),
      alt: props.alt || '',
      className: props.className || ''
    };
  }

  render() {
    const { onClick, alt, className } = this.state;
    const button = document.createElement('button');
    button.className = `plus-button ${className}`;
    button.textContent = '+';
    button.title = alt;
    this.addEventListener(button, 'click', onClick);
    return button;
  }
}

export default PlusButton;