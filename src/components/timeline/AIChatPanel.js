import { supabase } from '../../lib/hybrid-supabase.js';
import { showToast } from '../../lib/loading.js';
import { MuapiClient } from '../../lib/muapi.js';

export class AIChatPanel {
  constructor(container, timelineState, timelineActions) {
    this.container = container;
    this.state = timelineState;
    this.actions = timelineActions;
    this.muapi = new MuapiClient();
    this.conversationHistory = [];
    this.isProcessing = false;

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="card-title">💬 AI Assistant</div>
      <div class="chat-stack" id="chatStack"></div>
      <div class="chat-input-container">
        <input
          class="text-input"
          id="chatInput"
          placeholder="Type a command..."
          autocomplete="off"
        />
        <div class="quick-commands" id="quickCommands"></div>
      </div>
      <div class="processing-indicator" id="processingIndicator" style="display: none;">
        <div class="spinner"></div>
        <span>Processing...</span>
      </div>
    `;

    this.renderConversation();
    this.renderQuickCommands();
  }

  attachEventListeners() {
    const chatInput = this.container.querySelector('#chatInput');
    const quickCommands = this.container.querySelector('#quickCommands');

    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.isProcessing) {
        this.handleChatSubmit();
      }
    });

    // Voice input support
    this.initVoiceInput();
  }

  initVoiceInput() {
    // Check for speech recognition support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const chatInput = this.container.querySelector('#chatInput');
      chatInput.value = transcript;
      this.handleChatSubmit();
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      showToast('Voice input failed', 'error');
    };

    // Add voice button
    const inputContainer = this.container.querySelector('.chat-input-container');
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'mini-btn';
    voiceBtn.innerHTML = '🎤';
    voiceBtn.title = 'Voice input';
    voiceBtn.onclick = () => {
      this.recognition.start();
      showToast('Listening...', 'info');
    };
    inputContainer.appendChild(voiceBtn);
  }

  async handleChatSubmit() {
    const chatInput = this.container.querySelector('#chatInput');
    const text = chatInput.value.trim();

    if (!text || this.isProcessing) return;

    // Add user message to conversation
    this.addMessage('user', text);
    this.conversationHistory.push({ role: 'user', content: text });
    chatInput.value = '';

    // Show processing indicator
    this.setProcessing(true);

    try {
      // Use MuAPI /text for command understanding
      const commandAnalysis = await this.analyzeCommand(text);

      // Execute the command
      const result = await this.executeCommand(commandAnalysis);

      // Add AI response
      this.addMessage('ai', result.response);
      this.conversationHistory.push({ role: 'assistant', content: result.response });

    } catch (error) {
      console.error('Chat command error:', error);
      const errorMsg = this.getErrorMessage(error);
      this.addMessage('ai', errorMsg);
      this.conversationHistory.push({ role: 'assistant', content: errorMsg });
    } finally {
      this.setProcessing(false);
    }
  }

  async analyzeCommand(text) {
    try {
      const response = await this.muapi.generateText({
        prompt: `Analyze this video editing command and return a JSON object with the command type and parameters: "${text}"

Return format:
{
  "command": "command_type",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  },
  "confidence": 0.0-1.0
}

Supported commands:
- detect_scenes: Find scene boundaries in video
- split_clip: Split clip at current playhead position
- trim_clip: Trim selected clip start/end
- add_transition: Add transition between clips (fade, dissolve, wipe)
- add_text: Add text overlay to clip
- generate_subtitles: Generate subtitles using Whisper
- remove_filler_words: Clean filler words from audio
- add_b_roll: Find and add complementary footage
- speed_ramp: Change playback speed
- stabilize_video: Stabilize shaky video
- find_related_footage: Semantic search for related media

Example: "split the clip at the current time" -> {"command": "split_clip", "parameters": {}, "confidence": 0.95}`,
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
        max_tokens: 200
      });

      const analysis = JSON.parse(response.text || response.content || '{}');

      // Fallback parsing if JSON fails
      if (!analysis.command) {
        analysis.command = this.fallbackCommandDetection(text);
        analysis.parameters = {};
        analysis.confidence = 0.5;
      }

      return analysis;

    } catch (error) {
      console.warn('MuAPI analysis failed, using fallback:', error);
      return {
        command: this.fallbackCommandDetection(text),
        parameters: {},
        confidence: 0.3
      };
    }
  }

  fallbackCommandDetection(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('detect') && lowerText.includes('scene')) return 'detect_scenes';
    if (lowerText.includes('split') && lowerText.includes('clip')) return 'split_clip';
    if (lowerText.includes('trim') && lowerText.includes('clip')) return 'trim_clip';
    if (lowerText.includes('add') && lowerText.includes('fade')) return 'add_transition';
    if (lowerText.includes('add') && lowerText.includes('text')) return 'add_text';
    if (lowerText.includes('generate') && lowerText.includes('subtitle')) return 'generate_subtitles';
    if (lowerText.includes('remove') && lowerText.includes('filler')) return 'remove_filler_words';
    if (lowerText.includes('add') && lowerText.includes('roll')) return 'add_b_roll';
    if (lowerText.includes('speed')) return 'speed_ramp';
    if (lowerText.includes('stabilize')) return 'stabilize_video';
    if (lowerText.includes('find') && lowerText.includes('related')) return 'find_related_footage';

    return 'unknown';
  }

  async executeCommand(analysis) {
    const { command, parameters } = analysis;

    switch (command) {
      case 'detect_scenes':
        return await this.detectScenes(parameters);

      case 'split_clip':
        return await this.splitClip(parameters);

      case 'trim_clip':
        return await this.trimClip(parameters);

      case 'add_transition':
        return await this.addTransition(parameters);

      case 'add_text':
        return await this.addText(parameters);

      case 'generate_subtitles':
        return await this.generateSubtitles(parameters);

      case 'remove_filler_words':
        return await this.removeFillerWords(parameters);

      case 'add_b_roll':
        return await this.addBRoll(parameters);

      case 'speed_ramp':
        return await this.speedRamp(parameters);

      case 'stabilize_video':
        return await this.stabilizeVideo(parameters);

      case 'find_related_footage':
        return await this.findRelatedFootage(parameters);

      default:
        return {
          response: `I understood your command but don't know how to execute "${command}" yet. Try one of the supported commands.`,
          success: false
        };
    }
  }

  async detectScenes(params) {
    // Trigger scene detection
    if (this.actions.detectScenes) {
      await this.actions.detectScenes();
      return {
        response: 'Scene detection completed. Check the Scene Detection panel for results.',
        success: true
      };
    }

    return {
      response: 'Scene detection feature not available.',
      success: false
    };
  }

  async splitClip(params) {
    // Split clip at current playhead
    if (this.actions.splitClipAtPlayhead) {
      await this.actions.splitClipAtPlayhead();
      return {
        response: 'Clip split at current playhead position.',
        success: true
      };
    }

    return {
      response: 'Split clip feature not available.',
      success: false
    };
  }

  async trimClip(params) {
    // Trim selected clip
    if (this.actions.trimSelectedClip) {
      await this.actions.trimSelectedClip(params.start, params.end);
      return {
        response: 'Selected clip trimmed.',
        success: true
      };
    }

    return {
      response: 'Trim clip feature not available.',
      success: false
    };
  }

  async addTransition(params) {
    const transitionType = params.type || 'fade';

    if (this.actions.addTransition) {
      await this.actions.addTransition(transitionType, params.duration || 1.0);
      return {
        response: `${transitionType} transition added between clips.`,
        success: true
      };
    }

    return {
      response: 'Add transition feature not available.',
      success: false
    };
  }

  async addText(params) {
    const text = params.text || 'Sample Text';

    if (this.actions.addTextOverlay) {
      await this.actions.addTextOverlay(text, params.position);
      return {
        response: `Text overlay "${text}" added to clip.`,
        success: true
      };
    }

    return {
      response: 'Add text overlay feature not available.',
      success: false
    };
  }

  async generateSubtitles(params) {
    if (this.actions.generateSubtitles) {
      await this.actions.generateSubtitles();
      return {
        response: 'Subtitles generated successfully.',
        success: true
      };
    }

    return {
      response: 'Subtitle generation feature not available.',
      success: false
    };
  }

  async removeFillerWords(params) {
    if (this.actions.removeFillerWords) {
      await this.actions.removeFillerWords();
      return {
        response: 'Filler words removed from audio.',
        success: true
      };
    }

    return {
      response: 'Remove filler words feature not available.',
      success: false
    };
  }

  async addBRoll(params) {
    if (this.actions.addBRoll) {
      await this.actions.addBRoll(params.query);
      return {
        response: 'B-roll footage added to timeline.',
        success: true
      };
    }

    return {
      response: 'Add B-roll feature not available.',
      success: false
    };
  }

  async speedRamp(params) {
    const speed = params.speed || 1.5;

    if (this.actions.speedRamp) {
      await this.actions.speedRamp(speed);
      return {
        response: `Playback speed changed to ${speed}x.`,
        success: true
      };
    }

    return {
      response: 'Speed ramp feature not available.',
      success: false
    };
  }

  async stabilizeVideo(params) {
    if (this.actions.stabilizeVideo) {
      await this.actions.stabilizeVideo();
      return {
        response: 'Video stabilization applied.',
        success: true
      };
    }

    return {
      response: 'Video stabilization feature not available.',
      success: false
    };
  }

  async findRelatedFootage(params) {
    const query = params.query || 'related content';

    if (this.actions.findRelatedFootage) {
      const results = await this.actions.findRelatedFootage(query);
      return {
        response: `Found ${results.length} related footage items. Added to media library.`,
        success: true
      };
    }

    return {
      response: 'Find related footage feature not available.',
      success: false
    };
  }

  addMessage(role, text) {
    const chatStack = this.container.querySelector('#chatStack');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    chatStack.appendChild(bubble);
    chatStack.scrollTop = chatStack.scrollHeight;
  }

  renderConversation() {
    const chatStack = this.container.querySelector('#chatStack');
    chatStack.innerHTML = '';

    this.conversationHistory.forEach(message => {
      this.addMessage(message.role, message.content);
    });
  }

  renderQuickCommands() {
    const quickCommands = this.container.querySelector('#quickCommands');
    const commands = [
      'Detect Scenes',
      'Split Clip',
      'Trim Clip',
      'Add Fade',
      'Add Text',
      'Generate Subtitles'
    ];

    quickCommands.innerHTML = '';
    commands.forEach(command => {
      const button = document.createElement('button');
      button.className = 'command-btn';
      button.textContent = command;
      button.onclick = () => {
        const chatInput = this.container.querySelector('#chatInput');
        chatInput.value = command.toLowerCase();
        this.handleChatSubmit();
      };
      quickCommands.appendChild(button);
    });
  }

  setProcessing(isProcessing) {
    this.isProcessing = isProcessing;
    const indicator = this.container.querySelector('#processingIndicator');
    const chatInput = this.container.querySelector('#chatInput');

    if (isProcessing) {
      indicator.style.display = 'flex';
      chatInput.disabled = true;
    } else {
      indicator.style.display = 'none';
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  getErrorMessage(error) {
    if (error.message?.includes('API Key')) {
      return 'AI features require API configuration. Please check your settings.';
    }
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message?.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    return `Error: ${error.message || 'Unknown error occurred'}`;
  }

  // Public methods for external integration
  addQuickCommand(command) {
    const quickCommands = this.container.querySelector('#quickCommands');
    const button = document.createElement('button');
    button.className = 'command-btn';
    button.textContent = command;
    button.onclick = () => {
      const chatInput = this.container.querySelector('#chatInput');
      chatInput.value = command.toLowerCase();
      this.handleChatSubmit();
    };
    quickCommands.appendChild(button);
  }

  clearHistory() {
    this.conversationHistory = [];
    this.renderConversation();
  }
}