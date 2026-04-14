import { Component } from '../../base/Component.js';
import { getStore } from '../../base/Store.js';

const contextButtons = {
  COPY: 'Copy',
  PASTE: 'Paste'
};

const buttonStyles = {
  height: 33,
};

const menuWidth = 200;

export class ContextMenu extends Component {
  constructor(props = {}) {
    super(props);
    this.timelineStore = getStore('timelineStore');
    this.copy = this.copy.bind(this);
  }

  copy() {
    this.timelineStore.updateState({ copiedItems: [] });
    this.timelineStore.updateState({ contextMenu: { isOpen: false } });
  }

  render() {
    const { copiedItems, contextMenu } = this.timelineStore.getState();

    const menuHeight = buttonStyles.height * (contextMenu.buttons ? contextMenu.buttons.length : 0);
    let menuLeft = contextMenu.posX || 0;
    if (window.innerWidth < (contextMenu.posX || 0) + menuWidth) {
      menuLeft -= menuWidth;
    }

    const menuStyles = `width: ${menuWidth}px; left: ${menuLeft}px; top: ${(contextMenu.posY || 0) - menuHeight}px; height: ${menuHeight}px;`;

    const container = document.createElement('div');
    container.className = 'context-menu';
    container.style.cssText = menuStyles;

    if (contextMenu?.isClickOnRow && copiedItems?.length) {
      const pasteButton = document.createElement('button');
      pasteButton.className = 'context-menu__button';
      pasteButton.style.cssText = `height: ${buttonStyles.height}px;`;
      pasteButton.textContent = contextButtons.PASTE;
      this.addEventListener(pasteButton, 'click', () => this.timelineStore.updateState({ contextMenu: { isOpen: false } }));
      container.appendChild(pasteButton);
    } else {
      const copyButton = document.createElement('button');
      copyButton.className = 'context-menu__button';
      copyButton.style.cssText = `height: ${buttonStyles.height}px;`;
      copyButton.textContent = contextButtons.COPY;
      this.addEventListener(copyButton, 'click', this.copy);
      container.appendChild(copyButton);
    }

    return container;
  }
}

export default ContextMenu;