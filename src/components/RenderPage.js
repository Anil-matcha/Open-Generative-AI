import { navigate } from '../lib/router.js';
import { showToast, createLoadingSpinner } from '../lib/loading.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { escapeHtml } from '../lib/security.js';

// Repository endpoints
const REPO_ENDPOINTS = {
  'open-higgsfield': { label: 'Open Higgsfield', status: 'connected', description: 'Primary orchestration layer for render workflows.' },
  director: { label: 'Director', status: 'connected', description: 'Prompt-based cinematic editing and agentic scene direction.' },
  vimax: { label: 'ViMax', status: 'connected', description: 'Enhancement, optimization, and cinematic finishing passes.' },
  rendiv: { label: 'Rendiv', status: 'connected', description: 'Render/export pipeline for final outputs and format variants.' },
  ltx: { label: 'LTX-Desktop', status: 'connected', description: 'Subtitles, dubbing, clips, and post-processing utilities.' },
  yucut: { label: 'chatvideo-yucut', status: 'connected', description: 'Shorts, highlights, scene extraction, and social cutdowns.' },
};

// Preset configurations
const PRESET_CONFIG = {
  'Luxury Brand Grade': { key: 'luxury-brand-grade', colorProfile: 'luxury-gloss', pacing: 'measured', musicMood: 'elegant', captionStyle: 'minimal-premium', exportProfile: '4k-master', finish: 'soft-bloom' },
  'Documentary Contrast': { key: 'documentary-contrast', colorProfile: 'documentary-neutral', pacing: 'grounded', musicMood: 'honest', captionStyle: 'editorial-clean', exportProfile: 'hq-delivery', finish: 'contrast-lift' },
  'Film Trailer Punch': { key: 'film-trailer-punch', colorProfile: 'trailer-high-impact', pacing: 'aggressive', musicMood: 'dramatic', captionStyle: 'bold-trailer', exportProfile: 'trailer-master', finish: 'cinematic-punch' },
  'Emotional Story Tone': { key: 'emotional-story-tone', colorProfile: 'warm-story', pacing: 'emotive', musicMood: 'inspirational', captionStyle: 'soft-story', exportProfile: 'story-delivery', finish: 'warm-glow' },
};

