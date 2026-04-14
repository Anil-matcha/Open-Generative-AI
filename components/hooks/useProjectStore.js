import { createStore } from '../base/Store.js';

// Create project store
const projectStore = createStore({
  layers: [
    {
      id: 1,
      name: 'Video Layer',
      order: 0,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal'
    },
    {
      id: 2,
      name: 'Audio Layer',
      order: 1,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal'
    }
  ],
  elements: [
    {
      id: 'elem1',
      type: 'text',
      htmlText: 'Welcome to the video',
      start: 0,
      end: 10,
      track: 1
    },
    {
      id: 'elem2',
      type: 'image',
      start: 15,
      end: 25,
      track: 1
    },
    {
      id: 'elem3',
      type: 'lead_generator',
      start: 30,
      end: 45,
      track: 1
    }
  ],
  duration: 60,
  isLoaded: true,
  isPlayed: false,
  time: 0
});

// Add custom methods
const originalUpdateState = projectStore.updateState;
projectStore.updateState = (updates) => {
  originalUpdateState(updates);
};

projectStore.addLayer = () => {
  const layers = projectStore.getState().layers;
  const newLayer = {
    id: Date.now(),
    name: `Layer ${layers.length + 1}`,
    order: layers.length,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'normal'
  };
  projectStore.updateState({
    layers: [...layers, newLayer]
  });
};

projectStore.removeLayer = (id) => {
  const layers = projectStore.getState().layers;
  projectStore.updateState({
    layers: layers.filter(layer => layer.id !== id)
  });
};

projectStore.moveElements = (oldIndex, newIndex) => {
  const layers = [...projectStore.getState().layers];
  const [removed] = layers.splice(oldIndex, 1);
  layers.splice(newIndex, 0, removed);
  projectStore.updateState({ layers });
};

projectStore.stopIfPlay = () => {
  if (projectStore.getState().isPlayed) {
    projectStore.updateState({ isPlayed: false });
  }
};

// Register the store
import { registerStore } from '../base/Store.js';
registerStore('projectStore', projectStore);

export default projectStore;