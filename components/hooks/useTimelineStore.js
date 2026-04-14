import { createStore, registerStore } from '../base/Store.js';

// Create timeline store
const timelineStore = createStore({
  contextMenu: {
    isOpen: false,
    posX: 0,
    posY: 0,
    buttons: []
  },
  isActiveTimeline: false,
  timelineHeight: 300,
  copiedItems: []
});

// Add custom methods
timelineStore.setCopiedItems = (items) => {
  timelineStore.updateState({ copiedItems: items });
};

timelineStore.setContextMenu = (menu) => {
  timelineStore.updateState({ contextMenu: menu });
};

timelineStore.pasteElement = () => {
  console.log('Pasting elements');
  timelineStore.updateState({ contextMenu: { isOpen: false } });
};

// Register the store
registerStore('timelineStore', timelineStore);

export default timelineStore;