import { describe, it, expect, vi } from 'vitest';

describe('EffectsStudio Basic Import', () => {
  it('should import EffectsStudio without errors', async () => {
    const { EffectsStudio } = await import('../../../src/components/EffectsStudio.js');
    expect(typeof EffectsStudio).toBe('function');
  });
});