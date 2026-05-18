import { muapi } from '../lib/muapi.js';
import { navigate } from '../lib/router.js';

const STORAGE_KEY = 'higgsfield.agents';
const HANDOFF_KEYS = {
  workflow: 'higgsfield.pendingWorkflowAgentOutput',
  design: 'higgsfield.pendingDesignAgentOutput',
  marketing: 'higgsfield.pendingMarketingAgentOutput',
  director: 'higgsfield.pendingDirectorAgentOutput',
  library: 'higgsfield.pendingLibraryAgentOutput'
};

const AGENT_ROLES = [
  { id: 'creative-director', name: 'Creative Director Agent', icon: '🎨', description: 'Plan cinematic creative direction' },
  { id: 'prompt-engineer', name: 'Prompt Engineer Agent', icon: '📝', description: 'Optimize prompts for AI models' },
  { id: 'video-planning', name: 'Video Planning Agent', icon: '🎬', description: 'Plan video scenes and storyboards' },
  { id: 'storyboard', name: 'Storyboard Agent', icon: '📋', description: 'Create visual storyboards' },
  { id: 'marketing', name: 'Marketing Agent', icon: '📈', description: 'Generate marketing content' },
  { id: 'design', name: 'Design Agent', icon: '✨', description: 'Create UI designs and layouts' },
  { id: 'workflow', name: 'Workflow Agent', icon: '🔗', description: 'Build AI workflows' },
  { id: 'render', name: 'Render Assistant', icon: '📤', description: 'Optimize render settings' },
  { id: 'client-brief', name: 'Client Brief Agent', icon: '💼', description: 'Create client presentations' },
  { id: 'product-demo', name: 'Product Demo Agent', icon: '🎯', description: 'Generate product demos' },
];

const AVAILABLE_TOOLS = [
  { id: 'generate-image', name: 'Generate Image', icon: '🎨' },
  { id: 'generate-video', name: 'Generate Video', icon: '🎬' },
  { id: 'create-storyboard', name: 'Create Storyboard', icon: '📋' },
  { id: 'rewrite-prompt', name: 'Rewrite Prompt', icon: '📝' },
  { id: 'build-workflow', name: 'Build Workflow', icon: '🔗' },
  { id: 'landing-copy', name: 'Landing Page Copy', icon: '📄' },
  { id: 'analyze-brand', name: 'Analyze Brand', icon: '🔍' },
  { id: 'camera-movement', name: 'Suggest Camera Movement', icon: '🎥' },
  { id: 'suggest-effects', name: 'Suggest Effects', icon: '✨' },
  { id: 'send-render', name: 'Send to Render', icon: '📤' },
  { id: 'send-director', name: 'Send to Director', icon: '🎬' },
  { id: 'save-library', name: 'Save to Library', icon: '📚' },
];

const RESPONSE_STYLES = ['Concise', 'Detailed', 'Direct Response', 'Cinematic', 'Technical', 'Client Friendly', 'Marketing Focused'];

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function safeWriteStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function simulateAgentResponse(agent, message) {
  const responses = {
    'creative-director': `As your Creative Director, I suggest we approach this with a cinematic vision. Consider using a wide establishing shot followed by close-ups for emotional impact. The lighting should follow the rule of thirds with dramatic shadows. For the color grade, think ${agent.style || 'moody and cinematic'}.`,
    'prompt-engineer': `Let me optimize that prompt for better results. Try: "${message}" with additional details about style, lighting, composition, and aspect ratio. Adding quality modifiers like "8K, ultra-detailed, cinematic lighting" will help significantly.`,
    'video-planning': `For this video concept, I recommend a 3-act structure. Act 1: Establish the scene with a wide shot. Act 2: Build tension with mid-shots. Act 3: Resolve with a close-up. Consider camera movements: pan, tilt, dolly, or crane. Story points: ${agent.storyPoints || '3 key moments'}.`,
    'design': `For your design request, I suggest a modern minimalist approach with bold typography. Use a grid-based layout with consistent spacing. Color palette: ${agent.colorPalette || 'dark background with vibrant accent colors'}. Consider these components: ${agent.components ? agent.components.join(', ') : 'header, features, testimonial, CTA'}.`,
    'marketing': `Your marketing message should follow PAS (Problem-Agitate-Solution). First, highlight the pain point: "${message}". Then amplify the emotional impact. Finally, present your product as the solution. Tone: ${agent.responseStyle || 'Direct Response'}.`,
    'workflow': `I'll build a workflow for: "${message}". Suggested steps: 1) Text Prompt, 2) Image Generation, 3) Upscale, 4) Edit, 5) Render. Models to use: Flux for image, Seedance for video, ESRGAN for upscale.`,
    'render': `For optimal rendering: Resolution 1920x1080, Quality 95%, Codec H.264, FPS 30. Consider using the Render Studio for final export with these settings.`,
  };
  return responses[agent.role] || `I'm processing your request. This would connect to an LLM API in production. For now, I'm simulating a thoughtful response.`;
}

