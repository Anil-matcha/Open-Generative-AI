import { Component } from '../../base/Component.js';

const svgTransitionFrom = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.81 18.5">
  <defs>
    <style>.icon-transition-from_cls-1{fill:#212532;}.icon-transition-from_cls-2{fill:#fff;}</style>
  </defs>
  <title>transition-icon-from-group</title>
  <g id="icon-transition-from_layer_2">
    <g id="transition-icon-from">
      <g id="transition-icon-from-group">
        <path id="transition-icon-from-fill" class="icon-transition-from_cls-1"
              d="M23.39,9.3,19.2,5.11V1H4A3,3,0,0,0,1,4V14.5a3,3,0,0,0,3,3H19.2v-4Z"/>
        <path id="transition-icon-from-border" class="icon-transition-from_cls-2"
              d="M20.2,4.69V0H4A4.05,4.05,0,0,0,0,4V14.5a4.05,4.05,0,0,0,4,4H20.2V13.91L24.81,9.3Zm-1,8.8v4H4a3,3,0,0,1-3-3V4A3,3,0,0,1,4,1H19.2V5.11L23.39,9.3Z"/>
      </g>
    </g>
  </g>
</svg>`;

const svgTransitionTo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18.5">
  <defs>
    <style>
      .transition-icon-to_cls-1{fill:#212532;}
      .transition-icon-to_cls-2{fill:#474c65;}
      .transition-icon-to_cls-3{fill:#fff;}
    </style>
  </defs>
  <title>transition-icon-to-group</title>
  <g id="transition-icon-to_layer_2">
    <g id="transition-icon-to">
      <g id="transition-icon-to-group">
        <polygon id="transition-icon-to-curve-10" class="transition-icon-to_cls-1"
                 points="5.61 9.3 1 13.91 1 15.2 15.1 1 11.5 1 4.4 8.1 5.61 9.3"/>
        <polygon id="transition-icon-to-curve-9" class="transition-icon-to_cls-1" points="1 4.69 2.55 6.25 7.8 1 4.1 1 1 4.1 1 4.69"/>
        <path id="transition-icon-to-curve-8" class="transition-icon-to_cls-1" d="M18,17.5a3,3,0,0,0,3-3.1v-1l-4.1,4.1Z"/>
        <path id="transition-icon-to-curve-7" class="transition-icon-to_cls-1" d="M5.9,17.5,20.65,2.65a3,3,0,0,0-1.87-1.53L2.4,17.5Z"/>
        <polygon id="transition-icon-to-curve-6" class="transition-icon-to_cls-1" points="13.29 17.5 21 9.71 21 6 9.6 17.5 13.29 17.5"/>
        <polygon id="transition-icon-to-curve-5" class="transition-icon-to_cls-2" points="1 4.1 4.1 1 1.14 1 1 1.18 1 4.1"/>
        <polygon id="transition-icon-to-curve-4" class="transition-icon-to_cls-2" points="4.4 8.1 11.5 1 7.8 1 2.55 6.25 4.4 8.1"/>
        <path id="transition-icon-to-curve-3" class="transition-icon-to_cls-2"
              d="M1,17.5H2.4L18.78,1.12A2.89,2.89,0,0,0,18,1H15.1L1,15.2Z"/>
        <path id="transition-icon-to-curve-2" class="transition-icon-to_cls-2" d="M9.6,17.5,21,6V4a2.86,2.86,0,0,0-.35-1.35L5.9,17.5Z"/>
        <polygon id="transition-icon-to-curve-1" class="transition-icon-to_cls-2" points="16.9 17.5 21 13.4 21 9.71 13.29 17.5 16.9 17.5"/>
        <path id="transition-icon-to-border" class="transition-icon-to_cls-3"
              d="M18,0H0V5.11L4.19,9.3,0,13.49v5H18a4,4,0,0,0,4-4V4A4.05,4.05,0,0,0,18,0ZM1,13.91,5.61,9.3,4.4,8.1,2.55,6.25,1,4.69V1.18L1.14,1H18a2.89,2.89,0,0,1,.78.12,3,3,0,0,1,1.87,1.53A2.86,2.86,0,0,1,21,4V14.4a3,3,0,0,1-3,3.1H1V13.91Z"/>
      </g>
    </g>
  </g>
</svg>`;

export class TransitionButton extends Component {
  constructor(props = {}) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    if (this.props.onClick) {
      this.props.onClick();
    }
  }

  render() {
    const { type, className, from, to } = this.props;
    const isFrom = type === 'FROM';
    const icon = isFrom ? svgTransitionFrom : svgTransitionTo;
    const buttonClass = `add-transition-btn ${type} ${className || ''}`;
    const html = `<button class="${buttonClass}" title="Animate transition">${icon}</button>`;
    const element = this.createElementFromHTML(html);
    this.addEventListener(element, 'click', this.handleClick);
    return element;
  }
}

export default TransitionButton;