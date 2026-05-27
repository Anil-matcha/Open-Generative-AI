const test = require('node:test');
const assert = require('node:assert/strict');

const {
    formatStartupProgressMessage,
    parseGenerationProgressChunk,
    resolveGenerationSteps,
    resolveGuidanceScale,
    stripAnsiSequences,
} = require('../electron/lib/localInferenceRuntime');

test('resolveGenerationSteps prefers explicit request over model defaults', () => {
    const steps = resolveGenerationSteps({ steps: 3 }, { defaultSteps: 20 });
    assert.equal(steps, 3);
});

test('resolveGuidanceScale prefers explicit request over model defaults', () => {
    const guidance = resolveGuidanceScale({ guidance_scale: 5.25 }, { defaultGuidance: 7.5 });
    assert.equal(guidance, 5.25);
});

test('stripAnsiSequences removes terminal control codes', () => {
    const cleaned = stripAnsiSequences('\u001b[32mhello\u001b[0m');
    assert.equal(cleaned, 'hello');
});

test('formatStartupProgressMessage surfaces elapsed startup time', () => {
    assert.equal(formatStartupProgressMessage(0), 'Starting local model...');
    assert.equal(formatStartupProgressMessage(12_400), 'Loading local model (12s)...');
    assert.equal(formatStartupProgressMessage(65_000), 'Loading local model (1m 5s)...');
});

test('parseGenerationProgressChunk extracts sd-cli sampling progress from carriage-return output', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const chunk = '\r  |==>                                               | 1/20 - 7.16s/it\u001b[K\r  |=====>                                            | 2/20 - 6.98s/it\u001b[K';
    const events = parseGenerationProgressChunk(chunk, state);

    assert.deepEqual(events, [
        { step: 1, totalSteps: 20, progress: 0.05 },
        { step: 2, totalSteps: 20, progress: 0.1 },
    ]);
});

test('parseGenerationProgressChunk de-duplicates repeated progress events across chunks', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const first = parseGenerationProgressChunk('\r  |==> | 1/20 - 7.16s/it\u001b[K', state);
    const second = parseGenerationProgressChunk('\r  |==> | 1/20 - 7.16s/it\u001b[K\r  |=====> | 2/20 - 6.98s/it\u001b[K', state);

    assert.deepEqual(first, [{ step: 1, totalSteps: 20, progress: 0.05 }]);
    assert.deepEqual(second, [{ step: 2, totalSteps: 20, progress: 0.1 }]);
});

test('parseGenerationProgressChunk does not replay old buffered steps when later chunks include earlier output', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const first = parseGenerationProgressChunk('\r  |==> | 1/3 - 1.00s/it\u001b[K\r  |=====> | 2/3 - 1.00s/it\u001b[K', state);
    const second = parseGenerationProgressChunk('\r  |==> | 1/3 - 1.00s/it\u001b[K\r  |=====> | 2/3 - 1.00s/it\u001b[K\r  |========> | 3/3 - 1.00s/it\u001b[K', state);

    assert.deepEqual(first, [
        { step: 1, totalSteps: 3, progress: 1 / 3 },
        { step: 2, totalSteps: 3, progress: 2 / 3 },
    ]);
    assert.deepEqual(second, [
        { step: 3, totalSteps: 3, progress: 1 },
    ]);
});
