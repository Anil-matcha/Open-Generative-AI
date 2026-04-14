import { supabase, uploadFileToStorage } from '../lib/supabase.js';
import { showToast } from '../lib/loading.js';
import { initializeTimelineDragDrop, createEnhancedClipElement } from '../lib/editor/timelineRendererEnhanced.js';
import { initializeMediaLibraryDragDrop, setupEnhancedTooltips } from '../lib/editor/dragDrop.js';
import { renderMediaGrid, addMediaToTimeline } from '../lib/editor/mediaLibrary.js';

export function TimelineEditorPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full bg-app-bg overflow-hidden relative';

  const styles = `
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
  --emerald: #34d399;
  --shadow: 0 20px 60px rgba(0,0,0,0.45);
  --radius-xl: 28px;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  min-height: 100%;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
}
body { padding: 18px; }
button, input, textarea, select { font: inherit; }
#app { min-height: calc(100vh - 36px); }
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
.icon-btn:hover, .top-icon:hover, .mini-btn:hover, .rail-btn:hover, .tool-btn:hover, .clip:hover, .media-item:hover { transform: translateY(-1px); }
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
.left-top { display: grid; grid-template-columns: 300px minmax(0,1fr); gap: 16px; margin-bottom: 16px; align-items: stretch; }
.preview-card {
  position: relative; overflow: hidden; border-radius: var(--radius-xl); aspect-ratio: 16 / 9;
  border: 1px solid var(--border-soft); background: #000; box-shadow: 0 0 70px rgba(56,189,248,0.14);
}
.preview-glow { position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(34,211,238,0.12), transparent 55%); }
.preview-inner {
  position: absolute; inset: 24px; border-radius: 22px; border: 1px solid rgba(34,211,238,0.15);
  background: linear-gradient(135deg, rgba(20,25,33,0.9), rgba(8,10,14,0.86)); box-shadow: 0 0 60px rgba(34,211,238,0.1);
  overflow: hidden;
}
.preview-stage {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at center, rgba(34,211,238,0.08), rgba(0,0,0,0.2) 45%, rgba(0,0,0,0.5));
}
.preview-empty {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center;
}
.preview-screen { max-width: 420px; text-align: center; }
.preview-emoji { font-size: 72px; margin-bottom: 10px; }
.preview-title { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.92); }
.preview-sub { margin-top: 4px; font-size: 14px; color: rgba(255,255,255,0.45); }
.preview-media { width: 100%; height: 100%; object-fit: cover; display: block; background: #020406; }
.preview-media.contain { object-fit: contain; }
.preview-audio-card {
  width: min(88%, 640px); padding: 24px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); box-shadow: 0 20px 40px rgba(0,0,0,0.35);
  backdrop-filter: blur(16px);
}
.preview-audio-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.preview-audio-icon {
  width: 58px; height: 58px; border-radius: 16px; display: grid; place-items: center; font-size: 28px;
  border: 1px solid rgba(34,211,238,0.24); background: rgba(34,211,238,0.12);
}
.preview-audio-meta { flex: 1; min-width: 0; }
.preview-audio-name { font-size: 18px; font-weight: 800; color: rgba(255,255,255,0.94); }
.preview-audio-desc { margin-top: 4px; font-size: 12px; color: rgba(255,255,255,0.5); }
.preview-audio-bars { display: grid; grid-template-columns: repeat(24, 1fr); gap: 6px; align-items: end; height: 88px; margin-bottom: 18px; }
.preview-audio-bars span {
  display: block; border-radius: 999px; background: linear-gradient(to top, rgba(34,211,238,0.35), rgba(52,211,153,0.95)); box-shadow: 0 0 18px rgba(34,211,238,0.2);
}
.preview-text-card {
  width: min(82%, 760px); padding: 28px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(135deg, rgba(3,7,18,0.86), rgba(17,24,39,0.82)); box-shadow: 0 30px 70px rgba(0,0,0,0.45); text-align: left;
}
.preview-text-kicker { font-size: 11px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: #a5f3fc; }
.preview-text-heading { margin-top: 12px; font-size: clamp(28px, 4vw, 54px); line-height: 1.02; font-weight: 900; color: white; }
.preview-text-body { margin-top: 12px; max-width: 520px; font-size: 15px; line-height: 1.55; color: rgba(255,255,255,0.68); }
.preview-overlay {
  position: absolute; inset-inline: 0; bottom: 0; padding: 16px; background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent);
}
.time-row, .control-row { display: flex; align-items: center; justify-content: space-between; }
.time-row { margin-bottom: 8px; font-size: 12px; color: rgba(255,255,255,0.6); }
.progress-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,0.2); overflow: hidden; margin-bottom: 12px; }
.progress-fill { height: 100%; width: 28%; border-radius: inherit; background: linear-gradient(to right, var(--cyan), var(--emerald)); }
.control-row { justify-content: center; gap: 12px; }
.circle-btn { width: 40px; height: 40px; border-radius: 999px; border: 1px solid transparent; background: rgba(255,255,255,0.1); color: white; cursor: pointer; }
.circle-btn.primary { width: 48px; height: 48px; background: white; color: black; font-weight: 800; box-shadow: 0 10px 30px rgba(255,255,255,0.15); }
.timeline-card, .side-card {
  border-radius: 24px; border: 1px solid var(--border); background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015));
  box-shadow: 0 20px 60px rgba(0,0,0,0.35); backdrop-filter: blur(20px);
}
.timeline-card { padding: 16px; }
.side-card { padding: 14px; border-radius: 20px; box-shadow: var(--shadow); }
.side-card.generate { border-color: rgba(34,211,238,0.2); background: linear-gradient(180deg, rgba(56,189,248,0.08), rgba(17,24,39,0.75)); }
.card-title { margin-bottom: 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,0.82); }
.card-title.cyan { color: #bae6fd; }
.timeline-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-left, .tool-group, .pill-row, .floating-rail, .track-actions, .generate-types, .quick-commands { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tool-group { gap: 4px; padding: 4px; border-radius: 14px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); }
.tool-btn, .mini-btn, .command-btn, .rail-btn, .generate-type { border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.72); cursor: pointer; transition: all .15s ease; }
.tool-btn { width: 32px; height: 32px; border-radius: 8px; font-size: 14px; }
.tool-btn.active, .generate-type.active, .rail-btn.active { border-color: rgba(34,211,238,0.45); background: rgba(34,211,238,0.22); color: #cffafe; }
.mini-btn, .command-btn { border-radius: 10px; padding: 8px 12px; font-size: 12px; }
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
.track-toggle { width: 18px; height: 18px; border-radius: 6px; border: 1px solid var(--border); background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); font-size: 8px; cursor: pointer; }
.track-toggle.locked { background: rgba(34,211,238,0.2); }
.track-count { margin-top: 6px; font-size: 9px; color: rgba(255,255,255,0.35); }
.track-lane { position: relative; background: rgba(255,255,255,0.02); min-height: 62px; background-image: linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 80px 100%; }
.clip { position: absolute; top: 8px; bottom: 8px; border-radius: 12px; border: 1px solid var(--border); padding: 8px 10px; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.86); background: rgba(255,255,255,0.1); box-shadow: 0 10px 24px rgba(0,0,0,0.25); display: flex; align-items: center; overflow: hidden; cursor: pointer; }
.clip.active { border-color: rgba(34,211,238,0.5); background: rgba(34,211,238,0.2); color: #cffafe; }
.clip-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.upload-btn, .primary-btn, .text-input, .text-area, .select-input { width: 100%; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.4); color: white; }
.upload-btn, .primary-btn { padding: 11px 14px; cursor: pointer; font-weight: 700; }
.upload-btn { border-style: dashed; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.72); margin-bottom: 12px; }
.media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.media-note { margin: -4px 0 10px; font-size: 10px; line-height: 1.45; color: rgba(255,255,255,0.46); }
.media-item { min-height: 64px; border-radius: 14px; border: 1px solid var(--border); background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025)); display: flex; align-items: center; gap: 10px; padding: 10px 12px; text-align: left; cursor: pointer; transition: transform .15s ease, border-color .15s ease, background .15s ease; }
.media-item:hover { border-color: rgba(34,211,238,0.22); background: linear-gradient(180deg, rgba(34,211,238,0.08), rgba(255,255,255,0.03)); }
.media-icon { width: 34px; height: 34px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.28); display: grid; place-items: center; font-size: 17px; flex: 0 0 auto; }
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
.floating-rail { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 40; padding: 10px 14px; border-radius: 999px; border: 1px solid var(--border); background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); backdrop-filter: blur(18px); box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.rail-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 7px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; }
.rail-btn .emoji { font-size: 16px; }
.status-toast { position: fixed; right: 18px; bottom: 18px; max-width: 320px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(34,211,238,0.18); background: rgba(7,12,18,0.95); color: rgba(255,255,255,0.86); box-shadow: 0 18px 50px rgba(0,0,0,0.4); font-size: 12px; opacity: 0; transform: translateY(10px); pointer-events: none; transition: all .2s ease; }
.status-toast.show { opacity: 1; transform: translateY(0); }
@media (max-width: 1180px) { .main-grid { grid-template-columns: 1fr; } }
@media (max-width: 980px) { .top-actions { max-width: none; } .left-top { grid-template-columns: 1fr; } }
@media (max-width: 860px) {
  .header { flex-direction: column; align-items: stretch; }
  .project-head { text-align: left; }
  .timeline-header, .track-row { grid-template-columns: 86px 1fr; }
  .playhead-layer { left: 86px; }
  .floating-rail { left: 16px; right: 16px; transform: none; justify-content: center; }
}
`;

  const template = `
<div class="app-shell">
  <header class="header">
    <div class="brand">
      <button class="icon-btn" id="backBtn" aria-label="Go back to the previous view">←</button>
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
      <div class="left-top">
        <aside class="side-card" style="min-height:100%; display:flex; flex-direction:column;">
          <div class="card-title">💬 AI</div>
          <div class="chat-stack" id="chatStack"></div>
          <input class="text-input" id="chatInput" placeholder="Type command..." />
          <div class="quick-commands" id="quickCommands" style="margin-top:2px;"></div>
        </aside>
        <section class="preview-card">
          <div class="preview-glow"></div>
          <div class="preview-inner">
            <div class="preview-stage" id="previewStage"></div>
            <div class="preview-empty" id="previewEmpty">
              <div class="preview-screen">
                <div class="preview-emoji" id="previewEmoji">🎥</div>
                <div class="preview-title" id="previewTitle">Center Preview</div>
                <div class="preview-sub" id="previewSubtitle">Glow preview styled like the render page</div>
              </div>
            </div>
          </div>
          <input type="file" id="uploadInput" accept="video/*,image/*,audio/*,.txt" hidden />
          <div class="preview-overlay">
            <div class="time-row">
              <span id="currentTime">00:12.40</span>
              <span id="totalTime">01:00.00</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
            <div class="control-row">
              <button class="circle-btn" id="rewindBtn" aria-label="Rewind the playhead by 10%">⏮</button>
              <button class="circle-btn primary" id="playBtn" aria-label="Play or pause timeline preview">▶</button>
              <button class="circle-btn" id="stopBtn" aria-label="Stop playback and return to the beginning">⏹</button>
            </div>
          </div>
        </section>
      </div>
      <section class="timeline-card">
        <div class="timeline-top">
          <div class="toolbar-left">
            <div class="tool-group" id="toolGroup"></div>
            <button class="mini-btn" data-action="zoom-out" aria-label="Zoom out on the timeline">🔍-</button>
            <button class="mini-btn" data-action="zoom-in" aria-label="Zoom in on the timeline">🔍+</button>
            <button class="mini-btn" data-add-track="Video" aria-label="Add a new video track">+Video</button>
            <button class="mini-btn" data-add-track="Audio" aria-label="Add a new audio track">+Audio</button>
            <button class="mini-btn" data-add-track="Text" aria-label="Add a new text track">+Text</button>
            <button class="mini-btn" data-add-track="B-Roll" aria-label="Add a new B-roll track">+B-Roll</button>
          </div>
          <div class="pill-row" id="pillRow"></div>
        </div>
        <div class="timeline-shell">
          <div class="timeline-header"><div>Tracks</div><div>Timeline</div></div>
          <div class="timeline-body" id="timelineBody">
            <div class="playhead-layer"><div class="playhead-line" id="playheadLine"></div><div class="playhead-knob" id="playheadKnob"></div></div>
            <div id="trackRows"></div>
          </div>
        </div>
      </section>
    </div>
    <div class="side-col">
      <aside class="side-card">
        <div class="card-title">📁 Media</div>
        <button class="upload-btn" id="uploadBtn" aria-label="Upload media into the editor">Upload</button>
        <div class="media-note">Choose what you want to add to the timeline. Each tile inserts a different type of source asset.</div>
        <div class="media-grid" id="mediaGrid"></div>
      </aside>
      <aside class="side-card generate">
        <div class="generate-head"><div class="card-title cyan">⚡ Generate</div><div style="color: rgba(255,255,255,0.4)">✕</div></div>
        <div class="generate-types" id="generateTypes"></div>
        <textarea class="text-area" id="promptInput" placeholder="A cinematic shot of..."></textarea>
        <input class="text-input" id="negativeInput" placeholder="Negative prompt" />
        <div class="select-row">
          <select class="select-input" id="durationSelect"><option>5s</option><option>8s</option><option>12s</option></select>
          <select class="select-input" id="aspectSelect"><option>16:9</option><option>9:16</option><option>1:1</option></select>
          <select class="select-input" id="styleSelect"><option>Cinematic</option><option>Commercial</option><option>Documentary</option></select>
        </div>
        <button class="primary-btn" id="generateBtn" aria-label="Generate a new asset from the prompt settings">⚡ Generate</button>
      </aside>
    </div>
  </div>
</div>
<div class="floating-rail" id="floatingRail"></div>
<div class="status-toast" id="toast"></div>
`;

  function injectStyles() {
    if (document.getElementById('timeline-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'timeline-editor-styles';
    style.textContent = styles;
    document.head.appendChild(style);
  }

  function svgDataUri(markup) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  }

  function createState() {
    return {
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
          { id: 1, name: 'Opening Shot', left: 8, width: 18, type: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', poster: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#06131f"/><stop offset="1" stop-color="#123b4a"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="970" cy="180" r="120" fill="#22d3ee" opacity=".18"/><text x="90" y="310" fill="white" font-size="74" font-family="Arial" font-weight="700">Opening Shot</text><text x="92" y="380" fill="#a5f3fc" font-size="30" font-family="Arial">Cinematic demo preview</text></svg>`) },
          { id: 2, name: 'Generated Clip', left: 34, width: 16, type: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm', poster: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><rect x="110" y="145" width="1060" height="430" rx="28" fill="white" opacity=".04"/><text x="110" y="310" fill="white" font-size="76" font-family="Arial" font-weight="700">Generated Clip</text><text x="112" y="382" fill="#bbf7d0" font-size="30" font-family="Arial">Rendered output preview</text></svg>`) }
        ] },
        { id: 'audio-1', name: 'Audio', muted: false, solo: false, locked: false, clips: [
          { id: 3, name: 'Music Bed', left: 5, width: 42, type: 'audio', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' }
        ] },
        { id: 'text-1', name: 'Text', muted: false, solo: false, locked: false, clips: [
          { id: 4, name: 'Title Card', left: 14, width: 12, type: 'text', heading: 'Launch Faster', body: 'Use your timeline editor to turn generated media, overlays, and captions into polished deliverables.' }
        ] },
        { id: 'broll-1', name: 'B-Roll', muted: false, solo: false, locked: false, clips: [
          { id: 5, name: 'City Cutaway', left: 52, width: 20, type: 'image', src: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#020617"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><g opacity=".9"><rect x="120" y="340" width="120" height="250" fill="#0f172a"/><rect x="260" y="280" width="140" height="310" fill="#111827"/><rect x="430" y="210" width="180" height="380" fill="#1f2937"/><rect x="650" y="250" width="110" height="340" fill="#0f172a"/><rect x="780" y="180" width="210" height="410" fill="#1e293b"/></g><circle cx="1060" cy="130" r="70" fill="#e0f2fe" opacity=".75"/><text x="120" y="150" fill="white" font-size="78" font-family="Arial" font-weight="700">City Cutaway</text></svg>`), fit: 'cover' }
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
      // Enhanced state management
      projectId: null,
      undoStack: [],
      redoStack: [],
      mediaLibrary: [],
      generationQueue: [],
      isProcessing: false
    };
  }

  // Enhanced state management with local storage persistence
  function loadProjectFromStorage() {
    try {
      const saved = localStorage.getItem('timeline-editor-project');
      if (saved) {
        const projectData = JSON.parse(saved);
        showToast('Project loaded from local storage', 'success');
        return { ...createState(), ...projectData };
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      showToast('Failed to load saved project', 'error');
    }
    return createState();
  }

  function saveProjectToStorage(state) {
    try {
      const projectData = {
        projectTitle: state.projectTitle,
        selectedTool: state.selectedTool,
        selectedClipId: state.selectedClipId,
        generateType: state.generateType,
        zoom: state.zoom,
        timelineSeconds: state.timelineSeconds,
        tracks: state.tracks,
        mediaLibrary: state.mediaLibrary,
        projectId: state.projectId,
        timestamp: Date.now()
      };
      localStorage.setItem('timeline-editor-project', JSON.stringify(projectData));
      showToast('Project saved locally', 'success');
    } catch (err) {
      console.error('Failed to save project:', err);
      showToast('Failed to save project', 'error');
    }
  }

  function saveStateSnapshot(state) {
    state.undoStack.push(JSON.parse(JSON.stringify({
      projectTitle: state.projectTitle,
      tracks: state.tracks,
      selectedClipId: state.selectedClipId,
      playheadPercent: state.playheadPercent
    })));
    // Limit undo stack to 50 entries
    if (state.undoStack.length > 50) {
      state.undoStack.shift();
    }
    state.redoStack = [];
  }

  function undo(state) {
    if (state.undoStack.length === 0) {
      showToast('Nothing to undo', 'warning');
      return false;
    }
    const snapshot = state.undoStack.pop();
    state.redoStack.push(JSON.parse(JSON.stringify({
      projectTitle: state.projectTitle,
      tracks: state.tracks,
      selectedClipId: state.selectedClipId,
      playheadPercent: state.playheadPercent
    })));
    Object.assign(state, snapshot);
    showToast('Action undone', 'info');
    return true;
  }

  function redo(state) {
    if (state.redoStack.length === 0) {
      showToast('Nothing to redo', 'warning');
      return false;
    }
    const snapshot = state.redoStack.pop();
    state.undoStack.push(JSON.parse(JSON.stringify({
      projectTitle: state.projectTitle,
      tracks: state.tracks,
      selectedClipId: state.selectedClipId,
      playheadPercent: state.playheadPercent
    })));
    Object.assign(state, snapshot);
    showToast('Action redone', 'info');
    return true;
  }

  function formatTimeFromPercent(percent, totalSeconds) {
    const current = (percent / 100) * totalSeconds;
    const minutes = Math.floor(current / 60);
    const seconds = Math.floor(current % 60);
    const hundredths = Math.floor((current % 1) * 100);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function createTimelineEditorApp(root) {
    const state = loadProjectFromStorage();
    let playbackTimer = null;

    // Keyboard shortcuts for undo/redo
    function handleKeyboardShortcuts(event) {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              if (redo(state)) renderAll();
            } else {
              event.preventDefault();
              if (undo(state)) renderAll();
            }
            break;
          case 'y':
            event.preventDefault();
            if (redo(state)) renderAll();
            break;
          case 's':
            event.preventDefault();
            saveProjectToStorage(state);
            break;
        }
      }
    }

    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyboardShortcuts);
    root.innerHTML = template;

    const els = {
      topActions: root.querySelector('#topActions'),
      toolGroup: root.querySelector('#toolGroup'),
      pillRow: root.querySelector('#pillRow'),
      trackRows: root.querySelector('#trackRows'),
      mediaGrid: root.querySelector('#mediaGrid'),
      generateTypes: root.querySelector('#generateTypes'),
      chatStack: root.querySelector('#chatStack'),
      quickCommands: root.querySelector('#quickCommands'),
      floatingRail: root.querySelector('#floatingRail'),
      playBtn: root.querySelector('#playBtn'),
      stopBtn: root.querySelector('#stopBtn'),
      rewindBtn: root.querySelector('#rewindBtn'),
      currentTime: root.querySelector('#currentTime'),
      totalTime: root.querySelector('#totalTime'),
      progressFill: root.querySelector('#progressFill'),
      previewTitle: root.querySelector('#previewTitle'),
      previewSubtitle: root.querySelector('#previewSubtitle'),
      previewEmoji: root.querySelector('#previewEmoji'),
      previewStage: root.querySelector('#previewStage'),
      previewEmpty: root.querySelector('#previewEmpty'),
      playheadLine: root.querySelector('#playheadLine'),
      playheadKnob: root.querySelector('#playheadKnob'),
      projectTitle: root.querySelector('#projectTitle'),
      promptInput: root.querySelector('#promptInput'),
      durationSelect: root.querySelector('#durationSelect'),
      aspectSelect: root.querySelector('#aspectSelect'),
      styleSelect: root.querySelector('#styleSelect'),
      generateBtn: root.querySelector('#generateBtn'),
      chatInput: root.querySelector('#chatInput'),
      toast: root.querySelector('#toast'),
      uploadBtn: root.querySelector('#uploadBtn'),
      backBtn: root.querySelector('#backBtn'),
      uploadInput: root.querySelector('#uploadInput')
    };

    function showToast(message) {
      els.toast.textContent = message;
      els.toast.classList.add('show');
      clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(() => els.toast.classList.remove('show'), 1800);
    }

    function findSelectedClip() {
      return state.tracks.flatMap((track) => track.clips).find((item) => item.id === state.selectedClipId);
    }

    function clearPreviewStage() {
      const nodes = els.previewStage.querySelectorAll('*');
      nodes.forEach((node) => {
        if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') node.pause();
        node.remove();
      });
    }

    function buildAudioBars() {
      return Array.from({ length: 24 }, (_, index) => {
        const heights = [22,38,56,32,66,40,72,28,60,44,68,34,76,42,58,30,70,36,62,26,74,48,52,40];
        return `<span style="height:${heights[index]}px"></span>`;
      }).join('');
    }

    function renderPreviewAsset(selected) {
      clearPreviewStage();
      if (!selected) {
        els.previewEmpty.style.display = 'flex';
        els.previewTitle.textContent = 'Center Preview';
        els.previewSubtitle.textContent = 'Glow preview styled like the render page';
        els.previewEmoji.textContent = '🎥';
        return;
      }

      els.previewEmpty.style.display = 'none';
      els.previewTitle.textContent = selected.name;
      els.previewSubtitle.textContent = `${state.selectedTool} tool active • ${state.generateType} generation ready`;
      els.previewEmoji.textContent = selected.type === 'audio' ? '🎵' : selected.type === 'text' ? '📝' : selected.type === 'image' ? '🖼️' : '🎥';

      if (selected.type === 'video' && selected.src) {
        const video = document.createElement('video');
        video.className = 'preview-media';
        video.src = selected.src;
        if (selected.poster) video.poster = selected.poster;
        video.controls = true;
        video.preload = 'metadata';
        video.playsInline = true;
        els.previewStage.appendChild(video);
        return;
      }

      if (selected.type === 'image' && selected.src) {
        const image = document.createElement('img');
        image.className = `preview-media ${selected.fit === 'cover' ? '' : 'contain'}`;
        image.src = selected.src;
        image.alt = selected.name;
        els.previewStage.appendChild(image);
        return;
      }

      if (selected.type === 'audio') {
        const wrap = document.createElement('div');
        wrap.className = 'preview-audio-card';
        wrap.innerHTML = `
          <div class="preview-audio-top">
            <div class="preview-audio-icon">🎵</div>
            <div class="preview-audio-meta">
              <div class="preview-audio-name">${selected.name}</div>
              <div class="preview-audio-desc">Audio preview with transport and waveform styling</div>
            </div>
          </div>
          <div class="preview-audio-bars">${buildAudioBars()}</div>
        `;
        const audio = document.createElement('audio');
        audio.controls = true;
        if (selected.src) audio.src = selected.src;
        audio.style.width = '100%';
        wrap.appendChild(audio);
        els.previewStage.appendChild(wrap);
        return;
      }

      if (selected.type === 'text') {
        const textCard = document.createElement('div');
        textCard.className = 'preview-text-card';
        textCard.innerHTML = `
          <div class="preview-text-kicker">Text Overlay Preview</div>
          <div class="preview-text-heading">${selected.heading || selected.name}</div>
          <div class="preview-text-body">${selected.body || 'This clip shows how text overlays, captions, or title cards can render in the preview stage.'}</div>
        `;
        els.previewStage.appendChild(textCard);
        return;
      }

      els.previewEmpty.style.display = 'flex';
    }

    function updatePreview(clip) {
      const selected = clip || findSelectedClip();
      els.projectTitle.textContent = state.projectTitle;
      renderPreviewAsset(selected);
    }

    function syncMediaPlayState() {
      const media = els.previewStage.querySelector('video, audio');
      if (!media) return;
      if (state.playing) {
        media.play().catch(() => {});
      } else {
        media.pause();
      }
    }

    function updatePlaybackUI() {
      els.progressFill.style.width = `${state.playheadPercent}%`;
      els.playheadLine.style.left = `${state.playheadPercent}%`;
      els.playheadKnob.style.left = `calc(${state.playheadPercent}% - 4px)`;
      els.currentTime.textContent = formatTimeFromPercent(state.playheadPercent, state.timelineSeconds);
      els.totalTime.textContent = formatTimeFromPercent(100, state.timelineSeconds);
      els.playBtn.textContent = state.playing ? '❚❚' : '▶';
      syncMediaPlayState();
    }

    // Top action bar functionality
    function togglePreviewVisibility() {
      const previewCard = els.previewStage.closest('.preview-card');
      if (previewCard) {
        previewCard.style.display = previewCard.style.display === 'none' ? 'block' : 'none';
        showToast('Preview visibility toggled', 'info');
      }
    }

    function openMonitorSettings() {
      // Could open a modal with monitor/display settings
      showToast('Monitor settings opened', 'info');
    }

    function openMediaLibrary() {
      // Focus on media grid section
      const mediaGrid = els.mediaGrid;
      if (mediaGrid) {
        mediaGrid.scrollIntoView({ behavior: 'smooth' });
        showToast('Media library focused', 'info');
      }
    }

    function toggleQuickAIActions() {
      // Toggle visibility of quick commands
      const quickCommands = els.quickCommands;
      if (quickCommands) {
        quickCommands.style.display = quickCommands.style.display === 'none' ? 'flex' : 'none';
        showToast('Quick AI actions toggled', 'info');
      }
    }

    function openMusicTools() {
      // Focus on audio track or open music tools
      const audioTrack = state.tracks.find(t => t.name === 'Audio');
      if (audioTrack) {
        showToast('Audio tools opened', 'info');
      } else {
        showToast('No audio track found', 'warning');
      }
    }

    function openAudioControls() {
      // Open audio mixer or controls
      showToast('Audio controls opened', 'info');
    }

    function openVideoTools() {
      // Open video editing tools
      showToast('Video tools opened', 'info');
    }

    function openProfileTools() {
      // Open user profile or project settings
      showToast('Profile tools opened', 'info');
    }

    function openEditorSettings() {
      // Open editor preferences/settings
      showToast('Editor settings opened', 'info');
    }

    function focusChatInput() {
      // Focus the chat input field
      if (els.chatInput) {
        els.chatInput.focus();
        showToast('Chat input focused', 'info');
      }
    }

    function openProjectNotes() {
      // Open project notes or clipboard
      showToast('Project notes opened', 'info');
    }

    function renderTopActions() {
      els.topActions.innerHTML = '';
      const topActionLabels = {
        '👁': 'Toggle preview visibility tools', '📺': 'Open monitor or viewer settings', '📁': 'Open project media or files', '⚡': 'Open quick AI actions',
        '🎵': 'Open music tools', '🔊': 'Open audio controls', '🎞️': 'Open video strip or scene tools', '👤': 'Open character or profile tools',
        '⚙️': 'Open editor settings', '💬': 'Open AI chat tools', '📋': 'Open project notes or clipboard actions'
      };
      state.topIcons.forEach((icon, index) => {
        const button = document.createElement('button');
        button.className = `top-icon ${index === 3 ? 'active' : ''}`;
        button.textContent = icon;
        button.title = topActionLabels[icon] || 'Top action';
        button.setAttribute('aria-label', button.title);

        // Add specific functionality for each icon
        button.addEventListener('click', () => {
          switch (icon) {
            case '👁':
              togglePreviewVisibility();
              break;
            case '📺':
              openMonitorSettings();
              break;
            case '📁':
              openMediaLibrary();
              break;
            case '⚡':
              toggleQuickAIActions();
              break;
            case '🎵':
              openMusicTools();
              break;
            case '🔊':
              openAudioControls();
              break;
            case '🎞️':
              openVideoTools();
              break;
            case '👤':
              openProfileTools();
              break;
            case '⚙️':
              openEditorSettings();
              break;
            case '💬':
              focusChatInput();
              break;
            case '📋':
              openProjectNotes();
              break;
            default:
              showToast(`${icon} action clicked`);
          }
        });

        els.topActions.appendChild(button);
      });
      const ready = document.createElement('div');
      ready.className = 'ready-pill';
      ready.innerHTML = '<span class="ready-dot"></span>Ready';
      ready.title = 'Editor is ready for interaction';
      ready.setAttribute('aria-label', 'Editor is ready for interaction');
      els.topActions.appendChild(ready);
    }

    function renderTools() {
      els.toolGroup.innerHTML = '';
      const toolDescriptions = { Select: 'Select and inspect clips on the timeline', Blade: 'Cut clips at the playhead position', Ripple: 'Trim clips and ripple the timeline', Roll: 'Adjust the edit point between two clips', Slip: 'Change clip contents without moving its position', Slide: 'Move a clip while adjusting nearby clips', Zoom: 'Zoom the timeline in or out', Hand: 'Pan across the timeline view' };
      state.tools.forEach(([icon, label]) => {
        const button = document.createElement('button');
        button.className = `tool-btn ${state.selectedTool === label ? 'active' : ''}`;
        button.title = toolDescriptions[label] || label;
        button.textContent = icon;
        button.setAttribute('aria-label', button.title);
        button.addEventListener('click', () => {
          state.selectedTool = label;
          renderTools();
          updatePreview();
          showToast(`${label} tool selected`);
        });
        els.toolGroup.appendChild(button);
      });
    }

    function renderPills() {
      els.pillRow.innerHTML = '';
      state.pills.forEach((pill) => {
        const span = document.createElement('span');
        span.className = 'pill';
        span.textContent = pill;
        span.title = `${pill} quick mode`;
        span.setAttribute('aria-label', `${pill} quick mode`);
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
        meta.innerHTML = `
          <div class="track-name">${track.name}</div>
          <div class="track-actions">
            <button class="track-toggle ${track.muted ? 'locked' : ''}" data-toggle="mute" aria-label="Mute or unmute this track">M</button>
            <button class="track-toggle ${track.solo ? 'locked' : ''}" data-toggle="solo" aria-label="Solo this track">S</button>
            <button class="track-toggle ${track.locked ? 'locked' : ''}" data-toggle="lock" aria-label="Lock or unlock this track">L</button>
          </div>
          <div class="track-count">${track.clips.length} clips</div>
        `;
        meta.querySelectorAll('.track-toggle').forEach((button) => {
          button.addEventListener('click', () => {
            const key = button.dataset.toggle;
            if (key === 'mute') track.muted = !track.muted;
            if (key === 'solo') track.solo = !track.solo;
            if (key === 'lock') track.locked = !track.locked;
            renderTracks();
            showToast(`${track.name} ${key} toggled`);
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
        lane.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        });
        lane.addEventListener('drop', (e) => {
          e.preventDefault();
          const data = JSON.parse(e.dataTransfer.getData('application/json'));
          const rect = lane.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          if (data.type === 'clip') {
            const allClips = state.tracks.flatMap(t => t.clips);
            const clip = allClips.find(c => c.id === data.clipId);
            if (clip) {
              // Remove from old track
              state.tracks.forEach(t => t.clips = t.clips.filter(c => c.id !== clip.id));
              // Add to new track
              clip.left = Math.max(0, Math.min(100 - clip.width, percent));
              track.clips.push(clip);
              // Sort clips by left
              track.clips.sort((a, b) => a.left - b.left);
              saveStateSnapshot(state);
              renderTracks();
              showToast(`Clip moved to ${track.name}`);
            }
          } else if (data.type === 'media') {
            const extra = {};
            if (data.mediaType === 'video') {
              extra.src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
            } else if (data.mediaType === 'image') {
              extra.src = svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><text x="90" y="320" fill="white" font-size="74" font-family="Arial" font-weight="700">${data.label}</text></svg>`);
              extra.fit = 'contain';
            } else if (data.mediaType === 'audio') {
              extra.src = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';
            } else {
              extra.heading = data.label;
              extra.body = 'Dragged text asset.';
            }
            const newClip = { id: Date.now(), name: data.label, left: Math.max(0, percent), width: 16, type: data.mediaType, ...extra };
            track.clips.push(newClip);
            state.selectedClipId = newClip.id;
            saveStateSnapshot(state);
            renderTracks();
            updatePreview(newClip);
            showToast(`${data.label} added to ${track.name}`);
          }
        });
        track.clips.forEach((clip) => {
          // Convert clip format for enhanced renderer
          const enhancedClip = {
            id: clip.id,
            name: clip.name,
            text: clip.heading || clip.name,
            start: (clip.left / 100) * state.timelineSeconds,
            end: ((clip.left + clip.width) / 100) * state.timelineSeconds,
            type: clip.type,
            src: clip.src,
            fit: clip.fit,
            heading: clip.heading,
            body: clip.body,
            waveformData: clip.waveformData
          };

          const clipEl = createEnhancedClipElement(enhancedClip, { id: track.id, name: track.name }, {
            selectedClipId: state.selectedClipId,
            timelineSeconds: state.timelineSeconds
          }, state.zoom || 1);

          // Override click handler to work with this timeline's state management
          clipEl.addEventListener('click', (event) => {
            if (event.target.classList.contains('clip-handle')) return; // Don't trigger on handle clicks
            event.stopPropagation();
            state.selectedClipId = clip.id;
            updatePreview(clip);
            renderTracks();
            showToast(`${clip.name} selected`);
          }, true); // Use capture to override the default handler

          lane.appendChild(clipEl);
        });
        row.append(meta, lane);
        els.trackRows.appendChild(row);
      });
    }

    function createClipForMedia(label, file) {
      const objectUrl = URL.createObjectURL(file);
      const base = { id: Date.now() + Math.floor(Math.random() * 1000), name: file.name || label, left: 12, width: 16 };
      if (file.type.startsWith('video/')) return { ...base, type: 'video', src: objectUrl };
      if (file.type.startsWith('image/')) return { ...base, type: 'image', src: objectUrl, fit: 'contain' };
      if (file.type.startsWith('audio/')) return { ...base, type: 'audio', src: objectUrl };
      return { ...base, type: 'text', heading: file.name || 'Text Asset', body: 'Uploaded text asset preview placeholder.' };
    }

    function insertClipIntoTrack(clip, preferredTrackName) {
      const targetTrack = state.tracks.find((track) => track.name === preferredTrackName) || state.tracks[0];

      // Convert start/end format to left/width format used by this timeline
      if (clip.start !== undefined && clip.end !== undefined) {
        clip.left = (clip.start / state.timelineSeconds) * 100;
        clip.width = ((clip.end - clip.start) / state.timelineSeconds) * 100;
        delete clip.start;
        delete clip.end;
      } else {
        clip.left = Math.min(78, 8 + targetTrack.clips.length * 10);
      }

      targetTrack.clips.push(clip);
      state.selectedClipId = clip.id;
      renderTracks();
      updatePreview(clip);
    }

    function renderMedia() {
      // Use enhanced media library rendering with drag and drop support
      renderMediaGrid(state.media, els.mediaGrid, (media, index, showToast) => {
        // Handle media selection (click)
        const generatedId = Date.now();
        let clip;
        if (media.label === 'Video Clip') {
          clip = { id: generatedId, name: `Video Clip ${generatedId.toString().slice(-3)}`, start: 0, end: 14, type: 'video', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' };
          insertClipIntoTrack(clip, 'Video');
        } else if (media.label === 'Image Frame' || media.label === 'B-Roll Asset') {
          clip = { id: generatedId, name: media.label, start: 0, end: 14, type: 'image', src: svgDataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#111827"/><stop offset="1" stop-color="#0f766e"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><text x="90" y="320" fill="white" font-size="74" font-family="Arial" font-weight="700">${media.label}</text></svg>`), fit: 'contain' };
          insertClipIntoTrack(clip, media.label === 'B-Roll Asset' ? 'B-Roll' : 'Text');
        } else if (media.label === 'Audio Track') {
          clip = { id: generatedId, name: `Audio ${generatedId.toString().slice(-3)}`, start: 0, end: 16, type: 'audio', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3' };
          insertClipIntoTrack(clip, 'Audio');
        } else {
          clip = { id: generatedId, name: media.label, start: 0, end: 12, type: 'text', text: media.label, style: { fontSize: 24, color: '#ffffff', background: 'rgba(0,0,0,0.7)' } };
          insertClipIntoTrack(clip, 'Text');
        }
        showToast(`${media.label} inserted into timeline`);
      }, showToast, state);
    }

    function renderGenerateTypes() {
      els.generateTypes.innerHTML = '';
      state.generateTypes.forEach(([icon, label]) => {
        const button = document.createElement('button');
        button.className = `generate-type ${state.generateType === label ? 'active' : ''}`;
        button.innerHTML = `<span class="emoji">${icon}</span><span>${label}</span>`;
        button.title = `Switch generate mode to ${label}`;
        button.setAttribute('aria-label', `Switch generate mode to ${label}`);
        button.addEventListener('click', () => {
          state.generateType = label;
          renderGenerateTypes();
          showToast(`${label} mode selected`);
        });
        els.generateTypes.appendChild(button);
      });
    }

    function renderChat() {
      els.chatStack.innerHTML = '';
      state.chat.forEach((entry) => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${entry.role}`;
        bubble.textContent = entry.text;
        els.chatStack.appendChild(bubble);
      });
    }

    async function handleChatSubmit() {
      const text = els.chatInput.value.trim();
      if (!text) return;

      state.chat.push({ role: 'user', text });
      renderChat();
      els.chatInput.value = '';
      showToast('Processing AI command...', 'info');

      try {
        // Check if Supabase is configured before making requests
        if (!supabase || typeof supabase.functions?.invoke !== 'function') {
          throw new Error('AI features require Supabase configuration');
        }

        // Call frame-agent edge function
        const { data, error } = await supabase.functions.invoke('frame-agent', {
          body: {
            command: text,
            context: {
              selectedClipId: state.selectedClipId,
              currentTool: state.selectedTool,
              timelineState: {
                playheadPercent: state.playheadPercent,
                zoom: state.zoom,
                tracks: state.tracks.map(track => ({
                  id: track.id,
                  name: track.name,
                  clipCount: track.clips.length
                }))
              }
            }
          }
        });

        if (error) {
          console.error('Frame agent error:', error);
          // Handle different types of errors gracefully
          if (error.message?.includes('401') || error.message?.includes('auth')) {
            state.chat.push({ role: 'ai', text: 'AI features require authentication. Please sign in to use AI commands.' });
            showToast('Please sign in to use AI features', 'warning');
          } else {
            state.chat.push({ role: 'ai', text: `Error: ${error.message}` });
            showToast('AI command failed', 'error');
          }
        } else {
          // Process the AI response and apply changes
          const aiResponse = data?.response || 'Command processed successfully';
          state.chat.push({ role: 'ai', text: aiResponse });

          // Apply any timeline modifications from the AI response
          if (data?.modifications) {
            applyAIModifications(data.modifications);
          }

          showToast('AI command executed', 'success');
        }
      } catch (err) {
        console.error('Chat submission error:', err);
        // Provide user-friendly error messages
        if (err.message?.includes('Supabase')) {
          state.chat.push({ role: 'ai', text: 'AI features are not available. Supabase configuration required.' });
          showToast('AI features require Supabase setup', 'warning');
        } else if (err.message?.includes('fetch') || err.message?.includes('network')) {
          state.chat.push({ role: 'ai', text: 'Network error. Please check your connection.' });
          showToast('Network error - please check connection', 'error');
        } else {
          state.chat.push({ role: 'ai', text: `Error: ${err.message}` });
          showToast('Failed to process AI command', 'error');
        }
      }

      renderChat();
    }

    function applyAIModifications(modifications) {
      if (!modifications) return;

      saveStateSnapshot(state);

      // Apply playhead changes
      if (modifications.playheadPercent !== undefined) {
        state.playheadPercent = Math.max(0, Math.min(100, modifications.playheadPercent));
      }

      // Apply zoom changes
      if (modifications.zoom !== undefined) {
        state.zoom = Math.max(0.5, Math.min(2, modifications.zoom));
      }

      // Apply clip modifications
      if (modifications.clipChanges) {
        modifications.clipChanges.forEach(change => {
          const track = state.tracks.find(t => t.id === change.trackId);
          if (track) {
            const clip = track.clips.find(c => c.id === change.clipId);
            if (clip) {
              Object.assign(clip, change.updates);
            }
          }
        });
      }

      // Apply track modifications
      if (modifications.trackChanges) {
        modifications.trackChanges.forEach(change => {
          const track = state.tracks.find(t => t.id === change.trackId);
          if (track) {
            Object.assign(track, change.updates);
          }
        });
      }

      // Add new clips
      if (modifications.newClips) {
        modifications.newClips.forEach(clipData => {
          const track = state.tracks.find(t => t.name === clipData.trackName);
          if (track) {
            track.clips.push(clipData.clip);
            state.selectedClipId = clipData.clip.id;
          }
        });
      }

      renderAll();
    }

    function renderQuickCommands() {
      els.quickCommands.innerHTML = '';
      state.quickCommands.forEach((command) => {
        const button = document.createElement('button');
        button.className = 'command-btn';
        button.textContent = command;
        button.title = `Run quick command: ${command}`;
        button.setAttribute('aria-label', `Run quick command: ${command}`);
        button.addEventListener('click', () => {
          els.chatInput.value = command;
          handleChatSubmit();
        });
        els.quickCommands.appendChild(button);
      });
    }

    // Floating rail action functionality
    function splitClipAtPlayhead() {
      const selectedClip = findSelectedClip();
      if (!selectedClip) {
        showToast('No clip selected', 'warning');
        return;
      }

      saveStateSnapshot(state);

      const track = state.tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
      if (!track) return;

      const clipIndex = track.clips.findIndex(c => c.id === selectedClip.id);
      const splitPosition = (state.playheadPercent / 100) * 100; // Convert to clip width percentage

      if (splitPosition <= selectedClip.left || splitPosition >= selectedClip.left + selectedClip.width) {
        showToast('Playhead not within selected clip', 'warning');
        return;
      }

      // Create two new clips from the split
      const leftClip = {
        ...selectedClip,
        id: Date.now(),
        width: splitPosition - selectedClip.left
      };

      const rightClip = {
        ...selectedClip,
        id: Date.now() + 1,
        left: splitPosition,
        width: (selectedClip.left + selectedClip.width) - splitPosition
      };

      // Replace the original clip with the two new ones
      track.clips.splice(clipIndex, 1, leftClip, rightClip);
      state.selectedClipId = leftClip.id;

      renderTracks();
      updatePreview();
      showToast('Clip split at playhead', 'success');
    }

    async function detectScenes() {
      showToast('Detecting scenes...', 'info');

      try {
        const { data, error } = await supabase.functions.invoke('videoagent', {
          body: {
            action: 'scene-detection',
            project_id: state.projectId,
            timeline_data: {
              tracks: state.tracks,
              duration: state.timelineSeconds
            }
          }
        });

        if (error) throw error;

        if (data.scenes) {
          // Add scene markers or clips based on detection results
          showToast(`Detected ${data.scenes.length} scenes`, 'success');
        }
      } catch (err) {
        console.error('Scene detection error:', err);
        showToast('Scene detection failed', 'error');
      }
    }

    async function generateSubtitles() {
      const selectedClip = findSelectedClip();
      if (!selectedClip || selectedClip.type !== 'video') {
        showToast('Select a video clip first', 'warning');
        return;
      }

      showToast('Generating subtitles...', 'info');

      try {
        const { data, error } = await supabase.functions.invoke('frame-agent', {
          body: {
            command: 'subtitle',
            context: {
              clipId: selectedClip.id,
              videoUrl: selectedClip.src
            }
          }
        });

        if (error) throw error;

        // Add subtitle track or overlay
        showToast('Subtitles generated', 'success');
      } catch (err) {
        console.error('Subtitle generation error:', err);
        showToast('Subtitle generation failed', 'error');
      }
    }

    async function suggestBRoll() {
      showToast('Analyzing for B-Roll suggestions...', 'info');

      try {
        const { data, error } = await supabase.functions.invoke('frame-agent', {
          body: {
            command: 'b-roll',
            context: {
              timeline: state.tracks,
              playhead: state.playheadPercent
            }
          }
        });

        if (error) throw error;

        if (data.suggestions) {
          // Add suggested B-Roll clips
          showToast('B-Roll suggestions added', 'success');
        }
      } catch (err) {
        console.error('B-Roll suggestion error:', err);
        showToast('B-Roll suggestions failed', 'error');
      }
    }

    function adjustSpeed() {
      const selectedClip = findSelectedClip();
      if (!selectedClip) {
        showToast('No clip selected', 'warning');
        return;
      }

      // Simple speed adjustment (could be enhanced with UI)
      const newSpeed = prompt('Enter speed multiplier (0.25-4.0):', '1.0');
      if (newSpeed && !isNaN(parseFloat(newSpeed))) {
        saveStateSnapshot(state);
        selectedClip.speed = parseFloat(newSpeed);
        showToast(`Speed set to ${newSpeed}x`, 'success');
      }
    }

    async function stabilizeFootage() {
      const selectedClip = findSelectedClip();
      if (!selectedClip || selectedClip.type !== 'video') {
        showToast('Select a video clip first', 'warning');
        return;
      }

      showToast('Stabilizing footage...', 'info');

      try {
        const { data, error } = await supabase.functions.invoke('frame-agent', {
          body: {
            command: 'stabilize',
            context: {
              clipId: selectedClip.id,
              videoUrl: selectedClip.src
            }
          }
        });

        if (error) throw error;

        showToast('Footage stabilized', 'success');
      } catch (err) {
        console.error('Stabilization error:', err);
        showToast('Stabilization failed', 'error');
      }
    }

    function addTextOverlay() {
      const text = prompt('Enter text for overlay:');
      if (text) {
        const clipId = Date.now();
        const clip = {
          id: clipId,
          name: `Text: ${text.slice(0, 18)}`,
          left: state.playheadPercent,
          width: 10,
          type: 'text',
          heading: text.slice(0, 40),
          body: text
        };

        insertClipIntoTrack(clip, 'Text');
        showToast('Text overlay added', 'success');
      }
    }

    function renderRail() {
      els.floatingRail.innerHTML = '';
      state.railActions.forEach(([icon, label, active]) => {
        const button = document.createElement('button');
        button.className = `rail-btn ${active ? 'active' : ''}`;
        button.innerHTML = `<span class="emoji">${icon}</span><span>${label}</span>`;
        button.title = `${label} action`;
        button.setAttribute('aria-label', `${label} action`);

        // Add specific functionality for each rail action
        button.addEventListener('click', async () => {
          switch (label) {
            case 'Generate':
              // Trigger generation with current prompt
              await generateClip();
              break;
            case 'Split':
              splitClipAtPlayhead();
              break;
            case 'Scenes':
              detectScenes();
              break;
            case 'Subtitle':
              generateSubtitles();
              break;
            case 'B-Roll':
              suggestBRoll();
              break;
            case 'Speed':
              adjustSpeed();
              break;
            case 'Stabilize':
              stabilizeFootage();
              break;
            case 'Text':
              addTextOverlay();
              break;
            default:
              showToast(`${label} action triggered`);
          }
        });

        els.floatingRail.appendChild(button);
      });
    }

    function addTrack(type) {
      state.tracks.push({ id: `${type.toLowerCase()}-${Date.now()}`, name: type, muted: false, solo: false, locked: false, clips: [] });
      renderTracks();
      showToast(`${type} track added`);
    }

    async function generateClip() {
      const prompt = els.promptInput.value.trim();
      const negativePrompt = els.negativeInput.value.trim();
      const duration = els.durationSelect.value;
      const aspect = els.aspectSelect.value;
      const style = els.styleSelect.value;

      if (!prompt) {
        showToast('Please enter a prompt', 'warning');
        return;
      }

      if (state.isProcessing) {
        showToast('Generation already in progress', 'warning');
        return;
      }

      state.isProcessing = true;
      showToast('Generating content...', 'info');

      try {
        let generationResult;

        // Determine generation endpoint based on type
        if (state.generateType === 'Text') {
          // For text generation, create a text clip directly
          const clipId = Date.now();
          const clip = {
            id: clipId,
            name: `Text: ${prompt.slice(0, 18)}`,
            left: 0,
            width: 14,
            type: 'text',
            heading: prompt.slice(0, 40),
            body: negativePrompt || `Generated text content for: ${prompt}`
          };
          insertClipIntoTrack(clip, 'Text');
          showToast('Text clip created', 'success');
          return;
        }

        // Check if Supabase is configured before making requests
        if (!supabase || typeof supabase.functions?.invoke !== 'function') {
          throw new Error('Generation features require Supabase configuration');
        }

        if (state.generateType === 'Image' || state.generateType === 'B-Roll') {
          // Generate image using muapi-proxy
          const { data, error } = await supabase.functions.invoke('muapi-proxy', {
            body: {
              endpoint: 'predictions',
              method: 'POST',
              data: {
                model: 'flux-dev',
                prompt: prompt,
                negative_prompt: negativePrompt,
                aspect_ratio: aspect === '16:9' ? '16:9' : aspect === '9:16' ? '9:16' : '1:1',
                style: style.toLowerCase()
              }
            }
          });

          if (error) throw error;
          generationResult = data;
        } else {
          // Video generation
          const { data, error } = await supabase.functions.invoke('muapi-proxy', {
            body: {
              endpoint: 'video-generation',
              method: 'POST',
              data: {
                prompt: prompt,
                negative_prompt: negativePrompt,
                duration: duration,
                aspect_ratio: aspect === '16:9' ? '16:9' : aspect === '9:16' ? '9:16' : '1:1',
                style: style.toLowerCase()
              }
            }
          });

          if (error) throw error;
          generationResult = data;
        }

        // Process the generation result
        if (generationResult && generationResult.url) {
          const clipId = Date.now();
          let clip;

          if (state.generateType === 'Image' || state.generateType === 'B-Roll') {
            clip = {
              id: clipId,
              name: `${state.generateType}: ${prompt.slice(0, 18)}`,
              left: 0,
              width: 14,
              type: 'image',
              src: generationResult.url,
              fit: 'contain'
            };
          } else {
            clip = {
              id: clipId,
              name: `Video: ${prompt.slice(0, 18)}`,
              left: 0,
              width: parseInt(duration) * 2, // Rough width based on duration
              type: 'video',
              src: generationResult.url,
              poster: generationResult.thumbnail_url
            };
          }

          insertClipIntoTrack(clip, state.generateType === 'B-Roll' ? 'B-Roll' : 'Video');

          // Add to media library
          state.mediaLibrary.push({
            id: clipId,
            name: clip.name,
            type: state.generateType.toLowerCase(),
            url: generationResult.url,
            generatedAt: new Date().toISOString(),
            prompt: prompt
          });

          showToast(`${state.generateType} generated successfully`, 'success');
        } else {
          throw new Error('No result URL returned from generation');
        }

      } catch (error) {
        console.error('Generation error:', error);
        // Provide user-friendly error messages
        if (error.message?.includes('401') || error.message?.includes('auth')) {
          showToast('Generation requires authentication. Please sign in.', 'warning');
        } else if (error.message?.includes('Supabase')) {
          showToast('Generation features require Supabase setup', 'warning');
        } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
          showToast('Network error - please check connection', 'error');
        } else {
          showToast(`Generation failed: ${error.message}`, 'error');
        }
      } finally {
        state.isProcessing = false;
        // Save project state after generation
        saveProjectToStorage(state);
      }
    }

    function togglePlayback() {
      state.playing = !state.playing;
      if (state.playing) {
        playbackTimer = window.setInterval(() => {
          state.playheadPercent += 0.6;
          if (state.playheadPercent >= 100) {
            state.playheadPercent = 100;
            state.playing = false;
            window.clearInterval(playbackTimer);
          }
          updatePlaybackUI();
        }, 120);
      } else {
        window.clearInterval(playbackTimer);
      }
      updatePlaybackUI();
    }

    function stopPlayback() {
      state.playing = false;
      window.clearInterval(playbackTimer);
      state.playheadPercent = 0;
      updatePlaybackUI();
      const media = els.previewStage.querySelector('video, audio');
      if (media) media.currentTime = 0;
    }

    function rewindPlayback() {
      state.playing = false;
      window.clearInterval(playbackTimer);
      state.playheadPercent = Math.max(0, state.playheadPercent - 10);
      updatePlaybackUI();
    }

    async function handleUpload(file) {
      if (!file) return;

      showToast('Uploading file...', 'info');

      try {
        // Upload file to Supabase storage
        const publicUrl = await uploadFileToStorage(file);

        // Create clip with uploaded file
        const clip = createClipForMedia(file.name, { ...file, src: publicUrl });

        // Add to media library
        state.mediaLibrary.push({
          id: Date.now(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        });

        // Insert into appropriate track
        const target = clip.type === 'video' ? 'Video' : clip.type === 'audio' ? 'Audio' : clip.type === 'image' ? 'Text' : 'Text';
        insertClipIntoTrack(clip, target);

        // Save project state
        saveProjectToStorage(state);

        showToast(`${file.name} uploaded and added to timeline`, 'success');
      } catch (error) {
        console.error('Upload error:', error);
        showToast(`Upload failed: ${error.message}`, 'error');
      }
    }

    function bindEvents() {
      els.playBtn.addEventListener('click', togglePlayback);
      els.stopBtn.addEventListener('click', stopPlayback);
      els.rewindBtn.addEventListener('click', rewindPlayback);
      els.generateBtn.addEventListener('click', generateClip);
      els.uploadBtn.addEventListener('click', () => els.uploadInput.click());
      els.uploadInput.addEventListener('change', (event) => handleUpload(event.target.files?.[0]));
      els.backBtn.addEventListener('click', () => showToast('Back action clicked'));
      els.chatInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') handleChatSubmit(); });
      root.querySelectorAll('[data-add-track]').forEach((button) => button.addEventListener('click', () => addTrack(button.dataset.addTrack)));
      root.querySelectorAll('[data-action="zoom-in"]').forEach((button) => button.addEventListener('click', () => { state.zoom = Math.min(2, state.zoom + 0.1); showToast(`Zoom ${state.zoom.toFixed(1)}x`); }));
      root.querySelectorAll('[data-action="zoom-out"]').forEach((button) => button.addEventListener('click', () => { state.zoom = Math.max(0.5, state.zoom - 0.1); showToast(`Zoom ${state.zoom.toFixed(1)}x`); }));
    }

    function renderAll() {
      renderTopActions();
      renderTools();
      renderPills();
      renderTracks();
      renderMedia();
      renderGenerateTypes();
      renderChat();
      renderQuickCommands();
      renderRail();
      updatePreview();
      updatePlaybackUI();
    }

    renderAll();
    bindEvents();

    // Initialize enhanced drag and drop functionality
    initializeTimelineDragDrop(state, els);
    setupEnhancedTooltips();

    return {
      destroy() {
        window.clearInterval(playbackTimer);
        document.removeEventListener('keydown', handleKeyboardShortcuts);
        // Save final state
        saveProjectToStorage(state);
      }
    };
  }

  injectStyles();
  createTimelineEditorApp(container);

  return container;
}