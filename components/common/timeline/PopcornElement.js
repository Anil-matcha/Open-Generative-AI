import { Component } from '../../base/Component.js';
import { POPCORN_ELEMENT_TYPES } from '../../../lib/constants/popcorn.js';
import AnimatableElement from './elements/AnimatableElement.js';
import DefaultElement from './elements/DefaultElement.js';
import IconElement from './elements/IconElement.js';

const TIMELINE_COMPONENTS = {
  [POPCORN_ELEMENT_TYPES.TEXT]: AnimatableElement,
  [POPCORN_ELEMENT_TYPES.LEAD_GENERATOR]: DefaultElement,
  [POPCORN_ELEMENT_TYPES.IMAGE]: AnimatableElement,
};

export class PopcornElement extends Component {
  constructor(props = {}) {
    super(props);

    this.state = {
      item: props.item,
    };
  }

  render() {
    const { item } = this.state;

    const ElementClass = TIMELINE_COMPONENTS[item.type] || DefaultElement;

    if (!ElementClass) {
      return null;
    }

    const element = new ElementClass({
      item,
      className: `timeline-popcorn-${item.type}`,
    });

    return element.render();
  }
}

export default PopcornElement;