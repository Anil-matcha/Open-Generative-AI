import { Component } from '../base/Component.js';

export class Menu extends Component {
  constructor(props = {}) {
    super(props);
    this.state = {
      isOpen: false,
      toggleElement: props.toggleElement || '',
      items: props.items || [],
      useButton: props.useButton || false,
      className: props.className || '',
      onClick: props.onClick || (() => {})
    };

    this.handleToggle = this.handleToggle.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
  }

  handleToggle() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  handleItemClick(item) {
    if (this.state.onClick) {
      this.state.onClick(item.value);
    }
    this.setState({ isOpen: false });
  }

  render() {
    const { isOpen, toggleElement, items, useButton, className } = this.state;

    const container = document.createElement('div');
    container.className = `menu-component ${className}`;

    const toggleEl = useButton ? document.createElement('button') : document.createElement('div');
    toggleEl.className = 'menu-toggle';
    if (useButton) toggleEl.type = 'button';
    toggleEl.textContent = toggleElement;
    this.addEventListener(toggleEl, 'click', this.handleToggle);
    container.appendChild(toggleEl);

    if (isOpen) {
      const dropdown = document.createElement('div');
      dropdown.className = 'menu-dropdown';

      items.forEach((item, index) => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.textContent = item.title;
        this.addEventListener(menuItem, 'click', () => this.handleItemClick(item));
        dropdown.appendChild(menuItem);
      });

      container.appendChild(dropdown);
    }

    return container;
  }
}

export default Menu;