// Action pipelines
const ACTION_PIPELINES = {
  'AI Auto-Edit': { type: 'workflow', repoKeys: ['open-higgsfield', 'director', 'vimax', 'ltx'], pipeline: ['scene-detect', 'highlight-pass', 'subtitles', 'finishing'], statusLabel: 'AI auto-edit in progress' },
  'Agentic Editor': { type: 'editor', repoKeys: ['director', 'open-higgsfield'], pipeline: ['prompt-analysis', 'edit-plan', 'scene-adjustments'], statusLabel: 'Opening agentic editor' },
  'Full Editor': { type: 'editor', repoKeys: ['open-higgsfield', 'director'], pipeline: ['timeline-load', 'manual-edit'], statusLabel: 'Opening full editor' },
  'Create Shorts': { type: 'post', repoKeys: ['yucut', 'ltx', 'rendiv'], pipeline: ['shorts-plan', 'vertical-reframe', 'social-export'], statusLabel: 'Generating shorts' },
  'Generate Highlights': { type: 'post', repoKeys: ['yucut', 'director'], pipeline: ['scene-analysis', 'highlight-selection', 'clip-build'], statusLabel: 'Extracting highlights' },
  'Add Subtitles': { type: 'post', repoKeys: ['ltx', 'open-higgsfield'], pipeline: ['transcription', 'caption-styling', 'burn-in-or-srt'], statusLabel: 'Generating subtitles' },
  'Dub / Voiceover': { type: 'post', repoKeys: ['ltx', 'vimax'], pipeline: ['voice-plan', 'dub-render', 'mixdown'], statusLabel: 'Building voiceover' },
  'Export Variations': { type: 'export', repoKeys: ['rendiv', 'open-higgsfield'], pipeline: ['variant-plan', 'aspect-ratios', 'final-export'], statusLabel: 'Preparing export variations' },
  'Trailer Cut': { type: 'post', repoKeys: ['director', 'yucut', 'rendiv'], pipeline: ['teaser-selection', 'pace-build', 'export'], statusLabel: 'Building trailer cut' },
  'Social Resize': { type: 'post', repoKeys: ['yucut', 'rendiv'], pipeline: ['reframe', 'resize', 'channel-export'], statusLabel: 'Creating social formats' },
  'Remix Scene': { type: 'editor', repoKeys: ['director', 'vimax', 'open-higgsfield'], pipeline: ['scene-remix-plan', 'variation-pass', 'replace-preview'], statusLabel: 'Remixing selected scene' },
  'Export Video': { type: 'export', repoKeys: ['rendiv'], pipeline: ['master-export'], statusLabel: 'Exporting master video' },
  'Download Frame': { type: 'utility', repoKeys: ['open-higgsfield'], pipeline: ['frame-grab'], statusLabel: 'Preparing frame download' },
  'Queue Render': { type: 'render', repoKeys: ['open-higgsfield', 'rendiv'], pipeline: ['queue-job', 'render-handshake'], statusLabel: 'Queueing render job' },
  'Copy Prompt': { type: 'utility', repoKeys: ['open-higgsfield'], pipeline: ['copy-metadata'], statusLabel: 'Prompt copied' },
  'Duplicate Render': { type: 'utility', repoKeys: ['open-higgsfield'], pipeline: ['clone-project'], statusLabel: 'Duplicating render' },
  'Save as Template': { type: 'utility', repoKeys: ['open-higgsfield', 'director'], pipeline: ['template-save'], statusLabel: 'Saving template' },
  'Send to Storyboard': { type: 'editor', repoKeys: ['director', 'open-higgsfield'], pipeline: ['storyboard-transfer'], statusLabel: 'Sending to storyboard' },
  'Publish / Deliver': { type: 'delivery', repoKeys: ['rendiv', 'open-higgsfield'], pipeline: ['package-output', 'delivery-ready'], statusLabel: 'Preparing delivery package' },
};

// Action tiles config
const ACTION_TILES = [
  { title: 'Create Shorts', desc: 'Vertical cuts for Shorts, Reels, and TikTok.', icon: '🎬', accent: 'from-fuchsia-500/16 via-violet-500/8 to-indigo-500/14', iconBg: 'bg-fuchsia-500/16', iconBorder: 'border-fuchsia-400/25' },
  { title: 'Generate Highlights', desc: 'Pull standout scenes into shareable cuts.', icon: '✨', accent: 'from-cyan-500/16 via-sky-500/8 to-indigo-500/14', iconBg: 'bg-cyan-500/16', iconBorder: 'border-cyan-400/25' },
  { title: 'Add Subtitles', desc: 'Styled captions for social and cinematic delivery.', icon: '💬', accent: 'from-amber-500/14 via-orange-500/7 to-rose-500/12', iconBg: 'bg-amber-500/16', iconBorder: 'border-amber-400/25' },
  { title: 'Dub / Voiceover', desc: 'Narration, multilingual dubbing, and alt voice tracks.', icon: '🎙️', accent: 'from-emerald-500/14 via-teal-500/8 to-cyan-500/12', iconBg: 'bg-emerald-500/16', iconBorder: 'border-emerald-400/25' },
  { title: 'Trailer Cut', desc: 'Build a teaser or fast-paced trailer version.', icon: '🎞️', accent: 'from-rose-500/16 via-pink-500/8 to-fuchsia-500/12', iconBg: 'bg-rose-500/16', iconBorder: 'border-rose-400/25' },
  { title: 'Social Resize', desc: 'Reframe for feed, story, reel, and ad formats.', icon: '📱', accent: 'from-indigo-500/16 via-violet-500/8 to-blue-500/12', iconBg: 'bg-indigo-500/16', iconBorder: 'border-indigo-400/25' },
];

