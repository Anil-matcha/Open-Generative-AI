// main.js - Vanilla JS Director Page

// Data
const leftAgents = [
  { name: 'Video Summarizer', icon: 'BookOpenText' },
  { name: 'Video Search', icon: 'Search' },
  { name: 'Clip Creator', icon: 'Scissors' },
  { name: 'Video Dubbing', icon: 'Languages' },
  { name: 'Subtitle Generator', icon: 'Captions' },
  { name: 'Highlight Extractor', icon: 'Sparkles' },
  { name: 'Scene Detector', icon: 'ScanSearch' },
  { name: 'B-Roll Adder', icon: 'Images' },
  { name: 'Voiceover', icon: 'Mic' },
  { name: 'Video Editor', icon: 'Wand2' },
  { name: 'Video Enhancer', icon: 'Gauge' },
  { name: 'Content Compiler', icon: 'Layers3' },
  { name: 'Meme Generator', icon: 'SmilePlus' },
  { name: 'Music Video Maker', icon: 'Music4' },
  { name: 'Trailer Creator', icon: 'Film' },
  { name: 'Compilation Builder', icon: 'Blocks' },
  { name: 'Social Media Clip', icon: 'Smartphone' },
  { name: 'Preview Generator', icon: 'Eye' },
  { name: 'Montage Builder', icon: 'GalleryVerticalEnd' },
  { name: 'Story Builder', icon: 'BookOpenText' },
  { name: 'Color Correction', icon: 'Palette' },
  { name: 'Video Stabilize', icon: 'Clapperboard' },
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

// State
let selectedAgent = 'Video Summarizer';
let chatInput = '';
let messages = [
  {
    role: 'assistant',
    text: 'Hello! I'm Director, your AI video assistant with 24+ specialized agents. Select an agent or send a command to get started.',
  },
];

// DOM elements
let app;

// Function to create icon element
function createIcon(name, className = 'h-5 w-5') {
  const icon = document.createElement('i');
  icon.setAttribute('data-lucide', name);
  icon.className = className;
  return icon;
}

// Agent reply function - integrated with backend
async function agentReply(input) {
  const text = input.toLowerCase();

  // Map commands to agent IDs
  let agentId = null;
  if (text.includes('short') || text.includes('clip')) {
    agentId = 'social';
  } else if (text.includes('subtitle') || text.includes('caption')) {
    agentId = 'subtitler';
  } else if (text.includes('highlight') || text.includes('best moment')) {
    agentId = 'highlighter';
  } else if (text.includes('summarize') || text.includes('summary')) {
    agentId = 'summarizer';
  } else if (text.includes('scene')) {
    agentId = 'scenes';
  } else if (text.includes('dub') || text.includes('translate')) {
    agentId = 'dubbing';
  } else if (text.includes('voiceover')) {
    agentId = 'voiceover';
  } else if (text.includes('color')) {
    agentId = 'color';
  } else if (text.includes('stabilize')) {
    agentId = 'stabilize';
  }

  if (agentId) {
    try {
      // Call backend agent
      const response = await fetch('/supabase/functions/videoagent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: getActionFromAgent(agentId),
          tool: getToolFromAgent(agentId),
          prompt: input,
          videoUrl: null // TODO: get from state
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.message || getSuccessMessage(agentId);
      }
    } catch (error) {
      console.warn('Backend call failed, using fallback:', error);
    }
  }

  // Fallback messages
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

function getActionFromAgent(agentId) {
  const map = {
    'summarizer': 'summarize-video',
    'search': 'search-media',
    'clipper': 'create-clip',
    'dubbing': 'dub-video',
    'subtitler': 'generate-subtitles',
    'highlighter': 'extract-highlights',
    'scenes': 'detect-scenes',
    'broll': 'add-broll',
    'voiceover': 'add-voiceover',
    'editor': 'edit-video',
    'enhancer': 'enhance-video',
    'compiler': 'compile-videos',
    'meme': 'create-meme',
    'music': 'create-music-video',
    'trailer': 'create-trailer',
    'compilation': 'build-compilation',
    'social': 'create-social-clip',
    'preview': 'generate-preview',
    'montage': 'create-montage',
    'story': 'build-story',
    'color': 'color-correct',
    'stabilize': 'stabilize-video'
  };
  return map[agentId] || 'edit-video';
}

function getToolFromAgent(agentId) {
  const map = {
    'summarizer': 'video-analysis',
    'search': 'video-search',
    'clipper': 'video-clipper',
    'dubbing': 'video-dubbing',
    'subtitler': 'video-subtitles',
    'highlighter': 'video-highlights',
    'scenes': 'scene-detection',
    'broll': 'video-broll',
    'voiceover': 'video-voiceover',
    'editor': 'video-editor',
    'enhancer': 'video-enhancer',
    'compiler': 'video-compiler',
    'meme': 'meme-generator',
    'music': 'music-video',
    'trailer': 'trailer-maker',
    'compilation': 'compilation-builder',
    'social': 'social-clip',
    'preview': 'preview-generator',
    'montage': 'montage-builder',
    'story': 'story-builder',
    'color': 'color-correction',
    'stabilize': 'video-stabilize'
  };
  return map[agentId] || 'video-editor';
}

function getSuccessMessage(agentId) {
  const messages = {
    'summarizer': 'Video summary generated successfully',
    'search': 'Media search completed',
    'clipper': 'Clip created successfully',
    'dubbing': 'Video dubbed successfully',
    'subtitler': 'Subtitles generated successfully',
    'highlighter': 'Highlights extracted successfully',
    'scenes': 'Scenes detected successfully',
    'broll': 'B-roll added successfully',
    'voiceover': 'Voiceover added successfully',
    'editor': 'Video edited successfully',
    'enhancer': 'Video enhanced successfully',
    'compiler': 'Videos compiled successfully',
    'meme': 'Meme created successfully',
    'music': 'Music video generated successfully',
    'trailer': 'Trailer created successfully',
    'compilation': 'Compilation built successfully',
    'social': 'Social media clip created successfully',
    'preview': 'Preview generated successfully',
    'montage': 'Montage created successfully',
    'story': 'Story built successfully',
    'color': 'Color correction applied successfully',
    'stabilize': 'Video stabilized successfully'
  };
  return messages[agentId] || 'Operation completed successfully';
}

// Send message
async function sendMessage(value) {
  const trimmed = value.trim();
  if (!trimmed) return;

  messages.push({ role: 'user', text: trimmed });
  render(); // Render immediately with user message

  try {
    const reply = await agentReply(trimmed);
    messages.push({ role: 'assistant', text: reply });
  } catch (error) {
    messages.push({ role: 'assistant', text: 'Sorry, there was an error processing your request.' });
  }

  chatInput = '';
  render();
}

// Render function
function render() {
  const selectedAgentInfo = leftAgents.find((agent) => agent.name === selectedAgent) || leftAgents[0];

  app.innerHTML = `
    <div class="min-h-screen bg-[#08090b] p-4 text-white">
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)_260px]">
        ${renderLeftSidebar()}
        ${renderMain()}
        ${renderRightSidebar()}
      </div>
    </div>
  `;

  // Initialize Lucide icons
  lucide.createIcons();

  // Add event listeners
  addEventListeners();
}

// Render left sidebar
function renderLeftSidebar() {
  return `
    <aside class="rounded-[28px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_55px_rgba(99,102,241,0.08)] backdrop-blur-xl">
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
          ${createIcon('Bot', 'h-5 w-5 text-lime-300').outerHTML}
        </div>
        <div>
          <div class="text-xl font-black tracking-tight">DIRECTOR</div>
          <div class="text-[11px] text-white/45">AI Agentic Editor · 24 Agents</div>
        </div>
      </div>

      <div class="mb-3 flex items-center justify-between">
        <div class="text-xs font-black tracking-[0.18em] text-white/70">AI AGENTS</div>
        <button class="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] text-white/55">
          All Categories
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2">
        ${leftAgents.map((agent, i) => {
          const active = selectedAgent === agent.name;
          return `
            <button
              data-agent="${agent.name}"
              class="relative overflow-hidden rounded-2xl border p-2.5 text-left transition ${
                active
                  ? 'border-emerald-400/28 bg-emerald-500/[0.10] shadow-[0_0_28px_rgba(16,185,129,0.16)]'
                  : i < 6
                    ? 'border-white/12 bg-white/[0.04]'
                    : 'border-white/10 bg-white/[0.03]'
              }"
            >
              <div class="absolute inset-0 ${
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
              }"></div>
              <div class="relative z-10">
                <div class="mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-black/30">
                  ${createIcon(agent.icon, 'h-4 w-4 text-white/80').outerHTML}
                </div>
                <div class="text-[12px] font-bold leading-tight">${agent.name}</div>
                <div class="mt-1 truncate text-[10px] text-white/40">AI workflow module</div>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <div class="mt-6">
        <div class="mb-2 text-[11px] font-black tracking-[0.18em] text-white/70">ACTIVE AGENT</div>
        <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11px] text-white/70">
          ${selectedAgent}
        </div>
      </div>
    </aside>
  `;
}

// Render main area
function renderMain() {
  return `
    <main class="bg-[#08090b]">
      <div
        class="relative mb-6 h-36 overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.55),0_0_80px_rgba(99,102,241,0.10)]"
        style="background: linear-gradient(135deg, #17181b 0%, #0c0d10 45%, #1b2230 100%)"
      >
        <div
          class="absolute inset-0"
          style="background: radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(99,102,241,0.28), transparent 36%), radial-gradient(circle at 15% 25%, rgba(236,72,153,0.14), transparent 28%)"
        ></div>
        <div
          class="absolute inset-0"
          style="background: radial-gradient(circle at center, rgba(120,119,198,0.16), transparent 36%), radial-gradient(circle at 70% 55%, rgba(56,189,248,0.08), transparent 28%)"
        ></div>
        <div class="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5">
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
        </div>
      </div>

      <div class="rounded-[28px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_60px_rgba(99,102,241,0.08)] backdrop-blur-xl">
        <div class="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-[10px] uppercase tracking-[0.22em] text-white/40">Agent Workspace</p>
              <h3 class="mt-2 text-lg font-black">${selectedAgentInfo.name}</h3>
              <p class="mt-1 text-sm text-white/50">
                Load a video, then use any agent from the left or a quick action from the right.
              </p>
            </div>
            <div class="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              Processing preview updated
            </div>
          </div>
        </div>

        <div class="relative flex min-h-[480px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black shadow-[0_0_120px_rgba(16,185,129,0.18),0_0_90px_rgba(99,102,241,0.14)]">
          <div
            class="absolute inset-0"
            style="background: radial-gradient(circle at center, rgba(255,255,255,0.10), transparent 38%), radial-gradient(circle at 50% 58%, rgba(16,185,129,0.20), transparent 34%)"
          ></div>
          <div
            class="absolute inset-0"
            style="background: radial-gradient(circle at top, rgba(120,119,198,0.24), transparent 28%), radial-gradient(circle at 50% 78%, rgba(16,185,129,0.24), transparent 26%), radial-gradient(circle at bottom right, rgba(255,255,255,0.09), transparent 24%), radial-gradient(circle at 20% 80%, rgba(236,72,153,0.08), transparent 20%)"
          ></div>
          <div
            class="relative flex aspect-video w-[92%] items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/12 shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_110px_rgba(16,185,129,0.20),0_0_70px_rgba(99,102,241,0.12)]"
            style="background: linear-gradient(135deg, #101114 0%, #191b20 50%, #0c0d10 100%)"
          >
            <div
              class="absolute inset-0"
              style="background: radial-gradient(circle at 50% 35%, rgba(99,102,241,0.22), transparent 26%), radial-gradient(circle at 50% 82%, rgba(16,185,129,0.22), transparent 24%), radial-gradient(circle at 30% 80%, rgba(255,255,255,0.09), transparent 22%), radial-gradient(circle at 75% 25%, rgba(236,72,153,0.08), transparent 22%)"
            ></div>
            <div class="absolute left-4 top-4 rounded-full border border-emerald-400/18 bg-black/45 px-3 py-1 text-xs text-emerald-100/80 shadow-[0_0_24px_rgba(16,185,129,0.14)] backdrop-blur">
              Director Workspace • Ready
            </div>
            <div class="relative z-10 text-center">
              <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                ${createIcon('Play', 'h-6 w-6 text-white/80').outerHTML}
              </div>
              <div class="text-2xl font-black">No video loaded</div>
              <div class="mt-2 text-sm text-white/40">Generate a video first to use Director</div>
            </div>
          </div>
        </div>

        <div class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          ${renderChatSection()}
          ${renderTimelineSection()}
        </div>
      </div>
    </main>
  `;
}

// Render chat section
function renderChatSection() {
  return `
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
      <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        ${createIcon('MessageSquare', 'h-4 w-4').outerHTML} AI Chat
      </div>
      <div
        class="rounded-2xl border border-white/10 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
        style="background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.028))"
      >
        <div class="max-h-[260px] space-y-3 overflow-auto pr-1">
          ${messages.map((message, index) => `
            <div
              class="max-w-[88%] rounded-2xl border px-3 py-2 text-sm ${
                message.role === 'assistant'
                  ? 'border-white/10 bg-white/[0.04] text-white/85'
                  : 'ml-auto border-lime-400/20 bg-lime-400/10 text-lime-50'
              }"
            >
              ${message.text}
            </div>
          `).join('')}
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2">
          ${starterPrompts.map((item, i) => `
            <button
              data-prompt="${item}"
              class="rounded-xl border px-3 py-2 text-left text-xs ${
                i === 0
                  ? 'border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100'
                  : i === 1
                    ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'
                    : i === 2
                      ? 'border-amber-400/20 bg-amber-500/10 text-amber-100'
                      : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
              }"
            >
              ${item}
            </button>
          `).join('')}
        </div>

        <div class="mt-4 flex items-center gap-3">
          <input
            id="chat-input"
            value="${chatInput}"
            placeholder="Type your command (e.g. Create a short clip of the best moment)"
            class="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/35"
          />
          <button
            id="send-button"
            class="flex h-12 items-center gap-2 rounded-2xl bg-lime-300 px-5 text-sm font-semibold text-black shadow-[0_0_24px_rgba(190,242,100,0.18)]"
          >
            ${createIcon('Send', 'h-4 w-4').outerHTML} Send
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render timeline section
function renderTimelineSection() {
  return `
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        ${createIcon('Clock3', 'h-4 w-4').outerHTML} Timeline Preview
      </div>
      <div class="mb-4 flex min-h-[120px] items-center justify-center rounded-2xl border border-white/10 bg-[#111118] p-4 text-sm text-white/35">
        No timeline data
      </div>
      <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        ${createIcon('FileVideo', 'h-4 w-4').outerHTML} Active Workflow
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
              <span class="${i < 2 ? 'font-semibold text-emerald-200' : i === 2 ? 'font-semibold text-indigo-300' : ''}">
                ${step}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Render right sidebar
function renderRightSidebar() {
  return `
    <aside class="rounded-[28px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_55px_rgba(99,102,241,0.08)] backdrop-blur-xl">
      <div class="rounded-[28px] border border-white/10 bg-white/[0.02] p-4 h-full">
        <h2 class="text-2xl font-black tracking-tight">QUICK ACTIONS</h2>
        <p class="mb-4 mt-1 text-sm text-white/50">Choose how to proceed with your video</p>

        <div class="mb-5 space-y-2">
          ${quickActions.map(([title, desc, icon], i) => `
            <button
              class="w-full rounded-2xl border p-3 text-left shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition-all ${
                i === 0
                  ? 'border-emerald-400/28 bg-emerald-500/12 text-white shadow-[0_0_28px_rgba(16,185,129,0.18)]'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
              }"
            >
              <div class="flex items-start gap-3">
                <div class="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                  ${createIcon(icon, 'h-4 w-4 text-white/80').outerHTML}
                </div>
                <div>
                  <div class="text-sm font-black">${title}</div>
                  <div class="mt-1 text-[11px] text-white/50">${desc}</div>
                </div>
              </div>
            </button>
          `).join('')}
        </div>

        <div class="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div class="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
            ${createIcon('Clock3', 'h-4 w-4').outerHTML} Timeline Preview
          </div>
          <div class="rounded-2xl border border-white/10 bg-[#111118] p-5 text-center text-sm text-white/35">
            No timeline data
          </div>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div class="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
            ${createIcon('FileVideo', 'h-4 w-4').outerHTML} Export
          </div>
          <div class="mb-4 flex gap-2">
            ${['MP4', 'WebM', 'GIF'].map((item, i) => `
              <button
                class="rounded-xl px-4 py-2 text-xs font-semibold ${
                  i === 0 ? 'bg-white text-black' : 'border border-white/10 bg-white/[0.04] text-white/70'
                }"
              >
                ${item}
              </button>
            `).join('')}
          </div>
          <div>
            <label class="mb-2 block text-sm text-white/50">Frame Rate</label>
            <div class="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-200">
              24 FPS Cinematic
            </div>
          </div>
        </div>
      </div>
    </aside>
  `;
}

// Add event listeners
function addEventListeners() {
  // Agent selection
  document.querySelectorAll('[data-agent]').forEach(button => {
    button.addEventListener('click', () => {
      selectedAgent = button.getAttribute('data-agent');
      render();
    });
  });

  // Chat input
  const chatInputEl = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  if (chatInputEl) {
    chatInputEl.addEventListener('input', (e) => {
      chatInput = e.target.value;
    });

    chatInputEl.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        await sendMessage(chatInput);
      }
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', async () => {
      await sendMessage(chatInput);
    });
  }

  // Starter prompts
  document.querySelectorAll('[data-prompt]').forEach(button => {
    button.addEventListener('click', async () => {
      await sendMessage(button.getAttribute('data-prompt'));
    });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  app = document.getElementById('app');
  render();
});