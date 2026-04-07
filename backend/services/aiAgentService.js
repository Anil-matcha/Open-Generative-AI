import express from 'express';
const router = express.Router();

class AIAgentService {
  constructor() {
    this.commands = {
      add_title: /add.*title/i,
      add_subtitle: /add.*subtitle/i,
      trim_video: /trim.*video|cut.*video/i,
      generate_clip: /generate.*clip|create.*clip/i,
      detect_scenes: /detect.*scene/i
    };
  }

  async processCommand(command) {
    const lowerCommand = command.toLowerCase();

    for (const [action, regex] of Object.entries(this.commands)) {
      if (regex.test(lowerCommand)) {
        return await this.executeAction(action, command);
      }
    }

    return await this.generalAIResponse(command);
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
  try {
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

  } catch (error) {
    console.error('AI Agent processing error:', error);
    res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
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