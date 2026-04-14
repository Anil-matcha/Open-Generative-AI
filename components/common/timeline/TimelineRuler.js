import { Component } from '../../base/Component.js';

export class TimelineRuler extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      state: props.state || { timelineSeconds: 60 },
      zoom: props.zoom || 1
    };
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  render() {
    const { timelineSeconds } = this.state.state;
    const { zoom } = this.state;
    const majorTicks = Math.ceil(timelineSeconds / 10);

    const container = document.createElement('div');
    container.className = 'timeline-ruler';

    for (let i = 0; i <= majorTicks; i++) {
      const seconds = i * 10;
      const percentage = (seconds / timelineSeconds) * 100 * zoom;

      const tick = document.createElement('div');
      tick.className = 'ruler-tick';
      tick.style.left = `${percentage}%`;

      const label = document.createElement('div');
      label.className = 'ruler-label';
      label.textContent = this.formatTime(seconds);
      tick.appendChild(label);

      container.appendChild(tick);
    }

    return container;
  }
}

export default TimelineRuler;