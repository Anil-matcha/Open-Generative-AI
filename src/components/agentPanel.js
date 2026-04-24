/**
 * Agent Panel Component
 * Integrates ViMax agent capabilities into timeline editor UI
 * Provides context menu actions and agent control interfaces
 */

export class AgentPanel {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      theme: 'electric',
      position: 'right',
      ...options
    };
    this.agents = {};
    this.listeners = [];
    this.initialized = false;
  }

  async initialize(agentOrchestrator) {
    this.orchestrator = agentOrchestrator;
    this.setupAgentListeners();
    this.initialized = true;
    this.render();
  }

  setupAgentListeners() {
    this.orchestrator.on('stepStart', ({ step, agent }) => {
      this.updateStatus(`Running ${agent}: ${step}`);
    });

    this.orchestrator.on('stepComplete', ({ step, result }) => {
      this.updateStatus(`Completed: ${step}`);
    });

    this.orchestrator.on('agentStatus', ({ agent, status, progress }) => {
      this.updateAgentStatus(agent, status, progress);
    });
  }

  render() {
    const tooltips = {
      analyze_timeline: 'Run comprehensive analysis of timeline structure, gaps, and pacing',
      analyze_structure: 'Analyze timeline track organization and clip distribution',
      detect_gaps: 'Identify and analyze empty spaces between clips',
      generate_takes: 'Generate multiple AI variations of the selected clip',
      fill_gaps: 'Automatically fill detected gaps with suggested content',
      suggest_transitions: 'Get AI-powered transition recommendations between clips',
      track_characters: 'Track character consistency across all clips in timeline',
      check_consistency: 'Check visual consistency of characters throughout the video'
    };

    this.container.innerHTML = `
      <div class="agent-panel theme-${this.options.theme}">
        <div class="agent-panel-header">
          <h3>AI Agents</h3>
          <button class="agent-panel-toggle" aria-label="Toggle panel">
            <span class="toggle-icon">−</span>
          </button>
        </div>
        
        <div class="agent-panel-content">
          <div class="agent-section">
            <h4>Timeline Analysis</h4>
            <div class="agent-actions">
              <button class="agent-action-btn" data-action="analyze_timeline" title="${tooltips.analyze_timeline}">
                <span class="agent-icon">🔍</span>
                <span class="agent-label">Full Analysis</span>
              </button>
              <button class="agent-action-btn" data-action="analyze_structure" title="${tooltips.analyze_structure}">
                <span class="agent-icon">📊</span>
                <span class="agent-label">Structure</span>
              </button>
              <button class="agent-action-btn" data-action="detect_gaps" title="${tooltips.detect_gaps}">
                <span class="agent-icon">📏</span>
                <span class="agent-label">Gap Detection</span>
              </button>
            </div>
          </div>

          <div class="agent-section">
            <h4>Content Generation</h4>
            <div class="agent-actions">
              <button class="agent-action-btn" data-action="generate_takes" title="${tooltips.generate_takes}">
                <span class="agent-icon">🎬</span>
                <span class="agent-label">Generate Takes</span>
              </button>
              <button class="agent-action-btn" data-action="fill_gaps" title="${tooltips.fill_gaps}">
                <span class="agent-icon">✨</span>
                <span class="agent-label">Fill Gaps</span>
              </button>
              <button class="agent-action-btn" data-action="suggest_transitions" title="${tooltips.suggest_transitions}">
                <span class="agent-icon">🔗</span>
                <span class="agent-label">Transitions</span>
              </button>
            </div>
          </div>

          <div class="agent-section">
            <h4>Character Tracking</h4>
            <div class="agent-actions">
              <button class="agent-action-btn" data-action="track_characters" title="${tooltips.track_characters}">
                <span class="agent-icon">👤</span>
                <span class="agent-label">Track Characters</span>
              </button>
              <button class="agent-action-btn" data-action="check_consistency" title="${tooltips.check_consistency}">
                <span class="agent-icon">🎯</span>
                <span class="agent-label">Consistency</span>
              </button>
            </div>
          </div>

          <div class="agent-status">
            <div class="status-label">Status:</div>
            <div class="status-message">Ready</div>
          </div>

          <div class="agent-progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const toggleBtn = this.container.querySelector('.agent-panel-toggle');
    toggleBtn?.addEventListener('click', () => this.togglePanel());

    const actionBtns = this.container.querySelectorAll('.agent-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleAction(action);
      });
    });
  }

  togglePanel() {
    const content = this.container.querySelector('.agent-panel-content');
    const icon = this.container.querySelector('.toggle-icon');
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.textContent = '−';
    } else {
      content.style.display = 'none';
      icon.textContent = '+';
    }
  }

  handleAction(action) {
    this.emit('action', { action, timestamp: Date.now() });

    switch (action) {
      case 'analyze_timeline':
        this.runWorkflow('analyze_timeline');
        break;
      case 'analyze_structure':
        this.runAgent('Director');
        break;
      case 'detect_gaps':
        this.runAgent('Director');
        break;
      case 'generate_takes':
        this.emit('action', { action: 'generate_takes_dialog', timestamp: Date.now() });
        break;
      case 'fill_gaps':
        this.runAgent('Director');
        break;
      case 'suggest_transitions':
        this.runAgent('Director');
        break;
      case 'track_characters':
        this.runAgent('CharacterExtractor');
        break;
      case 'check_consistency':
        this.runAgent('CharacterExtractor');
        break;
    }
  }

  async runAgent(agentName) {
    const agent = this.orchestrator.get(agentName);
    if (!agent) return;

    this.showProgress();
    this.updateStatus(`Running ${agentName}...`);

    try {
      const context = this.getTimelineContext();
      await agent.execute(context);

      if (agent.result) {
        this.updateStatus('Complete!');
        this.emit('result', { agent: agentName, result: agent.result });
      } else if (agent.error) {
        this.updateStatus(`Error: ${agent.error}`);
        this.emit('error', { agent: agentName, error: agent.error });
      }
    } catch (error) {
      this.updateStatus(`Error: ${error.message}`);
    }

    this.hideProgress();
  }

  async runWorkflow(workflowName) {
    this.showProgress();
    this.updateStatus(`Running workflow: ${workflowName}`);

    try {
      const context = this.getTimelineContext();
      const results = await this.orchestrator.executeWorkflow(workflowName, context);
      
      this.updateStatus('Workflow complete!');
      this.emit('workflowComplete', { workflow: workflowName, results });
    } catch (error) {
      this.updateStatus(`Workflow error: ${error.message}`);
    }

    this.hideProgress();
  }

  getTimelineContext() {
    return {
      timelineState: this.options.timelineState || {},
      selectedClips: this.options.selectedClips || [],
      options: {
        includeNarrativeSuggestions: true
      }
    };
  }

  updateStatus(message) {
    const statusEl = this.container.querySelector('.status-message');
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  updateAgentStatus(agentName, status, progress) {
    if (status === 'running' && progress !== undefined) {
      this.showProgress();
      this.updateProgress(progress);
    }
  }

  showProgress() {
    const progressEl = this.container.querySelector('.agent-progress');
    if (progressEl) {
      progressEl.style.display = 'flex';
    }
  }

  hideProgress() {
    const progressEl = this.container.querySelector('.agent-progress');
    if (progressEl) {
      setTimeout(() => {
        progressEl.style.display = 'none';
      }, 1500);
    }
  }

  updateProgress(percent) {
    const fillEl = this.container.querySelector('.progress-fill');
    const textEl = this.container.querySelector('.progress-text');
    
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (textEl) textEl.textContent = `${Math.round(percent)}%`;
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
  }

  emit(event, data) {
    this.listeners.filter(l => l.event === event).forEach(l => l.callback(data));
  }

  setTimelineState(state) {
    this.options.timelineState = state;
  }

  setSelectedClips(clips) {
    this.options.selectedClips = clips;
  }
}

export function createAgentPanel(container, options) {
  return new AgentPanel(container, options);
}