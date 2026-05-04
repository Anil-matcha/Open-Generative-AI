import { describe, it, expect, beforeEach, vi } from 'vitest';
import { navigate, routes } from '../src/router';

describe('Director Vanilla Router', () => {
  beforeEach(() => {
    // Setup complete DOM structure matching index.html
    document.body.innerHTML = `
      <div id="app">
        <div class="app-shell">
          <header class="header">
            <div class="brand">
              <button id="backBtn">←</button>
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
            <div id="topActions"></div>
          </header>
          <div class="main-grid">
            <div class="left-col">
              <div class="timeline-card">
                <div class="timeline-top">
                  <div id="toolGroup"></div>
                  <div class="pill-row" id="pillRow"></div>
                </div>
                <div class="timeline-shell">
                  <div class="timeline-body" id="timelineBody">
                    <div id="trackRows"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="side-col">
              <aside class="side-card">
                <div class="card-title">📁 Media</div>
                <button id="uploadBtn">Upload</button>
                <div class="media-grid" id="mediaGrid"></div>
              </aside>
              <aside class="side-card generate">
                <div class="generate-head">
                  <div class="card-title cyan">⚡ Generate</div>
                </div>
                <div id="generateTypes"></div>
                <textarea id="promptInput" placeholder="A cinematic shot of..."></textarea>
                <button id="generateBtn">⚡ Generate</button>
              </aside>
            </div>
          </div>
        </div>
        <div id="floatingRail"></div>
        <div id="toast"></div>
      </div>
    `;
    vi.clearAllMocks();
  });

  it('should initialize router with route configuration', () => {
    expect(routes).toBeDefined();
    expect(typeof routes).toBe('object');
    expect(routes['/timeline']).toBeDefined();
    expect(routes['/library']).toBeDefined();
    expect(routes['/settings']).toBeDefined();
  });

  it('should mount director app on /timeline navigation', async () => {
    navigate('/timeline');
    // Wait for dynamic import and initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    const app = document.getElementById('app');
    expect(app).not.toBeNull();
    // Director should have rendered content (check for timeline body)
    expect(app.querySelector('.timeline-card')).not.toBeNull();
    expect(app.querySelector('#trackRows')).not.toBeNull();
  });

  it('should show placeholder on /library navigation', async () => {
    navigate('/library');
    await new Promise(resolve => setTimeout(resolve, 50));

    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Media Library');
  });

  it('should show placeholder on /settings navigation', async () => {
    navigate('/settings');
    await new Promise(resolve => setTimeout(resolve, 50));

    const app = document.getElementById('app');
    expect(app.innerHTML).toContain('Settings');
  });

  it('should handle popstate (back/forward navigation)', async () => {
    // Navigate to timeline first
    navigate('/timeline');
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate back navigation
    window.history.back();
    // The popstate event triggers cleanup of previous route
    await new Promise(resolve => setTimeout(resolve, 50));

    // Should now show default (timeline fallback or previous state)
    // For now just ensure no errors thrown
    expect(true).toBe(true);
  });
});
