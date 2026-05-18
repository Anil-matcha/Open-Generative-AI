import { navigate } from '../lib/router.js';

const STORAGE_KEY = 'higgsfield.assistantConversations';
const HANDOFF_KEYS = {
  workflow: 'higgsfield.pendingWorkflowAssistantOutput',
  design: 'higgsfield.pendingDesignAssistantOutput',
  marketing: 'higgsfield.pendingMarketingAssistantOutput',
  agent: 'higgsfield.pendingAgentAssistantOutput',
  library: 'higgsfield.pendingLibraryAssistantOutput'
};

const ASSISTANT_MODES = [
  { id: 'general', name: 'General Studio Help', icon: '❓', description: 'Help using Higgsfield/VideoRemix' },
  { id: 'prompt', name: 'Prompt Help', icon: '📝', description: 'Optimize prompts for AI models' },
  { id: 'workflow', name: 'Workflow Help', icon: '🔗', description: 'Build AI workflows' },
  { id: 'agent', name: 'Agent Help', icon: '🤖', description: 'Configure AI agents' },
  { id: 'design', name: 'Design Help', icon: '✨', description: 'UI and brand design' },
  { id: 'marketing', name: 'Marketing Help', icon: '📈', description: 'Campaign and copywriting' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧', description: 'Fix issues' },
  { id: 'navigation', name: 'App Navigation', icon: '🧭', description: 'Find and use apps' },
  { id: 'planning', name: 'Project Planning', icon: '📋', description: 'Plan creative projects' },
];

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function safeWriteStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function simulateAssistantResponse(mode, message) {
  const responses = {
    'general': `I'm your Higgsfield assistant. I can help you navigate the studio, use AI tools, and manage your projects. What do you need help with?`,
    'prompt': `For better AI generation results, try: 1) Be specific about style and composition, 2) Include lighting and camera details, 3) Mention aspect ratio, 4) Add quality modifiers. Your prompt: "${message}"`,
    'workflow': `Workflows connect AI models in automated pipelines. You can chain steps like: Text Prompt → Image Generation → Upscale → Edit → Render. Would you like me to help you build one?`,
    'agent': `AI Agents are autonomous assistants. Configure their role, goals, tools, and system instructions. They can run continuously or execute specific tasks.`,
    'design': `For UI/UX design, focus on: layout hierarchy, color palette, typography, and user flow. I can help generate design briefs, wireframes, and component lists.`,
    'marketing': `Marketing campaigns need: offer angles, ad copy, email sequences, social posts, and video scripts. I can help craft high-converting content for any niche.`,
    'troubleshooting': `Common issues: 1) API key missing - check Settings, 2) Generation failing - try simpler prompts, 3) Slow performance - clear browser cache. Need specific help?`,
    'navigation': `Main apps: Studio (hub), Image/Video/Cinema Studios, Workflow Builder, AI Agent, Design Agent, Marketing Studio, and Apps Studio. Each has specific tools and presets.`,
    'planning': `For creative project planning: 1) Define goals and audience, 2) Choose tools (Image, Video, Cinema), 3) Plan workflow steps, 4) Set up agents, 5) Generate and iterate.`
  };
  return responses[mode] || `I'm here to help with your Higgsfield project. Ask me anything about the tools, workflows, or creative process.`;
}

export function AssistantApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg';

  let conversation = {
    id: 'conv_' + Date.now(),
    mode: 'general',
    projectContext: '',
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
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Assistant</p>
        <h1 class="text-lg font-bold text-white">AI Creative Assistant</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="save-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Save</button>
    </div>
  `;
  container.appendChild(header);

  const main = document.createElement('flex-1 flex flex-row overflow-hidden');
  main.className = 'flex-1 flex flex-row overflow-hidden';

  const configPanel = document.createElement('div');
  configPanel.className = 'w-64 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';
  configPanel.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Assistant Settings</p>
    <div class="space-y-4">
      <div>
        <label class="text-xs text-secondary mb-1 block">Mode</label>
        <select id="assistant-mode" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
          ${ASSISTANT_MODES.map(m => `<option value="${m.id}">${m.icon} ${m.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Project Context</label>
        <textarea id="project-context" placeholder="Describe your project..." class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white resize-none h-24"></textarea>
      </div>
      <p class="text-xs font-bold text-muted uppercase tracking-wider">Send Output To</p>
      <div class="space-y-1">
        ${['Workflow Builder', 'Design Agent', 'Marketing Studio', 'AI Agent', 'Library'].map(tool => `
          <button data-send="${tool.toLowerCase().replace(' ', '-')}" class="w-full text-left text-xs text-white/70 hover:text-white bg-white/5 border border-white/10 rounded px-2 py-1">${tool}</button>
        `).join('')}
      </div>
    </div>
  `;

  const chatPanel = document.createElement('flex-1 flex flex-col');
  chatPanel.className = 'flex-1 flex flex-col';

  const messagesContainer = document.createElement('div');
  messagesContainer.className = 'flex-1 flex flex-col p-4 overflow-y-auto';
  messagesContainer.innerHTML = `
    <div class="empty-state text-center py-10">
      <p class="text-secondary text-sm mb-2">Ask me anything about your Higgsfield project.</p>
      <p class="text-xs text-muted">I can help with tools, workflows, prompts, and creative direction.</p>
    </div>
  `;

  const inputArea = document.createElement('div');
  inputArea.className = 'p-4 border-t border-white/10 bg-black/20';
  inputArea.innerHTML = `
    <div class="flex gap-2">
      <input type="text" id="message-input" placeholder="Type your question..." class="flex-1 px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-muted focus:outline-none focus:border-primary/50">
      <button id="send-btn" class="px-4 py-2 text-sm font-bold text-black bg-primary border-none rounded-lg hover:bg-primary/80">Send</button>
    </div>
  `;

  chatPanel.appendChild(messagesContainer);
  chatPanel.appendChild(inputArea);

  main.appendChild(configPanel);
  main.appendChild(chatPanel);
  container.appendChild(main);

  document.getElementById('back-btn').onclick = () => window.history.back();
  document.getElementById('save-btn').onclick = saveConversation;
  document.getElementById('send-btn').onclick = sendMessage;

  document.getElementById('assistant-mode').onchange = updateMode;

  configPanel.addEventListener('click', (e) => {
    if (e.target.matches('[data-send]')) {
      const tool = e.target.dataset.send;
      sendOutputTo(tool);
    }
  });

  function updateMode() {
    conversation.mode = document.getElementById('assistant-mode').value;
  }

  function saveConversation() {
    conversation.projectContext = document.getElementById('project-context').value;
    conversation.mode = document.getElementById('assistant-mode').value;
    const saved = safeReadStorage(STORAGE_KEY, []);
    saved.push(conversation);
    safeWriteStorage(STORAGE_KEY, saved);
  }

  function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    if (!message) return;

    conversation.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    input.value = '';
    renderMessages();

    setTimeout(() => {
      const response = simulateAssistantResponse(conversation.mode, message);
      conversation.messages.push({ role: 'assistant', content: response, timestamp: new Date().toISOString() });
      renderMessages();
    }, 500);
  }

  function renderMessages() {
    messagesContainer.innerHTML = '';
    if (conversation.messages.length === 0) {
      messagesContainer.innerHTML = `
        <div class="empty-state text-center py-10">
          <p class="text-secondary text-sm mb-2">Ask me anything about your Higgsfield project.</p>
          <p class="text-xs text-muted">I can help with tools, workflows, prompts, and creative direction.</p>
        </div>
      `;
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'messages-content space-y-3';

    conversation.messages.forEach(msg => {
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

  function sendOutputTo(tool) {
    const lastMessage = conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1].content : '';
    safeWriteStorage(HANDOFF_KEYS[tool] || 'higgsfield.pendingOutput', JSON.stringify({ message: lastMessage, tool }));
    navigate(tool);
  }

  return container;
}
