import React from 'react';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';

const DragHandle = SortableHandle(() => <span className="drag-handle">⋮⋮</span>);

const SortableItem = SortableElement(({ item, component: Component, onRemove }) => (
  <div className="sortable-item">
    <DragHandle />
    <Component item={item} onRemove={onRemove} />
  </div>
));

const SortableList = SortableContainer(({ items, component, onSortEnd, onRemove, sortableRef, className, idField }) => {
  return (
    <div ref={sortableRef} className={className}>
      {items.map((item, index) => (
        <SortableItem
          key={item[idField] || index}
          index={index}
          item={item}
          component={component}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
});

export default SortableList;