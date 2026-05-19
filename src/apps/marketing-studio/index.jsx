import React, { useState } from 'react';
import { appManifest } from './manifest';
import * as mktService from './services/marketingStudioService';
import { sendToLibrary } from '../../lib/outputHandoff';

export default function MarketingStudioApp() {
  const [brief, setBrief] = useState('');
  const [output, setOutput] = useState(null);

  const generate = async () => {
    const res = await mktService.generateCampaignIdeas(brief);
    setOutput(res);
  };

  return React.createElement('div', { className: 'h-full p-4 bg-[#0a0a0a] text-white' },
    React.createElement('h1', { className: 'text-xl mb-4' }, 'Marketing Studio'),
    React.createElement('textarea', { value: brief, onChange: e => setBrief(e.target.value), placeholder: 'Product launch for AI tool', className: 'w-full h-24 bg-white/5 p-3 rounded mb-4' }),
    React.createElement('button', { onClick: generate, className: 'px-6 py-2 bg-primary rounded' }, 'Generate Campaign'),
    output && React.createElement('div', { className: 'mt-4' },
      React.createElement('pre', { className: 'text-xs bg-black/40 p-3' }, JSON.stringify(output, null, 2)),
      React.createElement('button', { onClick: () => sendToLibrary({ ...output, app_id: 'marketing-studio', app_name: 'Marketing Studio' }), className: 'mt-2 px-4 py-2 bg-white/10 rounded' }, 'Save to Library')
    )
  );
}

export { appManifest } from './manifest';
export { routes as appRoutes } from './routes';