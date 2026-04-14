import { useState, useEffect } from 'react';
import { createStore } from '../base/Store.js';

/**
 * Project Store Hook
 * Manages project-related state and operations
 */
export const useProjectStore = () => {
  const [layers, setLayers] = useState([]);
  const [duration, setDuration] = useState(60);
  const [isLoaded, setIsLoaded] = useState(true);
  const [isPlayed, setIsPlayed] = useState(false);
  const [time, setTime] = useState(0);

  const addLayer = () => {
    const newLayer = {
      id: Date.now(),
      name: `Layer ${layers.length + 1}`,
      order: layers.length,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal'
    };
    setLayers([...layers, newLayer]);
  };

  const removeLayer = (id) => {
    setLayers(layers.filter(layer => layer.id !== id));
  };

  const moveElements = (oldIndex, newIndex) => {
    const newLayers = [...layers];
    const [removed] = newLayers.splice(oldIndex, 1);
    newLayers.splice(newIndex, 0, removed);
    setLayers(newLayers);
  };

  const stopIfPlay = () => {
    if (isPlayed) {
      setIsPlayed(false);
    }
  };

  const editLayer = (id, updates) => {
    setLayers(layers.map(layer =>
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  };

  return {
    layers,
    duration,
    isLoaded,
    addLayer,
    removeLayer,
    moveElements,
    isPlayed,
    time,
    stopIfPlay,
    editLayer,
    setLayers,
    setDuration,
    setIsPlayed,
    setTime
  };
};

export default useProjectStore;