const NEXT_ACTIONS = [
  { title: 'AI Auto-Edit', desc: 'Automatic scene detection, highlights, subtitles, and finishing passes.', icon: '⚡' },
  { title: 'Agentic Editor', desc: 'Use AI commands to rewrite scenes, improve pacing, and enhance visuals.', icon: '🧠' },
  { title: 'Full Editor', desc: 'Jump into timeline editing with full manual control and cinematic precision.', icon: '✏️' },
  { title: 'Create Shorts', desc: 'Turn your main render into TikTok, Reels, and YouTube Shorts variations.', icon: '🎬' },
  { title: 'Generate Highlights', desc: 'Pull the strongest moments automatically and build highlight-ready clips.', icon: '✨' },
  { title: 'Add Subtitles', desc: 'Generate styled captions and subtitle layers for cinematic or social delivery.', icon: '💬' },
  { title: 'Dub / Voiceover', desc: 'Create alternate narration, dubbing tracks, and voice-driven versions.', icon: '🎙️' },
  { title: 'Export Variations', desc: 'Create multiple output versions by size, aspect ratio, and delivery format.', icon: '📦' },
];

const QUICK_ACTIONS = ['Trailer Cut', 'Social Resize', 'Remix Scene', 'Copy Prompt', 'Duplicate Render', 'Save as Template', 'Send to Storyboard', 'Publish / Deliver'];
const ACTION_BUTTONS = ['Export Video', 'Download Frame', 'Queue Render', 'Trailer Cut', 'Social Resize', 'Remix Scene'];

function titleCasePipelineStep(step) {
  return step.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}



