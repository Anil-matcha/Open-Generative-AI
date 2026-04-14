import { createStore, registerStore } from '../base/Store.js';

// Create UI store
const uiStore = createStore({
  isTimelineOpen: true
});

// Register the store
registerStore('uiStore', uiStore);

export default uiStore;