/**
 * Timeline Agent Integration
 * Main entry point connecting all agent services to the timeline editor
 */

import { initializeAgentSystem, getAgent, executeWorkflow, AGENT_WORKFLOWS } from './lib/agents/index.js';
import { multiTakeSystem } from './lib/clipVersioning.js';
import { createTimelineAgentHooks } from './lib/timelineAgentHooks.js';
import { createAgentPanel } from './components/agentPanel.js';
import { createTakeSelector } from './components/takeSelector.js';

export class TimelineAgentIntegration {
  constructor(timelineEditor, options = {}) {
    this.timelineEditor = timelineEditor;
    this.options = {
      theme: 'electric',
      autoEnableAgents: true,
      ...options
    };
    this.agentPanel = null;
    this.takeSelector = null;
    this.agentHooks = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    initializeAgentSystem();
    
    this.setupAgentPanel();
    this.setupTakeSelector();
    this.setupTimelineHooks();
    this.setupTimelineEditorIntegration();
    
    this.initialized = true;
  }

  setupAgentPanel() {
    const panelContainer = document.createElement('div');
    panelContainer.id = 'agent-panel-container';
    panelContainer.style.position = 'fixed';
    panelContainer.style.right = '20px';
    panelContainer.style.top = '120px';
    panelContainer.style.width = '280px';
    panelContainer.style.zIndex = '100';
    
    document.body.appendChild(panelContainer);
    
    this.agentPanel = createAgentPanel(panelContainer, {
      theme: this.options.theme,
      timelineState: this.getTimelineState(),
      selectedClips: this.getSelectedClips()
    });

    this.agentPanel.on('action', (data) => this.handleAgentAction(data));
    this.agentPanel.on('result', (data) => this.handleAgentResult(data));
    this.agentPanel.on('workflowComplete', (data) => this.handleWorkflowComplete(data));
  }

  setupTakeSelector() {
    const selectorContainer = document.createElement('div');
    selectorContainer.id = 'take-selector-container';
    selectorContainer.style.position = 'fixed';
    selectorContainer.style.right = '20px';
    selectorContainer.style.top = '400px';
    selectorContainer.style.width = '280px';
    selectorContainer.style.zIndex = '100';
    
    document.body.appendChild(selectorContainer);
    
    this.takeSelector = createTakeSelector(selectorContainer, {
      theme: this.options.theme,
      timelineState: this.getTimelineState(),
      onTakeSelected: (data) => this.onTakeSelected(data),
      onTakeCompare: (data) => this.onTakeCompare(data),
      onTakeDelete: (data) => this.onTakeDelete(data),
      onGenerateTakes: (data) => this.onGenerateTakes(data)
    });
  }

  setupTimelineHooks() {
    const timelineState = this.getTimelineState();
    this.agentHooks = createTimelineAgentHooks(timelineState);
    
    this.agentHooks.onTimelineEvent('agentSuggestion', (data) => {
      this.displayAgentSuggestion(data);
    });

    this.agentHooks.onTimelineEvent('directorAnalysisComplete', (result) => {
      this.displayDirectorAnalysis(result);
    });

    this.agentHooks.onTimelineEvent('characterAnalysisComplete', (result) => {
      this.displayCharacterAnalysis(result);
    });
  }

  setupTimelineEditorIntegration() {
    if (!this.timelineEditor) return;

    if (typeof this.timelineEditor.on === 'function') {
      this.timelineEditor.on('clipSelect', (clip) => {
        if (this.takeSelector) {
          this.takeSelector.setClip(clip.id);
        }
        if (this.agentHooks) {
          this.agentHooks.emitTimelineEvent('clipSelected', clip);
        }
      });

      this.timelineEditor.on('timelineChange', () => {
        this.syncAgentState();
      });
    }
  }

  getTimelineState() {
    if (!this.timelineEditor) return {};
    
    if (typeof this.timelineEditor.getState === 'function') {
      return this.timelineEditor.getState();
    }
    
    return {
      tracks: this.timelineEditor.tracks || [],
      duration: this.timelineEditor.duration || 0
    };
  }

  getSelectedClips() {
    if (!this.timelineEditor) return [];
    
    if (typeof this.timelineEditor.getSelectedClips === 'function') {
      return this.timelineEditor.getSelectedClips();
    }
    
    return this.timelineEditor.selectedClips || [];
  }

  syncAgentState() {
    if (this.agentPanel) {
      this.agentPanel.setTimelineState(this.getTimelineState());
      this.agentPanel.setSelectedClips(this.getSelectedClips());
    }
    
    if (this.takeSelector) {
      this.takeSelector.options.timelineState = this.getTimelineState();
    }
    
    if (this.agentHooks) {
      this.agentHooks.timelineState = this.getTimelineState();
    }
  }

