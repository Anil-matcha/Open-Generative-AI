import { Component } from '../base/Component.js';

export class HelpIconComponent extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      placement: props.placement || 'top',
      noPadding: props.noPadding || false,
      message: props.message || ''
    };
  }

  render() {
    const { noPadding, message } = this.state;
    const container = document.createElement('div');
    container.className = `help-icon ${noPadding ? 'no-padding' : ''}`;
    container.title = message;
    container.textContent = '?';
    return container;
  }
}

export default HelpIconComponent;