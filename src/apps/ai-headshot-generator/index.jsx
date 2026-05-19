import React, { useState } from 'react';
import { appManifest } from './manifest';
import * as headshotService from './services/headshotService';
import { sendToLibrary, sendToEditStudio } from '../../lib/outputHandoff';

export default function AIHeadshotApp() {
  const [photo, setPhoto] = useState(null);
  const [preset, setPreset] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');

  const upload = (e) => {
    const file = e.target.files[0];
    setPhoto(URL.createObjectURL(file));
  };

  const generate = async () => {
    setStatus('Generating headshot...');
    const res = await headshotService.generateHeadshot(photo, preset);
    setResult(res);
    setStatus('Done');
  };

  const save = async () => {
    await sendToLibrary({ ...result, app_id: 'ai-headshot-generator', app_name: 'AI Headshot Generator' });
  };

  return React.createElement('div', { className: 'h-full p-4 bg-[#0a0a0a] text-white' },
    React.createElement('h1', { className: 'text-xl mb-4' }, 'AI Headshot Studio'),
    React.createElement('div', { className: 'flex gap-4' },
      React.createElement('div', { className: 'flex-1' },
        React.createElement('input', { type: 'file', onChange: upload, className: 'mb-4' }),
        photo && React.createElement('img', { src: photo, className: 'max-w-xs mb-4 border border-white/10' }),
        React.createElement('button', { onClick: generate, className: 'px-6 py-2 bg-primary rounded' }, 'Generate Headshot')
      ),
      React.createElement('div', { className: 'flex-1' },
        result && React.createElement('div', null,
          React.createElement('img', { src: result.url, className: 'max-w-xs mb-2' }),
          React.createElement('div', { className: 'flex gap-2' },
            React.createElement('button', { onClick: save, className: 'px-4 py-2 bg-white/10 rounded' }, 'Save to Library'),
            React.createElement('button', { onClick: () => sendToEditStudio(result), className: 'px-4 py-2 bg-white/10 rounded' }, 'Edit Studio')
          )
        ),
        React.createElement('div', { className: 'text-xs mt-2 text-muted' }, status)
      )
    )
  );
}

export { appManifest } from './manifest';
export { routes as appRoutes } from './routes';