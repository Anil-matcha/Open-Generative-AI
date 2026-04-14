import { showToast } from '../lib/loading.js';
import { MuapiClient } from '../lib/muapi.js';
import { supabase } from '../lib/supabase.js';

export function createVideoAgentWorkspace(runtime = null) {
  // Create the main container
  const container = document.createElement('div');
  container.className = 'w-full h-full bg-app-bg text-white font-sans overflow-hidden';
  container.style.background = '#050505';

  // ==========================================
  // 0. STATE MANAGEMENT
  // ==========================================
  let uploadedVideoUrl = null;
  let isDragOver = false;

  // Processing results state
  let processingResults = {};
  let sceneData = [];
  let generatedVideos = [];
  let captions = [];
  let metadata = {};
  let currentVideoIndex = 0; // 0 = original, 1+ = processed versions

  // ==========================================
  // 1. STYLES
  // ==========================================
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .card {
      background: rgba(17,17,17,0.9);
      backdrop-filter: blur(20px);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    }

    .subtle-card {
      background: rgba(255,255,255,0.03);
      border:1px solid rgba(255,255,255,0.05);
      border-radius:1rem;
      transition: all 0.25s ease;
    }

    .subtle-card:hover {
      border-color: rgba(139,92,246,0.3);
      transform: translateY(-2px);
    }

    .goal-btn {
      background: rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.08);
      padding:12px 14px;
      border-radius:12px;
      font-size:14px;
      text-align:left;
      transition: all 0.25s ease;
    }

    .goal-btn:hover {
      border-color: rgba(139,92,246,0.3);
      background: rgba(255,255,255,0.08);
      transform: translateY(-2px);
    }

    .primary-btn {
      background:#a855f7;
      color:black;
      font-weight:900;
      border-radius:12px;
      padding:10px 16px;
      transition: all 0.2s ease;
    }

    .primary-btn:hover {
      transform: scale(1.04);
      box-shadow: 0 0 20px rgba(168,85,247,0.6);
    }

    .ghost-btn {
      background: rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.08);
      color: rgba(255,255,255,0.88);
      border-radius: 12px;
      padding: 10px 14px;
      transition: all 0.2s ease;
    }

    .ghost-btn:hover {
      background: rgba(255,255,255,0.1);
      border-color: rgba(139,92,246,0.25);
    }

    .hero-banner {
      position: relative;
      overflow: hidden;
      min-height: 180px;
      background:
        radial-gradient(circle at 20% 20%, rgba(168,85,247,0.25), transparent 30%),
        radial-gradient(circle at 80% 30%, rgba(59,130,246,0.18), transparent 30%),
        linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
    }

    .hero-banner::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(17,17,17,0.95), rgba(17,17,17,0.25), transparent);
      pointer-events: none;
    }

    .status-pill {
      background: rgba(168,85,247,0.12);
      border: 1px solid rgba(168,85,247,0.25);
      color: #d8b4fe;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
    }

    .timeline-track {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      min-height: 56px;
    }

    .timeline-block {
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(168,85,247,0.32), rgba(255,255,255,0.08));
      border: 1px solid rgba(168,85,247,0.22);
      color: rgba(255,255,255,0.92);
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .mini-label {
      color: rgba(255,255,255,0.42);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .chat-bubble-user {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 10px 12px;
    }

    .chat-bubble-agent {
      background: rgba(168,85,247,0.08);
      border: 1px solid rgba(168,85,247,0.16);
      border-radius: 14px;
      padding: 10px 12px;
    }

    .progress-bar {
      background: linear-gradient(90deg, #a855f7, #c084fc);
      box-shadow: 0 0 18px rgba(168,85,247,0.45);
    }

    .workspace-grid {
      display: grid;
      grid-template-columns: 240px minmax(0, 1.7fr) 300px;
      gap: 1rem;
      align-items: start;
    }

    .preview-stage {
      position: relative;
      min-height: 620px;
      border-radius: 1.25rem;
      background:
        radial-gradient(circle at center, rgba(168,85,247,0.08), transparent 35%),
        #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .preview-stage video {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      background: #000;
    }

    @media (max-width: 1535px) {
      .workspace-grid {
        grid-template-columns: 220px minmax(0, 1.55fr) 280px;
      }

      .preview-stage {
        min-height: 560px;
      }
    }

    @media (max-width: 1279px) {
      .workspace-grid {
        grid-template-columns: 1fr;
      }

      .preview-stage {
        min-height: 480px;
      }
    }

    .drag-over {
      border-color: rgba(168,85,247,0.6) !important;
      background: rgba(168,85,247,0.05) !important;
    }

    .upload-zone {
      border: 2px dashed rgba(255,255,255,0.2);
      border-radius: 1rem;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .upload-zone:hover {
      border-color: rgba(168,85,247,0.4);
      background: rgba(168,85,247,0.02);
    }

    .tab-btn.active {
      background: rgba(168,85,247,0.1);
      border-color: rgba(168,85,247,0.3);
      color: #d8b4fe;
    }
  `;
  document.head.appendChild(style);

  container.innerHTML = `
    <!-- TOP BAR -->
    <div class="w-full flex items-center justify-between px-6 py-4 bg-panel-bg border-b border-white/5">
      <div class="flex items-center gap-4">
        <div>
          <div class="font-black text-lg leading-none">VideoAgent</div>
          <div class="text-xs text-muted mt-1">Project: Summer Campaign Edit</div>
        </div>
        <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">AI READY</span>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-muted text-sm rounded-lg transition-colors">Version History</button>
        <button class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-muted text-sm rounded-lg transition-colors">Save</button>
        <button class="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-transform">Export</button>
      </div>
    </div>

    <!-- HERO -->
    <div class="card hero-banner p-6 md:p-8 flex items-end">
      <div class="relative z-10 max-w-3xl">
        <div class="text-xs text-white/50 font-bold tracking-[0.25em] mb-3">AI VIDEO AGENT WORKSPACE</div>
        <h1 class="text-3xl md:text-5xl font-black tracking-tight mb-2">Edit, repurpose, and direct videos with AI.</h1>
        <p class="text-sm md:text-base text-white/65 max-w-2xl">Use Director-style planning, ArcReel-style job flow, and FireRed-style editing actions inside one cinematic workspace built in the Storyboard theme.</p>
        <div class="flex flex-wrap gap-3 mt-5">
          <button class="primary-btn">Start With AI Plan</button>
          <button class="ghost-btn">Open Existing Project</button>
        </div>
      </div>
    </div>

    <!-- FEATURES -->
    <div class="card p-4 md:p-6">
      <h2 class="text-xl font-black text-white mb-1">Agent Capabilities</h2>
      <p class="text-sm text-white/50 mb-6">Built like a premium storyboard app, but designed for AI-powered editing workflows.</p>
      <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="subtle-card p-4">
          <div class="text-3xl mb-3">🎬</div>
          <div class="font-black mb-1">Goal-Based Editing</div>
          <div class="text-sm text-white/55">Tell the agent what outcome you want instead of manually chaining tools together.</div>
        </div>
        <div class="subtle-card p-4">
          <div class="text-3xl mb-3">🧠</div>
          <div class="font-black mb-1">AI Planning</div>
          <div class="text-sm text-white/55">The agent builds a task plan for highlights, shorts, captions, dubbing, and quality improvements.</div>
        </div>
        <div class="subtle-card p-4">
          <div class="text-3xl mb-3">📝</div>
          <div class="font-black mb-1">Timeline + Outputs</div>
          <div class="text-sm text-white/55">Review scenes, generated clips, captions, and timeline changes from one unified workspace.</div>
        </div>
        <div class="subtle-card p-4">
          <div class="text-3xl mb-3">✨</div>
          <div class="font-black mb-1">Premium Workflow UX</div>
          <div class="text-sm text-white/55">Storyboard-style cards, polished interaction states, and a cinematic editing environment.</div>
        </div>
      </div>
    </div>

    <!-- QUICK ACTIONS -->
    <div class="card p-4 md:p-6">
      <h2 class="text-xl font-black text-white mb-1">Quick Actions</h2>
      <p class="text-sm text-white/50 mb-6">Launch the agent with common editing goals.</p>
      <div class="flex flex-wrap gap-3" id="quick-actions">
        <button class="goal-btn" data-prompt="Create highlights from this video">Create Highlights</button>
        <button class="goal-btn" data-prompt="Make 3 short vertical clips">Make Shorts</button>
        <button class="goal-btn" data-prompt="Add captions to this video">Add Captions</button>
        <button class="goal-btn" data-prompt="Dub this video into Spanish">Dub Video</button>
        <button class="goal-btn" data-prompt="Improve video quality and pacing">Improve Quality</button>
        <button class="goal-btn" data-prompt="Build a trailer cut from this video">Build Trailer</button>
      </div>
    </div>

    <!-- EXAMPLE OUTPUTS -->
    <div class="card p-4 md:p-6">
      <h2 class="text-xl font-black text-white mb-1">Example Outputs</h2>
      <p class="text-sm text-white/50 mb-6">Preview the kinds of transformations the agent can create.</p>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="subtle-card p-4 cursor-pointer">
          <div class="mb-3"><span class="status-pill">HIGHLIGHTS</span></div>
          <div class="text-white/80 text-sm">Three high-energy clips pulled from the strongest moments in your source video.</div>
        </div>
        <div class="subtle-card p-4 cursor-pointer">
          <div class="mb-3"><span class="status-pill">CAPTIONS</span></div>
          <div class="text-white/80 text-sm">Clean branded captions generated from transcript timing and scene pacing.</div>
        </div>
        <div class="subtle-card p-4 cursor-pointer">
          <div class="mb-3"><span class="status-pill">SHORTS</span></div>
          <div class="text-white/80 text-sm">Vertical edits with tighter pacing, stronger hooks, and mobile-first framing.</div>
        </div>
      </div>
    </div>

    <!-- MAIN WORKSPACE -->
    <div class="workspace-grid">

      <!-- LEFT: GOALS + JOBS -->
      <div class="space-y-4">
        <div class="card p-4 flex flex-col gap-3">
          <div class="mini-label mb-1">AGENT GOALS</div>
          <button class="goal-btn" data-goal="Create highlights from this video">🎬 Create Highlights</button>
          <button class="goal-btn" data-goal="Make 3 short vertical clips">📱 Make Shorts</button>
          <button class="goal-btn" data-goal="Add captions to this video">📝 Add Captions</button>
          <button class="goal-btn" data-goal="Dub this video into Spanish">🌍 Dub Video</button>
          <button class="goal-btn" data-goal="Improve video quality and pacing">✨ Improve Quality</button>
        </div>

        <div class="card p-4">
          <div class="mini-label mb-3">JOB CENTER</div>
          <div class="space-y-3" id="job-list">
            <div class="subtle-card p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-bold">Current Session</div>
                <div class="text-xs text-white/45">Idle</div>
              </div>
              <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div id="job-progress" class="progress-bar h-full w-0 rounded-full"></div>
              </div>
              <div class="text-xs text-white/45 mt-2" id="job-status-text">Waiting for a goal...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER -->
      <div class="space-y-4">
        <div class="card p-4 md:p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="mini-label mb-1">VIDEO PREVIEW</div>
              <div class="text-sm text-white/55">Source video, generated cuts, and scene-aware review.</div>
            </div>
            <div class="flex gap-2">
              <button class="ghost-btn">Original</button>
              <button class="primary-btn">AI Version</button>
            </div>
          </div>
          <div class="preview-stage" id="preview-stage">
            <video id="video" controls aria-label="Video preview player" style="display: none;"></video>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none" id="upload-zone">
              <div class="upload-zone w-full h-full flex flex-col items-center justify-center" id="drop-zone">
                <div class="text-6xl mb-4 opacity-70">🎬</div>
                <div class="text-xl font-bold text-white/80 mb-2">Drop your video here</div>
                <div class="text-base text-white/55 font-medium mb-4">Or click to browse files</div>
                <div class="text-sm text-white/35">Supports MP4, MOV, AVI, WebM up to 2GB</div>
                <input type="file" id="video-upload" accept="video/*" style="display: none;">
              </div>
            </div>
          </div>
          <div class="grid md:grid-cols-3 gap-3 mt-4">
            <div class="subtle-card p-3">
              <div class="mini-label mb-2">SOURCE</div>
              <div class="text-sm">Summer-Campaign-Full.mp4</div>
              <div class="text-xs text-white/45 mt-1">03:42 • 1080p • 16:9</div>
            </div>
            <div class="subtle-card p-3">
              <div class="mini-label mb-2">SCENES</div>
              <div class="text-sm">12 detected scenes</div>
              <div class="text-xs text-white/45 mt-1">Hook, demo, proof, CTA</div>
            </div>
            <div class="subtle-card p-3">
              <div class="mini-label mb-2">ACTIVE OUTPUT</div>
              <div class="text-sm">AI Short v2</div>
              <div class="text-xs text-white/45 mt-1">Captioned vertical export</div>
            </div>
          </div>
        </div>

        <div class="card p-4 md:p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="mini-label mb-1">TIMELINE</div>
              <div class="text-sm text-white/55">Scene structure, captions, and AI-generated edits.</div>
            </div>
            <div class="text-xs text-white/40">00:00 — 03:42</div>
          </div>

          <div class="space-y-3">
            <div>
              <div class="mini-label mb-2">VIDEO TRACK</div>
              <div class="timeline-track p-3 flex items-center gap-2 overflow-x-auto">
                <div class="timeline-block" style="width: 80px">Hook</div>
                <div class="timeline-block" style="width: 100px">Demo</div>
                <div class="timeline-block" style="width: 90px">Social Proof</div>
                <div class="timeline-block" style="width: 110px">Offer</div>
                <div class="timeline-block" style="width: 82px">CTA</div>
              </div>
            </div>

            <div>
              <div class="mini-label mb-2">CAPTION TRACK</div>
              <div class="timeline-track p-3 flex items-center gap-2 overflow-x-auto">
                <div class="timeline-block" style="width: 70px">Cap 1</div>
                <div class="timeline-block" style="width: 90px">Cap 2</div>
                <div class="timeline-block" style="width: 85px">Cap 3</div>
                <div class="timeline-block" style="width: 75px">Cap 4</div>
                <div class="timeline-block" style="width: 100px">Cap 5</div>
              </div>
            </div>

            <div>
              <div class="mini-label mb-2">AI SUGGESTIONS</div>
              <div class="timeline-track p-3 flex items-center gap-2 overflow-x-auto">
                <div class="timeline-block" style="width: 120px">Tighten Intro</div>
                <div class="timeline-block" style="width: 135px">Boost Hook</div>
                <div class="timeline-block" style="width: 145px">Shorten Pause</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT -->
      <div class="space-y-4">
        <div class="card flex flex-col min-h-[620px]">
          <div class="p-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <div class="mini-label mb-1">AI AGENT</div>
              <div class="text-sm text-white/55">Chat with the editing agent and review its plan.</div>
            </div>
            <span class="status-pill">LIVE</span>
          </div>

          <div class="px-4 pt-4 grid grid-cols-3 gap-2">
            <button class="tab-btn ghost-btn text-xs active" data-tab="chat">Chat</button>
            <button class="tab-btn ghost-btn text-xs" data-tab="outputs">Outputs</button>
            <button class="tab-btn ghost-btn text-xs" data-tab="inspector">Inspector</button>
          </div>

          <div id="chat" class="tab-content flex-1 overflow-y-auto p-4 space-y-3">
            <div class="chat-bubble-agent text-sm text-white/80">I can plan edits, create shorts, add captions, improve pacing, and help you build new video versions.</div>
            <div class="chat-bubble-agent text-sm text-white/80">Try: "Make 3 short clips from the strongest moments."</div>
          </div>

          <div id="outputs" class="tab-content flex-1 overflow-y-auto p-4 space-y-3" style="display: none;">
            <div class="text-sm text-white/70 mb-4">Generated outputs will appear here</div>
            <div class="subtle-card p-3">
              <div class="text-sm font-bold text-white mb-1">No outputs yet</div>
              <div class="text-xs text-white/50">Run an AI agent to generate video outputs</div>
            </div>
          </div>

          <div id="inspector" class="tab-content flex-1 overflow-y-auto p-4 space-y-3" style="display: none;">
            <div class="text-sm text-white/70 mb-4">Video analysis and metadata</div>
            <div class="subtle-card p-3">
              <div class="text-sm font-bold text-white mb-1">Video Metadata</div>
              <div class="text-xs text-white/50 space-y-1">
                <div>Duration: --</div>
                <div>Resolution: --</div>
                <div>Codec: --</div>
                <div>Size: --</div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-white/10 space-y-3">
            <div class="subtle-card p-3">
              <div class="mini-label mb-2">CURRENT PLAN</div>
              <div id="plan-preview" class="text-sm text-white/65">No active plan yet.</div>
            </div>
            <input id="input" placeholder="Tell the agent what to do..." class="w-full bg-black/50 px-3 py-3 rounded-xl border border-white/10 focus:border-purple-500 outline-none" />
          </div>
        </div>
      </div>

    </div>
  `;

  // Add JavaScript functionality
  function parseIntent(input) {
    const normalized = input.toLowerCase();
    if (normalized.includes('highlight')) return 'highlights';
    if (normalized.includes('short')) return 'shorts';
    if (normalized.includes('caption')) return 'captions';
    if (normalized.includes('dub')) return 'dub';
    if (normalized.includes('quality') || normalized.includes('improve')) return 'enhance';
    return 'unknown';
  }

  function planTasks(intent) {
    const plans = {
      highlights: ['scene-detect', 'score-moments', 'cut-clips', 'export'],
      shorts: ['detect-hooks', 'resize-vertical', 'caption', 'export'],
      captions: ['transcribe', 'generate-captions', 'overlay'],
      dub: ['transcribe', 'translate', 'tts', 'replace-audio'],
      enhance: ['analyze-quality', 'improve-pacing', 'color-balance', 'export']
    };
    return plans[intent] || ['analyze-video', 'build-plan'];
  }

  const jobs = [];
  let currentProgress = 0;
  const muapiClient = new MuapiClient();

  // Execute task via specific repository
  async function executeRepositoryTask(repoKey, params) {
    try {
      switch (repoKey) {
        case 'open-higgsfield':
          return await executeHiggsfieldTask(params);

        case 'director':
          return await executeDirectorTask(params);

        case 'vimax':
          return await executeVimaxTask(params);

        case 'rendiv':
          return await executeRendivTask(params);

        case 'yucut':
          return await executeYucutTask(params);

        case 'ltx':
          return await executeLtxTask(params);

        default:
          throw new Error(`Unsupported repository: ${repoKey}`);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Execute task via Open Higgsfield (primary orchestration)
  async function executeHiggsfieldTask(params) {
    const { data, error } = await supabase.functions.invoke('videoagent', {
      body: {
        action: params.action,
        tool: params.tool,
        videoUrl: params.videoUrl,
        prompt: `Higgsfield processing: ${params.task}`,
        settings: params.settings
      }
    });

    if (error) throw new Error(error.message);
    return { success: true, data };
  }

  // Execute task via Director (cinematic editing)
  async function executeDirectorTask(params) {
    // Use the director agent runtime if available
    if (runtime && runtime.executeAgentCommand) {
      const agentId = getDirectorAgentId(params.action);
      const result = await runtime.executeAgentCommand(agentId, {
        videoUrl: params.videoUrl,
        prompt: params.task
      });
      return { success: result.success, data: result };
    }

    // Fallback to Supabase function
    const { data, error } = await supabase.functions.invoke('director-agent', {
      body: {
        action: params.action,
        videoUrl: params.videoUrl,
        prompt: params.task
      }
    });

    if (error) throw new Error(error.message);
    return { success: true, data };
  }

  // Execute task via ViMax (enhancement)
  async function executeVimaxTask(params) {
    // Use MuapiClient for video enhancement
    if (params.action === 'enhance-video') {
      const result = await muapiClient.processV2V({
        model: 'vimax-enhancer',
        video_url: params.videoUrl,
        prompt: `Enhance video: ${params.task}`
      });
      return { success: true, data: result };
    }

    // Fallback
    return { success: false, error: 'ViMax enhancement not implemented' };
  }

  // Execute task via Rendiv (render/export)
  async function executeRendivTask(params) {
    const { data, error } = await supabase.functions.invoke('rendiv-render', {
      body: {
        action: params.action,
        videoUrl: params.videoUrl,
        outputFormat: params.settings?.format || 'mp4'
      }
    });

    if (error) throw new Error(error.message);
    return { success: true, data };
  }

  // Execute task via Yucut (shorts/highlights)
  async function executeYucutTask(params) {
    const { data, error } = await supabase.functions.invoke('yucut-processor', {
      body: {
        action: params.action,
        videoUrl: params.videoUrl,
        task: params.task
      }
    });

    if (error) throw new Error(error.message);
    return { success: true, data };
  }

  // Execute task via LTX (subtitles/dubbing)
  async function executeLtxTask(params) {
    // Use MuapiClient for audio processing
    if (params.action === 'generate-subtitles' || params.action === 'dub-video') {
      const result = await muapiClient.generateAudio({
        model: 'ltx-voice',
        prompt: params.task,
        duration: 30 // Default duration
      });
      return { success: true, data: result };
    }

    return { success: false, error: 'LTX task not implemented' };
  }

  // Map actions to director agent IDs
  function getDirectorAgentId(action) {
    const agentMap = {
      'detect-scenes': 'scenes',
      'extract-highlights': 'highlighter',
      'create-clip': 'clipper',
      'generate-subtitles': 'subtitler',
      'dub-video': 'dubbing',
      'add-voiceover': 'voiceover',
      'enhance-video': 'enhancer',
      'edit-video': 'editor',
      'color-correct': 'color',
      'summarize-video': 'summarizer',
      'build-story': 'story'
    };
    return agentMap[action] || 'editor';
  }

  // Repository endpoints for different processing types
  const REPO_ENDPOINTS = {
    'open-higgsfield': { api: 'higgsfield-api', description: 'Primary orchestration' },
    'director': { api: 'director-api', description: 'Cinematic editing' },
    'vimax': { api: 'vimax-api', description: 'Enhancement and finishing' },
    'rendiv': { api: 'rendiv-api', description: 'Render and export' },
    'yucut': { api: 'yucut-api', description: 'Shorts and highlights' },
    'ltx': { api: 'ltx-api', description: 'Subtitles and dubbing' }
  };

  // Map of task names to repository actions
  const taskActionMap = {
    'scene-detect': { action: 'detect-scenes', tool: 'scene-detection', repos: ['director', 'yucut'] },
    'score-moments': { action: 'extract-highlights', tool: 'video-highlights', repos: ['yucut', 'director'] },
    'cut-clips': { action: 'create-clip', tool: 'video-clipper', repos: ['yucut', 'rendiv'] },
    'export': { action: 'export-video', tool: 'video-export', repos: ['rendiv'] },
    'detect-hooks': { action: 'extract-highlights', tool: 'video-highlights', repos: ['yucut', 'director'] },
    'resize-vertical': { action: 'create-social-clip', tool: 'social-clip', repos: ['yucut', 'rendiv'] },
    'caption': { action: 'generate-subtitles', tool: 'video-subtitles', repos: ['ltx', 'open-higgsfield'] },
    'transcribe': { action: 'generate-subtitles', tool: 'video-subtitles', repos: ['ltx', 'open-higgsfield'] },
    'translate': { action: 'dub-video', tool: 'video-dubbing', repos: ['ltx', 'vimax'] },
    'tts': { action: 'add-voiceover', tool: 'video-voiceover', repos: ['ltx', 'vimax'] },
    'replace-audio': { action: 'dub-video', tool: 'video-dubbing', repos: ['ltx', 'vimax'] },
    'analyze-quality': { action: 'enhance-video', tool: 'video-enhancer', repos: ['vimax', 'open-higgsfield'] },
    'improve-pacing': { action: 'edit-video', tool: 'video-editor', repos: ['director', 'vimax'] },
    'color-balance': { action: 'color-correct', tool: 'color-correction', repos: ['vimax', 'director'] },
    'analyze-video': { action: 'summarize-video', tool: 'video-analysis', repos: ['director', 'open-higgsfield'] },
    'build-plan': { action: 'build-story', tool: 'story-builder', repos: ['director', 'open-higgsfield'] }
  };

  async function runTasks(tasks) {
    const progressBar = container.querySelector('#job-progress');
    const statusText = container.querySelector('#job-status-text');

    if (!uploadedVideoUrl) {
      log('No video uploaded for processing', 'agent');
      statusText.textContent = 'No video uploaded';
      return;
    }

    try {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const taskConfig = taskActionMap[task];

        log(`Running: ${task}`, 'agent');
        const taskDescriptions = {
          'scene-detect': 'Detecting video scenes',
          'score-moments': 'Scoring highlight moments',
          'cut-clips': 'Cutting video clips',
          'export': 'Exporting final video',
          'detect-hooks': 'Finding hook moments',
          'resize-vertical': 'Converting to vertical format',
          'caption': 'Generating captions',
          'transcribe': 'Transcribing audio',
          'translate': 'Translating content',
          'tts': 'Generating voice audio',
          'replace-audio': 'Replacing audio track',
          'analyze-quality': 'Analyzing video quality',
          'improve-pacing': 'Improving video pacing',
          'color-balance': 'Balancing colors'
        };
        statusText.textContent = taskDescriptions[task] || `Processing ${task}...`;
        currentProgress = Math.round(((i + 1) / tasks.length) * 100);
        progressBar.style.width = currentProgress + '%';

        if (taskConfig) {
          try {
            // Execute task across specified repositories
            const results = [];
            for (const repoKey of taskConfig.repos) {
              try {
                const repoConfig = REPO_ENDPOINTS[repoKey];
                if (!repoConfig) {
                  log(`⚠️ Unknown repository: ${repoKey}`, 'agent');
                  continue;
                }

                log(`🔄 Processing ${task} via ${repoKey}`, 'agent');

                // Call repository-specific API
                const result = await executeRepositoryTask(repoKey, {
                  action: taskConfig.action,
                  tool: taskConfig.tool,
                  videoUrl: uploadedVideoUrl,
                  task: task,
                  settings: {}
                });

                if (result.success) {
                  results.push({ repo: repoKey, result: result.data });
                  log(`✅ ${task} completed via ${repoKey}`, 'agent');

                  // Store results based on task type
                  storeTaskResult(task, result.data);
                } else {
                  log(`⚠️ ${task} via ${repoKey} failed: ${result.error}`, 'agent');
                }

              } catch (repoError) {
                log(`❌ ${task} via ${repoKey} error: ${repoError.message}`, 'agent');
              }
            }

            if (results.length === 0) {
              throw new Error(`All repositories failed for task: ${task}`);
            }

          } catch (apiError) {
            log(`❌ ${task} failed: ${apiError.message}`, 'agent');
            // Continue with other tasks even if one fails
          }
        } else {
          log(`⚠️ No API mapping found for task: ${task}`, 'agent');
        }

        // Small delay between tasks
        await new Promise(r => setTimeout(r, 500));
      }

      statusText.textContent = 'Processing completed.';
      log('✅ All tasks completed', 'agent');

      // Update all UI sections with real results
      updateOutputsSection();
      updateTimelineSection();
      updateInspectorSection();
      updateVideoToggle();

    } catch (error) {
      log(`❌ Processing failed: ${error.message}`, 'agent');
      statusText.textContent = 'Processing failed';

      // Show error in outputs section
      updateOutputsSection();

      showToast(`Video processing failed: ${error.message}`, 'error');
    }
  }

  function storeTaskResult(task, data) {
    processingResults[task] = data;

    switch (task) {
      case 'scene-detect':
        if (data.scenes) {
          sceneData = data.scenes;
        }
        break;
      case 'transcribe':
      case 'caption':
        if (data.captions) {
          captions = data.captions;
        }
        break;
      case 'export':
        if (data.url) {
          generatedVideos.push({
            url: data.url,
            type: 'export',
            description: 'Exported video'
          });
        }
        break;
      case 'cut-clips':
        if (data.clips && Array.isArray(data.clips)) {
          data.clips.forEach(clip => {
            if (clip.url) {
              generatedVideos.push({
                url: clip.url,
                type: 'clip',
                description: `Clip: ${clip.title || 'Generated clip'}`
              });
            }
          });
        }
        break;
      case 'resize-vertical':
        if (data.url) {
          generatedVideos.push({
            url: data.url,
            type: 'vertical',
            description: 'Vertical format'
          });
        }
        break;
      case 'replace-audio':
        if (data.url) {
          generatedVideos.push({
            url: data.url,
            type: 'dubbed',
            description: 'Dubbed audio'
          });
        }
        break;
      case 'enhance-video':
      case 'color-balance':
        if (data.url) {
          generatedVideos.push({
            url: data.url,
            type: 'enhanced',
            description: 'Enhanced quality'
          });
        }
        break;
    }

    // Update metadata if available
    if (data.metadata) {
      metadata = { ...metadata, ...data.metadata };
    }
  }

  function createJob(tasks) {
    const job = { id: Date.now(), tasks, status: 'running' };
    jobs.push(job);
    executeJob(job);
  }

  async function executeJob(job) {
    try {
      await runTasks(job.tasks);
      job.status = 'completed';
      job.completedAt = new Date();

      // Update UI with results
      updateOutputsSection();
      updateTimelineSection();
      updateInspectorSection();
      updateVideoToggle();
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      log(`Job failed: ${error.message}`, 'agent');

      // Update UI even on failure
      updateOutputsSection();
    }
  }

  function updateOutputsSection() {
    const outputsContainer = container.querySelector('#outputs');
    if (!outputsContainer) return;

    // Clear existing content
    outputsContainer.innerHTML = '';

    // Show generated videos
    if (generatedVideos.length > 0) {
      outputsContainer.innerHTML += '<div class="text-sm text-white/70 mb-4">Generated Videos</div>';
      generatedVideos.forEach((video, index) => {
        const videoDiv = document.createElement('div');
        videoDiv.className = 'subtle-card p-3 mb-3';
        videoDiv.innerHTML = `
          <div class="text-sm font-bold text-white mb-1">${video.description}</div>
          <div class="text-xs text-white/50 mb-2">Type: ${video.type}</div>
          <div class="flex gap-2">
            <button class="ghost-btn text-xs" onclick="window.open('${video.url}', '_blank')">Preview</button>
            <button class="ghost-btn text-xs" onclick="navigator.clipboard.writeText('${video.url}')">Copy URL</button>
          </div>
        `;
        outputsContainer.appendChild(videoDiv);
      });
    }

    // Show captions if available
    if (captions.length > 0) {
      outputsContainer.innerHTML += '<div class="text-sm text-white/70 mb-4 mt-4">Generated Captions</div>';
      const captionsDiv = document.createElement('div');
      captionsDiv.className = 'subtle-card p-3 mb-3';
      captionsDiv.innerHTML = `
        <div class="text-sm font-bold text-white mb-1">Video Captions</div>
        <div class="text-xs text-white/50 mb-2">${captions.length} caption entries</div>
        <div class="text-xs text-white/70 max-h-32 overflow-y-auto">
          ${captions.slice(0, 5).map(c => `${c.timestamp}: ${c.text}`).join('<br>')}
          ${captions.length > 5 ? '<br>...and more' : ''}
        </div>
        <button class="ghost-btn text-xs mt-2" onclick="downloadCaptions()">Download SRT</button>
      `;
      outputsContainer.appendChild(captionsDiv);
    }

    // Show completed job status
    const completedJobs = jobs.filter(job => job.status === 'completed');
    const failedJobs = jobs.filter(job => job.status === 'failed');

    if (completedJobs.length > 0 || failedJobs.length > 0) {
      outputsContainer.innerHTML += '<div class="text-sm text-white/70 mb-4 mt-4">Processing Jobs</div>';
    }

    // Show completed jobs
    completedJobs.forEach(job => {
      const outputDiv = document.createElement('div');
      outputDiv.className = 'subtle-card p-3 mb-3';
      outputDiv.innerHTML = `
        <div class="text-sm font-bold text-white mb-1">✅ Job #${job.id} - Completed</div>
        <div class="text-xs text-white/50 mb-2">Finished: ${job.completedAt?.toLocaleTimeString()}</div>
        <div class="text-xs text-white/70 mb-2">Tasks processed: ${job.tasks.join(' → ')}</div>
        <div class="text-xs text-green-400">All repositories processed successfully</div>
      `;
      outputsContainer.appendChild(outputDiv);
    });

    // Show failed jobs
    failedJobs.forEach(job => {
      const outputDiv = document.createElement('div');
      outputDiv.className = 'subtle-card p-3 mb-3 border-red-500/20';
      outputDiv.innerHTML = `
        <div class="text-sm font-bold text-red-400 mb-1">❌ Job #${job.id} - Failed</div>
        <div class="text-xs text-white/50 mb-2">Failed: ${job.completedAt?.toLocaleTimeString()}</div>
        <div class="text-xs text-white/70 mb-2">Tasks attempted: ${job.tasks.join(' → ')}</div>
        <div class="text-xs text-red-400">${job.error || 'Unknown error occurred'}</div>
      `;
      outputsContainer.appendChild(outputDiv);
    });

    // If no outputs at all
    if (generatedVideos.length === 0 && captions.length === 0 && completedJobs.length === 0 && failedJobs.length === 0) {
      outputsContainer.innerHTML = `
        <div class="text-sm text-white/70 mb-4">Generated outputs will appear here</div>
        <div class="subtle-card p-3">
          <div class="text-sm font-bold text-white mb-1">No outputs yet</div>
          <div class="text-xs text-white/50">Run an AI agent to generate video outputs</div>
        </div>
      `;
    }
  }

  function downloadCaptions() {
    if (captions.length === 0) return;

    const srtContent = captions.map((caption, index) => {
      const start = formatTime(caption.timestamp || 0);
      const end = formatTime((caption.timestamp || 0) + (caption.duration || 2));
      return `${index + 1}\n${start} --> ${end}\n${caption.text}\n`;
    }).join('\n');

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  function updateTimelineSection() {
    if (sceneData.length === 0) return;

    const timelineContainer = container.querySelector('.timeline-track');
    if (!timelineContainer) return;

    // Clear existing timeline blocks
    timelineContainer.innerHTML = '';

    // Calculate total duration (assume from metadata or estimate)
    const totalDuration = metadata.duration || 225; // default 3:45
    const scale = 300 / totalDuration; // pixels per second

    sceneData.forEach(scene => {
      const width = (scene.duration || 30) * scale;
      const block = document.createElement('div');
      block.className = 'timeline-block';
      block.style.width = `${Math.max(width, 60)}px`;
      block.textContent = scene.title || scene.description || `Scene ${scene.index || 1}`;
      timelineContainer.appendChild(block);
    });
  }

  function updateInspectorSection() {
    const inspectorContainer = container.querySelector('#inspector');
    if (!inspectorContainer) return;

    // Update metadata card
    const metadataCard = inspectorContainer.querySelector('.subtle-card');
    if (metadataCard && Object.keys(metadata).length > 0) {
      metadataCard.innerHTML = `
        <div class="text-sm font-bold text-white mb-1">Video Metadata</div>
        <div class="text-xs text-white/50 space-y-1">
          <div>Duration: ${formatDuration(metadata.duration)}</div>
          <div>Resolution: ${metadata.width || '--'}x${metadata.height || '--'}</div>
          <div>Codec: ${metadata.codec || '--'}</div>
          <div>Size: ${formatBytes(metadata.size)}</div>
          <div>Scenes: ${sceneData.length}</div>
          <div>Captions: ${captions.length}</div>
        </div>
      `;
    }

    // Add additional analysis cards if available
    if (sceneData.length > 0) {
      const sceneCard = document.createElement('div');
      sceneCard.className = 'subtle-card p-3 mt-3';
      sceneCard.innerHTML = `
        <div class="text-sm font-bold text-white mb-1">Scene Analysis</div>
        <div class="text-xs text-white/50 space-y-1">
          ${sceneData.slice(0, 3).map(scene => `<div>${scene.title || 'Scene'}: ${formatDuration(scene.timestamp)}</div>`).join('')}
          ${sceneData.length > 3 ? '<div>...and more scenes</div>' : ''}
        </div>
      `;
      inspectorContainer.appendChild(sceneCard);
    }
  }

  function formatDuration(seconds) {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatBytes(bytes) {
    if (!bytes) return '--';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  function updateVideoToggle() {
    const toggleButtons = container.querySelectorAll('.preview-stage + div button');
    const originalBtn = toggleButtons[0];
    const aiBtn = toggleButtons[1];
    if (!originalBtn || !aiBtn) return;

    // Update button states based on available videos
    if (generatedVideos.length > 0) {
      aiBtn.disabled = false;
      aiBtn.textContent = `AI Version (${generatedVideos.length})`;
      aiBtn.classList.remove('ghost-btn');
      aiBtn.classList.add('primary-btn');
    } else {
      aiBtn.disabled = true;
      aiBtn.textContent = 'No AI Versions';
      aiBtn.classList.remove('primary-btn');
      aiBtn.classList.add('ghost-btn');
    }

    // Update current video info
    const activeOutputDiv = container.querySelector('.subtle-card:nth-child(3) .text-sm');
    const activeDescDiv = container.querySelector('.subtle-card:nth-child(3) .text-xs');
    if (activeOutputDiv && activeDescDiv) {
      if (currentVideoIndex === 0) {
        activeOutputDiv.textContent = 'Original Video';
        activeDescDiv.textContent = 'Source video';
      } else {
        const video = generatedVideos[currentVideoIndex - 1];
        if (video) {
          activeOutputDiv.textContent = video.description;
          activeDescDiv.textContent = video.type;
        }
      }
    }
  }

  const chat = container.querySelector('#chat');
  const input = container.querySelector('#input');
  const planPreview = container.querySelector('#plan-preview');

  const handleInput = async (val) => {
    if (!val) return;
    input.value = '';

    log(val, 'user');

    if (runtime) {
      // Use the real director runtime
      try {
        const result = await runtime.processChatCommand(val);
        const activatedAgents = result.activatedAgents || [];
        const agentNames = activatedAgents.map(a => typeof a === 'string' ? a : a.name || a).join(', ');

        if (activatedAgents.length > 0) {
          log(`Activating agents: ${agentNames}`, 'agent');
          planPreview.textContent = `Agents: ${agentNames}`;
        }

        // Execute agent commands
        for (const agent of activatedAgents) {
          const agentId = typeof agent === 'string' ? agent : agent.id;
          try {
            await runtime.executeAgentCommand(agentId, { videoUrl: runtime.getVideoUrl() });
          } catch (error) {
            log(`Agent ${agentId} failed: ${error.message}`, 'agent');
          }
        }

        if (activatedAgents.length === 0) {
          log('No specific agents needed for this task.', 'agent');
        }
      } catch (error) {
        log(`Error processing command: ${error.message}`, 'agent');
      }
    } else {
      // Fallback to direct API calls
      const intent = parseIntent(val);
      const tasks = planTasks(intent);
      const planText = tasks.join(' → ');
      log(`Plan: ${planText}`, 'agent');
      planPreview.textContent = planText;

      // Create job and execute with real API calls
      createJob(tasks);
    }
  };

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      await handleInput(input.value.trim());
    }
  });

  function log(text, type = 'agent') {
    const el = document.createElement('div');
    el.className = type === 'user' ? 'chat-bubble-user text-sm text-white/85' : 'chat-bubble-agent text-sm text-white/80';
    el.textContent = type === 'user' ? `You: ${text}` : `Agent: ${text}`;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  }

  container.querySelectorAll('#quick-actions [data-prompt]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const prompt = btn.dataset.prompt;
      log(`Quick action: ${prompt}`, 'user');

      if (!uploadedVideoUrl) {
        log('Please upload a video first', 'agent');
        showToast('Please upload a video before running actions', 'warning');
        return;
      }

      // Map quick actions to tasks
      const actionTaskMap = {
        'Create highlights from this video': ['scene-detect', 'score-moments', 'cut-clips', 'export'],
        'Make 3 short vertical clips': ['detect-hooks', 'resize-vertical', 'caption', 'export'],
        'Add captions to this video': ['transcribe', 'caption'],
        'Dub this video into Spanish': ['transcribe', 'translate', 'tts', 'replace-audio'],
        'Improve video quality and pacing': ['analyze-quality', 'improve-pacing', 'color-balance', 'export']
      };

      const tasks = actionTaskMap[prompt];
      if (tasks) {
        planPreview.textContent = `Quick action: ${tasks.join(' → ')}`;
        createJob(tasks);
      } else {
        // Fallback to text input
        input.value = prompt;
        await handleInput(prompt);
      }
    });
  });

  // ==========================================
  // 4. VIDEO UPLOAD FUNCTIONALITY
  // ==========================================
  const previewStage = container.querySelector('#preview-stage');
  const videoElement = container.querySelector('#video');
  const uploadZone = container.querySelector('#upload-zone');
  const dropZone = container.querySelector('#drop-zone');
  const fileInput = container.querySelector('#video-upload');

  function showVideoPlayer(url) {
    uploadedVideoUrl = url;
    videoElement.src = url;
    videoElement.style.display = 'block';
    uploadZone.style.display = 'none';

    // Update runtime if available
    if (runtime) {
      runtime.setVideoUrl(url);
    }
  }



  // Drag and drop handlers
  previewStage.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = true;
    dropZone.classList.add('drag-over');
  });

  previewStage.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!previewStage.contains(e.relatedTarget)) {
      isDragOver = false;
      dropZone.classList.remove('drag-over');
    }
  });

  previewStage.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDragOver = false;
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleVideoFile(files[0]);
    }
  });

  // Click to upload
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleVideoFile(file);
    }
  });

  function handleVideoFile(file) {
    if (!file.type.startsWith('video/')) {
      showToast('Please select a video file.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024 * 1024) { // 2GB limit
      showToast('File size must be less than 2GB.', 'error');
      return;
    }

    const url = URL.createObjectURL(file);
    showVideoPlayer(url);

    // Extract metadata
    extractVideoMetadata(file);

    // Update metadata display
    const sourceDiv = container.querySelector('.subtle-card:nth-child(1) .text-sm');
    const sizeDiv = container.querySelector('.subtle-card:nth-child(1) .text-xs');
    if (sourceDiv && sizeDiv) {
      sourceDiv.textContent = file.name;
      sizeDiv.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB • ${file.type}`;
    }
  }

  async function extractVideoMetadata(file) {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
      });

      metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        codec: file.type,
        filename: file.name
      };

      updateInspectorSection();
      URL.revokeObjectURL(video.src);
    } catch (error) {
      console.warn('Could not extract video metadata:', error);
    }
  }

  // ==========================================
  // 5. GOAL BUTTON HANDLERS
  // ==========================================
  container.querySelectorAll('.goal-btn[data-goal]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const goal = btn.dataset.goal;
      input.value = goal;
      await handleInput(goal);
    });
  });

  // ==========================================
  // 6. TAB SWITCHING FUNCTIONALITY
  // ==========================================
  const tabButtons = container.querySelectorAll('.tab-btn');
  const tabContents = container.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;

      // Update button states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Show selected tab content
      tabContents.forEach(content => {
        content.style.display = content.id === tabName ? 'block' : 'none';
      });
    });
  });

  // Add video controls
  const toggleButtons = container.querySelectorAll('.preview-stage + div button');
  const originalBtn = toggleButtons[0];
  const aiBtn = toggleButtons[1];

  if (originalBtn && aiBtn) {
    originalBtn.addEventListener('click', () => {
      currentVideoIndex = 0;
      if (uploadedVideoUrl) {
        showVideoPlayer(uploadedVideoUrl);
      }
      updateVideoToggle();
    });

    aiBtn.addEventListener('click', () => {
      if (generatedVideos.length > 0) {
        currentVideoIndex = (currentVideoIndex % (generatedVideos.length + 1)) || 1;
        const video = generatedVideos[currentVideoIndex - 1];
        if (video && video.url) {
          showVideoPlayer(video.url);
        }
        updateVideoToggle();
      } else {
        showToast('No AI processed videos available', 'info');
      }
    });
  }

  return container;
}