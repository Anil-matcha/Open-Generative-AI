import React, { useState } from 'react';
import { appManifest } from './manifest';
import * as designService from './services/designAgentService';
import { sendToLibrary, sendToRender } from '../../lib/outputHandoff';

export default function DesignAgentApp() {
  const [brief, setBrief] = useState('');
  const [assets, setAssets] = useState([]);

  const planAndGenerate = async () => {
    const results = await designService.runDesignAgent(brief);
    setAssets(results);
  };

  return React.createElement('div', { className: 'h-full p-4 bg-[#0a0a0a] text-white' },
    React.createElement('h1', { className: 'text-xl mb-4' }, 'Design Agent'),
    React.createElement('textarea', { value: brief, onChange: e => setBrief(e.target.value), placeholder: 'Brand campaign for new product', className: 'w-full h-20 bg-white/5 p-3 rounded mb-4' }),
    React.createElement('button', { onClick: planAndGenerate, className: 'px-6 py-2 bg-primary rounded mb-4' }, 'Plan & Generate Assets'),
    assets.length > 0 && React.createElement('div', { className: 'grid grid-cols-3 gap-2' },
      assets.map((a, i) => React.createElement('div', { key: i },
        React.createElement('img', { src: a.url, className: 'w-full mb-1' }),
        React.createElement('button', { onClick: () => sendToLibrary(a), className: 'text-xs px-2 py-1 bg-white/10 w-full rounded' }, 'Save')
      ))
    )
  );
}

export { appManifest } from './manifest';
export { routes as appRoutes } from './routes';