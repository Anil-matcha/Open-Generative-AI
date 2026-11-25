import test from 'node:test';
import assert from 'node:assert/strict';
import { pollForWorkflowResult } from '../packages/studio/src/utils/generationLifecycle.js';

function respond(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
        json: async () => body,
    };
}

function poll(fetchImpl, maxAttempts = 900) {
    return pollForWorkflowResult({
        baseUrl: '', runId: 'run', apiKey: 'key', maxAttempts, interval: 0, fetchImpl,
    });
}

test('a failed workflow run stops polling immediately instead of retrying to the limit', async () => {
    let calls = 0;
    await assert.rejects(
        poll(async () => { calls++; return respond(200, { status: 'failed', error: 'node crashed' }); }),
        /Workflow failed: node crashed/
    );
    assert.equal(calls, 1);
});

test('a terminal workflow HTTP status stops polling immediately', async () => {
    let calls = 0;
    await assert.rejects(poll(async () => { calls++; return respond(404, 'no such run'); }), /Poll Failed: 404/);
    assert.equal(calls, 1);
});

test('5xx workflow responses are retried', async () => {
    let calls = 0;
    const result = await poll(async () => {
        calls++;
        return calls < 3 ? respond(503, 'busy') : respond(200, { status: 'completed', outputs: [] });
    });
    assert.equal(result.status, 'completed');
    assert.equal(calls, 3);
});

test('pending workflow statuses keep polling until the run completes', async () => {
    let calls = 0;
    const result = await poll(async () => {
        calls++;
        return calls < 4 ? respond(200, { status: 'running' }) : respond(200, { status: 'succeeded' });
    });
    assert.equal(result.status, 'succeeded');
    assert.equal(calls, 4);
});
