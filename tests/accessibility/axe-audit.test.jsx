/**
 * Accessibility audit tests using axe-core.
 *
 * Run: npx vitest run tests/accessibility/
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import axe from 'axe-core';
import fs from 'fs';
import path from 'path';

const REPO_ROOT = process.cwd();

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
    writable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
    writable: true,
  });
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
  window.IntersectionObserver = vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }));
  window.ResizeObserver = vi.fn(() => ({ observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() }));
  window.scrollTo = vi.fn();
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function auditAccessibility(container) {
  return axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    rules: { 'color-contrast': { enabled: false } },
  });
}

async function expectNoCriticalViolations(container, name = 'component') {
  const results = await auditAccessibility(container);
  const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  const minor = results.violations.filter(v => v.impact === 'moderate' || v.impact === 'minor' || !v.impact);

  if (minor.length > 0) {
    console.warn(`\n[A11Y] ${name}: ${minor.length} minor issue(s) for manual review:`);
    for (const v of minor) {
      console.warn(`  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} el)`);
    }
  }

  if (critical.length > 0) {
    const lines = [`${name} has ${critical.length} critical violation(s):`];
    for (const v of critical) {
      lines.push(`  [${v.impact}] ${v.id}: ${v.help}`);
      for (const node of v.nodes.slice(0, 2)) {
        lines.push(`    ${(node.html || '').substring(0, 80)}`);
      }
    }
    throw new Error(lines.join('\n'));
  }

  expect(critical).toHaveLength(0);
}

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
  Toaster: () => null,
}));

describe('Accessibility Audit', () => {
  describe('ApiKeyModal — axe-core audit', () => {
    it('has zero critical a11y violations', async () => {
      const { default: ApiKeyModal } = await import('../../components/ApiKeyModal.jsx');
      const { container } = render(
        <ApiKeyModal onSave={vi.fn()} locale="en" overlay={true} />
      );
      await expectNoCriticalViolations(container, 'ApiKeyModal');
    });

    it('has associated label and input', async () => {
      const { default: ApiKeyModal } = await import('../../components/ApiKeyModal.jsx');
      const { container } = render(
        <ApiKeyModal onSave={vi.fn()} locale="en" overlay={true} />
      );
      expect(container.querySelector('input')).toBeTruthy();
      expect(container.querySelector('label')).toBeTruthy();
    });

    it('has accessible dialog role when overlay', async () => {
      const { default: ApiKeyModal } = await import('../../components/ApiKeyModal.jsx');
      const { container } = render(
        <ApiKeyModal onSave={vi.fn()} locale="en" overlay={true} />
      );
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    });
  });

  describe('StudioErrorBoundary — axe-core audit', () => {
    it('renders accessible error fallback', async () => {
      const { default: StudioErrorBoundary } = await import(
        '../../packages/studio/src/components/StudioErrorBoundary'
      );
      const CrashComponent = () => { throw new Error('Test crash'); };
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(
        <StudioErrorBoundary studio="test">
          <CrashComponent />
        </StudioErrorBoundary>
      );

      spy.mockRestore();
      expect(container.textContent).toContain('encountered an error');
      expect(container.querySelector('button').textContent).toContain('Try Again');
      await expectNoCriticalViolations(container, 'StudioErrorBoundary');
    });
  });

  describe('Structural checks — source code audit', () => {
    it('StandaloneShell has skip-to-content link', () => {
      const src = fs.readFileSync(path.join(REPO_ROOT, 'components/StandaloneShell.js'), 'utf-8');
      expect(src).toContain('Skip to content');
      expect(src).toContain('sr-only');
      expect(src).toContain('focus:not-sr-only');
      expect(src).toContain('id="studio-content"');
    });

    it('StandaloneShell has ARIA role on main container', () => {
      const src = fs.readFileSync(path.join(REPO_ROOT, 'components/StandaloneShell.js'), 'utf-8');
      expect(src).toContain('role="application"');
      expect(src).toContain('aria-label');
    });

    it('ApiKeyModal has focus trapping', () => {
      const src = fs.readFileSync(path.join(REPO_ROOT, 'components/ApiKeyModal.jsx'), 'utf-8');
      expect(src).toContain('useRef');
      expect(src).toContain('aria-modal');
      expect(src).toContain('focus');
    });

    it('StudioErrorBoundary has accessible details/summary', () => {
      const src = fs.readFileSync(
        path.join(REPO_ROOT, 'packages/studio/src/components/StudioErrorBoundary.jsx'), 'utf-8'
      );
      expect(src).toContain('summary');
      expect(src).toContain('Technical details');
      expect(src).toContain('Try Again');
    });
  });

  describe('Keyboard navigation', () => {
    it('ApiKeyModal interactive elements are natively focusable', async () => {
      const { default: ApiKeyModal } = await import('../../components/ApiKeyModal.jsx');
      const { container } = render(
        <ApiKeyModal onSave={vi.fn()} locale="en" overlay={true} />
      );
      const interactive = container.querySelectorAll('a, button, input, select, textarea, [tabindex]');
      expect(interactive.length).toBeGreaterThan(0);
      for (const el of interactive) {
        const ti = el.getAttribute('tabindex');
        if (ti !== null) expect(Number(ti)).toBeLessThanOrEqual(0);
      }
    });

    it('close button has accessible name', async () => {
      const { default: ApiKeyModal } = await import('../../components/ApiKeyModal.jsx');
      const { container } = render(
        <ApiKeyModal onSave={vi.fn()} onClose={vi.fn()} locale="en" overlay={true} />
      );
      const btn = container.querySelector('button[aria-label]');
      expect(btn).toBeTruthy();
      expect(btn.getAttribute('aria-label').length).toBeGreaterThan(0);
    });
  });
});
