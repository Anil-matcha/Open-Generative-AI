import { Component } from '../../base/Component.js';
import { getStore } from '../../base/Store.js';

export class LineSlider extends Component {
  constructor(props = {}) {
    super(props);
    this.projectStore = getStore('projectStore');
  }

  render() {
    const { duration } = this.projectStore.getState();

    // Create time markers every 5 seconds for a 60-second timeline
    const markers = [];
    const interval = 5; // seconds
    const numMarkers = Math.ceil(duration / interval);

    for (let i = 0; i <= numMarkers; i++) {
      const time = i * interval;
      if (time <= duration) {
        const marker = document.createElement('div');
        marker.className = 'line-slider-marker';

        const timestamp = document.createElement('div');
        timestamp.className = 'line-slider-timestamp';
        // Format as MM:SS
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timestamp.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const line = document.createElement('div');
        line.className = 'line-slider-line';

        marker.appendChild(timestamp);
        marker.appendChild(line);
        markers.push(marker);
      }
    }

    const container = document.createElement('div');
    container.className = 'line-slider-container';
    markers.forEach(marker => container.appendChild(marker));

    return container;
  }
}

export default LineSlider;