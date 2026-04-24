/**
 * Agent System Index
 * Exports all ViMax-inspired agents for timeline editor integration
 */

export { BaseAgent, AgentOrchestrator, agentOrchestrator } from './baseAgent.js';
export { ScreenwriterAgent, screenwriterAgent } from './screenwriterAgent.js';
export { CharacterExtractorAgent, characterExtractorAgent } from './characterExtractorAgent.js';
export { DirectorAgent, directorAgent } from './directorAgent.js';

import { agentOrchestrator } from './baseAgent.js';
import { screenwriterAgent } from './screenwriterAgent.js';
import { characterExtractorAgent } from './characterExtractorAgent.js';
import { directorAgent } from './directorAgent.js';

agentOrchestrator.register('Screenwriter', screenwriterAgent);
agentOrchestrator.register('CharacterExtractor', characterExtractorAgent);
agentOrchestrator.register('Director', directorAgent);

agentOrchestrator.createWorkflow('analyze_timeline', [
  { name: 'Analyze Structure', agent: 'Director', contextKey: 'structureResult' },
  { name: 'Extract Characters', agent: 'CharacterExtractor', contextKey: 'characterResult' },
  { name: 'Generate Script', agent: 'Screenwriter', contextKey: 'scriptResult' }
]);

agentOrchestrator.createWorkflow('full_timeline_review', [
  { name: 'Structure Analysis', agent: 'Director', contextKey: 'structureResult' },
  { name: 'Character Tracking', agent: 'CharacterExtractor', contextKey: 'characterResult' }
]);

agentOrchestrator.createWorkflow('script_assistance', [
  { name: 'Content Analysis', agent: 'Screenwriter', contextKey: 'analysisResult' }
]);

export const AGENT_WORKFLOWS = {
  ANALYZE_TIMELINE: 'analyze_timeline',
  FULL_TIMELINE_REVIEW: 'full_timeline_review',
  SCRIPT_ASSISTANCE: 'script_assistance'
};

export function initializeAgentSystem() {
  return agentOrchestrator;
}

export function getAgent(name) {
  return agentOrchestrator.get(name);
}

export function executeWorkflow(workflowName, context) {
  return agentOrchestrator.executeWorkflow(workflowName, context);
}