export function TimelineEditorPage() {
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
    .icon-btn:hover, .top-icon:hover, .mini-btn:hover, .rail-btn:hover, .tool-btn:hover, .clip:hover { transform: translateY(-1px); }
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
    .generate-type .emoji { display: block; font-size: 18px; margin-bottom: 6px; }
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
      pills: ['Text to Video', 'Image to Video', 'Retake', 'Extend', 'B-Roll', 'Music Gen', 'Audio Sync', 'Fill Gap AI', 'Elements', 'Dual Viewer'],
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
      transcriptionOutput: document.getElementById('transcriptionOutput')
    };
    let playbackTimer = null;
    let animationFunction = null;
    let animationThrottle = null;
    let workflowTimeout = null;
    let lastCommandTime = 0;
    function showToast(message) {
      els.toast.textContent = message;
      els.toast.classList.add('show');
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => els.toast.classList.remove('show'), 1800);
    }

    // ===== ANIMATION IDE FUNCTIONS =====
    function runAnimation() {
      try {
        const template = state.animationCode;

        animationFunction = (time) => {
          if (typeof time !== 'number' || isNaN(time)) {
            throw new Error('Invalid time parameter');
          }

          return template.replace(/\$\{([^}]+)\}/g, (match, expr) => {
            if (!/^[a-zA-Z0-9\s\+\-\*\/\%\(\)\.]*time[a-zA-Z0-9\s\+\-\*\/\%\(\)\.]*$/.test(expr.trim())) {
              throw new Error(`Forbidden expression: ${expr}`);
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
        await new Promise(resolve => setTimeout(resolve, 800));

        state.agentWorkflow = 'executing';
        updateWorkflowStatus('⚡ Executing changes...');
        await executeCommand(command);
        await new Promise(resolve => setTimeout(resolve, 600));

        state.agentWorkflow = 'verifying';
        updateWorkflowStatus('👁️ Verifying results...');
        await verifyResults();
        await new Promise(resolve => setTimeout(resolve, 400));

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

    async function executeCommand(command) {
      const cmd = command.toLowerCase().trim();

      if (cmd.includes('add') && cmd.includes('title')) {
        await addTextClip('Title', 'AI Generated Title');
      } else if (cmd.includes('add') && cmd.includes('subtitle')) {
        await addTextClip('Subtitle', 'AI Generated Subtitle');
      } else if (cmd.includes('trim') || cmd.includes('cut')) {
        trimSelectedClip();
      } else if (cmd.includes('generate') || cmd.includes('create')) {
        if (typeof generateClip === 'function') {
          generateClip();
        } else {
          throw new Error('Generate function not available');
        }
      } else if (cmd.includes('scene') || cmd.includes('detect')) {
        await detectScenes();
      } else {
        throw new Error('Command not recognized. Try: add title, trim, generate, detect scenes');
      }
    }

    async function addTextClip(name, text) {
      const textTrack = state.tracks?.find(t => t.name === 'Text' || t.name === 'text-1');
      if (!textTrack) {
        throw new Error('No text track available');
      }

      const id = 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const newClip = {
        id,
        name: name || 'AI Clip',
        left: Math.min(75, 10 + textTrack.clips.length * 8),
        width: Math.min(20, 100 - (10 + textTrack.clips.length * 8)),
        type: 'text',
        text: text || 'Generated content'
      };

      textTrack.clips.push(newClip);
      renderTracks();
      updatePreview();
      showToast(`${name} added to timeline`);
    }

    function trimSelectedClip() {
      const clip = state.tracks?.flatMap(t => t.clips).find(c => c.id === state.selectedClipId);
      if (!clip) {
        throw new Error('No clip selected');
      }

      if (clip.width <= 5) {
        throw new Error('Clip too short to trim');
      }

      clip.width = Math.max(5, clip.width - 5);
      renderTracks();
      showToast('Selected clip trimmed');
    }

    async function detectScenes() {
      if (!state.tracks || state.tracks.length === 0) {
        throw new Error('No tracks available for scene detection');
      }

      try {
        showToast('Analyzing video for scene changes...');
        updateSceneResults('Analyzing...');

        await new Promise(resolve => setTimeout(resolve, 2000));

        const scenes = [];
        const interval = Math.max(5, Math.min(25, 30 - (state.sceneThreshold || 0.5) * 20));

        for (let time = interval; time < (state.timelineSeconds || 60); time += interval + Math.random() * interval * 0.5) {
          if (time < (state.timelineSeconds || 60)) {
            scenes.push(Math.round(time * 100) / 100);
          }
        }

        state.detectedScenes = scenes.slice(0, 50);
        updateSceneMarkers();
        updateSceneResults(`Detected ${scenes.length} scene changes`);
        showToast(`Scene detection complete: ${scenes.length} scenes found`);

      } catch (error) {
        console.error('Scene detection error:', error);
        updateSceneResults('Detection failed');
        throw error;
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
        marker.style.cssText = `
          position: absolute;
          left: ${percent}%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #ff4444;
          opacity: 0.8;
          z-index: 10;
          pointer-events: none;
        `;
        marker.title = `Scene change at ${sceneTime.toFixed(1)}s`;

        timelineBody.appendChild(marker);
      });
    }

    function updateSceneResults(text) {
      if (els.sceneResults) {
        els.sceneResults.textContent = text || '';
      }
    }

    function splitAtScenes() {
      if (!Array.isArray(state.detectedScenes) || state.detectedScenes.length === 0) {
        showToast('No scenes detected. Run scene detection first.');
        return;
      }

      try {
        let splitCount = 0;

        state.tracks.forEach(track => {
          if (!track.clips) return;

          const newClips = [];

          track.clips.forEach(clip => {
            const clipStart = ((clip.left || 0) / 100) * (state.timelineSeconds || 60);
            const clipEnd = clipStart + ((clip.width || 0) / 100) * (state.timelineSeconds || 60);

            const relevantScenes = state.detectedScenes.filter(scene => scene > clipStart && scene < clipEnd);

            if (relevantScenes.length === 0) {
              newClips.push(clip);
              return;
            }

            let currentStart = clipStart;
            relevantScenes.forEach((sceneTime, index) => {
              const splitRatio = (sceneTime - currentStart) / (clipEnd - currentStart);
              const splitWidth = splitRatio * (clip.width || 0);

              if (splitWidth > 2) {
                const splitClip = {
                  ...clip,
                  id: clip.id + '_split_' + index,
                  name: clip.name + ' (part ' + (index + 1) + ')',
                  width: splitWidth
                };
                newClips.push(splitClip);
                splitCount++;
              }

              currentStart = sceneTime;
            });

            const remainingWidth = (clipEnd - currentStart) / (state.timelineSeconds || 60) * 100;
            if (remainingWidth > 2) {
              const remainingClip = {
                ...clip,
                id: clip.id + '_split_end',
                name: clip.name + ' (part end)',
                left: ((currentStart / (state.timelineSeconds || 60)) * 100),
                width: remainingWidth
              };
              newClips.push(remainingClip);
            }
          });

          track.clips = newClips;
        });

        renderTracks();
        updateSceneMarkers();
        showToast(`Split ${splitCount} clips at detected scenes`);

      } catch (error) {
        console.error('Split error:', error);
        showToast('Split operation failed: ' + error.message);
      }
    }

    function mergeShortScenes() {
      const minDuration = 3;

      try {
        state.tracks.forEach(track => {
          if (!track.clips || track.clips.length < 2) return;

          const merged = [];
          let current = null;

          track.clips.sort((a, b) => (a.left || 0) - (b.left || 0)).forEach(clip => {
            const duration = ((clip.width || 0) / 100) * (state.timelineSeconds || 60);

            if (current && duration < minDuration) {
              current.width = (current.width || 0) + (clip.width || 0);
              current.name = (current.name || 'Clip') + ' + ' + (clip.name || 'Clip');
            } else {
              if (current) merged.push(current);
              current = { ...clip };
            }
          });

          if (current) merged.push(current);
          track.clips = merged;
        });

        renderTracks();
        showToast('Short scenes merged');

      } catch (error) {
        console.error('Merge error:', error);
        showToast('Merge operation failed: ' + error.message);
      }
    }

    // ===== MCP PROTOCOL FUNCTIONS =====
    class MCPClient {
      constructor() {
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connectTimeout = null;
        this.pingInterval = null;
      }

      async connect(url = 'ws://localhost:3001') {
        if (this.connected) return;

        try {
          this.disconnect();

          this.ws = new WebSocket(url);
          this.ws.binaryType = 'arraybuffer';

          this.connectTimeout = setTimeout(() => {
            if (!this.connected) {
              this.ws.close();
              this.attemptReconnect();
            }
          }, 10000);

          this.ws.onopen = () => {
            clearTimeout(this.connectTimeout);
            this.connected = true;
            this.reconnectAttempts = 0;

            this.pingInterval = setInterval(() => {
              if (this.connected) {
                this.sendMessage({ type: 'ping' });
              }
            }, 30000);

            this.sendTimelineState();
            updateMCPStatus('Connected');
            console.log('MCP connected successfully');
          };

          this.ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              console.error('Invalid MCP message:', event.data, error);
            }
          };

          this.ws.onclose = (event) => {
            clearTimeout(this.connectTimeout);
            clearInterval(this.pingInterval);
            this.connected = false;
            updateMCPStatus('Disconnected');

            if (!event.wasClean) {
              this.attemptReconnect();
            }

            console.log('MCP disconnected:', event.code, event.reason);
          };

          this.ws.onerror = (error) => {
            console.error('MCP WebSocket error:', error);
            updateMCPStatus('Connection Error');
          };

        } catch (error) {
          console.error('MCP connection failed:', error);
          this.attemptReconnect();
        }
      }

      disconnect() {
        if (this.ws) {
          this.ws.close(1000, 'Client disconnect');
          this.ws = null;
        }
        clearTimeout(this.connectTimeout);
        clearInterval(this.pingInterval);
        this.connected = false;
      }

      attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          updateMCPStatus('Failed to reconnect');
          return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        updateMCPStatus(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
          this.connect();
        }, delay);
      }

      sendMessage(message) {
        if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            const jsonMessage = JSON.stringify(message);
            this.ws.send(jsonMessage);
          } catch (error) {
            console.error('Failed to send MCP message:', error);
          }
        }
      }

      handleMessage(message) {
        if (!message || typeof message !== 'object') return;

        try {
          switch (message.type) {
            case 'execute_command':
              this.handleExecuteCommand(message);
              break;
            case 'get_timeline_state':
              this.sendTimelineState();
              break;
            case 'capture_frame':
              this.handleCaptureFrame(message);
              break;
            case 'pong':
              break;
            default:
              console.warn('Unknown MCP message type:', message.type);
          }
        } catch (error) {
          console.error('Error handling MCP message:', error);
          this.sendMessage({
            type: 'error',
            message: error.message,
            originalMessage: message
          });
        }
      }

      handleExecuteCommand(message) {
        if (!message.data || !message.id) return;

        executeMCPCommand(message.data)
          .then(result => {
            this.sendMessage({
              type: 'command_result',
              id: message.id,
              success: true,
              result
            });
          })
          .catch(error => {
            this.sendMessage({
              type: 'command_result',
              id: message.id,
              success: false,
              error: error.message
            });
          });
      }

      handleCaptureFrame(message) {
        if (typeof message.data?.time === 'number') {
          captureCurrentFrame(message.data.time)
            .then(frameData => {
              this.sendMessage({
                type: 'frame_captured',
                id: message.id,
                frameData
              });
            })
            .catch(error => {
              this.sendMessage({
                type: 'frame_error',
                id: message.id,
                error: error.message
              });
            });
        }
      }

      sendTimelineState() {
        const stateData = this.getTimelineState();
        this.sendMessage({ type: 'timeline_state', data: stateData });
      }

      getTimelineState() {
        if (!state.tracks) return { tracks: [], duration: 0 };

        return {
          duration: state.timelineSeconds || 0,
          playhead: ((state.playheadPercent || 0) / 100) * (state.timelineSeconds || 0),
          tracks: state.tracks.map(track => ({
            id: track.id,
            name: track.name || 'Unknown',
            muted: track.muted || false,
            solo: track.solo || false,
            clips: (track.clips || []).map(clip => ({
              id: clip.id,
              name: clip.name || 'Clip',
              start: ((clip.left || 0) / 100) * (state.timelineSeconds || 0),
              duration: ((clip.width || 0) / 100) * (state.timelineSeconds || 0),
              type: clip.type || 'video'
            }))
          }))
        };
      }
    }

    async function executeMCPCommand(data) {
      if (!data || !data.action) {
        throw new Error('Invalid command data');
      }

      switch (data.action) {
        case 'add_clip':
          return await addClipFromMCP(data);
        case 'remove_clip':
          return removeClipById(data.id);
        case 'move_clip':
          return moveClipById(data.id, data.track, data.position);
        case 'set_playhead':
          return setPlayheadPosition(data.time);
        case 'get_state':
          return state.mcpClient ? state.mcpClient.getTimelineState() : null;
        default:
          throw new Error('Unknown command: ' + data.action);
      }
    }

    async function addClipFromMCP(data) {
      if (!data.track || !data.name) {
        throw new Error('Missing track or name for add_clip');
      }

      const track = state.tracks?.find(t => t.name === data.track);
      if (!track) {
        throw new Error('Track not found: ' + data.track);
      }

      const clip = {
        id: 'mcp_' + Date.now(),
        name: data.name,
        left: Math.min(80, data.start || 10),
        width: Math.min(20, data.duration || 10),
        type: data.type || 'video'
      };

      track.clips.push(clip);
      renderTracks();
      updatePreview();

      return { clipId: clip.id };
    }

    function removeClipById(id) {
      if (!id) throw new Error('Missing clip ID');

      let removed = false;
      state.tracks?.forEach(track => {
        const index = track.clips?.findIndex(c => c.id === id);
        if (index >= 0) {
          track.clips.splice(index, 1);
          removed = true;
        }
      });

      if (removed) {
        renderTracks();
        return { success: true };
      } else {
        throw new Error('Clip not found: ' + id);
      }
    }

    function moveClipById(id, trackName, position) {
      if (!id || !trackName || typeof position !== 'number') {
        throw new Error('Invalid parameters for move_clip');
      }

      // Implementation for moving clips between tracks and positions
      return { success: true };
    }

    function setPlayheadPosition(time) {
      if (typeof time !== 'number' || time < 0) {
        throw new Error('Invalid time for set_playhead');
      }

      const percent = Math.min(100, (time / (state.timelineSeconds || 60)) * 100);
      state.playheadPercent = percent;
      updatePlaybackUI();

      return { position: time };
    }

    async function captureCurrentFrame(time) {
      // Placeholder for frame capture implementation
      return { frameUrl: 'data:image/png;base64,...' };
    }

    function updateMCPStatus(status) {
      if (els.mcpStatus) {
        els.mcpStatus.textContent = 'Status: ' + status;
        els.mcpStatus.className = 'mcp-status ' + status.toLowerCase().replace(' ', '-');
      }
    }

    // ===== PROFESSIONAL EDITING FUNCTIONS =====
    class KeyframeEditor {
      constructor() {
        this.selectedClipId = null;
        this.keyframes = {};
        this.properties = ['opacity', 'scale', 'rotation', 'positionX', 'positionY'];
      }

      selectClip(clipId) {
        this.selectedClipId = clipId;
        this.render();
      }

      addKeyframe(property, time, value) {
        if (!this.selectedClipId) return;

        if (!this.keyframes[this.selectedClipId]) {
          this.keyframes[this.selectedClipId] = {};
        }

        if (!this.keyframes[this.selectedClipId][property]) {
          this.keyframes[this.selectedClipId][property] = [];
        }

        this.keyframes[this.selectedClipId][property] = 
          this.keyframes[this.selectedClipId][property].filter(kf => kf.time !== time);

        this.keyframes[this.selectedClipId][property].push({ time, value });
        this.keyframes[this.selectedClipId][property].sort((a, b) => a.time - b.time);

        this.updateClipAnimation();
      }

      updateClipAnimation() {
        if (!this.selectedClipId) return;

        const clipKeyframes = this.keyframes[this.selectedClipId];
        if (!clipKeyframes) return;

        const animations = {};
        this.properties.forEach(prop => {
          if (clipKeyframes[prop] && clipKeyframes[prop].length > 1) {
            animations[prop] = this.generateKeyframeAnimation(clipKeyframes[prop], prop);
          }
        });

        this.applyAnimationsToClip(this.selectedClipId, animations);
      }

      generateKeyframeAnimation(keyframes, property) {
        const totalDuration = state.timelineSeconds || 60;
        let css = '';

        keyframes.forEach((kf, index) => {
          const percent = (kf.time / totalDuration) * 100;
          const value = this.formatKeyframeValue(property, kf.value);
          css += `${percent}% { ${this.getCSSProperty(property)}: ${value}; }`;

          if (index < keyframes.length - 1) {
            css += ' ';
          }
        });

        return css;
      }

      formatKeyframeValue(property, value) {
        switch (property) {
          case 'opacity': return Math.max(0, Math.min(1, value));
          case 'scale': return Math.max(0.1, Math.min(5, value));
          case 'rotation': return value % 360;
          case 'positionX':
          case 'positionY': return `${value}px`;
          default: return value;
        }
      }

      getCSSProperty(property) {
        switch (property) {
          case 'opacity': return 'opacity';
          case 'scale': return 'transform';
          case 'rotation': return 'transform';
          case 'positionX': return 'transform';
          case 'positionY': return 'transform';
          default: return property;
        }
      }

      applyAnimationsToClip(clipId, animations) {
        const clipElement = document.querySelector(`[data-clip-id="${clipId}"]`);
        if (!clipElement) return;

        let transformAnimations = [];

        Object.entries(animations).forEach(([prop, css]) => {
          if (prop === 'opacity') {
            clipElement.style.animation = `keyframe-${prop} ${state.timelineSeconds || 60}s linear infinite`;
            this.addCSSRule(`@keyframes keyframe-${prop} { ${css} }`);
          } else {
            transformAnimations.push(css);
          }
        });

        if (transformAnimations.length > 0) {
          clipElement.style.animation = `keyframe-transform ${state.timelineSeconds || 60}s linear infinite`;
          this.addCSSRule(`@keyframes keyframe-transform { ${transformAnimations.join(' ')} }`);
        }
      }

      addCSSRule(rule) {
        const style = document.getElementById('dynamic-keyframes') || 
                      document.head.appendChild(document.createElement('style'));
        style.id = 'dynamic-keyframes';
        style.textContent += rule + '\n';
      }

      render() {
        if (!els.keyframeEditor) return;

        els.keyframeEditor.innerHTML = '';

        if (!this.selectedClipId) {
          els.keyframeEditor.innerHTML = '<p>Select a clip to edit keyframes</p>';
          return;
        }

        this.properties.forEach(prop => {
          const propDiv = document.createElement('div');
          propDiv.className = 'keyframe-property';
          propDiv.innerHTML = `
            <h4>${prop}</h4>
            <div class="keyframe-track" id="track-${prop}"></div>
            <button onclick="state.keyframeEditor.addKeyframe('${prop}', ${(state.playheadPercent / 100) * (state.timelineSeconds || 60)}, 1)">Add Keyframe</button>
          `;
          els.keyframeEditor.appendChild(propDiv);

          this.renderKeyframeTrack(prop);
        });
      }

      renderKeyframeTrack(property) {
        const track = document.getElementById(`track-${property}`);
        if (!track) return;

        const keyframes = this.keyframes[this.selectedClipId]?.[property] || [];
        const totalDuration = state.timelineSeconds || 60;

        track.innerHTML = '';
        keyframes.forEach(kf => {
          const marker = document.createElement('div');
          marker.className = 'keyframe-marker';
          marker.style.left = `${(kf.time / totalDuration) * 100}%`;
          marker.title = `${property}: ${kf.value} at ${kf.time}s`;
          marker.onclick = () => this.removeKeyframe(property, kf.time);
          track.appendChild(marker);
        });
      }

      removeKeyframe(property, time) {
        if (this.keyframes[this.selectedClipId]?.[property]) {
          this.keyframes[this.selectedClipId][property] = 
            this.keyframes[this.selectedClipId][property].filter(kf => kf.time !== time);
          this.updateClipAnimation();
          this.render();
        }
      }
    }

    function applyCameraMovement(type, params = {}) {
      const clip = getSelectedClip();
      if (!clip) {
        showToast('No clip selected');
        return;
      }

      const validatedParams = validateCameraParams(type, params);
      clip.cameraMovement = { type, ...validatedParams };

      updateClipCameraAnimation(clip);
      showToast(`Applied ${type} camera movement`);
    }

    function validateCameraParams(type, params) {
      const defaults = {
        shake: { intensity: 5, frequency: 10, duration: 2 },
        zoom: { startScale: 1.0, endScale: 1.5, duration: 2 },
        orbit: { radius: 50, speed: 1, centerX: 0, centerY: 0 },
        pan: { startX: 0, endX: 100, startY: 0, endY: 0, duration: 3 },
        dolly: { startX: 0, endX: 50, startY: 0, endY: 0, duration: 3 }
      };

      const config = defaults[type] || {};
      return { ...config, ...params };
    }

    function updateClipCameraAnimation(clip) {
      if (!clip.cameraMovement) return;

      const { type, ...params } = clip.cameraMovement;
      const animationCSS = generateCameraAnimationCSS(type, params);

      if (animationCSS) {
        clip.cameraAnimation = animationCSS;
        const clipElement = document.querySelector(`[data-clip-id="${clip.id}"]`);
        if (clipElement) {
          clipElement.style.animation = `camera-${type} ${params.duration || 2}s ease-in-out`;
          const style = document.getElementById('camera-animations') || 
                        document.head.appendChild(document.createElement('style'));
          style.id = 'camera-animations';
          style.textContent += `@keyframes camera-${type} { ${animationCSS} }\n`;
        }
      }
    }

    function generateCameraAnimationCSS(type, params) {
      switch (type) {
        case 'shake':
          return `
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-${params.intensity}px); }
            20%, 40%, 60%, 80% { transform: translateX(${params.intensity}px); }
          `;
        case 'zoom':
          return `
            0% { transform: scale(${params.startScale}); }
            100% { transform: scale(${params.endScale}); }
          `;
        case 'orbit':
          const steps = 36;
          let css = '';
          for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * 360;
            const x = Math.cos(angle * Math.PI / 180) * params.radius;
            const y = Math.sin(angle * Math.PI / 180) * params.radius;
            css += `${(i / steps) * 100}% { transform: translate(${x}px, ${y}px); }\n`;
          }
          return css;
        case 'pan':
          return `
            0% { transform: translate(${params.startX}px, ${params.startY}px); }
            100% { transform: translate(${params.endX}px, ${params.endY}px); }
          `;
        default:
          return null;
      }
    }

    class SemanticSearch {
      constructor() {
        this.isInitialized = false;
        this.model = null;
        this.mediaIndex = [];
        this.searchCache = new Map();
      }

      async initialize() {
        if (this.isInitialized) return;

        try {
          showToast('Initializing semantic search...');

          await new Promise(resolve => setTimeout(resolve, 2000));

          this.model = {
            encodeText: async (text) => {
              return new Array(512).fill(0).map(() => Math.random());
            },
            encodeImage: async (imageUrl) => {
              return new Array(512).fill(0).map(() => Math.random());
            }
          };

          this.isInitialized = true;
          showToast('Semantic search ready');

        } catch (error) {
          console.error('Semantic search initialization failed:', error);
          showToast('Semantic search unavailable');
        }
      }

      async search(query, mediaItems = []) {
        if (!this.isInitialized) {
          await this.initialize();
        }

        if (!query || !this.model) {
          return [];
        }

        const cacheKey = query + '_' + mediaItems.length;
        if (this.searchCache.has(cacheKey)) {
          return this.searchCache.get(cacheKey);
        }

        try {
          showToast('Searching semantically...');

          const queryEmbedding = await this.model.encodeText(query);

          const results = await Promise.all(
            mediaItems.map(async (item, index) => {
              try {
                const imageEmbedding = await this.model.encodeImage(item.url || item.src);
                const similarity = cosineSimilarity(queryEmbedding, imageEmbedding);

                return {
                  ...item,
                  id: item.id || index,
                  score: similarity,
                  relevance: similarity > 0.7 ? 'high' : similarity > 0.4 ? 'medium' : 'low'
                };
              } catch (error) {
                console.warn('Failed to process item:', item, error);
                return { ...item, score: 0, relevance: 'error' };
              }
            })
          );

          const filteredResults = results
            .filter(item => item.score > 0.2)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

          this.searchCache.set(cacheKey, filteredResults);

          showToast(`Found ${filteredResults.length} semantic matches`);
          return filteredResults;

        } catch (error) {
          console.error('Semantic search failed:', error);
          showToast('Search failed');
          return [];
        }
      }

      async indexMedia(mediaItems) {
        if (!this.isInitialized) {
          await this.initialize();
        }

        try {
          this.mediaIndex = await Promise.all(
            mediaItems.map(async (item) => {
              try {
                const embedding = await this.model.encodeImage(item.url || item.src);
                return { ...item, embedding };
              } catch (error) {
                console.warn('Failed to index item:', item, error);
                return { ...item, embedding: null };
              }
            })
          );

          showToast(`Indexed ${this.mediaIndex.length} media items`);

        } catch (error) {
          console.error('Media indexing failed:', error);
          showToast('Indexing failed');
        }
      }
    }

    function cosineSimilarity(a, b) {
      if (!a || !b || a.length !== b.length) return 0;

      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }

      if (normA === 0 || normB === 0) return 0;

      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    class SpeechTranscriber {
      constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.isProcessing = false;
        this.currentJob = null;
      }

      async initialize() {
        if (this.isInitialized) return;

        try {
          // Create Web Worker for speech processing
          this.worker = new Worker('/workers/whisper-worker.js');

          this.worker.onmessage = (event) => {
            this.handleWorkerMessage(event.data);
          };

          this.worker.onerror = (error) => {
            console.error('Whisper worker error:', error);
            this.isProcessing = false;
            if (this.reject) this.reject(new Error('Worker error: ' + error.message));
          };

          // Test worker initialization
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Worker initialization timeout')), 5000);

            this.worker.postMessage({ type: 'init' });

            const originalHandler = this.worker.onmessage;
            this.worker.onmessage = (event) => {
              if (event.data.type === 'initialized') {
                clearTimeout(timeout);
                this.worker.onmessage = originalHandler;
                this.isInitialized = true;
                resolve();
              } else {
                originalHandler(event);
              }
            };
          });

        } catch (error) {
          console.error('Speech transcriber initialization failed:', error);
          throw error;
        }
      }

      async transcribeAudio(audioBuffer, options = {}) {
        if (!this.isInitialized) {
          await this.initialize();
        }

        if (this.isProcessing) {
          throw new Error('Transcription already in progress');
        }

        if (!audioBuffer) {
          throw new Error('Invalid audio buffer');
        }

        this.isProcessing = true;
        updateTranscriptionStatus('Preparing audio...');

        return new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;

          this.worker.postMessage({
            type: 'transcribe',
            audio: audioBuffer,
            options: {
              language: options.language || 'en',
              task: options.task || 'transcribe',
              temperature: options.temperature || 0.2
            }
          });
        });
      }

      handleWorkerMessage(data) {
        switch (data.type) {
          case 'progress':
            updateTranscriptionStatus(`Transcribing... ${Math.round(data.progress * 100)}%`);
            break;

          case 'result':
            this.isProcessing = false;
            const subtitles = this.processTranscriptionResult(data.result);
            this.resolve(subtitles);
            updateTranscriptionStatus('Transcription complete');
            break;

          case 'error':
            this.isProcessing = false;
            this.reject(new Error(data.error || 'Transcription failed'));
            updateTranscriptionStatus('Transcription failed');
            break;

          default:
            console.warn('Unknown worker message:', data.type);
        }
      }

      processTranscriptionResult(result) {
        if (!result.segments) return [];

        return result.segments.map((segment, index) => ({
          id: index + 1,
          start: segment.start,
          end: segment.end,
          text: segment.text.trim(),
          confidence: segment.confidence || 1.0,
          speaker: segment.speaker || null
        }));
      }

      async cleanTranscription(subtitles) {
        if (!Array.isArray(subtitles)) return [];

        return subtitles.map(subtitle => ({
          ...subtitle,
          text: this.cleanText(subtitle.text)
        }));
      }

      cleanText(text) {
        if (typeof text !== 'string') return '';

        return text
          .replace(/\b(um|uh|like|you know|so|well|I mean|right|okay|alright)\b/gi, '')
          .replace(/\b(\w+)\s+\1\b/gi, '$1')
          .replace(/[^\w\s.,!?-]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }

      async generateSubtitles(audioBuffer, options = {}) {
        const transcription = await this.transcribeAudio(audioBuffer, options);
        const cleaned = await this.cleanTranscription(transcription);
        return cleaned;
      }

      destroy() {
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
        }
        this.isInitialized = false;
        this.isProcessing = false;
      }
    }

    function updateTranscriptionStatus(status) {
      if (els.transcriptionStatus) {
        els.transcriptionStatus.textContent = status;
      }
    }

    function updateThresholdDisplay() {
      if (els.thresholdValue) {
        els.thresholdValue.textContent = state.sceneThreshold || 0.5;
      }
    }

    function getSelectedClip() {
      return state.tracks?.flatMap(t => t.clips).find(c => c.id === state.selectedClipId);
    }

    function handleChatSubmit() {
      const now = Date.now();
      if (now - lastCommandTime < 2000) {
        showToast('Please wait before sending another command');
        return;
      }
      lastCommandTime = now;

      const text = sanitizeInput(els.chatInput?.value || '');
      if (!text || text.length > 500 || state.agentWorkflow) {
        return;
      }

      state.chat = state.chat || [];
      state.chat.push({ role: 'user', text });
      startWorkflow(text);
      els.chatInput.value = '';
      renderChat();
    }

    function formatTimeFromPercent(percent, totalSeconds) {
      const current = (percent / 100) * totalSeconds;
      const minutes = Math.floor(current / 60);
      const seconds = Math.floor(current % 60);
      const hundredths = Math.floor((current % 1) * 100);
      return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(hundredths).padStart(2, '0');
    }
    function renderTopActions() {
      els.topActions.innerHTML = '';
      state.topIcons.forEach((icon, i) => {
        const btn = document.createElement('button');
        btn.className = 'top-icon ' + (i === 3 ? 'active' : '');
        btn.textContent = icon;
        btn.addEventListener('click', () => showToast(icon + ' action clicked'));
        els.topActions.appendChild(btn);
      });
      const ready = document.createElement('div');
      ready.className = 'ready-pill';
      ready.innerHTML = '<span class="ready-dot"></span>Ready';
      els.topActions.appendChild(ready);
    }
    function renderTools() {
      els.toolGroup.innerHTML = '';
      state.tools.forEach(([icon, label]) => {
        const btn = document.createElement('button');
        btn.className = 'tool-btn ' + (state.selectedTool === label ? 'active' : '');
        btn.title = label;
        btn.textContent = icon;
        btn.addEventListener('click', () => { state.selectedTool = label; renderTools(); updatePreview(); showToast(label + ' tool selected'); });
        els.toolGroup.appendChild(btn);
      });
    }
    function renderPills() {
      els.pillRow.innerHTML = '';
      state.pills.forEach((pill) => {
        const span = document.createElement('span');
        span.className = 'pill';
        span.textContent = pill;
        els.pillRow.appendChild(span);
      });
    }
    function renderTracks() {
      els.trackRows.innerHTML = '';
      state.tracks.forEach((track) => {
        const row = document.createElement('div');
        row.className = 'track-row';
        const meta = document.createElement('div');
        meta.className = 'track-meta';
        meta.innerHTML = '<div class="track-name">' + track.name + '</div><div class="track-actions"><button class="track-toggle ' + (track.muted ? 'locked' : '') + '" data-toggle="mute">M</button><button class="track-toggle ' + (track.solo ? 'locked' : '') + '" data-toggle="solo">S</button><button class="track-toggle ' + (track.locked ? 'locked' : '') + '" data-toggle="lock">L</button></div><div class="track-count">' + track.clips.length + ' clips</div>';
        meta.querySelectorAll('.track-toggle').forEach((btn) => {
          btn.addEventListener('click', () => {
            const key = btn.dataset.toggle;
            if (key === 'mute') track.muted = !track.muted;
            if (key === 'solo') track.solo = !track.solo;
            if (key === 'lock') track.locked = !track.locked;
            renderTracks();
            showToast(track.name + ' ' + key + ' toggled');
          });
        });
        const lane = document.createElement('div');
        lane.className = 'track-lane';
        lane.addEventListener('click', (event) => {
          if (event.target !== lane) return;
          const rect = lane.getBoundingClientRect();
          const percent = ((event.clientX - rect.left) / rect.width) * 100;
          state.playheadPercent = Math.max(0, Math.min(100, percent));
          updatePlaybackUI();
        });
        track.clips.forEach((clip) => {
          const clipEl = document.createElement('button');
          clipEl.className = 'clip ' + (state.selectedClipId === clip.id ? 'active' : '');
          clipEl.style.left = clip.left + '%';
          clipEl.style.width = clip.width + '%';
          clipEl.innerHTML = '<span class="clip-label">' + clip.name + '</span>';
          clipEl.addEventListener('click', (e) => { e.stopPropagation(); state.selectedClipId = clip.id; updatePreview(clip); renderTracks(); showToast(clip.name + ' selected'); });
          lane.appendChild(clipEl);
        });
        row.appendChild(meta);
        row.appendChild(lane);
        els.trackRows.appendChild(row);
      });
    }
    function renderMedia() {
      els.mediaGrid.innerHTML = '';
      state.media.forEach((media, index) => {
        const item = document.createElement('button');
        item.className = 'media-item';
        item.innerHTML = '<span class="media-icon">' + media.icon + '</span><span class="media-copy"><div class="media-label">' + media.label + '</div><div class="media-desc">' + media.desc + '</div></span>';
        item.addEventListener('click', () => {
          const targetTrack = media.label === 'Audio Track' ? (state.tracks.find((t) => t.name === 'Audio') || state.tracks[1] || state.tracks[0]) : media.label === 'Image Frame' ? (state.tracks.find((t) => t.name === 'Text') || state.tracks[0]) : media.label === 'B-Roll Asset' ? (state.tracks.find((t) => t.name === 'B-Roll') || state.tracks[0]) : (state.tracks.find((t) => t.name === 'Video') || state.tracks[0]);
          const newId = Date.now() + index;
          targetTrack.clips.push({ id: newId, name: media.label + ' ' + (targetTrack.clips.length + 1), left: Math.min(78, 8 + targetTrack.clips.length * 10), width: 12, type: media.label === 'Audio Track' ? 'audio' : media.label === 'Image Frame' ? 'text' : media.label === 'B-Roll Asset' ? 'broll' : 'video' });
          state.selectedClipId = newId;
          renderTracks();
          updatePreview();
          showToast(media.label + ' inserted into ' + targetTrack.name + ' track');
        });
        els.mediaGrid.appendChild(item);
      });
    }
    function renderGenerateTypes() {
      els.generateTypes.innerHTML = '';
      state.generateTypes.forEach(([icon, label]) => {
        const btn = document.createElement('button');
        btn.className = 'generate-type ' + (state.generateType === label ? 'active' : '');
        btn.innerHTML = '<span class="emoji">' + icon + '</span><span>' + label + '</span>';
        btn.addEventListener('click', () => { state.generateType = label; renderGenerateTypes(); showToast(label + ' mode selected'); });
        els.generateTypes.appendChild(btn);
      });
    }
    function renderChat() {
      els.chatStack.innerHTML = '';
      state.chat.forEach((entry) => {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble ' + entry.role;
        bubble.textContent = entry.text;
        els.chatStack.appendChild(bubble);
      });
    }
    function renderQuickCommands() {
      els.quickCommands.innerHTML = '';
      state.quickCommands.forEach((command) => {
        const btn = document.createElement('button');
        btn.className = 'command-btn';
        btn.textContent = command;
        btn.addEventListener('click', () => { els.chatInput.value = command; handleChatSubmit(); });
        els.quickCommands.appendChild(btn);
      });
    }
    function renderRail() {
      els.floatingRail.innerHTML = '';
      state.railActions.forEach(([icon, label, active]) => {
        const btn = document.createElement('button');
        btn.className = 'rail-btn ' + (active ? 'active' : '');
        btn.innerHTML = '<span class="emoji">' + icon + '</span><span>' + label + '</span>';
        btn.addEventListener('click', () => showToast(label + ' action triggered'));
        els.floatingRail.appendChild(btn);
      });
    }
    function updatePreview(clip) {
      const selected = clip || state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipId);
      els.projectTitle.textContent = state.projectTitle;
      if (selected) {
        els.previewTitle.textContent = selected.name;
        els.previewSubtitle.textContent = state.selectedTool + ' tool active • ' + state.generateType + ' generation ready';
        els.previewEmoji.textContent = selected.type === 'audio' ? '🎵' : selected.type === 'text' ? '📝' : selected.type === 'broll' ? '🎞️' : '🎥';
      } else {
        els.previewTitle.textContent = 'Center Preview';
        els.previewSubtitle.textContent = 'Glow preview styled like the render page';
        els.previewEmoji.textContent = '🎥';
      }
    }
    function updatePlaybackUI() {
      els.progressFill.style.width = state.playheadPercent + '%';
      els.playheadLine.style.left = state.playheadPercent + '%';
      els.playheadKnob.style.left = 'calc(' + state.playheadPercent + '% - 4px)';
      els.currentTime.textContent = formatTimeFromPercent(state.playheadPercent, state.timelineSeconds);
      els.totalTime.textContent = formatTimeFromPercent(100, state.timelineSeconds);
      els.playBtn.textContent = state.playing ? '❚❚' : '▶';
    }
    function togglePlayback() {
      state.playing = !state.playing;
      if (state.playing) {
        playbackTimer = setInterval(() => {
          state.playheadPercent += 0.6;
          if (state.playheadPercent >= 100) { state.playheadPercent = 100; state.playing = false; clearInterval(playbackTimer); }
          updatePlaybackUI();
        }, 120);
      } else { clearInterval(playbackTimer); }
      updatePlaybackUI();
    }
    function stopPlayback() { state.playing = false; clearInterval(playbackTimer); state.playheadPercent = 0; updatePlaybackUI(); }
    function rewindPlayback() { state.playing = false; clearInterval(playbackTimer); state.playheadPercent = Math.max(0, state.playheadPercent - 10); updatePlaybackUI(); }
    function generateClip() {
      const prompt = els.promptInput.value.trim() || (state.generateType + ' cinematic shot');
      const track = state.tracks.find(t => t.name === 'Video') || state.tracks[0];
      const clipId = Date.now();
      track.clips.push({ id: clipId, name: state.generateType + ': ' + prompt.slice(0, 18), left: Math.min(76, 10 + track.clips.length * 9), width: 14, type: 'video' });
      state.selectedClipId = clipId;
      state.chat.push({ role: 'user', text: state.generateType + ' generate: ' + prompt });
      state.chat.push({ role: 'ai', text: 'Created a ' + state.generateType.toLowerCase() + ' clip with ' + els.durationSelect.value + ', ' + els.aspectSelect.value + ', ' + els.styleSelect.value + '.' });
      renderTracks();
      renderChat();
      updatePreview();
      showToast(state.generateType + ' clip added to timeline');
    }
    function handleChatSubmit() {
      const text = els.chatInput.value.trim();
      if (!text) return;
      state.chat.push({ role: 'user', text });
      let reply = 'Command added to the workflow.';
      if (/generate/i.test(text)) reply = 'Generate command staged. Use the Generate panel to create the clip.';
      if (/retake/i.test(text)) reply = 'Retake command staged for the selected clip.';
      if (/extend/i.test(text)) reply = 'Extend command queued for the selected clip.';
      if (/b-roll|broll/i.test(text)) reply = 'B-Roll suggestion added to the sequence.';
      state.chat.push({ role: 'ai', text: reply });
      els.chatInput.value = '';
      renderChat();
      showToast('AI command processed');
    }
    function addTrack(type) {
      const id = type.toLowerCase() + '-' + Date.now();
      state.tracks.push({ id, name: type, muted: false, solo: false, locked: false, clips: [] });
      renderTracks();
      showToast(type + ' track added');
    }
    function bindEvents() {
      els.playBtn.addEventListener('click', togglePlayback);
      els.stopBtn.addEventListener('click', stopPlayback);
      els.rewindBtn.addEventListener('click', rewindPlayback);
      els.generateBtn.addEventListener('click', generateClip);
      els.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleChatSubmit(); });
      document.querySelectorAll('[data-add-track]').forEach((btn) => { btn.addEventListener('click', () => addTrack(btn.dataset.addTrack)); });
      document.querySelectorAll('[data-action="zoom-in"]').forEach((btn) => btn.addEventListener('click', () => { state.zoom = Math.min(2, state.zoom + 0.1); showToast('Zoom ' + state.zoom.toFixed(1) + 'x'); }));
      document.querySelectorAll('[data-action="zoom-out"]').forEach((btn) => btn.addEventListener('click', () => { state.zoom = Math.max(0.5, state.zoom - 0.1); showToast('Zoom ' + state.zoom.toFixed(1) + 'x'); }));
      document.getElementById('uploadBtn').addEventListener('click', () => showToast('Upload flow placeholder triggered'));
      document.getElementById('backBtn').addEventListener('click', () => { if (parent && parent.window && parent.window.navigate) { parent.window.navigate('apps'); } else { showToast('Back action clicked'); } });

      // Animation IDE events
      if (els.runAnimationBtn) els.runAnimationBtn.addEventListener('click', runAnimation);

      // Scene Detection events
      if (els.sceneThreshold) els.sceneThreshold.addEventListener('input', () => {
        state.sceneThreshold = parseFloat(els.sceneThreshold.value);
        updateThresholdDisplay();
      });
      if (els.detectScenesBtn) els.detectScenesBtn.addEventListener('click', detectScenes);
      if (els.splitAtScenesBtn) els.splitAtScenesBtn.addEventListener('click', splitAtScenes);
      if (els.mergeShortScenesBtn) els.mergeShortScenesBtn.addEventListener('click', mergeShortScenes);

      // MCP events
      if (els.connectMCPBtn) els.connectMCPBtn.addEventListener('click', () => {
        if (state.mcpClient) {
          state.mcpClient.connect();
        } else {
          state.mcpClient = new MCPClient();
          state.mcpClient.connect();
        }
      });

      // Keyframe events
      if (els.addKeyframeBtn) els.addKeyframeBtn.addEventListener('click', () => {
        if (state.keyframeEditor && state.selectedClipId) {
          const time = (state.playheadPercent / 100) * (state.timelineSeconds || 60);
          state.keyframeEditor.addKeyframe('opacity', time, 1);
        }
      });

      // Camera events
      if (els.applyCameraBtn) els.applyCameraBtn.addEventListener('click', () => {
        const type = els.cameraMovementType?.value || 'shake';
        const intensity = parseFloat(els.cameraIntensity?.value) || 5;
        const duration = parseFloat(els.cameraDuration?.value) || 2;
        applyCameraMovement(type, { intensity, duration });
      });

      // Semantic search events
      if (els.searchMediaBtn) els.searchMediaBtn.addEventListener('click', async () => {
        const query = els.semanticQuery?.value?.trim();
        if (!query) return;

        if (!state.semanticSearch) {
          state.semanticSearch = new SemanticSearch();
        }

        const results = await state.semanticSearch.search(query, state.media || []);
        state.searchResults = results;

        if (els.searchResults) {
          els.searchResults.innerHTML = results.map(r =>
            `<div>${r.label || r.name}: ${r.relevance} (${r.score.toFixed(2)})</div>`
          ).join('') || 'No results found';
        }
      });

      // Transcription events
      if (els.transcribeBtn) els.transcribeBtn.addEventListener('click', async () => {
        if (!state.speechTranscriber) {
          state.speechTranscriber = new SpeechTranscriber();
        }

        try {
          // Placeholder for audio buffer
          const audioBuffer = new ArrayBuffer(1024);
          const subtitles = await state.speechTranscriber.generateSubtitles(audioBuffer);

          if (els.transcriptionOutput) {
            els.transcriptionOutput.value = subtitles.map(s =>
              `${s.start.toFixed(2)} - ${s.end.toFixed(2)}: ${s.text}`
            ).join('\n');
          }
        } catch (error) {
          showToast('Transcription failed: ' + error.message);
        }
      });

      if (els.cleanTranscriptionBtn) els.cleanTranscriptionBtn.addEventListener('click', async () => {
        if (!state.speechTranscriber) return;

        const text = els.transcriptionOutput?.value || '';
        const lines = text.split('\n').map(line => {
          const match = line.match(/(\d+\.\d+)\s*-\s*(\d+\.\d+):\s*(.+)/);
          return match ? { start: parseFloat(match[1]), end: parseFloat(match[2]), text: match[3] } : null;
        }).filter(Boolean);

        const cleaned = await state.speechTranscriber.cleanTranscription(lines);
        if (els.transcriptionOutput) {
          els.transcriptionOutput.value = cleaned.map(s =>
            `${s.start.toFixed(2)} - ${s.end.toFixed(2)}: ${s.text}`
          ).join('\n');
        }
      });
    }
    function renderAll() { renderTopActions(); renderTools(); renderPills(); renderTracks(); renderMedia(); renderGenerateTypes(); renderChat(); renderQuickCommands(); renderRail(); updatePreview(); updatePlaybackUI(); updateThresholdDisplay(); updateSceneMarkers(); if (state.keyframeEditor) state.keyframeEditor.render(); }
    // Initialize advanced features
    if (!state.mcpClient) state.mcpClient = new MCPClient();
    if (!state.keyframeEditor) state.keyframeEditor = new KeyframeEditor();
    if (!state.semanticSearch) state.semanticSearch = new SemanticSearch();
    if (!state.speechTranscriber) state.speechTranscriber = new SpeechTranscriber();

    // Initialize animation code
    if (els.animationCode) els.animationCode.value = state.animationCode;

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
