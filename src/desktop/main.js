import React from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import { DesktopApp } from './DesktopApp.js';
import { createElectronStudioAdapter } from './electronStudioAdapter.js';

const appRoot = document.querySelector('#app');

if (!appRoot) {
  throw new Error('MozenAIGC desktop renderer could not find #app.');
}

if (shouldUseLegacyRenderer()) {
  import('../main.js');
} else {
  bootstrapDesktopRenderer();
}

function shouldUseLegacyRenderer() {
  const params = new URLSearchParams(window.location.search);
  return params.get('renderer') === 'legacy';
}

async function bootstrapDesktopRenderer() {
  const desktopAdapter = await createElectronStudioAdapter();

  createRoot(appRoot).render(
    React.createElement(DesktopApp, {
      desktopAdapter,
    }),
  );
}
