import { Component } from '../../base/Component.js';
import LineSlider from './LineSlider.js';

export class TimeLineSlider extends Component {
  constructor(props = {}) {
    super(props);
    this.state = props;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'timeline-slider';

    // Add the line slider (ruler) component
    const lineSlider = new LineSlider({
      startDate: this.state.startDate,
      endDate: this.state.endDate,
      startDateWithZoom: this.state.startDateWithZoom,
      endDateWithZoom: this.state.endDateWithZoom
    });

    container.appendChild(lineSlider.render());
    return container;
  }
}

export default TimeLineSlider;