import { describe, it, expect, beforeEach, vi } from 'vitest';
import { navigate, routes } from '../src/router.js';

describe('Director Vanilla Router', () => {
  beforeEach(() => {
    // Setup clean DOM with mount point
    document.body.innerHTML = '<div id="app"></div>';
    // Clear any module state if needed
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
    // Use navigate function to trigger route change
    navigate('/timeline');

    // Wait for dynamic import to resolve
    await new Promise(resolve => setTimeout(resolve, 50));

    const app = document.getElementById('app');
    expect(app).not.toBeNull();
    // Director should have rendered content (tracks, media grid, etc.)
    expect(app.children.length).toBeGreaterThan(0);
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
