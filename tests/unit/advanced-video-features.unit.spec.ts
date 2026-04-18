import { describe, it, expect } from 'vitest';

// Test the cinematic theme utilities (no external dependencies)
describe('Advanced Video Features - Unit Tests', () => {

  describe('Cinema Studio (CINEMATIC_THEME)', () => {
    describe('Theme Constants', () => {
      it('should export CINEMATIC_THEME object', () => {
        const { CINEMATIC_THEME } = require('../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME).toHaveProperty('page');
        expect(CINEMATIC_THEME).toHaveProperty('glass');
        expect(CINEMATIC_THEME).toHaveProperty('glow');
        expect(CINEMATIC_THEME).toHaveProperty('active');
        expect(CINEMATIC_THEME).toHaveProperty('text');
        expect(CINEMATIC_THEME).toHaveProperty('buttons');
        expect(CINEMATIC_THEME).toHaveProperty('layout');
        expect(CINEMATIC_THEME).toHaveProperty('accents');
      });

      it('should have proper glass panel styling', () => {
        const { CINEMATIC_THEME } = require('../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME.glass.panel).toContain('rounded-[28px]');
        expect(CINEMATIC_THEME.glass.panel).toContain('border');
        expect(CINEMATIC_THEME.glass.panel).toContain('bg-white/[0.04]');
        expect(CINEMATIC_THEME.glass.panel).toContain('backdrop-blur-xl');
      });

      it('should have proper glow effects', () => {
        const { CINEMATIC_THEME } = require('../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME.glow.emerald).toContain('shadow-[0_0_28px_rgba(16,185,129,0.18)]');
        expect(CINEMATIC_THEME.glow.indigo).toContain('shadow-[0_0_28px_rgba(99,102,241,0.12)]');
        expect(CINEMATIC_THEME.glow.rose).toContain('shadow-[0_0_26px_rgba(244,63,94,0.14)]');
      });

      it('should have proper button styles', () => {
        const { CINEMATIC_THEME } = require('../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME.buttons.primary).toContain('rounded-2xl');
        expect(CINEMATIC_THEME.buttons.primary).toContain('bg-white');
        expect(CINEMATIC_THEME.buttons.primary).toContain('text-black');

        expect(CINEMATIC_THEME.buttons.secondary).toContain('rounded-2xl');
        expect(CINEMATIC_THEME.buttons.secondary).toContain('bg-white/[0.04]');
      });
    });

    describe('Utility Functions', () => {
      it('should combine classes with cx function', () => {
        const { cx } = require('../../src/lib/cinematicTheme.js');

        const result = cx('class1', 'class2', undefined, 'class3');
        expect(result).toBe('class1 class2 class3');
      });

      it('should generate page shell class', () => {
        const { pageShell } = require('../../src/lib/cinematicTheme.js');

        const result = pageShell('extra-class');
        expect(result).toContain('min-h-screen');
        expect(result).toContain('w-full');
        expect(result).toContain('bg-[#0a0a0b]');
        expect(result).toContain('extra-class');
      });

      it('should generate glass panel class', () => {
        const { glassPanel } = require('../../src/lib/cinematicTheme.js');

        const result = glassPanel('extra-class');
        expect(result).toContain('rounded-[28px]');
        expect(result).toContain('border');
        expect(result).toContain('bg-white/[0.04]');
        expect(result).toContain('p-5');
        expect(result).toContain('extra-class');
      });

      it('should generate glass card class', () => {
        const { glassCard } = require('../../src/lib/cinematicTheme.js');

        const result = glassCard('extra-class');
        expect(result).toContain('rounded-2xl');
        expect(result).toContain('border');
        expect(result).toContain('bg-[linear-gradient(180deg,rgba(255,255,255,0.045)');
        expect(result).toContain('extra-class');
      });

      it('should generate chip button class', () => {
        const { chipButton } = require('../../src/lib/cinematicTheme.js');

        const inactiveResult = chipButton({ active: false, extra: 'extra-class' });
        expect(inactiveResult).toContain('rounded-full');
        expect(inactiveResult).toContain('border');
        expect(inactiveResult).toContain('bg-white/[0.04]');
        expect(inactiveResult).toContain('extra-class');

        const activeResult = chipButton({ active: true });
        expect(activeResult).toContain('bg-white');
        expect(activeResult).toContain('text-black');
      });

      it('should generate action button class', () => {
        const { actionButton } = require('../../src/lib/cinematicTheme.js');

        const primaryResult = actionButton({ variant: 'primary', extra: 'extra-class' });
        expect(primaryResult).toContain('bg-white');
        expect(primaryResult).toContain('text-black');
        expect(primaryResult).toContain('extra-class');

        const secondaryResult = actionButton({ variant: 'secondary' });
        expect(secondaryResult).toContain('bg-white/[0.04]');
        expect(secondaryResult).toContain('text-zinc-100');
      });

      it('should generate active surface class', () => {
        const { activeSurface } = require('../../src/lib/cinematicTheme.js');

        const emeraldResult = activeSurface({ tone: 'emerald', extra: 'extra-class' });
        expect(emeraldResult).toContain('border-emerald-400/28');
        expect(emeraldResult).toContain('bg-emerald-500/12');
        expect(emeraldResult).toContain('extra-class');

        const whiteResult = activeSurface({ tone: 'white' });
        expect(whiteResult).toContain('border-white');
        expect(whiteResult).toContain('bg-white');
        expect(whiteResult).toContain('text-black');
      });

      it('should generate accent glow class', () => {
        const { accentGlow } = require('../../src/lib/cinematicTheme.js');

        const emeraldGlow = accentGlow('emerald');
        expect(emeraldGlow).toContain('rgba(16,185,129,0.18)');

        const indigoGlow = accentGlow('indigo');
        expect(indigoGlow).toContain('rgba(99,102,241,0.12)');
      });

      it('should generate gradient accent class', () => {
        const { gradientAccent } = require('../../src/lib/cinematicTheme.js');

        const emeraldGradient = gradientAccent('emerald');
        expect(emeraldGradient).toContain('emerald-500/14');

        const roseGradient = gradientAccent('rose');
        expect(roseGradient).toContain('rose-500/16');
      });
    });

    describe('Random Accent Generation', () => {
      it('should return random accent from available colors', () => {
        const { getRandomAccent } = require('../../src/lib/cinematicTheme.js');

        const result = getRandomAccent();
        const validAccents = ['emerald', 'indigo', 'rose', 'amber', 'cyan'];

        expect(validAccents).toContain(result);
      });

      it('should return random accent object with gradient and glow', () => {
        const { randomAccent } = require('../../src/lib/cinematicTheme.js');

        const result = randomAccent();

        expect(result).toHaveProperty('gradient');
        expect(result).toHaveProperty('glow');
        expect(result).toHaveProperty('name');

        const validAccents = ['emerald', 'indigo', 'rose', 'amber', 'cyan'];
        expect(validAccents).toContain(result.name);

        // Gradient and glow are valid CSS class strings
        expect(typeof result.gradient).toBe('string');
        expect(result.gradient.length).toBeGreaterThan(0);
        expect(typeof result.glow).toBe('string');
        expect(result.glow.length).toBeGreaterThan(0);
      });
    });
  });
});