  async handleAgentAction(data) {
    const { action } = data;

    switch (action) {
      case 'generate_takes':
        const selectedClips = this.getSelectedClips();
        if (selectedClips.length > 0) {
          this.takeSelector.setClip(selectedClips[0].id);
          this.takeSelector.showGenerateDialog();
        }
        break;

      case 'analyze_timeline':
        await this.runFullTimelineAnalysis();
        break;

      case 'track_characters':
        await this.runCharacterTracking();
        break;

      default:
        console.log('Unhandled agent action:', action);
    }
  }

  handleAgentResult(data) {
    console.log('Agent result:', data);
    
    this.displayAgentResult(data.agent, data.result);
  }

  handleWorkflowComplete(data) {
    console.log('Workflow complete:', data);
    
    if (data.results) {
      Object.entries(data.results).forEach(([key, result]) => {
        console.log(`${key}:`, result);
      });
    }
  }

  async runFullTimelineAnalysis() {
    try {
      const results = await executeWorkflow(AGENT_WORKFLOWS.ANALYZE_TIMELINE, {
        timelineState: this.getTimelineState(),
        selectedClips: this.getSelectedClips()
      });
      
      this.displayAnalysisResults(results);
    } catch (error) {
      console.error('Timeline analysis failed:', error);
    }
  }

  async runCharacterTracking() {
    try {
      const characterAgent = getAgent('CharacterExtractor');
      if (characterAgent) {
        await characterAgent.execute({
          timelineState: this.getTimelineState(),
          selectedClips: this.getSelectedClips()
        });
        
        if (characterAgent.result) {
          this.displayCharacterAnalysis(characterAgent.result);
        }
      }
    } catch (error) {
      console.error('Character tracking failed:', error);
    }
  }

  displayAgentSuggestion(suggestion) {
    if (!this.timelineEditor || !this.timelineEditor.showNotification) return;

    const message = `${suggestion.agent}: ${suggestion.type}`;
    const details = suggestion.data?.message || suggestion.data?.description || '';

    this.timelineEditor.showNotification({
      type: 'agent-suggestion',
      title: message,
      message: details,
      actions: this.getSuggestionActions(suggestion)
    });
  }

  getSuggestionActions(suggestion) {
    const actions = [];

    switch (suggestion.type) {
      case 'gap_fill':
        actions.push({
          label: 'Fill Gap',
          action: () => this.fillGap(suggestion.data)
        });
        actions.push({
          label: 'Dismiss',
          action: () => {}
        });
        break;
      case 'character_consistency':
        actions.push({
          label: 'Regenerate',
          action: () => this.regenerateCharacterTake(suggestion.data)
        });
        actions.push({
          label: 'Ignore',
          action: () => {}
        });
        break;
      default:
        actions.push({
          label: 'View Details',
          action: () => this.showSuggestionDetails(suggestion)
        });
    }

    return actions;
  }

  async fillGap(gapData) {
    const directorAgent = getAgent('Director');
    if (!directorAgent) return;

    if (this.takeSelector?.currentClipId) {
      await multiTakeSystem.generateTakesWithAgents(this.takeSelector.currentClipId, {
        count: 1,
        agentType: 'Director',
        mode: 'scene',
        timelineState: this.getTimelineState()
      });
    }
  }

  regenerateCharacterTake(issue) {
    console.log('Regenerate take for:', issue.characterName);
  }

  showSuggestionDetails(suggestion) {
    console.log('Suggestion details:', suggestion);
  }

  displayAgentResult(agentName, result) {
    console.log(`${agentName} result:`, result);
  }

  displayDirectorAnalysis(result) {
    console.log('Director analysis:', result);
  }

  displayCharacterAnalysis(result) {
    console.log('Character analysis:', result);
  }

  displayAnalysisResults(results) {
    console.log('Full analysis results:', results);
  }

  onTakeSelected(data) {
    console.log('Take selected:', data);
  }

  onTakeCompare(data) {
    console.log('Take comparison:', data);
    if (this.takeSelector) {
      this.takeSelector.showComparisonResult(data);
    }
  }

  onTakeDelete(data) {
    console.log('Take deleted:', data);
  }

  onGenerateTakes(data) {
    console.log('Takes generated:', data);
  }

  destroy() {
    if (this.agentHooks) {
      this.agentHooks.destroy();
    }
    
    if (this.agentPanel) {
      const container = document.getElementById('agent-panel-container');
      if (container) container.remove();
    }
    
    if (this.takeSelector) {
      const container = document.getElementById('take-selector-container');
      if (container) container.remove();
    }
    
    this.initialized = false;
  }
}

export function initTimelineAgentIntegration(timelineEditor, options) {
  const integration = new TimelineAgentIntegration(timelineEditor, options);
  integration.initialize();
  return integration;
}

export default {
  TimelineAgentIntegration,
  initTimelineAgentIntegration,
  agentSystem: initializeAgentSystem(),
  multiTakeSystem,
  workflows: AGENT_WORKFLOWS
};