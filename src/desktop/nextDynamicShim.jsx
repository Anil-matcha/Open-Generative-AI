import React, { Suspense } from 'react';

export default function dynamic(loader, options = {}) {
  const LazyComponent = React.lazy(loader);
  const LoadingComponent = options.loading || (() => null);

  return function DynamicComponent(props) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
