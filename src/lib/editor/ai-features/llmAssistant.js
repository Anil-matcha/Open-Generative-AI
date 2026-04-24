import { muapi } from '../../muapi.js';

export const LLM_MODES = {
  ASK: 'ask',
  SEARCH: 'search',
  CUT: 'cut',
  TIMELINE: 'timeline'
};

export class LLMAssistant {
  constructor(timelineState) {
    this.timelineState = timelineState;
    this.currentMode = LLM_MODES.ASK;
    this.messages = [];
    this.container = null;
  }

  init(container) {
    this.container = container;
    this.renderPanel();
    return this;
  }

  renderPanel() {
    const panel = document.createElement('div');
    panel.className = 'llm-assistant';
    panel.innerHTML = `
      <div class="llm-header">
        <h3>AI Assistant</h3>
        <div class="llm-mode-selector">
          ${Object.entries(LLM_MODES).map(([key, value]) => `
            <button class="mode-btn ${value === this.currentMode ? 'active' : ''}" data-mode="${value}">
              ${this.getModeLabel(value)}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="llm-messages"></div>
      <div class="llm-input-area">
        <textarea placeholder="Ask about your project..."></textarea>
        <button class="send-btn">Send</button>
      </div>
    `;

    this.setupEventListeners(panel);
    this.container.appendChild(panel);
  }

  getModeLabel(mode) {
    const labels = {
      [LLM_MODES.ASK]: 'Ask',
      [LLM_MODES.SEARCH]: 'Search',
      [LLM_MODES.CUT]: 'Cut',
      [LLM_MODES.TIMELINE]: 'Timeline'
    };
    return labels[mode] || mode;
  }

  setupEventListeners(panel) {
    panel.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setMode(btn.dataset.mode));
    });

    const textarea = panel.querySelector('textarea');
    const sendBtn = panel.querySelector('.send-btn');

    sendBtn.addEventListener('click', () => this.sendMessage(textarea.value));
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(textarea.value);
      }
    });
  }

  setMode(mode) {
    this.currentMode = mode;
    const btns = this.container.querySelectorAll('.mode-btn');
    btns.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));

    const textarea = this.container.querySelector('textarea');
    textarea.placeholder = this.getModePlaceholder(mode);
  }

  getModePlaceholder(mode) {
    const placeholders = {
      [LLM_MODES.ASK]: 'Ask questions about your project...',
      [LLM_MODES.SEARCH]: 'Search for quotes, mentions, assets...',
      [LLM_MODES.CUT]: 'Propose transcript-driven selects and cuts...',
      [LLM_MODES.TIMELINE]: 'Reason about clip structure and pacing...'
    };
    return placeholders[mode] || 'Type a message...';
  }

  async sendMessage(content) {
    if (!content.trim()) return;

    this.addMessage('user', content);
    const textarea = this.container.querySelector('textarea');
    textarea.value = '';

    const loadingMsg = this.addMessage('assistant', 'Thinking...');

    try {
      const response = await this.getLLMResponse(content);
      this.updateMessage(loadingMsg.id, 'assistant', response);
    } catch (error) {
      this.updateMessage(loadingMsg.id, 'assistant', `Error: ${error.message}`);
    }
  }

  addMessage(role, content) {
    const messagesContainer = this.container.querySelector('.llm-messages');
    const msgEl = document.createElement('div');
    msgEl.className = `message message--${role}`;
    msgEl.innerHTML = `
      <div class="message__role">${role}</div>
      <div class="message__content">${this.formatContent(content)}</div>
    `;
    messagesContainer.appendChild(msgEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return { id: msgEl.dataset.id, role, content };
  }

  updateMessage(id, role, content) {
    const msgEls = this.container.querySelectorAll('.message');
    const msgEl = Array.from(msgEls).find(m => m.dataset.id === id);
    if (msgEl) {
      msgEl.querySelector('.message__content').innerHTML = this.formatContent(content);
    }
  }

  formatContent(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
  }

  async getLLMResponse(query) {
    const context = this.buildProjectContext();
    const systemPrompt = this.buildSystemPrompt();

    try {
      const response = await this.callOpenAI(query, context, systemPrompt);
      return response;
    } catch (error) {
      console.error('LLM call failed:', error);
      throw error;
    }
  }

  buildProjectContext() {
    const assets = this.timelineState.assets || [];
    const clips = this.timelineState.clips || [];
    const timeline = this.timelineState.timelines || [];

    return {
      projectName: this.timelineState.projectName || 'Untitled Project',
      assetCount: assets.length,
      clipCount: clips.length,
      timelineDuration: this.calculateTimelineDuration(),
      recentClips: clips.slice(-5).map(c => ({
        name: c.name || c.id,
        startTime: c.startTime,
        duration: c.duration
      })),
      assets: assets.slice(0, 20).map(a => ({
        id: a.id,
        name: a.name,
        type: a.type
      }))
    };
  }

  buildSystemPrompt() {
    const modePrompts = {
      [LLM_MODES.ASK]: 'You are a helpful AI assistant for video editing. Answer questions about the project, suggest improvements, and provide insights.',
      [LLM_MODES.SEARCH]: 'You are a search assistant. Find quotes, mentions, assets, and timeline moments matching the query. Provide clickable citations.',
      [LLM_MODES.CUT]: 'You are an editorial assistant. Propose transcript-driven selects and rough cuts. Preview them and help apply as a new timeline.',
      [LLM_MODES.TIMELINE]: 'You are a timeline expert. Reason about clip structure, trims, tracks, pacing, and suggest specific edits to the timeline.'
    };

    return `${modePrompts[this.currentMode]}

Context about the current project:
- Project has {assetCount} assets and {clipCount} clips
- Timeline duration: {timelineDuration}
- Recent clips: {recentClips}

When referencing timeline moments, use timestamps like [00:01:23].
When referencing assets, use format @asset-name.
Always be helpful and specific in your recommendations.`;
  }

  async callOpenAI(query, context, systemPrompt) {
    const formattedPrompt = systemPrompt
      .replace('{assetCount}', context.assetCount)
      .replace('{clipCount}', context.clipCount)
      .replace('{timelineDuration}', context.timelineDuration)
      .replace('{recentClips}', JSON.stringify(context.recentClips, null, 2));

    const response = await muapi.makeRequest('chat', {
      messages: [
        { role: 'system', content: formattedPrompt },
        { role: 'user', content: query }
      ],
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices?.[0]?.message?.content || 'No response received.';
  }

  calculateTimelineDuration() {
    const clips = this.timelineState.clips || [];
    if (clips.length === 0) return '0s';

    const maxEnd = Math.max(...clips.map(c => c.endTime || c.startTime + c.duration));
    return this.formatTime(maxEnd);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.messages = [];
  }
}

export function createLLMAssistant(timelineState, container) {
  return new LLMAssistant(timelineState).init(container);
}