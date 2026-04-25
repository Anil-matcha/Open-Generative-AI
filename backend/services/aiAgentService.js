import express from 'express';
const router = express.Router();

// Import production services
import { ErrorBoundary, defaultErrorHandlers } from '../src/lib/services/ErrorBoundary.js';
import { MonitoringService } from '../src/lib/services/MonitoringService.js';

class AIAgentService {
  constructor() {
    this.commands = {
      add_title: /add.*title/i,
      add_subtitle: /add.*subtitle/i,
      trim_video: /trim.*video|cut.*video/i,
      generate_clip: /generate.*clip|create.*clip/i,
      detect_scenes: /detect.*scene/i
    };

    // Initialize production services
    this.errorBoundary = new ErrorBoundary();
    this.monitoring = new MonitoringService();

    // Register error handlers
    Object.entries(defaultErrorHandlers).forEach(([type, handler]) => {
      this.errorBoundary.registerHandler(type, handler);
    });

    this.initialize();
  }

  async initialize() {
    try {
      this.monitoring.start();
      this.rateLimitStore = new Map(); // Simple in-memory rate limiting
      console.log('[AIAgentService] Initialized with production safeguards');
    } catch (error) {
      console.error('[AIAgentService] Initialization failed:', error);
    }
  }

  /**
   * Basic rate limiting (10 requests per minute per client)
   */
  checkRateLimit(clientId) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 10;

    if (!this.rateLimitStore.has(clientId)) {
      this.rateLimitStore.set(clientId, { requests: [], lastCleanup: now });
    }

    const clientData = this.rateLimitStore.get(clientId);

    // Cleanup old requests
    clientData.requests = clientData.requests.filter(timestamp => now - timestamp < windowMs);

    if (clientData.requests.length >= maxRequests) {
      return false;
    }

    clientData.requests.push(now);
    return true;
  }

  async processCommand(command) {
    return await this.errorBoundary.wrap(async () => {
      // Input validation
      if (!command || typeof command !== 'string' || command.trim().length === 0) {
        throw new Error('Invalid command: must be a non-empty string');
      }

      if (command.length > 1000) {
        throw new Error('Command too long: maximum 1000 characters');
      }

      // Rate limiting check (basic implementation)
      const clientId = 'default'; // In production, use actual client identification
      if (!this.checkRateLimit(clientId)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      const lowerCommand = command.toLowerCase();
      this.monitoring.record('api_call', {
        type: 'ai_agent_command',
        command_length: command.length,
        success: true
      });

      for (const [action, regex] of Object.entries(this.commands)) {
        if (regex.test(lowerCommand)) {
          return await this.executeAction(action, command);
        }
      }

      return await this.generalAIResponse(command);

    }, { command }, {
      retry: false, // Agent commands don't need retry
      onError: (error, context) => {
        this.monitoring.record('error', {
          type: 'ai_agent_processing',
          error: error.message,
          command: context.command?.substring(0, 100) // Log first 100 chars for debugging
        });
      }
    });
  }

  async executeAction(action, originalCommand) {
    switch (action) {
      case 'add_title':
        return {
          action: 'add_clip',
          type: 'text',
          name: 'Title',
          text: this.extractTitleText(originalCommand) || 'Generated Title',
          position: 10,
          duration: 5
        };

      case 'add_subtitle':
        return {
          action: 'add_clip',
          type: 'text',
          name: 'Subtitle',
          text: this.extractSubtitleText(originalCommand) || 'Generated Subtitle',
          position: 15,
          duration: 4
        };

      case 'trim_video':
        return {
          action: 'trim_clip',
          clipId: 'selected',
          trimAmount: 2
        };

      case 'generate_clip':
        return {
          action: 'generate_clip',
          type: 'video',
          prompt: this.extractPrompt(originalCommand),
          duration: 5
        };

      case 'detect_scenes':
        return {
          action: 'detect_scenes',
          threshold: 0.5
        };

      default:
        return { action: 'unknown', message: 'Command not recognized' };
    }
  }

  async generalAIResponse(command) {
    const responses = [
      "I understand you want to edit your video. Let me help with that.",
      "That's an interesting request. I'm analyzing your timeline...",
      "I can assist with video editing tasks. What would you like to do?",
      "Let me process that command for you."
    ];

    return {
      action: 'response',
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: ['add title', 'trim video', 'detect scenes']
    };
  }

  extractTitleText(command) {
    const matches = command.match(/(?:title|text)["']([^"']+)["']/i);
    return matches ? matches[1] : 'New Title';
  }

  extractSubtitleText(command) {
    const matches = command.match(/(?:subtitle|caption)["']([^"']+)["']/i);
    return matches ? matches[1] : 'New Subtitle';
  }

  extractPrompt(command) {
    const match = command.match(/(?:generate|create)\s+(?:a\s+)?(.+)/i);
    return match ? match[1].trim() : 'cinematic scene';
  }
}

const aiService = new AIAgentService();

router.post('/process', async (req, res) => {
  await aiService.errorBoundary.wrap(async () => {
    const { command } = req.body;

    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        error: 'Invalid command',
        message: 'Command must be a non-empty string'
      });
    }

    const result = await aiService.processCommand(command);

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });

  }, { endpoint: 'process', body: req.body }, {
    retry: false,
    onError: (error, context) => {
      console.error('AI Agent processing error:', error);
      res.status(500).json({
        error: 'Processing failed',
        message: error.message
      });
    }
  });
});

router.get('/commands', (req, res) => {
  res.json({
    commands: Object.keys(aiService.commands),
    examples: [
      'add a title "My Video Title"',
      'trim the video by 2 seconds',
      'generate a sunset clip',
      'detect scenes in the video'
    ]
  });
});

router.post('/workflow', async (req, res) => {
  try {
    const { command } = req.body;
    const result = await aiService.processCommand(command);

    const workflow = [
      { stage: 'planning', message: '🤖 Analyzing request...', delay: 800 },
      { stage: 'executing', message: '⚡ Executing changes...', delay: 600 },
      { stage: 'verifying', message: '👁️ Verifying results...', delay: 400 },
      { stage: 'complete', message: '✅ Task completed successfully!', delay: 0 }
    ];

    res.json({
      workflow,
      result,
      success: true
    });

  } catch (error) {
    res.status(500).json({
      error: 'Workflow failed',
      message: error.message
    });
  }
});

export default router;