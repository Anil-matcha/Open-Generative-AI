const test = require('node:test');
const assert = require('node:assert/strict');

const { createProgressParser, findSavedPath, summarizeRun } = require('../electron/lib/wan2gpOutput');

// Excerpts of real `wgp.py --process` console output (WanGP v13.141).
const LOADING = [
    'Loading Model Wan2.1 Text2video 1.3B...',
    '  [0/1] Loading Wan2.1 Text2video 1.3B - Preparing Models',
    '  [3/12] Loading Wan2.1 Text2video 1.3B - Scanning Sizes VAE Model',
].join('\n') + '\n';
const DENOISING = '  [0/30] Denoising | 2.5s\r  [0/30] Denoising | 3.5s\r  3%|▎         | 1/30 [00:09<04:31,  9.35s/it]\r  [1/30] Denoising | 12.1s / 4m 51s\r  [1/30] Denoising | 13.4s / 4m 51s\n';
const DECODING = '  [21/21] VAE Decoding | 4m 58s / 4m 58s\n';
const SUCCESS_TAIL = [
    '  [0/1] Saving File 2026-09-30-1...nowflakes falling, cinematic tr.mp4Video file saved to Path: /out/2026-09-30-10h08m24s_seed42_A red fox trotting.mp4',
    '  Task 1 completed',
    '==================================================',
    'Queue completed: 1/1 tasks in 14m 39s',
].join('\n') + '\n';

test('progress parser reports loading, denoising steps and decoding in order', () => {
    const parse = createProgressParser();
    const events = [...parse(LOADING), ...parse(DENOISING), ...parse(DECODING)];

    assert.deepEqual(events.map(e => e.status), ['loading', 'loading', 'loading', 'generating', 'generating', 'decoding']);
    const denoise = events.filter(e => e.status === 'generating');
    assert.deepEqual(denoise.map(e => [e.step, e.totalSteps]), [[0, 30], [1, 30]]);
    for (let i = 1; i < events.length; i++) {
        assert.ok(events[i].progress >= events[i - 1].progress, 'progress never goes backwards');
    }
    assert.ok(events.at(-1).progress > 0.9 && events.at(-1).progress < 1);
});

test('progress parser handles lines split across chunks and ignores repeats', () => {
    const parse = createProgressParser();
    assert.deepEqual(parse('  [5/30] Deno'), []);
    const events = parse('ising | 50.9s / 4m 45s\n  [5/30] Denoising | 52.1s / 4m 45s\n');
    assert.equal(events.length, 1);
    assert.equal(events[0].step, 5);
});

test('progress parser ignores compiler noise and tqdm bars', () => {
    const parse = createProgressParser();
    const noise = '/usr/include/features.h:319:10: note: previous definition\n 1796 | #define _POSIX_C_SOURCE 200809L\n 10%|█         | 3/30 [00:28<04:12,  9.35s/it]\n';
    assert.deepEqual(parse(noise), []);
});

test('findSavedPath returns the last reported path, including spaces', () => {
    assert.equal(findSavedPath(SUCCESS_TAIL), '/out/2026-09-30-10h08m24s_seed42_A red fox trotting.mp4');
    const remuxed = `${SUCCESS_TAIL}Remuxed Video saved to Path: /out/final.mp4\n`;
    assert.equal(findSavedPath(remuxed), '/out/final.mp4');
    assert.equal(findSavedPath('nothing here'), null);
});

test('summarizeRun accepts a completed queue and returns the media path', () => {
    const result = summarizeRun({ exitCode: 0, signal: null, output: LOADING + DENOISING + SUCCESS_TAIL });
    assert.deepEqual(result, { ok: true, savedPath: '/out/2026-09-30-10h08m24s_seed42_A red fox trotting.mp4' });
});

test('summarizeRun reports CUDA OOM in plain words with the log tail', () => {
    const output = `${DENOISING}Traceback (most recent call last):\n  File "wgp.py", line 1\ntorch.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB\n`;
    const result = summarizeRun({ exitCode: 1, signal: null, output });
    assert.equal(result.ok, false);
    assert.match(result.error, /^GPU ran out of memory/);
    assert.match(result.error, /Tried to allocate 2\.00 GiB/);
});

test('summarizeRun surfaces the exception line of a Python traceback', () => {
    const output = 'Traceback (most recent call last):\n  File "wgp.py", line 9, in <module>\n    main()\nValueError: resolution 123x45 is not supported\n';
    const result = summarizeRun({ exitCode: 1, signal: null, output });
    assert.match(result.error, /^ValueError: resolution 123x45 is not supported/);
});

test('summarizeRun surfaces WanGP [ERROR] lines and missing input files', () => {
    const unknown = summarizeRun({ exitCode: 1, signal: null, output: '[load_settings] Unknown model type: nope for task #1. Skipping.\n[ERROR] Unknown model type: nope\n' });
    assert.match(unknown.error, /^Unknown model type: nope/);

    const missing = summarizeRun({ exitCode: 1, signal: null, output: "[load_settings] Warning: File not found for 'image_start': /tmp/gone.png\nQueue completed: 0/1 tasks in 1s\n" });
    assert.match(missing.error, /^Input file for "image_start" not found: \/tmp\/gone\.png/);
});

test('summarizeRun treats a partial queue or a signal as failure', () => {
    const partial = summarizeRun({ exitCode: 0, signal: null, output: 'Queue completed: 0/1 tasks in 3s\n' });
    assert.equal(partial.ok, false);
    assert.match(partial.error, /finished 0\/1 tasks/);

    const killed = summarizeRun({ exitCode: null, signal: 'SIGTERM', output: DENOISING });
    assert.equal(killed.ok, false);
    assert.match(killed.error, /stopped \(SIGTERM\)/);
});
