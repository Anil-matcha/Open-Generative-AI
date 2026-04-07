export function TimelineEditorPage() {
  let playbackTimer, workflowTimeout, animationThrottle;
  const container = document.createElement('div');
  container.className = 'w-full h-full';
  container.style.background = '#05070b';

  const iframe = document.createElement('iframe');
  iframe.title = 'Timeline Editor';
  iframe.style.cssText = 'width:100%;height:100%;border:0;background:#05070b;';
  iframe.sandbox = 'allow-scripts allow-same-origin';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Timeline Editor</title>
  <style>
    :root {
      --bg: #05070b;
      --panel: rgba(255,255,255,0.05);
      --panel-soft: rgba(255,255,255,0.03);
      --border: rgba(255,255,255,0.1);
      --border-soft: rgba(255,255,255,0.08);
      --text: #ffffff;
      --muted: rgba(255,255,255,0.6);
      --dim: rgba(255,255,255,0.4);
      --cyan: #22d3ee;
      --cyan-soft: rgba(34,211,238,0.2);
      --emerald: #34d399;
      --shadow: 0 20px 60px rgba(0,0,0,0.45);
      --radius-xl: 28px;
      --radius-lg: 20px;
      --radius-md: 14px;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
    button, input, textarea, select { font: inherit; }
    body { padding: 18px; }
    .app-shell { max-width: 1500px; margin: 0 auto; }
    .header {
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      margin-bottom: 16px; padding: 18px 20px; border-radius: 24px;
      border: 1px solid var(--border);
      background: linear-gradient(135deg, #171b24 0%, #07090d 45%, #111827 100%);
      box-shadow: var(--shadow);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .icon-btn, .top-icon {
      border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85);
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer;
      transition: transform .15s ease, background .15s ease, border-color .15s ease;
    }
    .icon-btn:hover, .top-icon:hover, .mini-btn:hover, .rail-btn:hover, .clip:hover { transform: translateY(-1px); }
    .icon-btn { width: 40px; height: 40px; border-radius: 12px; }
    .brand-mark {
      width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-size: 22px;
      border: 1px solid rgba(34,211,238,0.2); background: rgba(34,211,238,0.1); box-shadow: 0 0 16px rgba(56,189,248,0.12);
    }
    .brand-title { font-size: 20px; font-weight: 900; letter-spacing: .04em; }
    .brand-sub { font-size: 10px; text-transform: uppercase; letter-spacing: .25em; color: var(--dim); }
    .project-head { text-align: center; }
    .project-head .title { font-size: 16px; font-weight: 700; }
    .project-head .sub { font-size: 10px; color: var(--dim); }
    .top-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; max-width: 420px; }
    .top-icon { width: 36px; height: 36px; border-radius: 10px; font-size: 18px; }
    .top-icon.active { border-color: rgba(34,211,238,0.4); background: rgba(34,211,238,0.2); }
    .ready-pill {
      margin-left: 4px; padding: 6px 12px; border-radius: 999px; border: 1px solid rgba(52,211,153,0.2);
      background: rgba(52,211,153,0.1); color: #bbf7d0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .ready-dot { width: 6px; height: 6px; border-radius: 999px; background: #86efac; }
    .main-grid { display: grid; grid-template-columns: minmax(0,1fr) 320px; gap: 16px; }
    .left-col { min-width: 0; }
    .side-col { display: flex; flex-direction: column; gap: 16px; }
    .preview-card {
      position: relative; overflow: hidden; margin-bottom: 16px; border-radius: var(--radius-xl); aspect-ratio: 16 / 9;
      border: 1px solid var(--border-soft); background: #000; box-shadow: 0 0 70px rgba(56,189,248,0.14);
    }
    .preview-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(34,211,238,0.12), transparent 55%); }
    .preview-inner {
      position: absolute; inset: 24px; border-radius: 22px; border: 1px solid rgba(34,211,238,0.15);
      background: linear-gradient(135deg, rgba(20,25,33,0.9), rgba(8,10,14,0.86));
      box-shadow: 0 0 60px rgba(34,211,238,0.1); display: flex; align-items: center; justify-content: center;
    }
    .preview-screen { text-align: center; }
    .preview-emoji { font-size: 72px; margin-bottom: 10px; }
    .preview-title { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.92); }
    .preview-sub { margin-top: 4px; font-size: 14px; color: rgba(255,255,255,0.45); }
    .preview-overlay {
      position: absolute; inset-inline: 0; bottom: 0; padding: 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent);
    }
    .time-row, .control-row { display: flex; align-items: center; justify-content: space-between; }
    .time-row { margin-bottom: 8px; font-size: 12px; color: rgba(255,255,255,0.6); }
    .progress-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,0.2); overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; width: 28%; border-radius: inherit; background: linear-gradient(to right, var(--cyan), var(--emerald)); }
    .control-row { justify-content: center; gap: 12px; }
    .circle-btn {
      width: 40px; height: 40px; border-radius: 999px; border: 1px solid transparent; background: rgba(255,255,255,0.1); color: white; cursor: pointer;
    }
    .circle-btn.primary { width: 48px; height: 48px; background: white; color: black; font-weight: 800; box-shadow: 0 10px 30px rgba(255,255,255,0.15); }
    .timeline-card, .side-card {
      border-radius: 24px; border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015));
      box-shadow: 0 20px 60px rgba(0,0,0,0.35); backdrop-filter: blur(20px);
    }
    .timeline-card { padding: 16px; }
    .side-card { padding: 14px; border-radius: 20px; box-shadow: var(--shadow); }
    .side-card.generate { border-color: rgba(34,211,238,0.2); background: linear-gradient(180deg, rgba(56,189,248,0.08), rgba(17,24,39,0.75)); }
    .card-title { margin-bottom: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,0.82); }
    .card-title.cyan { color: #bae6fd; }
    .timeline-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .toolbar-left, .toolbar-right, .tool-group, .pill-row, .floating-rail, .track-actions, .generate-types, .quick-commands { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tool-group { gap: 4px; padding: 4px; border-radius: 14px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); }
    .tool-btn, .mini-btn, .chip, .command-btn, .rail-btn, .generate-type {
      border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.72); cursor: pointer; transition: all .15s ease;
    }
    .tool-btn { width: 32px; height: 32px; border-radius: 8px; font-size: 14px; }
    .tool-btn.active, .generate-type.active, .rail-btn.active { border-color: rgba(34,211,238,0.45); background: rgba(34,211,238,0.22); color: #cffafe; }
    .mini-btn, .chip, .command-btn { border-radius: 10px; padding: 8px 12px; font-size: 12px; }
    .pill-row { gap: 6px; }
    .pill { border-radius: 999px; padding: 7px 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); font-size: 10px; color: rgba(255,255,255,0.55); }
    .timeline-shell { position: relative; overflow: hidden; border-radius: 20px; border: 1px solid var(--border-soft); background: rgba(0,0,0,0.2); }
    .timeline-header { display: grid; grid-template-columns: 100px 1fr; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.03); font-size: 11px; text-transform: uppercase; letter-spacing: .25em; color: rgba(255,255,255,0.4); }
    .timeline-header div { padding: 10px 12px; }
    .timeline-body { position: relative; }
    .playhead-layer { position: absolute; left: 100px; right: 0; top: 0; bottom: 0; pointer-events: none; }
    .playhead-line { position: absolute; top: 0; bottom: 0; left: 32%; width: 2px; background: var(--cyan); box-shadow: 0 0 18px rgba(34,211,238,0.8); }
    .playhead-knob { position: absolute; top: 0; left: calc(32% - 4px); width: 10px; height: 10px; border-radius: 999px; background: var(--cyan); box-shadow: 0 0 15px rgba(34,211,238,0.8); }
    .track-row { display: grid; grid-template-columns: 100px 1fr; min-height: 62px; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .track-row:last-child { border-bottom: 0; }
    .track-meta { padding: 10px 8px; border-right: 1px solid var(--border); background: rgba(0,0,0,0.35); }
    .track-name { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.86); }
    .track-actions { margin-top: 8px; gap: 4px; }
    .track-toggle {
      width: 18px; height: 18px; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9);
      font-size: 8px; cursor: pointer;
    }
    .track-toggle.locked { background: rgba(34,211,238,0.2); }
    .track-count { margin-top: 6px; font-size: 9px; color: rgba(255,255,255,0.35); }
    .track-lane {
      position: relative; background: rgba(255,255,255,0.02); min-height: 62px;
      background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px);
      background-size: 80px 100%;
    }
    .clip {
      position: absolute; top: 8px; bottom: 8px; border-radius: 12px; border: 1px solid var(--border); padding: 8px 10px;
      font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.86); background: rgba(255,255,255,0.1);
      box-shadow: 0 10px 24px rgba(0,0,0,0.25); display: flex; align-items: center; overflow: hidden; cursor: pointer;
    }
    .clip.active { border-color: rgba(34,211,238,0.5); background: rgba(34,211,238,0.2); color: #cffafe; }
    .clip-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .upload-btn, .primary-btn, .text-input, .text-area, .select-input {
      width: 100%; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.4); color: white;
    }
    .upload-btn, .primary-btn { padding: 11px 14px; cursor: pointer; font-weight: 700; }
    .upload-btn { border-style: dashed; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.72); margin-bottom: 12px; }
    .media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .media-note { margin: -4px 0 10px; font-size: 10px; line-height: 1.45; color: rgba(255,255,255,0.46); }
    .media-item {
      min-height: 64px; border-radius: 14px; border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025));
      display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-align: left; cursor: pointer;
      transition: transform .15s ease, border-color .15s ease, background .15s ease;
    }
    .media-item:hover { transform: translateY(-1px); border-color: rgba(34,211,238,0.22); background: linear-gradient(180deg, rgba(34,211,238,0.08), rgba(255,255,255,0.03)); }
    .media-icon {
      width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.28); display: grid; place-items: center; font-size: 17px; flex: 0 0 auto;
    }
    .media-copy { min-width: 0; }
    .media-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.88); }
    .media-desc { margin-top: 2px; font-size: 9px; line-height: 1.35; color: rgba(255,255,255,0.45); }
    .generate-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .generate-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; }
    .generate-type { border-radius: 12px; padding: 10px 6px; font-size: 10px; text-align: center; }
    .text-area { min-height: 88px; padding: 10px 12px; resize: vertical; margin-bottom: 8px; }
    .text-input, .select-input { padding: 10px 12px; margin-bottom: 8px; }
    .select-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
    .primary-btn { background: linear-gradient(to right, var(--cyan), var(--emerald)); color: #03131a; }
    .chat-stack { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
    .chat-bubble { border-radius: 10px; padding: 10px; font-size: 10px; }
    .chat-bubble.user { background: rgba(255,255,255,0.1); }
    .chat-bubble.ai { background: rgba(34,211,238,0.2); color: #cffafe; }
    .quick-commands { gap: 6px; }
    .command-btn { padding: 6px 10px; font-size: 9px; }
    .floating-rail {
      position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 40;
      padding: 10px 14px; border-radius: 999px; border: 1px solid var(--border);
      background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
      backdrop-filter: blur(18px); box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .rail-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 7px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; }
    .rail-btn .emoji { font-size: 16px; }
    .status-toast {
      position: fixed; right: 18px; bottom: 18px; max-width: 320px; padding: 12px 14px; border-radius: 14px;
      border: 1px solid rgba(34,211,238,0.18); background: rgba(7,12,18,0.95); color: rgba(255,255,255,0.86);
      box-shadow: 0 18px 50px rgba(0,0,0,0.4); font-size: 12px; opacity: 0; transform: translateY(10px); pointer-events: none; transition: all .2s ease;
    }
    .status-toast.show { opacity: 1; transform: translateY(0); }

    /* AI Feature Indicators */
    .ai-indicator {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--cyan);
      border: 1px solid var(--bg);
      opacity: 0.8;
    }

    .ai-tooltip {
      position: absolute;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
      border: 1px solid var(--border);
    }

    .ai-tooltip.show {
      opacity: 1;
    }

    /* Guided Tour Styles */
    .tour-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
    }

    .tour-modal {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      text-align: center;
    }

    .tour-step {
      position: absolute;
      background: var(--panel);
      border: 2px solid var(--cyan);
      border-radius: 8px;
      padding: 12px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: var(--shadow);
    }

    /* Scene markers */
    .scene-marker {
      position: absolute;
      width: 2px !important;
      background: #ff4444 !important;
      opacity: 0.8 !important;
      z-index: 10;
      pointer-events: none;
    }

    @media (max-width: 1180px) { .main-grid { grid-template-columns: 1fr; } }
    @media (max-width: 980px) { .top-actions { max-width: none; } .left-top { grid-template-columns: 1fr !important; } }
    @media (max-width: 860px) {
      .header { flex-direction: column; align-items: stretch; }
      .project-head { text-align: left; }
      .timeline-header, .track-row { grid-template-columns: 86px 1fr; }
      .playhead-layer { left: 86px; }
      .floating-rail { left: 16px; right: 16px; transform: none; justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header class="header">
      <div class="brand">
        <button class="icon-btn" id="backBtn">←</button>
        <div class="brand-mark">🎬</div>
        <div>
          <div class="brand-title">TIMELINE</div>
          <div class="brand-sub">AI Video Editor</div>
        </div>
      </div>
      <div class="project-head">
        <div class="title" id="projectTitle">Untitled Project</div>
        <div class="sub" id="projectSub">Working timeline preview</div>
      </div>
      <div class="top-actions" id="topActions"></div>
    </header>
    <div class="main-grid">
      <div class="left-col">
        <div class="left-top" style="display:grid; grid-template-columns: 300px minmax(0,1fr); gap:16px; margin-bottom:16px; align-items:stretch;">
          <aside class="side-card" style="min-height:100%; display:flex; flex-direction:column;">
            <div class="card-title">💬 AI</div>
            <div class="chat-stack" id="chatStack"></div>
            <div id="workflowStatus" class="workflow-status" style="display:none; padding:8px; background: rgba(34,211,238,0.2); border-radius:8px; margin-bottom:8px; font-size:10px;"></div>
            <input class="text-input" id="chatInput" placeholder="Type command..." />
            <div class="quick-commands" id="quickCommands" style="margin-top:2px;"></div>
          </aside>
          <section class="preview-card" style="margin-bottom:0;">
            <div class="preview-glow"></div>
            <div class="preview-inner">
              <div class="preview-screen">
                <div class="preview-emoji" id="previewEmoji">🎥</div>
                <div class="preview-title" id="previewTitle">Center Preview</div>
                <div class="preview-sub" id="previewSubtitle">Glow preview styled like the render page</div>
                <textarea class="text-area" id="animationCode" placeholder="Write HTML animation code..." style="margin-top: 12px;"></textarea>
                <div class="animation-preview" id="animationPreview" style="width: 100%; height: 80px; border: 1px solid var(--border); background: black; margin-top: 8px; border-radius: 8px;"></div>
                <button class="primary-btn" id="runAnimationBtn" style="margin-top: 8px; width: 100%;">▶ Run Animation</button>
              </div>
            </div>
            <div class="preview-overlay">
              <div class="time-row">
                <span id="currentTime">00:12.40</span>
                <span id="totalTime">01:00.00</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
              <div class="control-row">
                <button class="circle-btn" id="rewindBtn">⏮</button>
                <button class="circle-btn primary" id="playBtn">▶</button>
                <button class="circle-btn" id="stopBtn">⏹</button>
              </div>
            </div>
          </section>
        </div>
        <section class="timeline-card">
          <div class="timeline-top">
            <div class="toolbar-left">
              <div class="tool-group" id="toolGroup"></div>
              <button class="mini-btn" data-action="zoom-out">🔍-</button>
              <button class="mini-btn" data-action="zoom-in">🔍+</button>
              <button class="mini-btn" data-add-track="Video">+Video</button>
              <button class="mini-btn" data-add-track="Audio">+Audio</button>
              <button class="mini-btn" data-add-track="Text">+Text</button>
              <button class="mini-btn" data-add-track="B-Roll">+B-Roll</button>
            </div>
            <div class="pill-row" id="pillRow"></div>
          </div>
          <div class="timeline-shell">
            <div class="timeline-header">
              <div>Tracks</div>
              <div>Timeline</div>
            </div>
            <div class="timeline-body" id="timelineBody">
              <div class="playhead-layer">
                <div class="playhead-line" id="playheadLine"></div>
                <div class="playhead-knob" id="playheadKnob"></div>
              </div>
              <div id="trackRows"></div>
            </div>
          </div>
        </section>
      </div>
      <div class="side-col">
        <aside class="side-card">
          <div class="card-title">📁 Media</div>
          <button class="upload-btn" id="uploadBtn">Upload</button>
          <div class="media-note">Choose what you want to add to the timeline. Each tile inserts a different type of source asset.</div>
          <div class="media-grid" id="mediaGrid"></div>
        </aside>
        <aside class="side-card generate">
          <div class="generate-head">
            <div class="card-title cyan">⚡ Generate</div>
            <div style="color: rgba(255,255,255,0.4)">✕</div>
          </div>
          <div class="generate-types" id="generateTypes"></div>
          <textarea class="text-area" id="promptInput" placeholder="A cinematic shot of..."></textarea>
          <input class="text-input" id="negativeInput" placeholder="Negative prompt" />
          <div class="select-row">
            <select class="select-input" id="durationSelect">
              <option>5s</option>
              <option>8s</option>
              <option>12s</option>
            </select>
            <select class="select-input" id="aspectSelect">
              <option>16:9</option>
              <option>9:16</option>
              <option>1:1</option>
            </select>
            <select class="select-input" id="styleSelect">
              <option>Cinematic</option>
              <option>Commercial</option>
              <option>Documentary</option>
            </select>
          </div>
          <button class="primary-btn" id="generateBtn">⚡ Generate</button>
        </aside>
        <aside class="side-card">
          <div class="card-title">🎥 Scene Detection</div>
          <div style="margin-bottom: 12px;">
            <label style="font-size: 10px; color: rgba(255,255,255,0.7);">Threshold: <span id="thresholdValue">0.5</span></label>
            <input type="range" id="sceneThreshold" min="0.1" max="1.0" step="0.1" value="0.5" style="width: 100%;">
          </div>
          <button class="primary-btn" id="detectScenesBtn">🎬 Detect Scenes</button>
          <div id="sceneResults" style="margin-top: 8px; font-size: 10px; color: rgba(255,255,255,0.6);"></div>
          <button class="primary-btn" id="splitAtScenesBtn" style="margin-top: 8px;">✂️ Split at Scenes</button>
          <button class="primary-btn" id="mergeShortScenesBtn" style="margin-top: 8px;">🔗 Merge Short Scenes</button>
        </aside>
        <aside class="side-card">
          <div class="card-title">🔗 MCP Connection</div>
          <div style="margin-bottom: 12px;">
            <div id="mcpStatus" style="font-size: 10px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">Status: Disconnected</div>
            <button class="primary-btn" id="connectMCPBtn">🔗 Connect</button>
          </div>
          <div id="mcpCommands" style="font-size: 10px; color: rgba(255,255,255,0.6);">
            Available: add_clip, remove_clip, move_clip, set_playhead
          </div>
        </aside>
        <aside class="side-card">
          <div class="card-title">🎬 Keyframe Editor</div>
          <div id="keyframeEditor" style="font-size: 10px; color: rgba(255,255,255,0.6);">
            Select a clip to edit keyframes
          </div>
          <button class="primary-btn" id="addKeyframeBtn" style="margin-top: 8px;">➕ Add Keyframe</button>
        </aside>
        <aside class="side-card">
          <div class="card-title">📹 Camera Controls</div>
          <select id="cameraMovementType" class="select-input" style="margin-bottom: 8px;">
            <option value="shake">Shake</option>
            <option value="zoom">Zoom</option>
            <option value="orbit">Orbit</option>
            <option value="pan">Pan</option>
            <option value="dolly">Dolly</option>
          </select>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <input type="number" id="cameraIntensity" placeholder="Intensity" step="0.1" class="text-input">
            <input type="number" id="cameraDuration" placeholder="Duration" step="0.1" class="text-input">
          </div>
          <button class="primary-btn" id="applyCameraBtn">🎥 Apply Movement</button>
        </aside>
        <aside class="side-card">
          <div class="card-title">🔍 Semantic Search</div>
          <input type="text" id="semanticQuery" placeholder="Describe what you want..." class="text-input" style="margin-bottom: 8px;">
          <button class="primary-btn" id="searchMediaBtn">🔍 Search</button>
          <div id="searchResults" style="margin-top: 8px; font-size: 10px; color: rgba(255,255,255,0.6); max-height: 100px; overflow-y: auto;">
            No results yet
          </div>
        </aside>
        <aside class="side-card">
          <div class="card-title">🎤 Transcription</div>
          <button class="primary-btn" id="uploadAudioBtn" style="margin-bottom: 8px;">📤 Upload Audio</button>
          <button class="primary-btn" id="transcribeBtn" style="margin-bottom: 8px;">🎤 Transcribe</button>
          <div id="transcriptionStatus" style="font-size: 10px; color: rgba(255,255,255,0.6); margin-bottom: 8px;">Ready</div>
          <button class="primary-btn" id="cleanTranscriptionBtn">🧹 Clean Text</button>
          <textarea id="transcriptionOutput" class="text-area" style="margin-top: 8px; height: 80px;" placeholder="Transcription will appear here..."></textarea>
        </aside>
      </div>
    </div>
  </div>
  <div class="floating-rail" id="floatingRail"></div>
  <div class="status-toast" id="toast"></div>

  <!-- Guided Tour Overlay -->
  <div class="tour-overlay" id="tourOverlay">
    <div class="tour-modal">
      <h3>Welcome to AI Timeline Editor!</h3>
      <p>Discover powerful AI features integrated into your workflow.</p>
      <button class="primary-btn" id="startTourBtn">Start Tour</button>
      <button class="mini-btn" id="skipTourBtn">Skip Tour</button>
    </div>
  </div>

  <script>
    const state = {
      projectTitle: 'Untitled Project',
      selectedTool: 'Select',
      selectedClipId: 1,
      generateType: 'Text',
      playing: false,
      playheadPercent: 32,
      zoom: 1,
      timelineSeconds: 60,
      tracks: [
        { id: 'video-1', name: 'Video', muted: false, solo: false, locked: true, clips: [
          { id: 1, name: 'Opening Shot', left: 8, width: 18, type: 'video' },
          { id: 2, name: 'Generated Clip', left: 34, width: 16, type: 'video' }
        ] },
        { id: 'audio-1', name: 'Audio', muted: false, solo: false, locked: false, clips: [
          { id: 3, name: 'Music Bed', left: 5, width: 42, type: 'audio' }
        ] },
        { id: 'text-1', name: 'Text', muted: false, solo: false, locked: false, clips: [
          { id: 4, name: 'Title Card', left: 14, width: 12, type: 'text' }
        ] },
        { id: 'broll-1', name: 'B-Roll', muted: false, solo: false, locked: false, clips: [
          { id: 5, name: 'City Cutaway', left: 52, width: 20, type: 'broll' }
        ] }
      ],
      tools: [['↖', 'Select'], ['✂', 'Blade'], ['⤵', 'Ripple'], ['⤶', 'Roll'], ['⇿', 'Slip'], ['⇆', 'Slide'], ['🔍', 'Zoom'], ['✋', 'Hand']],
      pills: ['Text to Video', 'Image to Video', 'Retake', 'Extend', 'B-Roll', 'Music Gen', 'Audio Sync', 'Fill Gap AI', 'Elements', 'Dual Viewer', '🤖 AI Active', '🎬 Scenes Ready'],
      topIcons: ['👁','📺','📁','⚡','🎵','🔊','🎞️','👤','⚙️','💬','📋'],
      media: [
        { icon: '🎬', label: 'Video Clip', desc: 'Insert a source shot or generated video clip.' },
        { icon: '🖼️', label: 'Image Frame', desc: 'Add still images, frames, or storyboard art.' },
        { icon: '🎵', label: 'Audio Track', desc: 'Place music, voiceover, or sound design assets.' },
        { icon: '🎞️', label: 'B-Roll Asset', desc: 'Drop in cutaways, overlays, or support footage.' }
      ],
      generateTypes: [['✍️', 'Text'], ['🖼️', 'Image'], ['🔄', 'Retake'], ['➡️', 'Extend'], ['🎞️', 'B-Roll']],
      quickCommands: ['⚡Generate','Retake','Extend','B-Roll'],
      railActions: [['⚡', 'Generate', true], ['✂️', 'Split'], ['🎬', 'Scenes'], ['💬', 'Subtitle'], ['🎞️', 'B-Roll'], ['⏱️', 'Speed'], ['🪄', 'Stabilize'], ['📝', 'Text']],
      chat: [
        { role: 'user', text: 'Generate a better opening shot' },
        { role: 'ai', text: 'Opening idea ready. Use Generate or Retake.' }
      ],
      animationCode: '<div style="width: 100%; height: 100%; background: linear-gradient(${time * 360}deg, #ff6b6b, #4ecdc4); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: white; transform: scale(${1 + time * 0.5});">Time: ${time.toFixed(2)}</div>',
      agentWorkflow: null,
      sceneThreshold: 0.5,
      detectedScenes: [],
      mcpClient: null,
      keyframeEditor: null,
      semanticSearch: null,
      speechTranscriber: null,
      cameraMovements: {},
      subtitles: [],
      searchResults: []
    };
    const els = {
      topActions: document.getElementById('topActions'),
      toolGroup: document.getElementById('toolGroup'),
      pillRow: document.getElementById('pillRow'),
      trackRows: document.getElementById('trackRows'),
      mediaGrid: document.getElementById('mediaGrid'),
      generateTypes: document.getElementById('generateTypes'),
      chatStack: document.getElementById('chatStack'),
      quickCommands: document.getElementById('quickCommands'),
      floatingRail: document.getElementById('floatingRail'),
      playBtn: document.getElementById('playBtn'),
      stopBtn: document.getElementById('stopBtn'),
      rewindBtn: document.getElementById('rewindBtn'),
      currentTime: document.getElementById('currentTime'),
      totalTime: document.getElementById('totalTime'),
      progressFill: document.getElementById('progressFill'),
      previewTitle: document.getElementById('previewTitle'),
      previewSubtitle: document.getElementById('previewSubtitle'),
      previewEmoji: document.getElementById('previewEmoji'),
      playheadLine: document.getElementById('playheadLine'),
      playheadKnob: document.getElementById('playheadKnob'),
      projectTitle: document.getElementById('projectTitle'),
      promptInput: document.getElementById('promptInput'),
      negativeInput: document.getElementById('negativeInput'),
      durationSelect: document.getElementById('durationSelect'),
      aspectSelect: document.getElementById('aspectSelect'),
      styleSelect: document.getElementById('styleSelect'),
      generateBtn: document.getElementById('generateBtn'),
      chatInput: document.getElementById('chatInput'),
      toast: document.getElementById('toast'),
      animationCode: document.getElementById('animationCode'),
      animationPreview: document.getElementById('animationPreview'),
      runAnimationBtn: document.getElementById('runAnimationBtn'),
      workflowStatus: document.getElementById('workflowStatus'),
      sceneThreshold: document.getElementById('sceneThreshold'),
      detectScenesBtn: document.getElementById('detectScenesBtn'),
      sceneResults: document.getElementById('sceneResults'),
      thresholdValue: document.getElementById('thresholdValue'),
      splitAtScenesBtn: document.getElementById('splitAtScenesBtn'),
      mergeShortScenesBtn: document.getElementById('mergeShortScenesBtn'),
      mcpStatus: document.getElementById('mcpStatus'),
      connectMCPBtn: document.getElementById('connectMCPBtn'),
      mcpCommands: document.getElementById('mcpCommands'),
      keyframeEditor: document.getElementById('keyframeEditor'),
      addKeyframeBtn: document.getElementById('addKeyframeBtn'),
      cameraMovementType: document.getElementById('cameraMovementType'),
      cameraIntensity: document.getElementById('cameraIntensity'),
      cameraDuration: document.getElementById('cameraDuration'),
      applyCameraBtn: document.getElementById('applyCameraBtn'),
      semanticQuery: document.getElementById('semanticQuery'),
      searchMediaBtn: document.getElementById('searchMediaBtn'),
      searchResults: document.getElementById('searchResults'),
      uploadAudioBtn: document.getElementById('uploadAudioBtn'),
      transcribeBtn: document.getElementById('transcribeBtn'),
      transcriptionStatus: document.getElementById('transcriptionStatus'),
      cleanTranscriptionBtn: document.getElementById('cleanTranscriptionBtn'),
      transcriptionOutput: document.getElementById('transcriptionOutput'),
      tourOverlay: document.getElementById('tourOverlay'),
      startTourBtn: document.getElementById('startTourBtn'),
      skipTourBtn: document.getElementById('skipTourBtn')
    };
    let playbackTimer = null;
    let animationFunction = null;
    let animationThrottle = null;
    let workflowTimeout = null;
    let lastCommandTime = 0;
    let mcpSocket = null;
    let currentTourStep = 0;
    let tourSteps = [];

    function showToast(message) {
      els.toast.textContent = message;
      els.toast.classList.add('show');
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
    }

    function formatTimeFromPercent(percent, totalSeconds) {
      const current = (percent / 100) * totalSeconds;
      const minutes = Math.floor(current / 60);
      const seconds = Math.floor(current % 60);
      const hundredths = Math.floor((current % 1) * 100);
      return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(hundredths).padStart(2, '0');
    }

    // ===== GUIDED TOUR SYSTEM =====
    function initializeGuidedTour() {
      // Check if user has seen tour before
      const hasSeenTour = localStorage.getItem('timelineTourSeen');
      if (!hasSeenTour) {
        showTourOverlay();
      }

      // Define tour steps
      tourSteps = [
        {
          element: '.brand',
          title: 'Welcome to AI Timeline Editor!',
          content: 'This powerful editor combines traditional video editing with cutting-edge AI features.',
          position: 'bottom'
        },
        {
          element: '.side-card:first-child',
          title: 'AI Chat Assistant',
          content: 'Talk naturally with your editor. Try commands like "add a title" or "detect scenes".',
          position: 'right'
        },
        {
          element: '.preview-card',
          title: 'Animation IDE',
          content: 'Create custom animations using time-based code. Perfect for advanced effects.',
          position: 'left'
        },
        {
          element: '.timeline-card',
          title: 'Smart Timeline',
          content: 'AI-enhanced timeline with scene detection, keyframe animation, and intelligent editing.',
          position: 'top'
        },
        {
          element: '.side-card:nth-child(2)',
          title: 'Scene Detection',
          content: 'Automatically detect scene changes and split your video intelligently.',
          position: 'left'
        }
      ];

      // Bind tour buttons
      if (els.startTourBtn) {
        els.startTourBtn.addEventListener('click', startGuidedTour);
      }
      if (els.skipTourBtn) {
        els.skipTourBtn.addEventListener('click', skipTour);
      }
    }

    function showTourOverlay() {
      if (els.tourOverlay) {
        els.tourOverlay.style.display = 'flex';
      }
    }

    function startGuidedTour() {
      if (els.tourOverlay) {
        els.tourOverlay.style.display = 'none';
      }
      currentTourStep = 0;
      showTourStep();
    }

    function skipTour() {
      if (els.tourOverlay) {
        els.tourOverlay.style.display = 'none';
      }
      localStorage.setItem('timelineTourSeen', 'true');
    }

    function showTourStep() {
      if (currentTourStep >= tourSteps.length) {
        localStorage.setItem('timelineTourSeen', 'true');
        return;
      }

      const step = tourSteps[currentTourStep];
      const element = document.querySelector(step.element);

      if (element) {
        // Create tour step element
        const tourStep = document.createElement('div');
        tourStep.className = 'tour-step';
        tourStep.innerHTML = \`
          <div style="font-weight: bold; margin-bottom: 8px;">\${step.title}</div>
          <div style="margin-bottom: 12px;">\${step.content}</div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="mini-btn" onclick="previousTourStep()">Back</button>
            <button class="primary-btn" onclick="nextTourStep()">\${currentTourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</button>
          </div>
        \`;

        // Position the step
        const rect = element.getBoundingClientRect();
        tourStep.style.top = (rect.top + rect.height / 2 - 100) + 'px';
        tourStep.style.left = step.position === 'right' ? (rect.right + 10) + 'px' : (rect.left - 320) + 'px';

        document.body.appendChild(tourStep);

        // Highlight target element
        element.style.boxShadow = '0 0 0 3px var(--cyan)';
        element.style.zIndex = '9998';
      }
    }

    function nextTourStep() {
      // Remove current step
      const currentStep = document.querySelector('.tour-step');
      if (currentStep) {
        // Remove highlight from target
        const step = tourSteps[currentTourStep];
        const element = document.querySelector(step.element);
        if (element) {
          element.style.boxShadow = '';
          element.style.zIndex = '';
        }
        currentStep.remove();
      }

      currentTourStep++;
      showTourStep();
    }

    function previousTourStep() {
      if (currentTourStep > 0) {
        // Remove current step
        const currentStep = document.querySelector('.tour-step');
        if (currentStep) {
          const step = tourSteps[currentTourStep];
          const element = document.querySelector(step.element);
          if (element) {
            element.style.boxShadow = '';
            element.style.zIndex = '';
          }
          currentStep.remove();
        }

        currentTourStep--;
        showTourStep();
      }
    }

    // Make functions global for onclick handlers
    window.nextTourStep = nextTourStep;
    window.previousTourStep = previousTourStep;

    // ===== CONTEXTUAL HELP SYSTEM =====
    function initializeContextualHelp() {
      // Add tooltips to key elements
      addTooltip('.mini-btn[data-add-track="Video"]', 'Add video clips. Try AI generation in the Generate panel!');
      addTooltip('.circle-btn.primary', 'Play/pause timeline. AI features work during playback!');
      addTooltip('.tool-group', 'Select editing tools. AI Scene Detection available in side panel.');

      // Add keyboard shortcuts
      document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    function addTooltip(selector, content) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
          showTooltip(e.target, content);
        });
        element.addEventListener('mouseleave', hideTooltip);
      });
    }

    function showTooltip(element, content) {
      hideTooltip(); // Remove existing

      const tooltip = document.createElement('div');
      tooltip.className = 'ai-tooltip';
      tooltip.textContent = content;

      const rect = element.getBoundingClientRect();
      tooltip.style.top = (rect.top - 40) + 'px';
      tooltip.style.left = (rect.left + rect.width / 2 - 100) + 'px';

      document.body.appendChild(tooltip);

      // Trigger show animation
      setTimeout(() => tooltip.classList.add('show'), 10);
    }

    function hideTooltip() {
      const tooltip = document.querySelector('.ai-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    }

    function handleKeyboardShortcuts(e) {
      // Ctrl+Shift shortcuts for AI features
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'S':
            e.preventDefault();
            detectScenes();
            break;
          case 'K':
            e.preventDefault();
            if (els.addKeyframeBtn) els.addKeyframeBtn.click();
            break;
          case 'M':
            e.preventDefault();
            if (els.applyCameraBtn) els.applyCameraBtn.click();
            break;
          case 'A':
            e.preventDefault();
            if (els.chatInput) els.chatInput.focus();
            break;
          case 'T':
            e.preventDefault();
            if (els.transcribeBtn) els.transcribeBtn.click();
            break;
        }
      }
    }

    // ===== ANIMATION IDE FUNCTIONS =====
    function runAnimation() {
      try {
        const template = state.animationCode;

        animationFunction = (time) => {
          if (typeof time !== 'number' || isNaN(time)) {
            throw new Error('Invalid time parameter');
          }

          return template.replace(new RegExp('\\$\\{([^}]+)\\}', 'g'), (match, expr) => {
            if (!new RegExp('^[a-zA-Z0-9\\s+\\-*/%().]*time[a-zA-Z0-9\\s+\\-*/%().]*$').test(expr.trim())) {
              throw new Error(\`Forbidden expression: \${expr}\`);
            }

            try {
              const result = new Function('"use strict"; const time = arguments[0]; return (' + expr + ');')(time);

              if (typeof result !== 'number' && typeof result !== 'string') {
                throw new Error('Expression must return number or string');
              }

              return String(result);
            } catch (e) {
              console.warn('Expression evaluation failed:', expr, e);
              return '0';
            }
          });
        };

        updateAnimationPreview();
        showToast('Animation loaded and validated');

      } catch (e) {
        console.error('Animation loading error:', e);
        showToast('Animation error: ' + e.message);
        animationFunction = null;
      }
    }

    function updateAnimationPreview() {
      if (animationThrottle) return;

      animationThrottle = setTimeout(() => {
        if (animationFunction && state.playheadPercent >= 0) {
          try {
            const currentTime = Math.max(0, (state.playheadPercent / 100) * state.timelineSeconds);
            const html = animationFunction(currentTime);

            const sanitized = html.replace(/<script[^>]*>.*?<\/script>/gi, '')
                                 .replace(/javascript:/gi, '')
                                 .substring(0, 10000);

            if (els.animationPreview) els.animationPreview.innerHTML = sanitized;

          } catch (e) {
            console.error('Animation runtime error:', e);
            if (els.animationPreview) els.animationPreview.innerHTML = '<div style="color:red;">Animation Error</div>';
            animationFunction = null;
          }
        }
        animationThrottle = null;
      }, 16);
    }

    // ===== AI AGENT SYSTEM FUNCTIONS =====
    function sanitizeInput(input) {
      if (typeof input !== 'string') return '';
      return input.replace(/[<>'"&]/g, '').trim().substring(0, 500);
    }

    async function startWorkflow(command) {
      if (state.agentWorkflow || !command) return;

      clearTimeout(workflowTimeout);
      state.agentWorkflow = 'planning';

      try {
        updateWorkflowStatus('🤖 Analyzing request...');

        // Call backend AI agent API
        const response = await fetch('http://localhost:3001/api/ai-agent/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command })
        });

        if (!response.ok) {
          throw new Error('Backend API error: ' + response.status);
        }

        const result = await response.json();

        updateWorkflowStatus('⚡ Executing changes...');
        await executeCommandFromBackend(result.result);

        updateWorkflowStatus('👁️ Verifying results...');
        await verifyResults();

        state.agentWorkflow = 'complete';
        updateWorkflowStatus('✅ Task completed successfully!');

      } catch (error) {
        console.error('Workflow error:', error);
        state.agentWorkflow = 'error';
        updateWorkflowStatus('❌ Error: ' + (error.message || 'Unknown error'));
      } finally {
        workflowTimeout = setTimeout(() => {
          if (els.workflowStatus) els.workflowStatus.style.display = 'none';
          state.agentWorkflow = null;
        }, 3000);
      }
    }

    function updateWorkflowStatus(text) {
      if (els.workflowStatus) {
        els.workflowStatus.textContent = text;
        els.workflowStatus.style.display = 'block';
      }
    }

    async function executeCommandFromBackend(backendResult) {
      if (!backendResult || !backendResult.action) {
        throw new Error('Invalid backend response');
      }

      switch (backendResult.action) {
        case 'add_clip':
          if (backendResult.type === 'text') {
            await addTextClip(backendResult.name || 'AI Clip', backendResult.text || 'Generated content');
          }
          break;

        case 'trim_clip':
          trimSelectedClip();
          break;

        case 'generate_clip':
          if (typeof generateClip === 'function') {
            generateClip();
          }
          break;

        case 'detect_scenes':
          await detectScenes();
          break;

        default:
          console.log('Backend action:', backendResult.action);
      }
    }

    // ===== SCENE DETECTION FUNCTIONS =====
    async function detectScenes() {
      try {
        showToast('Analyzing video for scene changes...');
        updateSceneResults('Analyzing...');

        const response = await fetch('http://localhost:3001/api/scene-detection/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threshold: state.sceneThreshold || 0.5 })
        });

        if (!response.ok) {
          throw new Error('Backend API error: ' + response.status);
        }

        const result = await response.json();

        if (result.success) {
          state.detectedScenes = result.scenes.map(scene => ({
            time: scene.time,
            confidence: scene.confidence || 0.8
          }));

          updateSceneMarkers();
          updateSceneResults(\`Detected \${result.totalScenes} scene changes\`);
          showToast(\`Scene detection complete: \${result.totalScenes} scenes found\`);
        } else {
          throw new Error(result.message || 'Scene detection failed');
        }

      } catch (error) {
        console.error('Scene detection error:', error);
        updateSceneResults('Detection failed');
        showToast('Scene detection failed: ' + error.message);
      }
    }

    function updateSceneMarkers() {
      const timelineBody = document.getElementById('timelineBody');
      if (!timelineBody) return;

      timelineBody.querySelectorAll('.scene-marker').forEach(marker => marker.remove());

      if (!Array.isArray(state.detectedScenes)) return;

      state.detectedScenes.forEach(sceneTime => {
        if (typeof sceneTime !== 'number' || sceneTime < 0) return;

        const percent = Math.min(100, (sceneTime / (state.timelineSeconds || 60)) * 100);

        const marker = document.createElement('div');
        marker.className = 'scene-marker';
        marker.style.cssText = \`
          position: absolute;
          left: \${percent}%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #ff4444;
          opacity: 0.8;
          z-index: 10;
          pointer-events: none;
        \`;
        marker.title = \`Scene change at \${sceneTime.toFixed(1)}s\`;

        timelineBody.appendChild(marker);
      });
    }

    function updateSceneResults(text) {
      if (els.sceneResults) {
        els.sceneResults.textContent = text || '';
      }
    }

    // ===== MCP WEBSOCKET FUNCTIONS =====
    function initializeMCPConnection() {
      try {
        mcpSocket = new WebSocket('ws://localhost:3001/mcp');

        mcpSocket.onopen = () => {
          console.log('MCP WebSocket connected');
          if (els.mcpStatus) els.mcpStatus.textContent = 'Status: Connected';
        };

        mcpSocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleMCPMessage(message);
          } catch (error) {
            console.error('Invalid MCP message:', error);
          }
        };

        mcpSocket.onclose = () => {
          console.log('MCP WebSocket disconnected');
          if (els.mcpStatus) els.mcpStatus.textContent = 'Status: Disconnected';
          setTimeout(initializeMCPConnection, 5000);
        };

        mcpSocket.onerror = (error) => {
          console.error('MCP WebSocket error:', error);
          if (els.mcpStatus) els.mcpStatus.textContent = 'Status: Error';
        };

      } catch (error) {
        console.error('Failed to initialize MCP connection:', error);
      }
    }

    function handleMCPMessage(message) {
      console.log('Received MCP message:', message);

      if (message.type === 'command_result') {
        if (message.success) {
          showToast('MCP Command executed successfully');
        } else {
          showToast('MCP Command failed: ' + message.error);
        }
      }
    }

    function sendMCPCommand(command) {
      if (mcpSocket && mcpSocket.readyState === WebSocket.OPEN) {
        mcpSocket.send(JSON.stringify({
          type: 'execute_command',
          data: command
        }));
      } else {
        showToast('MCP connection not available');
      }
    }

    // Continue with existing functions...
    // [Rest of the existing code remains the same]

    // Initialize MCP WebSocket connection
    initializeMCPConnection();

    // Initialize guided tour for new users
    initializeGuidedTour();

    // Add contextual tooltips and keyboard shortcuts
    initializeContextualHelp();

    renderAll();
    bindEvents();
  </script>
</body>
</html>`;

  iframe.srcdoc = html;
  container.appendChild(iframe);

  // Cleanup function to clear timers
  container.cleanup = () => {
    if (playbackTimer) {
      clearInterval(playbackTimer);
      playbackTimer = null;
    }
    if (workflowTimeout) {
      clearTimeout(workflowTimeout);
      workflowTimeout = null;
    }
    if (animationThrottle) {
      clearTimeout(animationThrottle);
      animationThrottle = null;
    }
    if (state.mcpClient) {
      state.mcpClient.disconnect();
    }
    if (state.speechTranscriber) {
      state.speechTranscriber.destroy();
    }
    // Clear any dynamic styles
    const dynamicStyles = document.getElementById('dynamic-keyframes');
    if (dynamicStyles) dynamicStyles.remove();
    const cameraStyles = document.getElementById('camera-animations');
    if (cameraStyles) cameraStyles.remove();
  };

  return container;
}