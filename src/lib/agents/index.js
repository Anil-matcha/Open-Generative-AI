/**
 * Agent System Index
 * Exports all ViMax-inspired agents for timeline editor integration
 */

export { BaseAgent, AgentOrchestrator, agentOrchestrator } from './baseAgent.js';
export { ScreenwriterAgent, screenwriterAgent } from './screenwriterAgent.js';
export { CharacterExtractorAgent, characterExtractorAgent } from './characterExtractorAgent.js';
export { DirectorAgent, directorAgent } from './directorAgent.js';
export { CameraOperatorAgent, cameraOperatorAgent } from './cameraOperatorAgent.js';
export { EditorAgent, editorAgent } from './editorAgent.js';

import { agentOrchestrator } from './baseAgent.js';
import { screenwriterAgent } from './screenwriterAgent.js';
import { characterExtractorAgent } from './characterExtractorAgent.js';
import { directorAgent } from './directorAgent.js';
import { cameraOperatorAgent } from './cameraOperatorAgent.js';
import { editorAgent } from './editorAgent.js';

agentOrchestrator.register('Screenwriter', screenwriterAgent);
agentOrchestrator.register('CharacterExtractor', characterExtractorAgent);
agentOrchestrator.register('Director', directorAgent);
agentOrchestrator.register('CameraOperator', cameraOperatorAgent);
agentOrchestrator.register('Editor', editorAgent);

agentOrchestrator.createWorkflow('analyze_timeline', [
  { name: 'Analyze Structure', agent: 'Director', contextKey: 'structureResult' },
  { name: 'Extract Characters', agent: 'CharacterExtractor', contextKey: 'characterResult' },
  { name: 'Generate Script', agent: 'Screenwriter', contextKey: 'scriptResult' }
]);

agentOrchestrator.createWorkflow('full_timeline_review', [
  { name: 'Structure Analysis', agent: 'Director', contextKey: 'structureResult' },
  { name: 'Character Tracking', agent: 'CharacterExtractor', contextKey: 'characterResult' },
  { name: 'Timeline Assembly', agent: 'Editor', contextKey: 'assemblyResult' }
]);

agentOrchestrator.createWorkflow('script_assistance', [
  { name: 'Content Analysis', agent: 'Screenwriter', contextKey: 'analysisResult' }
]);

agentOrchestrator.createWorkflow('camera_analysis', [
  { name: 'Clip Analysis', agent: 'CameraOperator', contextKey: 'clipAnalysis' },
  { name: 'Assembly Review', agent: 'Editor', contextKey: 'assemblyResult' }
]);

export const AGENT_WORKFLOWS = {
  ANALYZE_TIMELINE: 'analyze_timeline',
  FULL_TIMELINE_REVIEW: 'full_timeline_review',
  SCRIPT_ASSISTANCE: 'script_assistance',
  CAMERA_ANALYSIS: 'camera_analysis'
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