import React from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import { DesktopApp } from './DesktopApp.js';
import { createElectronStudioAdapter } from './electronStudioAdapter.js';

const appRoot = document.querySelector('#app');

if (!appRoot) {
  throw new Error('MozenAIGC desktop renderer could not find #app.');
}

bootstrapDesktopRenderer();

async function bootstrapDesktopRenderer() {
  const desktopAdapter = await createElectronStudioAdapter();

  createRoot(appRoot).render(
    React.createElement(DesktopApp, {
      desktopAdapter,
    }),
  );
}
