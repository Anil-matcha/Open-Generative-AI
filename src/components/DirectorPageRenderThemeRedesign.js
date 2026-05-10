import { directorRuntime } from '../lib/directorAgentRuntime.js';
import { supabase } from '../lib/hybrid-supabase.js';
import { VideoUpload } from './common/Upload.js';
import { showToast } from '../lib/loading.js';
import { escapeHtml } from '../lib/security.js';
import { navigate } from '../lib/router.js';

// Icon definitions (emoji/text based for vanilla JS)
const ICONS = {
  Bot: '🤖',
  Search: '🔍',
  Scissors: '✂️',
  Languages: '🌐',
  Captions: '💬',
  Sparkles: '✨',
  Clapperboard: '🎬',
  Images: '🖼️',
  Mic: '🎙️',
  Wand2: '🪄',
  Gauge: '📊',
  Layers3: '📚',
  SmilePlus: '😊',
  Music4: '🎵',
  Film: '🎥',
  Blocks: '🧱',
  Smartphone: '📱',
  Eye: '👁️',
  GalleryVerticalEnd: '🖼️',
  BookOpenText: '📖',
  Palette: '🎨',
  ScanSearch: '🔎',
  Send: '📤',
  Play: '▶️',
  Clock3: '🕒',
  FileVideo: '🎞️',
  MessageSquare: '💬',
};

// Constants from the React code
const leftAgents = [
  { id: 'summarizer', name: 'Video Summarizer', icon: 'BookOpenText', description: 'Summarize video content' },
  { id: 'search', name: 'Video Search', icon: 'Search', description: 'Search and index media library' },
  { id: 'clipper', name: 'Clip Creator', icon: 'Scissors', description: 'Extract and create clips' },
  { id: 'dubbing', name: 'Video Dubbing', icon: 'Languages', description: 'Translate and dub audio/video' },
  { id: 'subtitler', name: 'Subtitle Generator', icon: 'Captions', description: 'Add subtitles in any language' },
  { id: 'highlighter', name: 'Highlight Extractor', icon: 'Sparkles', description: 'Find key moments automatically' },
  { id: 'scenes', name: 'Scene Detector', icon: 'ScanSearch', description: 'Identify scene boundaries' },
  { id: 'broll', name: 'B-Roll Adder', icon: 'Images', description: 'Add overlay footage' },
  { id: 'voiceover', name: 'Voiceover', icon: 'Mic', description: 'Add AI voiceover' },
  { id: 'editor', name: 'Video Editor', icon: 'Wand2', description: 'Edit and enhance video' },
  { id: 'enhancer', name: 'Video Enhancer', icon: 'Gauge', description: 'Quality enhancement' },
  { id: 'compiler', name: 'Content Compiler', icon: 'Layers3', description: 'Compile multiple videos' },
  { id: 'meme', name: 'Meme Generator', icon: 'SmilePlus', description: 'Create meme videos' },
  { id: 'music', name: 'Music Video Maker', icon: 'Music4', description: 'Generate music videos' },
  { id: 'trailer', name: 'Trailer Creator', icon: 'Film', description: 'Make video trailers' },
  { id: 'compilation', name: 'Compilation Builder', icon: 'Blocks', description: 'Build compilations' },
  { id: 'social', name: 'Social Media Clip', icon: 'Smartphone', description: 'Create social media clips' },
  { id: 'preview', name: 'Preview Generator', icon: 'Eye', description: 'Generate video previews' },
  { id: 'montage', name: 'Montage Builder', icon: 'GalleryVerticalEnd', description: 'Create video montages' },
  { id: 'story', name: 'Story Builder', icon: 'BookOpenText', description: 'Build narratives from clips' },
  { id: 'color', name: 'Color Correction', icon: 'Palette', description: 'Adjust colors and tones' },
  { id: 'stabilize', name: 'Video Stabilize', icon: 'Clapperboard', description: 'Stabilize shaky footage' },
];

const quickActions = [
  ['Summarize', 'Generate video summary', 'BookOpenText'],
  ['Extract Highlights', 'Find best moments', 'Sparkles'],
  ['Detect Scenes', 'Identify boundaries', 'ScanSearch'],
  ['Add Subtitles', 'Auto-generate captions', 'Captions'],
  ['Dub Video', 'Translate audio', 'Languages'],
  ['Add B-Roll', 'Overlay footage', 'Images'],
  ['Voiceover', 'Add AI narration', 'Mic'],
  ['Create Shorts', 'TikTok/Reels/Shorts', 'Smartphone'],
  ['Color Correction', 'Adjust colors', 'Palette'],
  ['Stabilize', 'Fix shaky footage', 'Clapperboard'],
];

const timelineItems = [
  'Scene Detection',
  'Highlight Detection',
  'Clip Generation',
  'Subtitles',
  'Final Export',
];

const starterPrompts = [
  'Summarize this video',
  'Create a short clip of the best moment',
  'Add subtitles with cinematic styling',
  'Detect scenes and build highlights',
];

// Helper function to create icon elements (vanilla JS version)
const createIcon = (iconKey, className = 'h-4 w-4 text-white/80') => {
  const iconContainer = document.createElement('div');
  iconContainer.className = className;
  iconContainer.textContent = ICONS[iconKey] || '🔧'; // Use emoji from ICONS or fallback
  return iconContainer;
};

// Agent reply function from React code
function agentReply(input) {
  const text = input.toLowerCase();

  if (text.includes('short')) {
    return 'I can turn this into short-form clips by detecting the strongest moments, reframing vertically, and preparing social-ready cuts.';
  }
  if (text.includes('subtitle') || text.includes('caption')) {
    return 'I can generate subtitles, style them for cinematic delivery, and prepare either burned-in captions or export-ready caption tracks.';
  }
  if (text.includes('highlight') || text.includes('best moment')) {
    return 'I can extract highlights by ranking the strongest scenes, selecting the most engaging moments, and building a polished highlights sequence.';
  }
  if (text.includes('summarize') || text.includes('summary')) {
    return 'I can summarize the video into key beats, major talking points, and a concise scene-level overview for editing or repurposing.';
  }
  return 'I can help with summarizing, highlights, subtitles, dubbing, shorts, and scene-based editing workflows. Choose a card or send a command to continue.';
}

