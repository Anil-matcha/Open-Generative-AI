import { Component } from '../../base/Component.js';

export class PlayTime extends Component {
  constructor(props = {}) {
    super(props);
  }

  render() {
    const container = document.createElement('div');
    container.className = 'play-time';

    const currentTime = document.createElement('span');
    currentTime.className = 'current-time';
    currentTime.textContent = '00:00:00.00';
    container.appendChild(currentTime);

    const separator = document.createElement('span');
    separator.className = 'separator';
    separator.textContent = ' / ';
    container.appendChild(separator);

    const totalTime = document.createElement('span');
    totalTime.className = 'total-time';
    totalTime.textContent = '01:00:00.00';
    container.appendChild(totalTime);

    return container;
  }
}

export default PlayTime;