export function AIAgentApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden';

  let agent = {
    id: 'agent_' + Date.now(),
    name: 'Creative Director',
    role: 'creative-director',
    goal: '',
    instructions: 'You are a cinematic AI creative director helping plan and execute creative projects.',
    style: '',
    storyPoints: '',
    colorPalette: '',
    components: [],
    responseStyle: 'Detailed',
    tools: AVAILABLE_TOOLS.map(t => t.id),
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="back-btn" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
      </button>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">AI Agent</p>
        <h1 class="text-lg font-bold text-white">AI Agent Workspace</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="save-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Save Agent</button>
      <button id="export-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Export</button>
    </div>
  `;
  container.appendChild(header);

  const main = document.createElement('flex-1 flex flex-row overflow-hidden');
  main.className = 'flex-1 flex flex-row overflow-hidden';

  const configPanel = document.createElement('div');
  configPanel.className = 'w-80 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';
  configPanel.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Agent Configuration</p>
    <div class="space-y-4">
      <div>
        <label class="text-xs text-secondary mb-1 block">Agent Name</label>
        <input type="text" id="agent-name" value="${agent.name}" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Agent Role</label>
        <select id="agent-role" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
          ${AGENT_ROLES.map(r => `<option value="${r.id}" ${r.id === agent.role ? 'selected' : ''}>${r.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Goal</label>
        <textarea id="agent-goal" placeholder="Plan a cinematic product video..." class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white resize-none h-20">${agent.goal}</textarea>
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">System Instructions</label>
        <textarea id="agent-instructions" placeholder="You are a creative AI director..." class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white resize-none h-32">${agent.instructions}</textarea>
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Response Style</label>
        <select id="response-style" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
          ${RESPONSE_STYLES.map(s => `<option value="${s}" ${s === agent.responseStyle ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <p class="text-xs font-bold text-muted uppercase tracking-wider">Available Tools</p>
      <div id="tools-list" class="space-y-1 max-h-48 overflow-y-auto"></div>
    </div>
  `;

  const toolsList = configPanel.querySelector('#tools-list');
  AVAILABLE_TOOLS.forEach(tool => {
    const toolEl = document.createElement('label');
    toolEl.className = 'flex items-center gap-2 text-xs';
    toolEl.innerHTML = `<input type="checkbox" data-tool="${tool.id}" ${agent.tools.includes(tool.id) ? 'checked' : ''} class="rounded"><span>${tool.icon} ${tool.name}</span>`;
    toolsList.appendChild(toolEl);
  });

  const chatPanel = document.createElement('flex-1 flex flex-col');
  chatPanel.className = 'flex-1 flex flex-col';

  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'flex-1 flex flex-col p-4 overflow-y-auto';
  messagesContainer.innerHTML = `
    <div class="empty-state text-center py-10">
      <p class="text-secondary text-sm">Start a conversation with your AI agent.</p>
    </div>
  `;

  const inputArea = document.createElement('div');
  inputArea.className = 'p-4 border-t border-white/10 bg-black/20';
  inputArea.innerHTML = `
    <div class="flex gap-2">
      <input type="text" id="message-input" placeholder="Type your message..." class="flex-1 px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted focus:outline-none focus:border-primary/50">
      <button id="send-btn" class="px-4 py-2 text-sm font-bold text-black bg-primary border-none rounded-lg hover:bg-primary/80">Send</button>
    </div>
    <div class="flex gap-2 mt-2">
      <button id="send-workflow" class="flex-1 text-xs text-white bg-teal-500/10 border border-teal-500/20 rounded px-2 py-1">Send to Workflow</button>
      <button id="send-design" class="flex-1 text-xs text-white bg-pink-500/10 border border-pink-500/20 rounded px-2 py-1">Send to Design</button>
      <button id="send-marketing" class="flex-1 text-xs text-white bg-green-500/10 border border-green-500/20 rounded px-2 py-1">Send to Marketing</button>
    </div>
  `;

  chatPanel.appendChild(messagesContainer);
  chatPanel.appendChild(inputArea);

  main.appendChild(configPanel);
  main.appendChild(chatPanel);
  container.appendChild(main);

  // Event listeners
  document.getElementById('back-btn').onclick = () => window.history.back();
  document.getElementById('save-btn').onclick = saveAgent;
  document.getElementById('export-btn').onclick = exportAgent;
  document.getElementById('send-btn').onclick = sendMessage;
  document.getElementById('send-workflow').onclick = () => sendOutput('workflow');
  document.getElementById('send-design').onclick = () => sendOutput('design');
  document.getElementById('send-marketing').onclick = () => sendOutput('marketing');

  configPanel.addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      agent.tools = Array.from(configPanel.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.dataset.tool);
    }
  });

  function saveAgent() {
    agent.name = document.getElementById('agent-name').value;
    agent.role = document.getElementById('agent-role').value;
    agent.goal = document.getElementById('agent-goal').value;
    agent.instructions = document.getElementById('agent-instructions').value;
    agent.responseStyle = document.getElementById('response-style').value;
    agent.updatedAt = new Date().toISOString();
    
    const saved = safeReadStorage(STORAGE_KEY, []);
    saved.push(agent);
    safeWriteStorage(STORAGE_KEY, saved);
  }

  function exportAgent() {
    const data = JSON.stringify(agent, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name || 'agent'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    agent.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    input.value = '';
    renderMessages();

    setTimeout(() => {
      const response = simulateAgentResponse(agent, message);
      agent.messages.push({ role: 'assistant', content: response, timestamp: new Date().toISOString() });
      renderMessages();
    }, 500);
  }

  function renderMessages() {
    messagesContainer.innerHTML = '';
    if (agent.messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="empty-state text-center py-10">
          <p class="text-secondary text-sm">Start a conversation with your AI agent.</p>
        </div>
      `;
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'messages-content space-y-3';

    agent.messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse gap-2' : ''}`;
      msgEl.innerHTML = `
        <div class="w-8 h-8 rounded-full ${msg.role === 'user' ? 'bg-primary/20' : 'bg-white/10'} flex items-center justify-center text-xs">
          ${msg.role === 'user' ? '👤' : '🤖'}
        </div>
        <div class="rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-primary/10 border border-primary/20' : 'bg-white/5 border border-white/10'}">
          ${msg.content}
        </div>
      `;
      wrapper.appendChild(msgEl);
    });

    messagesContainer.appendChild(wrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function sendOutput(target) {
    const lastMessage = agent.messages.length > 0 ? agent.messages[agent.messages.length - 1].content : '';
    safeWriteStorage(HANDOFF_KEYS[target] || 'higgsfield.pendingOutput', JSON.stringify({ content: lastMessage, agent: agent.name }));
    navigate(target);
  }

  return container;
}