export function DirectorPageRenderThemeRedesign() {
  // Initialize state object (converted from React useState)
  const state = {
    selectedAgent: 'Video Summarizer',
    chatInput: '',
    messages: [
      {
        role: 'assistant',
        text: 'Hello! I\'m Director, your AI video assistant with 24+ specialized agents. Select an agent or send a command to get started.',
      },
    ],
    // Additional state for DirectorPage.js features
    videoUrl: '',
    videoId: '',
    isProcessing: false,
    processingStatus: null,
    activeAgents: new Set(),
    chatHistory: [],
    actionHistory: [],
    storyboardFrames: [],
    timelineData: null,
    // Storyboard state
    activeTab: 'agents', // 'agents' or 'storyboard'
    storyboardPreset: 'cinematic-story',
    selectedFrameId: 1,
  };

  // Container element
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-[#08090b] p-4 text-white';

  // Director runtime instance
  let directorRuntimeInstance = null;

  // Initialize director runtime
  const initializeDirectorRuntime = async () => {
    try {
      directorRuntimeInstance = new directorRuntime.constructor();
      directorRuntimeInstance.setStateChangeCallback(() => {
        // Update state from runtime
        updateState({
          storyboardFrames: directorRuntimeInstance.getFrames(),
          selectedFrameId: directorRuntimeInstance.getSelectedFrame()?.id || 1
        });
        render();
      });
      await directorRuntimeInstance.initialize();

      // Set initial preset
      directorRuntimeInstance.setPreset(state.storyboardPreset);

      // Initialize with default frames if none exist
      if (directorRuntimeInstance.getFrames().length === 0) {
        // Add default frames
        directorRuntimeInstance.addFrame();
        directorRuntimeInstance.addFrame();
        directorRuntimeInstance.addFrame();
      }

      updateState({
        storyboardFrames: directorRuntimeInstance.getFrames()
      });

    } catch (error) {
      console.error('[DirectorPageRenderThemeRedesign] Failed to initialize director runtime:', error);
    }
  };

  // State update function
  const updateState = (patch) => {
    Object.assign(state, patch);
    render();
  };

  // Get selected agent info
  const selectedAgentInfo = () => {
    return leftAgents.find((agent) => agent.name === state.selectedAgent) || leftAgents[0];
  };

  // Send message function
  const sendMessage = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    updateState({
      messages: [
        ...state.messages,
        { role: 'user', text: trimmed },
        { role: 'assistant', text: agentReply(trimmed) },
      ],
      chatInput: '',
    });
  };

  // Process command with real agent execution (from DirectorPage.js)
  const processCommand = async (command) => {
    if (!command.trim() || state.isProcessing) return;

    state.isProcessing = true;
    updateState({ isProcessing: true });

    addMessage(command, true);
    updateState({ chatInput: '' });

    try {
      // Map command to videoagent action
      const actionMapping = {
        'highlight': 'highlight-detection',
        'clip': 'clip-segmentation',
        'short': 'create-shorts',
        'scene': 'scene-detection',
        'auto-edit': 'auto-edit',
        'edit': 'auto-edit'
      };

      let action = 'auto-edit'; // default
      const cmd = command.toLowerCase();
      for (const [key, val] of Object.entries(actionMapping)) {
        if (cmd.includes(key)) {
          action = val;
          break;
        }
      }

      // Determine activated agents based on action
      const agentMapping = {
        'highlight-detection': ['Highlight Extractor'],
        'clip-segmentation': ['Clip Creator'],
        'create-shorts': ['Highlight Extractor', 'Clip Creator'],
        'scene-detection': ['Scene Detector'],
        'auto-edit': ['Video Editor', 'Reasoning Engine']
      };
      const activatedAgents = agentMapping[action] || ['Video Editor'];

      // Update active agents
      activatedAgents.forEach(a => state.activeAgents.add(a.toLowerCase().replace(/ /g, '_')));
      updateActiveAgents();

      // Update processing status
      updateState({
        processingStatus: {
          title: activatedAgents.join(', '),
          steps: ['Initializing...', 'Processing...', 'Finalizing...'],
          currentStep: 0
        }
      });

      // Call real videoagent API
      const { data, error } = await supabase.functions.invoke('videoagent', {
        body: {
          action,
          videoId: state.videoId || '',
          videoUrl: state.videoUrl || '',
          options: { command }
        }
      });

      if (error) {
        throw new Error(`Processing failed: ${error.message}`);
      }

      const jobId = data.jobId;

      // Simulate progress for now (in production, this would poll job status)
      for (let i = 1; i <= 3; i++) {
        await new Promise(r => setTimeout(r, 1000));
        updateState({
          processingStatus: {
            ...state.processingStatus,
            currentStep: i,
            progress: (i / 3) * 100
          }
        });
      }

      // Clear active agents after processing
      setTimeout(() => {
        state.activeAgents.clear();
        updateActiveAgents();
      }, 2000);

      // Add success message
      const successMessage = `Processing completed successfully! Your video has been processed with ${activatedAgents.join(', ')}.`;
      addMessage(successMessage, false, activatedAgents, true);

      // Add to action history
      addToHistory(command, activatedAgents);

      // Update timeline if available
      updateTimelinePreview();

    } catch (error) {
      console.error('Processing error:', error);

      // Show error status
      updateState({
        processingStatus: {
          title: 'Processing Failed',
          steps: [`Error: ${error.message}`],
          currentStep: 1,
          error: true
        }
      });

      // Add error message to chat
      addMessage(`Sorry, processing failed: ${error.message}`, false, [], false);

      // Hide error after 5 seconds
      setTimeout(() => {
        updateState({ processingStatus: null });
      }, 5000);
    }

    state.isProcessing = false;
    updateState({ isProcessing: false, processingStatus: null });
  };

  // Add message to chat
  const addMessage = (text, isUser = false, agents = [], isAction = false) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message flex gap-3';

    if (isUser) {
      msgDiv.innerHTML = `
        <div class="w-8 h-8 bg-primary rounded-full flex-shrink-0 flex items-center justify-center text-black text-xs font-bold">YOU</div>
        <div class="bg-primary/20 rounded-2xl rounded-tr-sm p-3 max-w-[85%]">
          <p class="text-sm text-white">${escapeHtml(text)}</p>
        </div>
      `;
    } else if (isAction) {
      msgDiv.innerHTML = `
        <div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">✓</div>
        <div class="bg-green-500/20 rounded-2xl rounded-tr-sm p-3 max-w-[85%]">
          <p class="text-sm text-white">${escapeHtml(text)}</p>
          ${agents.length > 0 ? `
            <div class="mt-2 pt-2 border-t border-white/10">
              <p class="text-xs text-secondary">Agents activated:</p>
              <div class="flex flex-wrap gap-1 mt-1">
                ${agents.map(a => `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">${a}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
        <div class="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
          <p class="text-sm text-white">${escapeHtml(text)}</p>
          ${agents.length > 0 ? `
            <div class="mt-2 pt-2 border-t border-white/10">
              <p class="text-xs text-secondary">Agents activated:</p>
              <div class="flex flex-wrap gap-1 mt-1">
                ${agents.map(a => `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">${a}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    const chatMessages = container.querySelector('#chat-messages');
    if (chatMessages) {
      chatMessages.appendChild(msgDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    state.chatHistory.push({ text, isUser, agents, isAction });
  };

  // Update active agents display
  const updateActiveAgents = () => {
    const activeEl = container.querySelector('#active-agents');

    if (!activeEl) return;

    if (state.activeAgents.size === 0) {
      activeEl.innerHTML = '<div class="text-xs text-secondary italic p-2">No agents running</div>';
      return;
    }

    activeEl.innerHTML = Array.from(state.activeAgents).map(agentId => {
      const agent = leftAgents.find(a => a.name.toLowerCase().replace(/ /g, '_') === agentId);
      const safeName = escapeHtml(agent?.name || agentId);
      const safeIcon = ICONS[agent?.icon] || '🤖';
      return `
        <div class="p-2 bg-white/5 rounded-lg flex items-center gap-2">
          <span class="text-lg">${safeIcon}</span>
          <span class="text-xs text-white flex-1">${safeName}</span>
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        </div>
      `;
    }).join('');
  };

  // Add to action history
  const addToHistory = (command, agents) => {
    const historyEl = container.querySelector('#action-history');
    if (!historyEl) return;

    if (historyEl.querySelector('.italic')) {
      historyEl.innerHTML = '';
    }

    const actionEl = document.createElement('div');
    actionEl.className = 'p-2 bg-white/5 rounded-lg text-xs text-white flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors';
    actionEl.innerHTML = `
      <span class="text-primary font-bold">✓</span>
      <span class="flex-1 truncate">${escapeHtml(command.slice(0, 25))}${command.length > 25 ? '...' : ''}</span>
      <span class="text-secondary ml-auto">${agents.slice(0, 2).join(', ')}</span>
    `;
    actionEl.onclick = () => {
      updateState({ chatInput: command });
      const inputEl = container.querySelector('#command-input');
      if (inputEl) {
        inputEl.value = command;
        inputEl.focus();
      }
    };
    historyEl.insertBefore(actionEl, historyEl.firstChild);

    // Keep only last 10 items
    while (historyEl.children.length > 10) {
      historyEl.removeChild(historyEl.lastChild);
    }

    state.actionHistory.unshift({ command, agents, timestamp: new Date() });
    if (state.actionHistory.length > 10) {
      state.actionHistory = state.actionHistory.slice(0, 10);
    }
  };

  // Update timeline preview with actual data
  const updateTimelinePreview = async () => {
    const timelineEl = container.querySelector('.timeline-preview');
    if (!timelineEl || !state.videoUrl) return;

    try {
      // Call videoagent to get timeline data
      const { data, error } = await supabase.functions.invoke('videoagent', {
        body: {
          action: 'scene-detection',
          videoUrl: state.videoUrl,
          options: { getTimeline: true }
        }
      });

      if (!error && data?.scenes) {
        // Render timeline with scene markers
        const duration = data.duration || 60;
        const scenes = data.scenes;

        timelineEl.innerHTML = `
          <div class="h-16 bg-black/30 rounded relative overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center text-xs text-secondary">
              ${scenes.length} scenes detected
            </div>
            ${scenes.map(scene => `
              <div class="absolute top-0 bottom-0 bg-primary/30 border-r border-primary/50"
                   style="left: ${(scene.start / duration) * 100}%; width: ${((scene.end - scene.start) / duration) * 100}%;"
                   title="Scene ${scene.id}: ${scene.start}s - ${scene.end}s">
              </div>
            `).join('')}
          </div>
          <div class="flex justify-between text-xs text-secondary mt-2">
            <span>0:00</span>
            <span>${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}</span>
          </div>
        `;

        updateState({ timelineData: { scenes, duration } });
      }
    } catch (error) {
      console.warn('[DirectorPageRenderThemeRedesign] Failed to update timeline:', error);
    }
  };

  // Storyboard frame management functions
  const addStoryboardFrame = () => {
    if (!directorRuntimeInstance) return;

    const newFrame = directorRuntimeInstance.addFrame();
    updateState({
      selectedFrameId: newFrame.id,
      storyboardFrames: directorRuntimeInstance.getFrames()
    });
    updateStoryboardFramesDisplay();
  };

  const generateStoryboardFrame = async (frameId) => {
    if (!directorRuntimeInstance) return;

    try {
      showToast('Generating storyboard frame...', 'info');
      await directorRuntimeInstance.generateFrame(frameId);
      updateState({ storyboardFrames: directorRuntimeInstance.getFrames() });
      updateStoryboardFramesDisplay();
      showToast('Storyboard frame generated successfully!', 'success');
    } catch (error) {
      console.error('Frame generation failed:', error);
      showToast(`Frame generation failed: ${error.message}`, 'error');
    }
  };

  const generateAllStoryboardFrames = async () => {
    if (!directorRuntimeInstance) return;

    try {
      showToast('Generating all storyboard frames...', 'info');
      await directorRuntimeInstance.generateAllFrames();
      updateState({ storyboardFrames: directorRuntimeInstance.getFrames() });
      updateStoryboardFramesDisplay();
      showToast('All storyboard frames generated successfully!', 'success');
    } catch (error) {
      console.error('Batch frame generation failed:', error);
      showToast(`Batch generation failed: ${error.message}`, 'error');
    }
  };

  const removeStoryboardFrame = (frameId) => {
    if (!directorRuntimeInstance) return;

    if (directorRuntimeInstance.removeFrame(frameId)) {
      const frames = directorRuntimeInstance.getFrames();
      let newSelectedId = state.selectedFrameId;
      if (newSelectedId === frameId && frames.length > 0) {
        newSelectedId = frames[0].id;
      }
      updateState({
        selectedFrameId: newSelectedId,
        storyboardFrames: frames
      });
      updateStoryboardFramesDisplay();
    }
  };

  const updateStoryboardFramesDisplay = (frameListElement = null) => {
    const frameList = frameListElement || container.querySelector('#storyboard-frames');
    if (!frameList || !directorRuntimeInstance) return;

    const frames = directorRuntimeInstance.getFrames();

    if (frames.length === 0) {
      frameList.innerHTML = '<div class="text-xs text-secondary italic p-2">No frames yet. Add a frame to start.</div>';
      return;
    }

    frameList.innerHTML = '';

    frames.forEach(frame => {
      const frameDiv = document.createElement('div');
      frameDiv.className = `bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors ${frame.id === state.selectedFrameId ? 'ring-2 ring-primary' : ''}`;
      frameDiv.onclick = () => updateState({ selectedFrameId: frame.id });

      const headerDiv = document.createElement('div');
      headerDiv.className = 'flex items-center justify-between mb-2';
      headerDiv.innerHTML = `<span class="text-xs font-bold text-primary">FRAME ${frame.id}</span>`;

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'flex gap-1';

      const generateBtn = document.createElement('button');
      generateBtn.className = `px-2 py-1 text-xs rounded transition-colors ${
        frame.generated
          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          : 'bg-primary/20 text-primary hover:bg-primary/30'
      }`;
      generateBtn.textContent = frame.generated ? '✓' : 'Generate';
      generateBtn.onclick = (e) => {
        e.stopPropagation();
        generateStoryboardFrame(frame.id);
      };
      buttonContainer.appendChild(generateBtn);

      // Video generation button
      if (frame.generated) {
        const videoBtn = document.createElement('button');
        videoBtn.className = `px-2 py-1 text-xs rounded transition-colors ${
          frame.videoUrl
            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
        }`;
        videoBtn.textContent = frame.videoUrl ? '🎬' : '▶️';
        videoBtn.title = frame.videoUrl ? 'Video generated' : 'Generate video clip';
        videoBtn.onclick = (e) => {
          e.stopPropagation();
          if (!frame.videoUrl) {
            generateFrameVideoClip(frame.id);
          }
        };
        buttonContainer.appendChild(videoBtn);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30';
      removeBtn.textContent = '×';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        removeStoryboardFrame(frame.id);
      };
      buttonContainer.appendChild(removeBtn);

      headerDiv.appendChild(buttonContainer);
      frameDiv.appendChild(headerDiv);

      const shotDiv = document.createElement('div');
      shotDiv.className = 'text-xs text-secondary mb-1';
      shotDiv.textContent = frame.shot;
      frameDiv.appendChild(shotDiv);

      const promptDiv = document.createElement('div');
      promptDiv.className = 'text-xs text-white leading-tight mb-2';
      promptDiv.textContent = frame.prompt || 'No prompt set';
      frameDiv.appendChild(promptDiv);

      const narrationDiv = document.createElement('div');
      narrationDiv.className = 'text-xs text-secondary';
      narrationDiv.textContent = frame.narration || 'No narration';
      frameDiv.appendChild(narrationDiv);

      frameList.appendChild(frameDiv);
    });
  };

  // Storyboard persistence functions
  const saveStoryboard = async () => {
    if (!directorRuntimeInstance) return;

    try {
      showToast('Saving storyboard...', 'info');
      const result = await directorRuntimeInstance.saveStoryboard('current-project');
      if (result.success) {
        showToast('Storyboard saved successfully!', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Save storyboard failed:', error);
      showToast(`Save failed: ${error.message}`, 'error');
    }
  };

  const loadStoryboard = async () => {
    if (!directorRuntimeInstance) return;

    try {
      showToast('Loading storyboard...', 'info');
      const result = await directorRuntimeInstance.loadStoryboard('current-project');
      if (result.success) {
        updateState({
          storyboardFrames: directorRuntimeInstance.getFrames(),
          selectedFrameId: directorRuntimeInstance.getSelectedFrame()?.id || 1
        });
        updateStoryboardFramesDisplay();
        showToast('Storyboard loaded successfully!', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Load storyboard failed:', error);
      showToast(`Load failed: ${error.message}`, 'error');
    }
  };

  // Export/import storyboard
  const exportStoryboard = () => {
    if (!directorRuntimeInstance) return;

    try {
      const storyboardData = directorRuntimeInstance.exportStoryboard();
      const blob = new Blob([storyboardData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `storyboard-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Storyboard exported successfully!', 'success');
    } catch (error) {
      console.error('Export storyboard failed:', error);
      showToast(`Export failed: ${error.message}`, 'error');
    }
  };

  const importStoryboard = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonString = event.target.result;
          if (directorRuntimeInstance && directorRuntimeInstance.importStoryboard(jsonString)) {
            updateState({
              storyboardFrames: directorRuntimeInstance.getFrames(),
              selectedFrameId: directorRuntimeInstance.getSelectedFrame()?.id || 1
            });
            updateStoryboardFramesDisplay();
            showToast('Storyboard imported successfully!', 'success');
          } else {
            throw new Error('Invalid storyboard file');
          }
        } catch (error) {
          console.error('Import storyboard failed:', error);
          showToast(`Import failed: ${error.message}`, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Video compilation functions
  const compileStoryboardToVideo = async () => {
    if (!directorRuntimeInstance) return;

    try {
      showToast('Starting storyboard compilation...', 'info');

      // Get compilation options from UI
      const transition = container.querySelector('#transition-select')?.value || 'fade';
      const duration = parseInt(container.querySelector('#duration-select')?.value || '3');
      const quality = container.querySelector('#quality-select')?.value || 'high';

      // Update processing status
      updateState({
        processingStatus: {
          title: 'Compiling Storyboard to Video',
          steps: ['Preparing frames...', 'Generating video clips...', 'Combining clips...', 'Finalizing video...'],
          currentStep: 0,
          progress: 0
        }
      });

      // Call compilation function
      const result = await directorRuntimeInstance.compileToVideo({
        transition,
        duration,
        quality,
        preset: state.storyboardPreset
      });

      if (result.success) {
        // Update progress through steps
        for (let i = 1; i <= 4; i++) {
          await new Promise(r => setTimeout(r, 1000));
          updateState({
            processingStatus: {
              ...state.processingStatus,
              currentStep: i,
              progress: (i / 4) * 100
            }
          });
        }

        showToast('Storyboard compiled successfully!', 'success');

        // Optionally download the compiled video
        if (result.url) {
          const a = document.createElement('a');
          a.href = result.url;
          a.download = `storyboard-compilation-${new Date().toISOString().split('T')[0]}.mp4`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      } else {
        throw new Error(result.error || 'Compilation failed');
      }

    } catch (error) {
      console.error('Storyboard compilation failed:', error);
      showToast(`Compilation failed: ${error.message}`, 'error');
    }

    // Clear processing status after delay
    setTimeout(() => {
      updateState({ processingStatus: null });
    }, 3000);
  };

  const generateFrameVideoClip = async (frameId) => {
    if (!directorRuntimeInstance) return;

    try {
      const duration = parseInt(container.querySelector('#duration-select')?.value || '3');
      showToast(`Generating video clip for frame ${frameId}...`, 'info');

      const result = await directorRuntimeInstance.frameToVideo(frameId, null, null, duration);

      if (result.success) {
        updateState({ storyboardFrames: directorRuntimeInstance.getFrames() });
        updateStoryboardFramesDisplay();
        showToast(`Frame ${frameId} video clip generated!`, 'success');
      } else {
        throw new Error(result.error || 'Frame video generation failed');
      }
    } catch (error) {
      console.error('Frame video generation failed:', error);
      showToast(`Frame video generation failed: ${error.message}`, 'error');
    }
  };

  const generateFullVideoFromFrames = async () => {
    if (!directorRuntimeInstance) return;

    try {
      showToast('Generating full video from all frames...', 'info');

      updateState({
        processingStatus: {
          title: 'Generating Full Video',
          steps: ['Preparing frames...', 'Converting to video...', 'Combining clips...', 'Processing complete...'],
          currentStep: 0,
          progress: 0
        }
      });

      const result = await directorRuntimeInstance.generateFullVideo();

      if (result.success) {
        // Update progress
        for (let i = 1; i <= 4; i++) {
          await new Promise(r => setTimeout(r, 1000));
          updateState({
            processingStatus: {
              ...state.processingStatus,
              currentStep: i,
              progress: (i / 4) * 100
            }
          });
        }

        updateState({ storyboardFrames: directorRuntimeInstance.getFrames() });
        updateStoryboardFramesDisplay();

        showToast(`Full video generated with ${result.clips?.length || 0} clips!`, 'success');

        if (result.clips && result.clips.length > 0) {
        }
      } else {
        throw new Error(result.error || 'Full video generation failed');
      }

    } catch (error) {
      console.error('Full video generation failed:', error);
      showToast(`Full video generation failed: ${error.message}`, 'error');
    }

    setTimeout(() => {
      updateState({ processingStatus: null });
    }, 3000);
  };

  // Render function (replaces React's virtual DOM)
  const render = () => {
    // Clear existing content
    container.innerHTML = '';

    // Main grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)_260px]';

    // Left sidebar (agents)
    const leftSidebar = createLeftSidebar();
    gridContainer.appendChild(leftSidebar);

    // Main content
    const mainContent = createMainContent();
    gridContainer.appendChild(mainContent);

    // Right sidebar (quick actions)
    const rightSidebar = createRightSidebar();
    gridContainer.appendChild(rightSidebar);

    container.appendChild(gridContainer);
  };

  // Create left sidebar component
  const createLeftSidebar = () => {
    const sidebar = document.createElement('div');
    sidebar.className = 'rounded-[28px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_55px_rgba(99,102,241,0.08)] backdrop-blur-xl';

    // Header
    const header = document.createElement('div');
    header.className = 'mb-4 flex items-center gap-3';
    header.innerHTML = `
      <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div>
        <div class="text-xl font-black tracking-tight">DIRECTOR</div>
        <div class="text-[11px] text-white/45">AI Agentic Editor · 24 Agents</div>
      </div>
    `;
    sidebar.appendChild(header);

    // Tab Navigation
    const tabNav = document.createElement('div');
    tabNav.className = 'flex border-b border-white/5 mb-4';

    const agentsTab = document.createElement('button');
    agentsTab.id = 'agents-tab';
    agentsTab.className = `flex-1 py-3 px-4 text-sm font-bold transition-colors ${
      state.activeTab === 'agents'
        ? 'text-white bg-primary/10 border-b-2 border-primary'
        : 'text-secondary hover:text-white'
    }`;
    agentsTab.textContent = 'AGENTS';
    agentsTab.onclick = () => {
      updateState({ activeTab: 'agents' });
    };
    tabNav.appendChild(agentsTab);

    const storyboardTab = document.createElement('button');
    storyboardTab.id = 'storyboard-tab';
    storyboardTab.className = `flex-1 py-3 px-4 text-sm font-bold transition-colors ${
      state.activeTab === 'storyboard'
        ? 'text-white bg-primary/10 border-b-2 border-primary'
        : 'text-secondary hover:text-white'
    }`;
    storyboardTab.textContent = 'STORYBOARD';
    storyboardTab.onclick = () => {
      updateState({ activeTab: 'storyboard' });
    };
    tabNav.appendChild(storyboardTab);

    sidebar.appendChild(tabNav);

    // Agents Tab Content
    const agentsPanel = document.createElement('div');
    agentsPanel.id = 'agents-panel';
    agentsPanel.className = `flex-1 overflow-auto ${state.activeTab === 'agents' ? '' : 'hidden'}`;

    const agentsContent = document.createElement('div');
    agentsContent.className = 'p-4';

    // AI Agents section
    const agentsSection = document.createElement('div');
    agentsSection.className = 'mb-3 flex items-center justify-between';
    agentsSection.innerHTML = `
      <div class="text-xs font-black tracking-[0.18em] text-white/70">AI AGENTS</div>
      <button class="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/55">
        All Categories
      </button>
    `;
    agentsContent.appendChild(agentsSection);

    // Agents grid
    const agentsGrid = document.createElement('div');
    agentsGrid.className = 'grid grid-cols-2 gap-2';

    leftAgents.forEach((agent, i) => {
      const agentButton = document.createElement('button');
      agentButton.className = 'agent-btn';
      agentButton.dataset.agent = agent.id;
      agentButton.onclick = () => updateState({ selectedAgent: agent.name });

      const active = state.selectedAgent === agent.name;

      agentButton.className += ` relative overflow-hidden rounded-2xl border p-2.5 text-left transition ${
        active
          ? 'border-emerald-400/28 bg-emerald-500/[0.10] shadow-[0_0_28px_rgba(16,185,129,0.16)]'
          : i < 6
            ? 'border-white/12 bg-white/[0.04]'
            : 'border-white/10 bg-white/[0.03]'
      }`;

      // Gradient background
      const gradientDiv = document.createElement('div');
      gradientDiv.className = `absolute inset-0 ${
        i % 6 === 0
          ? 'bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-indigo-500/10'
          : i % 6 === 1
            ? 'bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-indigo-500/10'
            : i % 6 === 2
              ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10'
            : i % 6 === 3
              ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10'
              : i % 6 === 4
                ? 'bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-fuchsia-500/10'
                : 'bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-blue-500/10'
      }`;
      agentButton.appendChild(gradientDiv);

      // Agent content
      const contentDiv = document.createElement('div');
      contentDiv.className = 'relative z-10';

      const iconContainer = document.createElement('div');
      iconContainer.className = 'mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/30';
      iconContainer.appendChild(createIcon(agent.icon));
      contentDiv.appendChild(iconContainer);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'text-[12px] font-bold leading-tight';
      nameDiv.textContent = agent.name;
      contentDiv.appendChild(nameDiv);

      const descDiv = document.createElement('div');
      descDiv.className = 'mt-1 truncate text-[10px] text-white/40';
      descDiv.textContent = 'AI workflow module';
      contentDiv.appendChild(descDiv);

      agentButton.appendChild(contentDiv);

      agentsGrid.appendChild(agentButton);
    });

    agentsContent.appendChild(agentsGrid);

    // Active agents section
    const activeAgentsSection = document.createElement('div');
    activeAgentsSection.className = 'mt-6';
    activeAgentsSection.innerHTML = `
      <h4 class="font-bold text-white text-sm mb-3 flex items-center gap-2">
        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        ACTIVE AGENTS
      </h4>
      <div id="active-agents" class="space-y-2 max-h-48 overflow-auto">
        <div class="text-xs text-secondary italic p-2">No agents running</div>
      </div>
    `;
    agentsContent.appendChild(activeAgentsSection);

    // Recent history section
    const historySection = document.createElement('div');
    historySection.className = 'mt-6';
    historySection.innerHTML = `
      <h4 class="font-bold text-white text-sm mb-3">RECENT ACTIONS</h4>
      <div id="action-history" class="space-y-2 max-h-40 overflow-auto">
        <div class="text-xs text-secondary italic p-2">No actions yet</div>
      </div>
    `;
    agentsContent.appendChild(historySection);

    agentsPanel.appendChild(agentsContent);
    sidebar.appendChild(agentsPanel);

    // Storyboard Tab Content
    const storyboardPanel = document.createElement('div');
    storyboardPanel.id = 'storyboard-panel';
    storyboardPanel.className = `flex-1 overflow-auto ${state.activeTab === 'storyboard' ? '' : 'hidden'}`;

    const storyboardContent = document.createElement('div');
    storyboardContent.className = 'p-4';

    // Storyboard Controls
    const storyboardControls = document.createElement('div');
    storyboardControls.className = 'mb-4';

    const controlsHeader = document.createElement('div');
    controlsHeader.className = 'flex items-center justify-between mb-3';
    controlsHeader.innerHTML = `
      <h3 class="font-bold text-white text-sm uppercase tracking-wider">STORYBOARD</h3>
      <select id="preset-selector" class="bg-white/5 text-xs text-secondary rounded px-2 py-1 border border-white/10">
        <option value="cinematic-story">Cinematic Story</option>
        <option value="commercial-ad">Commercial Ad</option>
        <option value="documentary-flow">Documentary Flow</option>
        <option value="social-shorts">Social Shorts</option>
      </select>
    `;
    storyboardControls.appendChild(controlsHeader);

    const controlsButtons = document.createElement('div');
    controlsButtons.className = 'flex gap-2 mb-3';

    const addFrameBtn = document.createElement('button');
    addFrameBtn.id = 'add-frame-btn';
    addFrameBtn.className = 'flex-1 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-lg transition-colors';
    addFrameBtn.innerHTML = '+ ADD FRAME';
    addFrameBtn.onclick = () => addStoryboardFrame();
    controlsButtons.appendChild(addFrameBtn);

    const generateAllBtn = document.createElement('button');
    generateAllBtn.id = 'generate-all-btn';
    generateAllBtn.className = 'flex-1 px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/80 transition-colors';
    generateAllBtn.innerHTML = 'GENERATE ALL';
    generateAllBtn.onclick = () => generateAllStoryboardFrames();
    controlsButtons.appendChild(generateAllBtn);

    const generateVideoBtn = document.createElement('button');
    generateVideoBtn.id = 'generate-video-btn';
    generateVideoBtn.className = 'flex-1 px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white text-xs font-bold rounded-lg hover:from-green-600 hover:to-teal-600 transition-colors';
    generateVideoBtn.innerHTML = '🎥 FULL VIDEO';
    generateVideoBtn.onclick = () => generateFullVideoFromFrames();
    controlsButtons.appendChild(generateVideoBtn);

    storyboardControls.appendChild(controlsButtons);

    // Persistence controls
    const persistenceButtons = document.createElement('div');
    persistenceButtons.className = 'flex gap-2 mb-3';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold rounded-lg transition-colors';
    saveBtn.innerHTML = '💾 SAVE';
    saveBtn.onclick = () => saveStoryboard();
    persistenceButtons.appendChild(saveBtn);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold rounded-lg transition-colors';
    loadBtn.innerHTML = '📁 LOAD';
    loadBtn.onclick = () => loadStoryboard();
    persistenceButtons.appendChild(loadBtn);

    const exportBtn = document.createElement('button');
    exportBtn.className = 'flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-bold rounded-lg transition-colors';
    exportBtn.innerHTML = '📤 EXPORT';
    exportBtn.onclick = () => exportStoryboard();
    persistenceButtons.appendChild(exportBtn);

    const importBtn = document.createElement('button');
    importBtn.className = 'flex-1 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-bold rounded-lg transition-colors';
    importBtn.innerHTML = '📥 IMPORT';
    importBtn.onclick = () => importStoryboard();
    persistenceButtons.appendChild(importBtn);

    storyboardControls.appendChild(persistenceButtons);
    storyboardContent.appendChild(storyboardControls);

    // Frame List
    const frameList = document.createElement('div');
    frameList.id = 'storyboard-frames';
    frameList.className = 'space-y-2 max-h-96 overflow-auto';

    // Initialize with default frames or empty state
    updateStoryboardFramesDisplay(frameList);

    storyboardContent.appendChild(frameList);
    storyboardPanel.appendChild(storyboardContent);
    sidebar.appendChild(storyboardPanel);

    return sidebar;
  };

  // Create main content component
  const createMainContent = () => {
    const main = document.createElement('div');
    main.className = 'bg-[#08090b]';

    // Header section with gradient background
    const headerSection = document.createElement('div');
    headerSection.className = 'relative mb-6 h-64 md:h-80 lg:h-96 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.55),0_0_80px_rgba(99,102,241,0.10)]';
    headerSection.style.background = 'linear-gradient(135deg, #17181b 0%, #0c0d10 45%, #1b2230 100%)';

    // Gradient overlays
    const gradient1 = document.createElement('div');
    gradient1.className = 'absolute inset-0';
    gradient1.style.background = 'radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(99,102,241,0.28), transparent 36%), radial-gradient(circle at 15% 25%, rgba(236,72,153,0.14), transparent 28%)';
    headerSection.appendChild(gradient1);

    const gradient2 = document.createElement('div');
    gradient2.className = 'absolute inset-0';
    gradient2.style.background = 'radial-gradient(circle at center, rgba(120,119,198,0.16), transparent 36%), radial-gradient(circle at 70% 55%, rgba(56,189,248,0.08), transparent 28%)';
    headerSection.appendChild(gradient2);

    // Header content
    const headerContent = document.createElement('div');
    headerContent.className = 'absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5';
    headerContent.innerHTML = `
      <div>
        <p class="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/45">AI FILM STUDIO</p>
        <h1 class="text-4xl font-black tracking-tight">Director</h1>
        <p class="mt-1 max-w-2xl text-sm text-white/60">
          Use the full AI agent workspace with the cinematic render-page visual language.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100">
          Clear Chat
        </button>
        <button class="rounded-2xl bg-lime-300 px-4 py-2 text-sm font-semibold text-black">
          Reasoning Engine
        </button>
      </div>
    `;
    headerSection.appendChild(headerContent);

    main.appendChild(headerSection);

    // Agent workspace section
    const workspaceSection = document.createElement('div');
    workspaceSection.className = 'rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_60px_rgba(99,102,241,0.08)] backdrop-blur-xl';

    // Status section
    const statusSection = document.createElement('div');
    statusSection.className = 'mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
    statusSection.innerHTML = `
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-[10px] uppercase tracking-[0.22em] text-white/40">Agent Workspace</p>
          <h3 class="mt-2 text-lg font-black">${selectedAgentInfo().name}</h3>
          <p class="mt-1 text-sm text-white/50">
            Load a video, then use any agent from the left or a quick action from the right.
          </p>
        </div>
        <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Processing preview updated
        </div>
      </div>
    `;
    workspaceSection.appendChild(statusSection);

    // Video preview area
    const videoPreview = document.createElement('div');
    videoPreview.className = 'relative flex min-h-[480px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black shadow-[0_0_120px_rgba(16,185,129,0.18),0_0_90px_rgba(99,102,241,0.14)]';

    // Gradient backgrounds for video area
    const videoGradient1 = document.createElement('div');
    videoGradient1.className = 'absolute inset-0';
    videoGradient1.style.background = 'radial-gradient(circle at center, rgba(255,255,255,0.10), transparent 38%), radial-gradient(circle at 50% 58%, rgba(16,185,129,0.20), transparent 34%)';
    videoPreview.appendChild(videoGradient1);

    const videoGradient2 = document.createElement('div');
    videoGradient2.className = 'absolute inset-0';
    videoGradient2.style.background = 'radial-gradient(circle at top, rgba(120,119,198,0.24), transparent 28%), radial-gradient(circle at 50% 78%, rgba(16,185,129,0.24), transparent 26%), radial-gradient(circle at bottom right, rgba(255,255,255,0.09), transparent 24%), radial-gradient(circle at 20% 80%, rgba(236,72,153,0.08), transparent 20%)';
    videoPreview.appendChild(videoGradient2);

    // Video content area
    const videoContent = document.createElement('div');
    videoContent.className = 'absolute left-4 top-4 rounded-full border border-emerald-400/18 bg-black/45 px-3 py-1 text-xs text-emerald-100/80 shadow-[0_0_24px_rgba(16,185,129,0.14)] backdrop-blur';
    videoContent.textContent = 'Director Workspace • Ready';
    videoPreview.appendChild(videoContent);

    if (state.videoUrl) {
      // Show video player when video is loaded
      const videoElement = document.createElement('video');
      videoElement.id = 'director-video';
      videoElement.className = 'max-w-full max-h-full';
      videoElement.controls = true;
      videoElement.src = escapeHtml(state.videoUrl);
      videoElement.innerHTML = 'Your browser does not support video playback.';
      videoPreview.appendChild(videoElement);

      // Add storyboard video controls if we have generated videos
      const storyboardVideos = directorRuntimeInstance?.getVideoClips() || [];
      if (storyboardVideos.length > 0) {
        const storyboardControls = document.createElement('div');
        storyboardControls.className = 'absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur rounded-lg p-3';
        storyboardControls.innerHTML = `
          <div class="flex items-center justify-between text-white text-sm">
            <span>Storyboard Generated Videos (${storyboardVideos.length} clips)</span>
            <div class="flex gap-2">
              <button id="play-storyboard" class="px-3 py-1 bg-primary text-black text-xs rounded">Play All</button>
              <button id="download-storyboard" class="px-3 py-1 bg-white/20 text-white text-xs rounded">Download</button>
            </div>
          </div>
        `;
        videoPreview.appendChild(storyboardControls);

        // Add event listeners for storyboard controls
        setTimeout(() => {
          const playBtn = container.querySelector('#play-storyboard');
          const downloadBtn = container.querySelector('#download-storyboard');

          if (playBtn) {
            playBtn.onclick = () => {
              // Implement storyboard playback
              showToast('Storyboard playback feature coming soon!', 'info');
            };
          }

          if (downloadBtn) {
            downloadBtn.onclick = () => {
              // Implement storyboard download
              showToast('Storyboard download feature coming soon!', 'info');
            };
          }
        }, 100);
      }
    } else {
      // Show upload placeholder when no video is loaded
      const videoCenter = document.createElement('div');
      videoCenter.className = 'relative z-10 text-center';
      videoCenter.innerHTML = `
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <div class="text-2xl font-black">No video loaded</div>
        <div class="mt-2 text-sm text-white/40">Upload a video to start directing</div>
      `;

      // Add upload component
      const uploadContainer = document.createElement('div');
      uploadContainer.id = 'upload-placeholder';
      uploadContainer.className = 'mt-4';

      const videoUpload = VideoUpload({
        placeholder: 'Upload a video to start directing',
        maxSize: 2000, // 2GB
        onUpload: (file) => {
          const url = URL.createObjectURL(file);
          updateState({
            videoUrl: url,
            videoId: '',
            videoMetadata: {
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString()
            }
          });
          showToast('Video uploaded successfully', 'success');
          updateTimelinePreview();
        },
        onError: (errors) => {
          errors.forEach(error => showToast(error, 'error'));
        }
      });
      uploadContainer.appendChild(videoUpload);
      videoCenter.appendChild(uploadContainer);

      videoPreview.appendChild(videoCenter);
    }

    workspaceSection.appendChild(videoPreview);

    // Chat and timeline section
    const chatTimelineGrid = document.createElement('div');
    chatTimelineGrid.className = 'mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]';

    // Chat section
    const chatSection = document.createElement('div');
    chatSection.className = 'rounded-2xl border border-white/10 bg-white/[0.03] p-3.5';
    chatSection.innerHTML = `
      <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        AI Chat
      </div>
    `;

    // Chat messages container
    const chatMessages = document.createElement('div');
    chatMessages.className = 'rounded-2xl border border-white/10 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]';
    chatMessages.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.028))';

    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'max-h-[260px] space-y-3 overflow-auto pr-1';

    state.messages.forEach(message => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `max-w-[88%] rounded-2xl border px-3 py-2 text-sm ${
        message.role === 'assistant'
          ? 'border-white/10 bg-white/[0.04] text-white/85'
          : 'ml-auto border-lime-400/20 bg-lime-400/10 text-lime-50'
      }`;
      messageDiv.textContent = message.text;
      messagesContainer.appendChild(messageDiv);
    });

    chatMessages.appendChild(messagesContainer);

    // Starter prompts
    const promptsGrid = document.createElement('div');
    promptsGrid.className = 'mt-3 grid grid-cols-2 gap-2';

    starterPrompts.forEach((prompt, i) => {
      const promptButton = document.createElement('button');
      promptButton.onclick = () => sendMessage(prompt);
      promptButton.className = `rounded-xl border px-3 py-2 text-left text-xs ${
        i === 0
          ? 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100'
          : i === 1
            ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'
            : i === 2
              ? 'border-amber-400/20 bg-amber-500/10 text-amber-100'
              : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
      }`;
      promptButton.textContent = prompt;
      promptsGrid.appendChild(promptButton);
    });

    chatMessages.appendChild(promptsGrid);

    // Chat input
    const chatInputContainer = document.createElement('div');
    chatInputContainer.className = 'mt-4 flex items-center gap-3';

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.id = 'command-input';
    chatInput.value = state.chatInput;
    chatInput.onchange = (e) => updateState({ chatInput: e.target.value });
    chatInput.onkeydown = (e) => {
      if (e.key === 'Enter') processCommand(state.chatInput);
    };
    chatInput.placeholder = 'Type your command (e.g. Create a short clip of the best moment)';
    chatInput.className = 'h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/35';
    chatInputContainer.appendChild(chatInput);

    const sendButton = document.createElement('button');
    sendButton.onclick = () => processCommand(state.chatInput);
    sendButton.className = 'flex h-12 items-center gap-2 rounded-2xl bg-lime-300 px-5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(190,242,100,0.18)]';
    sendButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
      Send
    `;
    chatInputContainer.appendChild(sendButton);

    chatMessages.appendChild(chatInputContainer);
    chatSection.appendChild(chatMessages);

    chatTimelineGrid.appendChild(chatSection);

    // Timeline section
    const timelineSection = document.createElement('div');
    timelineSection.className = 'rounded-2xl border border-white/10 bg-white/[0.03] p-4';
    timelineSection.innerHTML = `
      <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        Timeline Preview
      </div>
      <div class="mb-4 flex min-h-[120px] items-center justify-center rounded-2xl border border-white/10 bg-[#111118] p-4 text-sm text-white/35">
        No timeline data
      </div>
      <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        Active Workflow
      </div>
      <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div class="mb-4 flex items-center gap-3">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
          <div class="font-black">Ready for processing</div>
        </div>
        <div class="space-y-2 text-sm">
          ${timelineItems.map((step, i) => `
            <div class="flex items-center gap-3 text-white/60">
              <div class="h-2.5 w-2.5 rounded-full ${i < 2 ? 'bg-emerald-400' : i === 2 ? 'animate-pulse bg-indigo-400' : 'bg-white/20'}"></div>
              <span class="${i < 2 ? 'font-semibold text-emerald-200' : i === 2 ? 'font-semibold text-indigo-300' : ''}">${step}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    chatTimelineGrid.appendChild(timelineSection);
    workspaceSection.appendChild(chatTimelineGrid);

    main.appendChild(workspaceSection);

    return main;
  };

  // Create right sidebar component
  const createRightSidebar = () => {
    const sidebar = document.createElement('div');
    sidebar.className = 'rounded-[28px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_55px_rgba(99,102,241,0.08)] backdrop-blur-xl';

    // Processing Status (if active)
    if (state.processingStatus) {
      const processingSection = document.createElement('div');
      processingSection.id = 'processing-status';
      processingSection.className = 'mb-6';
      processingSection.innerHTML = `
        <h4 class="font-bold text-white text-sm mb-3 flex items-center gap-2">
          <div class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
          PROCESSING
        </h4>
        <div class="bg-white/5 rounded-xl p-3">
          <div class="mb-3">
            <span id="processing-title" class="text-sm text-white font-bold">${state.processingStatus.title}</span>
          </div>
          <div id="processing-steps" class="space-y-1 text-xs">
            ${state.processingStatus.steps.map((step, idx) => `
              <div class="flex items-center gap-2 ${idx < state.processingStatus.currentStep ? 'text-white' : idx === state.processingStatus.currentStep ? 'text-primary' : 'text-secondary'}">
                <span class="w-1.5 h-1.5 rounded-full ${idx < state.processingStatus.currentStep ? 'bg-primary' : idx === state.processingStatus.currentStep ? 'bg-primary animate-pulse' : 'bg-secondary'}"></span>
                ${step}
              </div>
            `).join('')}
          </div>
          <div class="mt-3 pt-3 border-t border-white/10">
            <div class="flex items-center justify-between text-xs">
              <span class="text-secondary">Progress</span>
              <span id="progress-percent" class="text-primary font-bold">${Math.round(state.processingStatus.progress || 0)}%</span>
            </div>
            <div class="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div id="progress-bar" class="h-full bg-primary transition-all duration-300" style="width: ${state.processingStatus.progress || 0}%"></div>
            </div>
          </div>
        </div>
      `;
      sidebar.appendChild(processingSection);
    }

    // Quick Actions section
    const quickActionsContainer = document.createElement('div');
    quickActionsContainer.className = 'rounded-[28px] border border-white/10 bg-white/[0.02] p-4 h-full';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-black tracking-tight';
    title.textContent = 'QUICK ACTIONS';
    quickActionsContainer.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'mb-4 mt-1 text-sm text-white/50';
    subtitle.textContent = 'Choose how to proceed with your video';
    quickActionsContainer.appendChild(subtitle);

    // Quick actions list
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'mb-5 space-y-2';

    quickActions.forEach(([title, desc, iconKey], i) => {
      const action = title.toLowerCase().replace(/ /g, '');
      const actionButton = document.createElement('button');
      actionButton.className = `action-btn w-full rounded-2xl border p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition-all ${
        i === 0
          ? 'border-emerald-400/28 bg-emerald-500/12 text-white shadow-[0_0_28px_rgba(16,185,129,0.18)]'
          : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
      }`;
      actionButton.dataset.action = action;

      const flexContainer = document.createElement('div');
      flexContainer.className = 'flex items-start gap-3';

      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/25';
      iconWrapper.appendChild(createIcon(Icon));
      flexContainer.appendChild(iconWrapper);

      const textContainer = document.createElement('div');
      const titleDiv = document.createElement('div');
      titleDiv.className = 'text-sm font-black';
      titleDiv.textContent = title;
      textContainer.appendChild(titleDiv);

      const descDiv = document.createElement('div');
      descDiv.className = 'mt-1 text-[11px] text-white/50';
      descDiv.textContent = desc;
      textContainer.appendChild(descDiv);

      flexContainer.appendChild(textContainer);
      actionButton.appendChild(flexContainer);

      actionsContainer.appendChild(actionButton);
    });

    quickActionsContainer.appendChild(actionsContainer);

    // Timeline preview section
    const timelinePreviewSection = document.createElement('div');
    timelinePreviewSection.className = 'mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
    timelinePreviewSection.innerHTML = `
      <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        Timeline Preview
      </div>
      <div class="rounded-2xl border border-white/10 bg-[#111118] p-5 text-center text-sm text-white/35">
        No timeline data
      </div>
    `;
    quickActionsContainer.appendChild(timelinePreviewSection);

    // Compilation section
    const compilationSection = document.createElement('div');
    compilationSection.className = 'rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-4';
    compilationSection.innerHTML = `
      <div class="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
        Video Compilation
      </div>
      <div class="mb-3 flex gap-2">
        <button id="compile-storyboard-btn" class="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all">
          🎬 COMPILE STORYBOARD
        </button>
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-secondary">Transition</span>
          <select id="transition-select" class="bg-white/5 text-secondary rounded px-2 py-1 text-xs border border-white/10">
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="wipe">Wipe</option>
            <option value="none">None</option>
          </select>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-secondary">Duration per frame</span>
          <select id="duration-select" class="bg-white/5 text-secondary rounded px-2 py-1 text-xs border border-white/10">
            <option value="2">2 seconds</option>
            <option value="3">3 seconds</option>
            <option value="4">4 seconds</option>
            <option value="5">5 seconds</option>
          </select>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="text-secondary">Quality</span>
          <select id="quality-select" class="bg-white/5 text-secondary rounded px-2 py-1 text-xs border border-white/10">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
    `;
    quickActionsContainer.appendChild(compilationSection);

    // Export section
    const exportSection = document.createElement('div');
    exportSection.className = 'rounded-2xl border border-white/10 bg-white/[0.03] p-4';
    exportSection.innerHTML = `
      <div class="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 14l-3-3h-7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h9z"/>
          <path d="M14 15v2a2 2 0 0 0 2 2h4"/>
          <path d="M3 3v16a2 2 0 0 0 2 2h4"/>
        </svg>
        Export
      </div>
      <div class="mb-4 flex gap-2">
        <button class="export-btn flex-1 rounded-xl px-4 py-2 bg-white text-black text-xs font-semibold" data-format="mp4">MP4</button>
        <button class="export-btn flex-1 rounded-xl px-4 py-2 border border-white/10 bg-white/[0.04] text-white/70 text-xs font-semibold" data-format="webm">WebM</button>
        <button class="export-btn flex-1 rounded-xl px-4 py-2 border border-white/10 bg-white/[0.04] text-white/70 text-xs font-semibold" data-format="gif">GIF</button>
      </div>
      <div>
        <label class="mb-2 block text-sm text-white/50">Frame Rate</label>
        <div class="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-200">
          24 FPS Cinematic
        </div>
      </div>
    `;
    quickActionsContainer.appendChild(exportSection);

    sidebar.appendChild(quickActionsContainer);

    return sidebar;
  };

  // Add event handlers after render
  const addEventHandlers = () => {
    // Preset selector
    const presetSelector = container.querySelector('#preset-selector');
    if (presetSelector) {
      presetSelector.value = state.storyboardPreset;
      presetSelector.onchange = (e) => {
        const newPreset = e.target.value;
        updateState({ storyboardPreset: newPreset });
        if (directorRuntimeInstance) {
          directorRuntimeInstance.setPreset(newPreset);
        }
      };
    }

    // Agent buttons
    container.querySelectorAll('.agent-btn').forEach(btn => {
      btn.onclick = () => {
        const agentId = btn.dataset.agent;
        const agent = leftAgents.find(a => a.id === agentId);
        if (agent) {
          processCommand(`Use ${agent.name} to ${agent.description.toLowerCase()}`);
        }
      };
    });

    // Quick action buttons
    container.querySelectorAll('.action-btn').forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        const actionTexts = {
          summarize: 'Summarize this video',
          highlights: 'Extract the best highlights from this video',
          scenes: 'Detect all scenes in this video',
          subtitles: 'Add subtitles to this video',
          dubbing: 'Dub this video to Spanish',
          broll: 'Add relevant B-roll footage',
          voiceover: 'Add voiceover narration',
          shorts: 'Create short clips for social media',
          color: 'Apply color correction to this video',
          stabilize: 'Stabilize this video'
        };
        processCommand(actionTexts[action]);
      };
    });

    // Compilation button
    const compileBtn = container.querySelector('#compile-storyboard-btn');
    if (compileBtn) {
      compileBtn.onclick = () => compileStoryboardToVideo();
    }

    // Export buttons with enhanced progress tracking
    container.querySelectorAll('.export-btn').forEach(btn => {
      btn.onclick = async () => {
        const format = btn.dataset.format;
        try {
          showToast(`Starting export as ${format.toUpperCase()}...`, 'info');

          // Update processing status
          updateState({
            processingStatus: {
              title: `Exporting as ${format.toUpperCase()}`,
              steps: ['Preparing export...', 'Processing video...', 'Generating file...', 'Export complete...'],
              currentStep: 0,
              progress: 0
            }
          });

          const { data, error } = await supabase.functions.invoke('videoagent', {
            body: {
              action: 'export-video',
              videoUrl: state.videoUrl,
              videoId: state.videoId,
              options: {
                exportFormat: format,
                quality: container.querySelector('#quality-select')?.value || 'high',
                command: `Export video as ${format.toUpperCase()}`
              }
            }
          });

          if (error) throw error;

          // Simulate progress updates
          for (let i = 1; i <= 4; i++) {
            await new Promise(r => setTimeout(r, 1500));
            updateState({
              processingStatus: {
                ...state.processingStatus,
                currentStep: i,
                progress: (i / 4) * 100
              }
            });
          }

          showToast(`Export completed! Job ID: ${data.jobId}`, 'success');

          // Clear processing status
          setTimeout(() => {
            updateState({ processingStatus: null });
          }, 2000);

        } catch (error) {
          console.error('Export failed:', error);
          showToast(`Export failed: ${error.message}`, 'error');
          updateState({ processingStatus: null });
        }
      };
    });
  };

  // Initialize the component
  const initialize = async () => {
    await initializeDirectorRuntime();
    render();
    addEventHandlers();
  };

  // Call initialize when component is created
  initialize();

  return container;
}