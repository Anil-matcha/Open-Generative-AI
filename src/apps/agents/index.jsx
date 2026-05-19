import React, { useState } from 'react';
import { appManifest } from './manifest';
import * as agentService from './services/agentService';
import { sendToLibrary, sendToVideoAgent } from '../../lib/outputHandoff';

export default function AgentsApp() {
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const send = async () => {
    const reply = await agentService.sendAgentMessage(agent.id, input);
    setMessages([...messages, reply]);
    setInput('');
  };

  return React.createElement('div', { className: 'h-full flex flex-col bg-[#0a0a0a] text-white p-4' },
    React.createElement('h1', { className: 'text-xl mb-4' }, 'Agents'),
    React.createElement('div', { className: 'flex-1 overflow-auto mb-4 bg-black/30 p-3 text-sm' },
      messages.map((m, i) => React.createElement('div', { key: i }, m.content))
    ),
    React.createElement('div', { className: 'flex gap-2' },
      React.createElement('input', { value: input, onChange: e => setInput(e.target.value), className: 'flex-1 bg-white/5 px-3 py-2 rounded', placeholder: 'Ask agent...' }),
      React.createElement('button', { onClick: send, className: 'px-4 py-2 bg-primary rounded' }, 'Send'),
      React.createElement('button', { onClick: () => sendToVideoAgent({ agent }), className: 'px-4 py-2 bg-white/10 rounded' }, 'Handoff Video Agent')
    )
  );
}

export { appManifest } from './manifest';
export { routes as appRoutes } from './routes';