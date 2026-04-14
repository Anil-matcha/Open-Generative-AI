import { Component } from '../../base/Component.js';

export class PlayButton extends Component {
  constructor(props = {}) {
    super(props);
    this.handlePlay = this.handlePlay.bind(this);
  }

  handlePlay() {
    console.log('Play button clicked');
  }

  render() {
    const button = document.createElement('button');
    button.className = 'play-button';
    button.textContent = '▶️';
    this.addEventListener(button, 'click', this.handlePlay);
    return button;
  }
}

export default PlayButton;