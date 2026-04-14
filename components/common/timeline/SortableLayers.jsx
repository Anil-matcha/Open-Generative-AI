import React, { useState } from 'react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import Layer from './Layer.jsx';

const SortableLayer = SortableElement(({ item, onRemove }) => (
  <div className="sortable-layer-item">
    <Layer item={item} onRemove={onRemove} />
  </div>
));

const SortableLayersList = SortableContainer(({ items, onRemove }) => (
  <div className="layers-list">
    {items.map((item, index) => (
      <SortableLayer
        key={item.id || index}
        index={index}
        item={item}
        onRemove={onRemove}
      />
    ))}
  </div>
));

const SortableLayers = ({ layers, onSortEnd, onRemove }) => {
  return (
    <SortableLayersList
      items={layers}
      onSortEnd={onSortEnd}
      onRemove={onRemove}
      useDragHandle
    />
  );
};

export default SortableLayers;