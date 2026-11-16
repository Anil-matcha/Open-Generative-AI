import test from 'node:test';
import assert from 'node:assert/strict';
import { pollForGenerationResult } from '../packages/studio/src/utils/generationLifecycle.js';

function respond(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
        json: async () => body,
    };
}

function poll(fetchImpl, maxAttempts = 900) {
    return pollForGenerationResult({
        baseUrl: '', requestId: 'req', apiKey: 'key', maxAttempts, interval: 0, fetchImpl,
    });
}

test('a 402 stops polling immediately instead of retrying to the limit', async () => {
    let calls = 0;
    await assert.rejects(poll(async () => { calls++; return respond(402, 'insufficient credits'); }), /Poll Failed: 402/);
    assert.equal(calls, 1);
});

test('a failed job status stops polling immediately', async () => {
    let calls = 0;
    await assert.rejects(
        poll(async () => { calls++; return respond(200, { status: 'failed', error: 'model exploded' }); }),
        /Generation failed: model exploded/
    );
    assert.equal(calls, 1);
});

test('5xx responses are retried', async () => {
    let calls = 0;
    const result = await poll(async () => {
        calls++;
        return calls < 3 ? respond(503, 'busy') : respond(200, { status: 'completed' });
    });
    assert.equal(result.status, 'completed');
    assert.equal(calls, 3);
});

test('pending statuses keep polling until the job completes', async () => {
    let calls = 0;
    const result = await poll(async () => {
        calls++;
        return calls < 4 ? respond(200, { status: 'pending' }) : respond(200, { status: 'succeeded' });
    });
    assert.equal(result.status, 'succeeded');
    assert.equal(calls, 4);
});

test('network errors are retried and surface after the last attempt', async () => {
    let calls = 0;
    await assert.rejects(poll(async () => { calls++; throw new Error('ECONNRESET'); }, 3), /ECONNRESET/);
    assert.equal(calls, 3);
});
