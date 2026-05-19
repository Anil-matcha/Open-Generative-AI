import React, { useState } from 'react';
import { appManifest } from './manifest';
import * as pomelliService from './services/pomelliService';
import { sendToLibrary } from '../../lib/outputHandoff';

export default function OpenPomelliApp() {
  const [url, setUrl] = useState('');
  const [dna, setDna] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [output, setOutput] = useState(null);

  const analyze = async () => {
    const brand = await pomelliService.analyzeWebsite(url);
    setDna(brand);
  };

  const generateCampaign = async () => {
    const camp = await pomelliService.generateCampaignConcepts(dna);
    setCampaigns(camp);
  };

  const generateCreative = async (platform) => {
    const creative = await pomelliService.generatePlatformCreative(dna, platform);
    setOutput(creative);
  };

  const save = async () => {
    if (!output) return;
    await sendToLibrary({ ...output, app_id: 'open-pomelli', app_name: 'Open Pomelli' });
  };

  return React.createElement('div', { className: 'h-full flex flex-col bg-[#0a0a0a] text-white p-4' },
    React.createElement('h1', { className: 'text-xl mb-4' }, 'Open Pomelli'),
    React.createElement('div', { className: 'flex gap-2 mb-4' },
      React.createElement('input', { value: url, onChange: e => setUrl(e.target.value), placeholder: 'https://example.com', className: 'flex-1 bg-white/5 border border-white/10 px-3 py-2 rounded' }),
      React.createElement('button', { onClick: analyze, className: 'px-4 py-2 bg-primary rounded' }, 'Analyze Website')
    ),
    dna && React.createElement('div', { className: 'mb-4 p-3 bg-white/5 rounded' }, 'Brand DNA: ' + JSON.stringify(dna).slice(0, 80) + '...'),
    React.createElement('button', { onClick: generateCampaign, className: 'mb-4 px-4 py-2 bg-white/10 rounded' }, 'Generate Campaigns'),
    campaigns.length > 0 && React.createElement('div', { className: 'mb-4' }, campaigns.map((c, i) => React.createElement('button', { key: i, onClick: () => generateCreative('instagram'), className: 'mr-2 px-3 py-1 bg-white/10 rounded text-sm' }, c.name))),
    output && React.createElement('div', null,
      React.createElement('img', { src: output.url, className: 'max-w-xs mb-2' }),
      React.createElement('button', { onClick: save, className: 'px-4 py-2 bg-white/10 rounded' }, 'Save to Library')
    )
  );
}

export { appManifest } from './manifest';
export { routes as appRoutes } from './routes';