export function RenderPage() {
  const container = document.createElement('div');
  container.className = 'min-h-screen w-full bg-[#0a0a0b] p-4 text-white md:p-8 overflow-y-auto custom-scrollbar';

  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('videoId') || 'vid_preview';
  const videoUrl = urlParams.get('videoUrl') || '';
  const videoTitle = urlParams.get('prompt') || 'Generated Video Prompt Title';

  let selectedPreset = 'Luxury Brand Grade';
  let activeAction = 'Export Video';
  let activeIntervals = [];
  let isRunning = false;
  const progress = 0;
  const currentStage = 'finishing';

  const inner = document.createElement('div');
  inner.className = 'w-full';

  // Hero section
  const hero = document.createElement('div');
  hero.className = 'relative mb-8 overflow-hidden rounded-[28px] md:mb-10';
  const heroBanner = createHeroSection('render', 'h-44 md:h-60');
  if (heroBanner) {
    heroBanner.classList.add('rounded-[28px]');
    const heroOverlay = document.createElement('div');
    heroOverlay.className = 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 md:p-8 z-10';
    heroOverlay.innerHTML = `
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-3 text-xs uppercase tracking-[0.28em] text-white/45">AI Film Studio</p>
          <h1 class="text-3xl font-black tracking-tight md:text-5xl text-white">Video Render</h1>
          <p class="mt-2 max-w-2xl text-sm text-white/60 md:text-base">Review, refine, and process your generated video with a cinematic render workflow.</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button id="saveDraftBtn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-100 shadow-lg shadow-black/20 transition hover:bg-white/10">Save Draft</button>
          <button id="startRenderBtn" class="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-xl transition hover:opacity-90">Start Render</button>
        </div>
      </div>
    `;
    heroBanner.appendChild(heroOverlay);
    hero.appendChild(heroBanner);
  } else {
    // Fallback if hero image not found
    hero.className = 'relative mb-8 h-44 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17181b_0%,#0c0d10_45%,#1b2230_100%)] md:mb-10 md:h-60';
    hero.innerHTML = `
      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 md:p-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="mb-3 text-xs uppercase tracking-[0.28em] text-white/45">AI Film Studio</p>
            <h1 class="text-3xl font-black tracking-tight md:text-5xl">Video Render</h1>
            <p class="mt-2 max-w-2xl text-sm text-white/60 md:text-base">Review, refine, and process your generated video with a cinematic render workflow.</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button id="saveDraftBtn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-zinc-100 shadow-lg shadow-black/20 transition hover:bg-white/10">Save Draft</button>
            <button id="startRenderBtn" class="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-xl transition hover:opacity-90">Start Render</button>
          </div>
        </div>
      </div>
    `;
  }
  inner.appendChild(hero);

  // Main grid
  const mainGrid = document.createElement('div');
  mainGrid.className = 'grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]';

  // Left section
  const leftSection = document.createElement('section');
  leftSection.className = 'rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_60px_rgba(99,102,241,0.08)] backdrop-blur-xl md:p-6';

  // Video title and status
  const headerDiv = document.createElement('div');
  headerDiv.className = 'mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between';
  headerDiv.innerHTML = `
    <div>
      <div class="truncate text-xl font-black md:text-2xl">${escapeHtml(videoTitle)}</div>
      <div class="mt-1 text-sm text-white/45">ID: ${escapeHtml(videoId)}</div>
    </div>
    <div class="flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
      <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
      Processing preview updated
    </div>
  `;
  leftSection.appendChild(headerDiv);

  // Connected pipeline info
  const pipelineInfo = document.createElement('div');
  pipelineInfo.className = 'mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  pipelineInfo.innerHTML = `
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.22em] text-white/40">Connected Pipeline</p>
        <h3 class="mt-2 text-lg font-black" id="statusLabel">Exporting master video</h3>
        <p class="mt-1 text-sm text-white/50">Rendiv</p>
      </div>
      <div class="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
        Preset: <span class="font-semibold text-white" id="presetLabel">${escapeHtml(selectedPreset)}</span>
      </div>
    </div>
  `;
  leftSection.appendChild(pipelineInfo);

  // Video preview area
  const previewArea = document.createElement('div');
  previewArea.className = 'relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-white/5 bg-black shadow-[0_0_120px_rgba(16,185,129,0.18),0_0_90px_rgba(99,102,241,0.14)] md:min-h-[460px]';
  previewArea.innerHTML = `
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_38%),radial-gradient(circle_at_50%_58%,rgba(16,185,129,0.20),transparent_34%)]"></div>
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.24),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(16,185,129,0.24),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.09),transparent_24%)]"></div>
    <div class="relative flex aspect-video w-[88%] max-w-3xl items-center justify-center overflow-hidden rounded-2xl border border-emerald-400/12 bg-[linear-gradient(135deg,#101114_0%,#191b20_50%,#0c0d10_100%)] shadow-[0_25px_80px_rgba(0,0,0,0.5),0_0_110px_rgba(16,185,129,0.20),0_0_70px_rgba(99,102,241,0.12)]">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(99,102,241,0.22),transparent_26%),radial-gradient(circle_at_50%_82%,rgba(16,185,129,0.22),transparent_24%)]"></div>
      <div class="absolute left-4 top-4 rounded-full border border-emerald-400/18 bg-black/45 px-3 py-1 text-xs text-emerald-100/80 shadow-[0_0_24px_rgba(16,185,129,0.14)] backdrop-blur" id="previewBadge">${escapeHtml(selectedPreset)} • ${progress}% • ${currentStage}</div>
      <div class="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs text-white/75 backdrop-blur" id="actionBadge">Export Video</div>
      <div class="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/10 backdrop-blur-md">
        <div class="ml-1 h-0 w-0 border-y-[14px] border-y-transparent border-l-[22px] border-l-white"></div>
      </div>
    </div>
  `;
  leftSection.appendChild(previewArea);

  // Stats row
  const statsRow = document.createElement('div');
  statsRow.className = 'mt-5 grid grid-cols-1 gap-4 md:grid-cols-3';
  statsRow.innerHTML = `
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p class="text-xs uppercase tracking-[0.2em] text-white/40">Duration</p><p class="mt-2 text-lg font-semibold">--:--</p></div>
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p class="text-xs uppercase tracking-[0.2em] text-white/40">Resolution</p><p class="mt-2 text-lg font-semibold">1920 × 1080</p></div>
    <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><p class="text-xs uppercase tracking-[0.2em] text-white/40">Estimated Time</p><p class="mt-2 text-lg font-semibold">--:--</p></div>
  `;
  leftSection.appendChild(statsRow);

  // Action buttons row
  const actionBtnsRow = document.createElement('div');
  actionBtnsRow.className = 'mt-5 flex flex-wrap gap-3';
  actionBtnsRow.id = 'actionButtonsRow';
  ACTION_BUTTONS.forEach(action => {
    const btn = document.createElement('button');
    btn.className = `rounded-2xl px-5 py-3 text-sm font-medium transition ${action === 'Export Video' ? 'bg-white text-black shadow-xl hover:opacity-90' : 'border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]'}`;
    btn.textContent = action;
    btn.onclick = () => runAction(action);
    actionBtnsRow.appendChild(btn);
  });
  leftSection.appendChild(actionBtnsRow);

  // Action tiles section
  const actionTilesSection = document.createElement('div');
  actionTilesSection.className = 'mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6';
  actionTilesSection.innerHTML = `
    <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><p class="text-xs uppercase tracking-[0.24em] text-white/40">Repurpose & Enhance</p><h3 class="mt-2 text-xl font-black">Action Tiles</h3></div>
      <p class="max-w-xl text-sm text-white/45">Compact action modules with cinematic glow and color accents.</p>
    </div>
  `;

  const tilesGrid = document.createElement('div');
  tilesGrid.className = 'grid grid-cols-1 gap-3 md:grid-cols-2';
  ACTION_TILES.forEach(tile => {
    const tileBtn = document.createElement('button');
    tileBtn.className = `group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.028))] px-4 py-4 text-left shadow-[0_14px_34px_rgba(0,0,0,0.26)] transition hover:-translate-y-0.5 hover:bg-white/[0.06]`;
    tileBtn.innerHTML = `
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 ${tile.accent}"></div>
      <div class="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/6"></div>
      <div class="relative z-10 flex items-start gap-4">
        <div class="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl shadow-[0_0_18px_rgba(99,102,241,0.14)] transition group-hover:scale-[1.03] ${tile.iconBg} ${tile.iconBorder}">${tile.icon}</div>
        <div class="min-w-0 flex-1">
          <div class="text-base font-black leading-tight text-white">${tile.title}</div>
          <div class="mt-1 text-sm leading-6 text-white/55">${tile.desc}</div>
          <div class="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"><span>Open Tool</span><span class="text-sm">→</span></div>
        </div>
      </div>
    `;
    tileBtn.onclick = () => runAction(tile.title);
    tilesGrid.appendChild(tileBtn);
  });
  actionTilesSection.appendChild(tilesGrid);
  leftSection.appendChild(actionTilesSection);

  // Quick actions
  const quickActionsDiv = document.createElement('div');
  quickActionsDiv.className = 'mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  quickActionsDiv.innerHTML = '<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p class="text-xs uppercase tracking-[0.24em] text-white/40">Quick Utilities</p><h3 class="mt-2 text-lg font-black">Post-Render Commands</h3></div></div>';
  const quickBtnsDiv = document.createElement('div');
  quickBtnsDiv.className = 'flex flex-wrap gap-2 mt-3 md:mt-0';
  QUICK_ACTIONS.forEach(action => {
    const btn = document.createElement('button');
    btn.className = 'rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/[0.08] transition';
    btn.textContent = action;
    btn.onclick = () => runAction(action);
    quickBtnsDiv.appendChild(btn);
  });
  quickActionsDiv.querySelector('div').appendChild(quickBtnsDiv);
  leftSection.appendChild(quickActionsDiv);

  // Presets section
  const presetsDiv = document.createElement('div');
  presetsDiv.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  presetsDiv.innerHTML = '<div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p class="text-xs uppercase tracking-[0.24em] text-white/40">Look & Finish</p><h3 class="mt-2 text-lg font-black">Cinematic Presets</h3></div></div>';
  const presetsBtnsDiv = document.createElement('div');
  presetsBtnsDiv.className = 'flex flex-wrap gap-2 mt-3 md:mt-0';
  presetsBtnsDiv.id = 'presetsContainer';
  Object.keys(PRESET_CONFIG).forEach(preset => {
    const btn = document.createElement('button');
    btn.className = `rounded-full border px-3 py-2 text-xs font-semibold transition ${preset === selectedPreset ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]'}`;
    btn.textContent = preset;
    btn.onclick = () => selectPreset(preset);
    presetsBtnsDiv.appendChild(btn);
  });
  presetsDiv.querySelector('div').appendChild(presetsBtnsDiv);

  // Preset details
  const presetDetails = document.createElement('div');
  presetDetails.className = 'mt-4 grid grid-cols-1 gap-3 md:grid-cols-3';
  presetDetails.id = 'presetDetails';
  const activePreset = PRESET_CONFIG[selectedPreset];
  presetDetails.innerHTML = `
    <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Color Profile</p><p class="mt-2 text-sm font-semibold text-white">${activePreset.colorProfile}</p></div>
    <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Pacing</p><p class="mt-2 text-sm font-semibold text-white">${activePreset.pacing}</p></div>
    <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Export Profile</p><p class="mt-2 text-sm font-semibold text-white">${activePreset.exportProfile}</p></div>
  `;
  presetsDiv.appendChild(presetDetails);
  leftSection.appendChild(presetsDiv);

  mainGrid.appendChild(leftSection);

  // Right sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'h-fit rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45),0_0_55px_rgba(99,102,241,0.08)] backdrop-blur-xl md:p-6';
  sidebar.innerHTML = '<h2 class="text-2xl font-black tracking-tight">NEXT ACTIONS</h2><p class="mb-6 mt-1 text-sm text-white/50">Choose how to proceed with your video</p>';

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'max-h-[540px] space-y-3 overflow-y-auto pr-1';
  NEXT_ACTIONS.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'w-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.028))] p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.22)] transition-all hover:bg-white/[0.06]';
    btn.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/20 text-xl shadow-[0_0_22px_rgba(99,102,241,0.18)]">${item.icon}</div>
        <div><div class="text-lg font-black leading-tight">${item.title}</div><div class="mt-1 text-sm text-white/50">${item.desc}</div></div>
      </div>
    `;
    btn.onclick = () => runAction(item.title);
    actionsContainer.appendChild(btn);
  });
  sidebar.appendChild(actionsContainer);

  // Progress section
  const progressSection = document.createElement('div');
  progressSection.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  progressSection.innerHTML = `
    <div class="mb-4 flex items-center gap-3"><div class="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div><div class="font-black" id="progressStatus">Exporting master video</div></div>
    <div class="mb-4"><div class="flex items-center justify-between text-xs"><span class="text-white/45">Progress</span><span class="font-bold text-emerald-200" id="progressPercent">${progress}%</span></div>
    <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-[linear-gradient(90deg,#10b981,#60a5fa)]" id="progressBar" style="width: ${progress}%"></div></div></div>
    <div class="space-y-2 text-sm" id="progressSteps">
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Scene Detection</span></div>
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Highlight Detection</span></div>
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Clip Generation</span></div>
      <div class="flex items-center gap-3 text-emerald-200"><div class="h-2.5 w-2.5 rounded-full bg-emerald-400"></div><span class="font-semibold">Subtitles</span></div>
      <div class="flex items-center gap-3 text-indigo-300"><div class="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-400"></div><span class="font-semibold">Final Export</span></div>
    </div>
  `;
  sidebar.appendChild(progressSection);

  // Output settings
  const outputSettings = document.createElement('div');
  outputSettings.className = 'mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  outputSettings.innerHTML = `
    <div><label class="mb-2 block text-sm text-white/50">Output Format</label><div class="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-200">MP4 (H.264)</div></div>
    <div><label class="mb-2 block text-sm text-white/50">Frame Rate</label><div class="rounded-2xl border border-white/10 bg-[#111118] px-4 py-3 text-sm text-zinc-200">24 FPS Cinematic</div></div>
    <div><label class="mb-2 block text-sm text-white/50">Quality</label><div class="h-2 rounded-full bg-white/10"><div class="h-2 w-[82%] rounded-full bg-white"></div></div><p class="mt-2 text-xs text-white/40">High quality master export</p></div>
  `;
  sidebar.appendChild(outputSettings);

  // Repo handlers
  const repoSection = document.createElement('div');
  repoSection.className = 'mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4';
  repoSection.innerHTML = '<p class="text-xs uppercase tracking-[0.22em] text-white/40">Repo Handlers</p><div class="mt-3 space-y-2" id="repoHandlers"></div>';
  const repoHandlers = repoSection.querySelector('#repoHandlers');
  ['open-higgsfield', 'rendiv'].forEach(repoKey => {
    const repo = REPO_ENDPOINTS[repoKey];
    repoHandlers.innerHTML += `
      <div class="rounded-xl border border-white/10 bg-black/20 p-3">
        <div class="flex items-center justify-between gap-3">
          <div><p class="text-sm font-semibold text-white">${repo.label}</p><p class="mt-1 text-xs text-white/45">${repo.description}</p></div>
          <span class="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-200">${repo.status}</span>
        </div>
      </div>
    `;
  });
  sidebar.appendChild(repoSection);

  mainGrid.appendChild(sidebar);
  inner.appendChild(mainGrid);
  container.appendChild(inner);

  // Action handler
  function runAction(action) {
    if (isRunning) return;
    isRunning = true;
    activeAction = action;

    const actionBadge = container.querySelector('#actionBadge');
    if (actionBadge) actionBadge.textContent = action;

    const pipeline = ACTION_PIPELINES[action];
    if (pipeline) {
      const statusLabel = container.querySelector('#statusLabel');
      const progressStatus = container.querySelector('#progressStatus');
      if (statusLabel) statusLabel.textContent = pipeline.statusLabel;
      if (progressStatus) progressStatus.textContent = pipeline.statusLabel;
    }

    showToast(`${action} started`);

    // Simulate progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        activeIntervals = activeIntervals.filter(i => i !== interval);
        isRunning = false;
        showToast(`${action} completed!`);
      }
      const progressBar = container.querySelector('#progressBar');
      const progressPercent = container.querySelector('#progressPercent');
      if (progressBar) progressBar.style.width = `${currentProgress}%`;
      if (progressPercent) progressPercent.textContent = `${Math.round(currentProgress)}%`;
    }, 500);
    activeIntervals.push(interval);
  }

  // Preset selector
  function selectPreset(preset) {
    selectedPreset = preset;
    const presetLabel = container.querySelector('#presetLabel');
    const previewBadge = container.querySelector('#previewBadge');
    const presetDetailsEl = container.querySelector('#presetDetails');

    if (presetLabel) presetLabel.textContent = preset;
    if (previewBadge) previewBadge.textContent = `${preset} • ${progress}% • ${currentStage}`;

    // Update preset buttons
    const presetsContainer = container.querySelector('#presetsContainer');
    if (presetsContainer) {
      presetsContainer.querySelectorAll('button').forEach(btn => {
        if (btn.textContent === preset) {
          btn.className = 'rounded-full border border-white bg-white text-black px-3 py-2 text-xs font-semibold transition';
        } else {
          btn.className = 'rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/[0.08] transition';
        }
      });
    }

    // Update preset details
    const config = PRESET_CONFIG[preset];
    if (presetDetailsEl && config) {
      presetDetailsEl.innerHTML = `
        <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Color Profile</p><p class="mt-2 text-sm font-semibold text-white">${config.colorProfile}</p></div>
        <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Pacing</p><p class="mt-2 text-sm font-semibold text-white">${config.pacing}</p></div>
        <div class="rounded-2xl border border-white/10 bg-black/20 p-3"><p class="text-[11px] uppercase tracking-[0.18em] text-white/40">Export Profile</p><p class="mt-2 text-sm font-semibold text-white">${config.exportProfile}</p></div>
      `;
    }

    showToast(`Preset: ${preset}`);
  }

  // Bind events
  container.querySelector('#saveDraftBtn')?.addEventListener('click', () => runAction('Save as Template'));
  container.querySelector('#startRenderBtn')?.addEventListener('click', () => runAction('Queue Render'));

  // Cleanup function to clear active intervals
  container.cleanup = () => {
    activeIntervals.forEach(interval => clearInterval(interval));
    activeIntervals = [];
  };

  return container;
}
