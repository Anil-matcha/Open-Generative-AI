import { Component } from '../../components/base/Component.js';

export class Clip extends Component {
  constructor(props = {}) {
    super(props);

    const item = props.item || {};

    this.state = {
      id: item.id || null,
      name: item.name || 'Untitled Clip',
      start: item.start || 0,
      end: item.end || 10,
      left: item.left ?? (item.start !== undefined ? item.start : 0),
      width: item.width ?? ((item.end || 10) - (item.start || 0)),
      type: item.type || 'video',
      selected: item.selected || false,
      ...item
    };

    // Callbacks
    this.onClick = props.onClick || (() => {});
    this.onSelect = props.onSelect || (() => {});
    this.onDeselect = props.onDeselect || (() => {});

    // Bind handlers
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e) {
    e.stopPropagation();
    if (this.state.selected) {
      this.onDeselect(this.state.id);
      this.setState({ selected: false });
    } else {
      this.onSelect(this.state.id);
      this.setState({ selected: true });
    }
    this.onClick(this.state.id);
  }

  onMount() {
    // Could set up drag handlers, etc.
  }

  render() {
    const { name, left, width, selected, type } = this.state;

    // Use createElementFromHTML for cleaner template
    const clip = this.createElementFromHTML(
      `<button class="clip ${selected ? 'selected' : ''}" type="button"></button>`
    );

    clip.style.left = `${left}%`;
    clip.style.width = `${width}%`;
    clip.dataset.clipId = this.state.id;
    clip.title = `${name} (${type})`;

    const label = document.createElement('span');
    label.className = 'clip-label';
    label.textContent = name;
    clip.appendChild(label);

    this.addEventListener(clip, 'click', this.handleClick);

    return clip;
  }
}

export default Clip;
