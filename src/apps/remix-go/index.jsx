import React, { useState } from 'react';
import { appManifest } from './manifest';
import * as remixGoService from './services/remixGoService';
import { sendToLibrary, sendToTimeline } from '../../lib/outputHandoff';

export default function RemixGoApp() {
  const [project, setProject] = useState(null);
  const [media, setMedia] = useState([]);
  const [output, setOutput] = useState(null);
  const [status, setStatus] = useState('');

  const handleNewProject = async () => {
    const name = prompt('Project name') || 'Untitled';
    const p = await remixGoService.createProject({ name });
    setProject(p);
    setStatus('Project created');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const url = await remixGoService.uploadMedia(file);
      setMedia([...media, url]);
    };
    input.click();
  };

  const handleGenerate = async () => {
    setStatus('Generating...');
    const result = await remixGoService.generateOutput(project.id, { prompt: 'cinematic edit' });
    setOutput(result);
    setStatus('Done');
  };

  const handleSaveLibrary = async () => {
    if (!output) return;
    await sendToLibrary({ ...output, app_id: 'remix-go', app_name: 'Remix Go' });
    alert('Saved to Library');
  };

  const handleHandoffTimeline = async () => {
    if (!output) return;
    await sendToTimeline(output);
    alert('Sent to Timeline');
  };

  return React.createElement('div', { className: 'h-full flex flex-col bg-[#0a0a0a] text-white' },
    React.createElement('div', { className: 'p-4 border-b border-white/10 flex justify-between' },
      React.createElement('h1', { className: 'text-xl font-bold' }, 'Remix Go'),
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('button', { onClick: handleNewProject, className: 'px-4 py-2 bg-white/10 rounded' }, 'New Project'),
        React.createElement('button', { onClick: handleImport, className: 'px-4 py-2 bg-white/10 rounded' }, 'Import Media')
      )
    ),
    React.createElement('div', { className: 'flex-1 flex' },
      React.createElement('div', { className: 'w-64 border-r border-white/10 p-4' },
        React.createElement('div', { className: 'text-sm mb-2' }, 'Media'),
        media.map((m, i) => React.createElement('div', { key: i, className: 'text-xs truncate' }, m))
      ),
      React.createElement('div', { className: 'flex-1 p-4' },
        React.createElement('div', { className: 'h-96 bg-black/50 flex items-center justify-center' },
          output ? React.createElement('video', { src: output.url, controls: true, className: 'max-h-full' }) : 'Canvas / Timeline'
        )
      )
    ),
    React.createElement('div', { className: 'p-4 border-t border-white/10 flex gap-2' },
      React.createElement('button', { onClick: handleGenerate, className: 'px-6 py-2 bg-primary rounded' }, 'Generate'),
      React.createElement('button', { onClick: handleSaveLibrary, className: 'px-4 py-2 bg-white/10 rounded' }, 'Save to Library'),
      React.createElement('button', { onClick: handleHandoffTimeline, className: 'px-4 py-2 bg-white/10 rounded' }, 'Send to Timeline'),
      React.createElement('div', { className: 'text-xs text-muted ml-auto' }, status)
    )
  );
}

export { appManifest } from './manifest';
export { routes as appRoutes } from './routes';