// Task 6: Component virtualization for performance
import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';

export const VirtualizedList = memo(({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight = items.length * itemHeight;
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1).map((item, index) => ({
      ...item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute',
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, visibleRange, itemHeight]);

  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item) => (
          <div key={item.index} style={item.style}>
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  );
});

// Optimized media grid with virtualization
export const VirtualizedMediaGrid = memo(({
  mediaItems,
  itemWidth = 200,
  itemHeight = 200,
  gap = 16,
  containerWidth,
  containerHeight,
  renderMediaItem,
  onItemClick
}) => {
  const itemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rowHeight = itemHeight + gap;

  const virtualItems = useMemo(() => {
    const items = [];
    for (let i = 0; i < mediaItems.length; i += itemsPerRow) {
      const rowItems = mediaItems.slice(i, i + itemsPerRow);
      items.push({
        type: 'row',
        items: rowItems,
        rowIndex: Math.floor(i / itemsPerRow),
        startIndex: i
      });
    }
    return items;
  }, [mediaItems, itemsPerRow]);

  const renderRow = useCallback((rowData) => (
    <div
      key={rowData.rowIndex}
      style={{
        display: 'flex',
        gap: gap,
        marginBottom: gap,
        height: itemHeight
      }}
    >
      {rowData.items.map((item, colIndex) => (
        <div
          key={rowData.startIndex + colIndex}
          style={{
            width: itemWidth,
            height: itemHeight,
            flexShrink: 0,
            cursor: 'pointer'
          }}
          onClick={() => onItemClick?.(item, rowData.startIndex + colIndex)}
        >
          {renderMediaItem(item, rowData.startIndex + colIndex)}
        </div>
      ))}
    </div>
  ), [itemWidth, itemHeight, gap, renderMediaItem, onItemClick]);

  return (
    <VirtualizedList
      items={virtualItems}
      itemHeight={rowHeight}
      containerHeight={containerHeight}
      renderItem={renderRow}
    />
  );
});

// Performance monitoring HOC
export function withPerformanceMonitoring(Component, componentName) {
  return memo((props) => {
    const renderStart = useRef(performance.now());
    const [renderTime, setRenderTime] = useState(0);

    useEffect(() => {
      const endTime = performance.now();
      const duration = endTime - renderStart.current;
      setRenderTime(duration);

      // Track render performance
      if (window.enhancedPerfMonitor) {
        window.enhancedPerfMonitor.trackComponentRender(componentName, duration);
      }

      // Warn about slow renders
      if (duration > 16.67) {
        console.warn(`[Performance] Slow render: ${componentName} (${duration.toFixed(2)}ms)`);
      }
    });

    // Add performance data to component for debugging
    const performanceProps = {
      ...props,
      'data-render-time': renderTime.toFixed(2),
      'data-component-name': componentName
    };

    return <Component {...performanceProps} />;
  });
}

// Lazy component loader
export function lazyLoadComponent(importFn, fallback = null) {
  const LazyComponent = lazy(importFn);

  return (props) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Image component with lazy loading and performance optimization
export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 'full',
  onLoad,
  onError,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src || priority) return;

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoaded(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  const handleLoad = useCallback(() => {
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  const shouldLoad = priority || loaded;

  return (
    <div
      ref={imgRef}
      style={{
        width,
        height,
        backgroundColor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      {...props}
    >
      {error ? (
        <div style={{ color: '#666', fontSize: '12px' }}>Failed to load</div>
      ) : shouldLoad ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ color: '#999', fontSize: '12px' }}>Loading...</div>
      )}
    </div>
  );
});