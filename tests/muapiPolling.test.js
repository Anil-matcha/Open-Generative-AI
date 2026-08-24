const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// src/lib/muapi.js is an ES module for the browser and pulls in models.js, so
// rather than importing it we extract the class body and evaluate just the
// polling method. That keeps the test dependency-free like the rest of the
// suite while still exercising the shipped source.
// Returns the text of the block starting at `marker`, from the marker through
// the brace that closes it. Brace-matched rather than index-guessed so the test
// keeps working as the surrounding file changes.
function extractBlock(source, marker) {
    const start = source.indexOf(marker);
    assert.ok(start !== -1, `not found in src/lib/muapi.js: ${marker}`);

    let depth = 0;
    let seenOpen = false;
    for (let i = start; i < source.length; i++) {
        if (source[i] === '{') {
            depth++;
            seenOpen = true;
        } else if (source[i] === '}') {
            depth--;
            if (seenOpen && depth === 0) return source.slice(start, i + 1);
        }
    }
    throw new Error(`unbalanced braces after ${marker}`);
}

function loadPollForResult() {
    const source = fs.readFileSync(
        path.resolve(__dirname, '..', 'src', 'lib', 'muapi.js'),
        'utf8'
    );

    const script = `
        ${extractBlock(source, 'function fatal(')}
        const obj = {
            ${extractBlock(source, 'async pollForResult(')}
        };
        obj.pollForResult;
    `;

    const context = { console: { log() {}, warn() {} }, fetch: null, setTimeout };
    vm.createContext(context);
    const run = vm.runInContext(script, context);
    assert.equal(typeof run, 'function', 'failed to extract pollForResult');
    return { run, context };
}

function respond(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
        json: async () => body,
    };
}

test('a 402 stops polling immediately instead of retrying to the limit', async () => {
    const { run, context } = loadPollForResult();
    let calls = 0;
    context.fetch = async () => {
        calls += 1;
        return respond(402, 'insufficient credits');
    };

    await assert.rejects(
        run.call({ baseUrl: '' }, 'req-1', 'key', 900, 0),
        /Poll Failed: 402/
    );
    assert.equal(calls, 1, 'expected exactly one request, got ' + calls);
});

test('a failed job status stops polling immediately', async () => {
    const { run, context } = loadPollForResult();
    let calls = 0;
    context.fetch = async () => {
        calls += 1;
        return respond(200, { status: 'failed', error: 'model exploded' });
    };

    await assert.rejects(
        run.call({ baseUrl: '' }, 'req-2', 'key', 900, 0),
        /Generation failed: model exploded/
    );
    assert.equal(calls, 1, 'expected exactly one request, got ' + calls);
});

test('5xx responses are still treated as transient and retried', async () => {
    const { run, context } = loadPollForResult();
    let calls = 0;
    context.fetch = async () => {
        calls += 1;
        if (calls < 3) return respond(503, 'upstream busy');
        return respond(200, { status: 'completed', outputs: ['https://example.test/a.png'] });
    };

    const result = await run.call({ baseUrl: '' }, 'req-3', 'key', 900, 0);
    assert.equal(result.status, 'completed');
    assert.equal(calls, 3);
});

test('pending statuses keep polling until the job completes', async () => {
    const { run, context } = loadPollForResult();
    let calls = 0;
    context.fetch = async () => {
        calls += 1;
        if (calls < 4) return respond(200, { status: 'pending' });
        return respond(200, { status: 'succeeded', outputs: ['https://example.test/b.mp4'] });
    };

    const result = await run.call({ baseUrl: '' }, 'req-4', 'key', 900, 0);
    assert.equal(result.status, 'succeeded');
    assert.equal(calls, 4);
});

test('network errors remain retryable and surface after the last attempt', async () => {
    const { run, context } = loadPollForResult();
    let calls = 0;
    context.fetch = async () => {
        calls += 1;
        throw new Error('ECONNRESET');
    };

    await assert.rejects(run.call({ baseUrl: '' }, 'req-5', 'key', 3, 0), /ECONNRESET/);
    assert.equal(calls, 3, 'transient network failures should use every attempt');
});
