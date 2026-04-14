import React, { useState, useRef, useEffect } from 'react';
import { Component } from '../../base/Component.js';
import { getStore } from '../../base/Store.js';
import BlendingMode from './BlendingMode.js';
import Opacity from './Opacity.js';

const penIcon = `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.84 12.15">
  <defs><style>.cls-1{fill:none;stroke:#eb5054;stroke-linecap:round;stroke-linejoin:round;}</style>
  </defs>
  <rect class="cls-1 icon-edit-timeline" x="396.9" y="193.69" width="2.96" height="1.65" transform="translate(-289.55 -322.57) rotate(21)"/><rect class="cls-1 icon-edit-timeline" x="395.27" y="195.03" width="2.96" height="7.49" transform="translate(-288.13 -321.7) rotate(21)"/><polygon class="cls-1 icon-edit-timeline" points="9.69 9.56 11.07 10.09 9.97 10.87 8.88 11.65 8.59 10.34 8.3 9.03 9.69 9.56"/><line class="cls-1 icon-edit-timeline" x1="0.5" y1="11.65" x2="6.83" y2="11.65"/>
</svg>`;

const trashIcon = `<svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.6144 2.3H11.3946H9.85559H9.30596V1.3C9.30596 1 9.19604 0.6 8.86626 0.4C8.6464 0.1 8.31662 0 7.87692 0H5.3486C4.9089 0 4.57912 0.1 4.35926 0.4C4.02948 0.6 3.91956 0.9 3.91956 1.3V2.3H3.36993H1.83095H1.6111C1.17139 2.3 0.841614 2.6 0.841614 2.9C0.841614 3.2 1.17139 3.6 1.6111 3.6H1.94088V10.7C1.94088 11 2.27066 11.3 2.60044 11.3V11.6C2.60044 11.8 2.82029 12 3.04015 12H10.2953C10.5152 12 10.735 11.8 10.735 11.6V11.3C11.0648 11.3 11.3946 11 11.3946 10.7V3.6H11.7243C12.1641 3.6 12.4938 3.3 12.4938 2.9C12.4938 2.5 12.0541 2.3 11.6144 2.3ZM4.79897 1.3C4.79897 1.2 4.9089 1 5.01882 0.9C5.12875 0.8 5.23868 0.7 5.45853 0.7H7.98684C8.09677 0.7 8.31662 0.8 8.42655 0.9C8.42655 1 8.42655 1.1 8.42655 1.3V2.3H4.79897V1.3ZM9.85559 10.7H3.26V3.6H9.85559V10.7Z" fill="#EB5054"/>
<path d="M5.34861 9.80001C5.56846 9.80001 5.78832 9.60001 5.78832 9.40001V4.60001C5.78832 4.40001 5.56846 4.20001 5.34861 4.20001C5.12876 4.20001 4.90891 4.40001 4.90891 4.60001V9.40001C4.90891 9.60001 5.12876 9.80001 5.34861 9.80001Z" fill="#EB5054"/>
<path d="M7.8769 9.80001C8.09675 9.80001 8.31661 9.60001 8.31661 9.40001V4.60001C8.31661 4.40001 8.09675 4.20001 7.8769 4.20001C7.65705 4.20001 7.43719 4.40001 7.43719 4.60001V9.40001C7.43719 9.60001 7.65705 9.80001 7.8769 9.80001Z" fill="#EB5054"/>
</svg>`;

const Layer = ({ item, onRemove }) => {
  const [isEdit, setIsEdit] = useState(false);
  const [name, setName] = useState(item.name || item.defaultName || 'Layer');
  const [visible, setVisible] = useState(item.visible !== false);
  const [locked, setLocked] = useState(item.locked || false);
  const [solo, setSolo] = useState(item.solo || false);
  const [opacity, setOpacity] = useState(item.opacity || 1);
  const inputRef = useRef(null);

  // Mock project store for now - will integrate with actual store later
  const projectStore = {
    editLayer: (id, updates) => {
      console.log('Editing layer', id, updates);
      // This will be replaced with actual store integration
    },
    setLayerStyle: (layerId, style) => {
      console.log('Setting layer style', layerId, style);
      if (style.name === 'opacity') {
        setOpacity(style.value);
      }
    }
  };

  const toggleVisibility = () => {
    setVisible(!visible);
    projectStore.editLayer(item.id, { visible: !visible });
  };

  const toggleLock = () => {
    setLocked(!locked);
    projectStore.editLayer(item.id, { locked: !locked });
  };

  const toggleSolo = () => {
    setSolo(!solo);
    projectStore.editLayer(item.id, { solo: !solo });
  };

  useEffect(() => {
    if (inputRef.current && isEdit) {
      inputRef.current.focus();
    }
  }, [isEdit]);

  const handleEdit = (e) => {
    setName(e.target.value);
  };

  const handleEditClick = () => {
    setIsEdit(!isEdit);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(item);
    }
  };

  const handleBlur = () => {
    setIsEdit(false);
    if (!name.trim()) {
      setName(item.defaultName || 'Layer');
    }
    projectStore.editLayer(item.id, { name });
  };

  const layersCount = 1; // Mock - will be dynamic based on actual layers

  return (
    <div className={`layer ${locked ? 'locked' : ''} ${!visible ? 'hidden' : ''}`}>
      <div className="layer__drag-handle">⋮⋮</div>

      <div className="layer__controls">
        <button
          className={`layer-control ${visible ? 'active' : ''}`}
          onClick={toggleVisibility}
          title="Toggle visibility"
        >
          👁
        </button>
        <button
          className={`layer-control ${locked ? 'active' : ''}`}
          onClick={toggleLock}
          title="Toggle lock"
        >
          🔒
        </button>
        <button
          className={`layer-control ${solo ? 'active' : ''}`}
          onClick={toggleSolo}
          title="Toggle solo"
        >
          S
        </button>
      </div>

      <div className="layer__block">
        <div className="layer__delete">
          {layersCount > 1 && (
            <div className="layer__flex">
              <button
                className="icon icon-button svg-fix"
                type="button"
                onClick={handleRemove}
                dangerouslySetInnerHTML={{ __html: trashIcon }}
              />
            </div>
          )}
        </div>

        <div className="layer__block">
          <input
            ref={inputRef}
            className="title reset-input"
            value={name}
            onChange={handleEdit}
            onFocus={() => setIsEdit(true)}
            onBlur={handleBlur}
          />

          <div className="layer__flex">
            <button
              className="icon icon-button svg-fix"
              type="button"
              onClick={handleEditClick}
              dangerouslySetInnerHTML={{ __html: penIcon }}
            />
          </div>
        </div>
      </div>

      <div className="layer__block">
        <BlendingMode layer={item} />
        <Opacity layer={{ ...item, opacity }} />
      </div>
    </div>
  );
};

export default Layer;