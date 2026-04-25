import { aiService } from '../services/aiService.js';

/**
 * Base Agent Class
 * Foundation for all ViMax-inspired agents integrated into timeline editor
 */

export class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.status = 'idle';
    this.progress = 0;
    this.result = null;
    this.error = null;
    this.listeners = [];
    this.aiService = aiService;
    this.aiOptimizationsEnabled = false;
  }

  /**
   * Enable AI service optimizations for this agent
   */
  async enableAIOptimizations() {
    if (!this.aiOptimizationsEnabled) {
      await this.aiService.initialize();
      this.aiOptimizationsEnabled = true;
      console.log(`[${this.name}] AI optimizations enabled`);
    }
  }

  on(event, callback) {
    this.listeners.push({ event, callback });
    return () => {
      this.listeners = this.listeners.filter(l => l.event !== event || l.callback !== callback);
    };
  }

  emit(event, data) {
    this.listeners
      .filter(l => l.event === event)
      .forEach(l => l.callback(data));
  }

  setStatus(status, progress = null) {
    this.status = status;
    if (progress !== null) {
      this.progress = progress;
    }
    this.emit('statusChange', { agent: this.name, status, progress: this.progress });
  }

  setResult(result) {
    this.result = result;
    this.setStatus('completed', 100);
    this.emit('completed', { agent: this.name, result });
  }

  setError(error) {
    this.error = error;
    this.setStatus('failed');
    this.emit('error', { agent: this.name, error });
  }

  reset() {
    this.status = 'idle';
    this.progress = 0;
    this.result = null;
    this.error = null;
  }

  async execute(context) {
    this.reset();
    this.setStatus('running', 0);

    // Use AI service optimizations if enabled
    if (this.aiOptimizationsEnabled) {
      return await this.executeWithAIOptimizations(context);
    }

    // Continue with normal execution
    return await this.executeInternal(context);
  }

  /**
   * Execute with AI service optimizations
   */
  async executeWithAIOptimizations(context) {
    const aiRequest = {
      type: 'agent-execution',
      params: {
        agentName: this.name,
        context
      },
      priority: this.determineExecutionPriority(context),
      metadata: {
        agent: this.name,
        executionMode: context.mode || 'standard',
        source: 'baseAgent'
      }
    };

    try {
      const result = await this.aiService.generate(aiRequest);

      if (result.status === 'completed' && result.data) {
        this.setResult(result.data);
        return result.data;
      } else if (result.status === 'cached') {
        this.setResult(result.data);
        return result.data;
      } else {
        throw new Error(result.error || 'AI service execution failed');
      }
    } catch (error) {
      console.warn(`[${this.name}] AI service failed, falling back to direct execution:`, error.message);
      return await this.executeInternal(context);
    }
  }

  /**
   * Internal execution method (to be implemented by subclasses)
   */
  async executeInternal(context) {
    // Default implementation - should be overridden by subclasses
    throw new Error('executeInternal must be implemented by subclass');
  }

  /**
   * Determine execution priority based on context
   */
  determineExecutionPriority(context) {
    // High priority for time-sensitive operations
    if (context.urgent || context.priority === 'high') {
      return 'high';
    }

    // Medium priority for standard operations
    if (context.mode === 'analysis' || context.mode === 'suggestions') {
      return 'medium';
    }

    // Low priority for background tasks
    return 'low';
  }
}

export class AgentOrchestrator {
  constructor() {
    this.agents = new Map();
    this.workflows = new Map();
  }

  register(name, agent) {
    this.agents.set(name, agent);
  }

  get(name) {
    return this.agents.get(name);
  }

  async executeWorkflow(workflowName, context) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowName}`);
    }

    const results = {};
    for (const step of workflow.steps) {
      const agent = this.agents.get(step.agent);
      if (!agent) {
        throw new Error(`Agent not found: ${step.agent}`);
      }

      const stepContext = { ...context, ...results };
      this.emit('stepStart', { step: step.name, agent: step.agent });
      
      await agent.execute(stepContext);
      
      if (agent.error) {
        throw new Error(`Workflow failed at ${step.name}: ${agent.error}`);
      }
      
      results[step.name] = agent.result;
      this.emit('stepComplete', { step: step.name, result: agent.result });
    }

    return results;
  }

  createWorkflow(name, steps) {
    this.workflows.set(name, { name, steps });
  }

  emit(event, data) {
    this.listeners?.forEach(l => l(event, data));
  }

  on(event, callback) {
    if (!this.listeners) this.listeners = [];
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
}

export const agentOrchestrator = new AgentOrchestrator();