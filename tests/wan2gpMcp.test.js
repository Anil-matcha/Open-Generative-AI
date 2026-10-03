const test = require('node:test');
const assert = require('node:assert/strict');

const { createMcpClient, normalizeMcpUrl, toProgressEvent } = require('../electron/lib/wan2gpMcp');

// Minimal fake of WanGP's MCP server (Streamable HTTP, SSE-framed replies).
function fakeServer(tools) {
    const calls = [];
    const reply = (body, extraHeaders = {}) => ({
        ok: true,
        status: 200,
        headers: new Map(Object.entries({ 'content-type': 'text/event-stream', ...extraHeaders })),
        text: async () => `event: message\ndata: ${JSON.stringify(body)}\n\n`,
    });
    const fetchImpl = async (url, init = {}) => {
        const u = String(url);
        if (u.includes('/wangp_api/gallery/download/')) {
            return { ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode('video-bytes').buffer };
        }
        if (u.includes('/wangp_api/gallery/upload/')) {
            calls.push({ upload: u, bytes: init.body.length });
            return { ok: true, status: 200, json: async () => ({ status: 'uploaded', media_id: 'visual:up1' }) };
        }
        const msg = JSON.parse(init.body);
        calls.push(msg);
        if (msg.method === 'initialize') return reply({ jsonrpc: '2.0', id: msg.id, result: { serverInfo: { name: 'WanGP', version: '1.30.0' } } }, { 'mcp-session-id': 's1' });
        if (msg.method === 'notifications/initialized') return { ok: true, status: 202, headers: new Map(), text: async () => '' };
        if (msg.method === 'tools/list') return reply({ jsonrpc: '2.0', id: msg.id, result: { tools: Object.keys(tools).map(name => ({ name })) } });
        const handler = tools[msg.params.name];
        const out = handler(msg.params.arguments);
        const result = out instanceof Error
            ? { isError: true, content: [{ type: 'text', text: out.message }] }
            : { structuredContent: out };
        return reply({ jsonrpc: '2.0', id: msg.id, result });
    };
    return { fetchImpl, calls };
}

test('normalizeMcpUrl appends /mcp once', () => {
    assert.equal(normalizeMcpUrl('http://gpu:7866'), 'http://gpu:7866/mcp');
    assert.equal(normalizeMcpUrl('http://gpu:7866/mcp/'), 'http://gpu:7866/mcp');
    assert.equal(normalizeMcpUrl(''), '');
});

test('toProgressEvent maps WanGP job events onto app progress', () => {
    assert.deepEqual(
        toProgressEvent({ kind: 'progress', data: { phase: 'inference', status: 'Denoising', progress: 36, current_step: 2, total_steps: 8 } }),
        { status: 'generating', progress: 0.36, step: 2, totalSteps: 8, message: 'Denoising' },
    );
    assert.equal(toProgressEvent({ kind: 'stream', data: { text: '25%|██' } }), null);

    const status = (phase) => toProgressEvent({ kind: 'progress', data: { phase, progress: 10 } }).status;
    assert.equal(status('encoding_text'), 'encoding');
    assert.equal(status('inference_stage_2'), 'generating');
    assert.equal(status('loading_model'), 'loading');
    assert.equal(status('downloading_output'), 'saving');
    assert.equal(status('something_new'), 'working');
});

test('probe initializes a session and requires WanGP generation tools', async () => {
    const { fetchImpl, calls } = fakeServer({ wangp_generate: () => ({}), wangp_get_job: () => ({}) });
    const client = createMcpClient('http://gpu:7866', { fetchImpl });
    assert.deepEqual(await client.probe(), { server: 'WanGP', version: '1.30.0' });
    assert.deepEqual(calls.map(c => c.method), ['initialize', 'notifications/initialized', 'tools/list']);

    const other = fakeServer({ some_tool: () => ({}) });
    await assert.rejects(createMcpClient('http://x', { fetchImpl: other.fetchImpl }).probe(), /does not expose WanGP generation tools/);
});

test('modelAvailability distinguishes downloaded, missing and unknown models', async () => {
    const { fetchImpl } = fakeServer({
        wangp_get_model_availability: ({ model_type }) => model_type === 'nope'
            ? new Error('Error executing tool wangp_get_model_availability: Unknown model_type: nope')
            : { model_type, status: model_type === 't2v_1.3B' ? 'available' : 'missing' },
    });
    const client = createMcpClient('http://gpu:7866', { fetchImpl });
    assert.equal(await client.modelAvailability('t2v_1.3B'), 'available');
    assert.equal(await client.modelAvailability('t2v_2_2'), 'missing');
    assert.equal(await client.modelAvailability('nope'), 'unknown-model');
});

test('generate submits, polls with progress, and download fetches the gallery item', { timeout: 20000 }, async () => {
    let polls = 0;
    const { fetchImpl, calls } = fakeServer({
        wangp_generate: () => ({ job_id: 'job1', done: false, events: [] }),
        wangp_get_job: () => (++polls < 2
            ? { job_id: 'job1', done: false, events: [{ kind: 'progress', data: { phase: 'inference', status: 'Denoising', progress: 50, current_step: 4, total_steps: 8 } }] }
            : { job_id: 'job1', done: true, result: { success: true, gallery_items: [{ media_id: 'visual:abc', media_type: 'video', filename: 'out.mp4' }] } }),
        wangp_create_gallery_download: () => ({ download_url: '/wangp_api/gallery/download/tok', filename: 'out.mp4' }),
    });
    const client = createMcpClient('http://gpu:7866/mcp', { fetchImpl });
    const progress = [];
    let jobId = null;
    const item = await client.generate({ model_type: 't2v_1.3B', prompt: 'x' }, { onProgress: p => progress.push(p), onJobId: id => { jobId = id; } });

    assert.equal(jobId, 'job1');
    assert.equal(item.media_id, 'visual:abc');
    assert.deepEqual(progress.map(p => [p.status, p.step]), [['generating', 4]]);
    const submit = calls.find(c => c.params?.name === 'wangp_generate');
    assert.deepEqual(submit.params.arguments, { source: { model_type: 't2v_1.3B', prompt: 'x' }, wait: false, event_limit: 0 });

    const file = await client.download(item.media_id);
    assert.equal(file.filename, 'out.mp4');
    assert.equal(file.bytes.toString(), 'video-bytes');
});

test('generate surfaces job errors', { timeout: 20000 }, async () => {
    const { fetchImpl } = fakeServer({
        wangp_generate: () => ({ job_id: 'job2', done: true, result: { success: false, errors: [{ message: 'CUDA out of memory' }] } }),
    });
    await assert.rejects(createMcpClient('http://gpu:7866', { fetchImpl }).generate({}), /generation failed:\nCUDA out of memory/);
});

test('uploadImage PUTs bytes to the one-time URL and returns the media id', async () => {
    const { fetchImpl, calls } = fakeServer({
        wangp_create_gallery_upload: ({ filename }) => ({ upload_url: '/wangp_api/gallery/upload/tok', filename }),
    });
    const mediaId = await createMcpClient('http://gpu:7866', { fetchImpl }).uploadImage({ name: 'start.png', bytes: Buffer.from('png'), mime: 'image/png' });
    assert.equal(mediaId, 'visual:up1');
    assert.deepEqual(calls.at(-1), { upload: 'http://gpu:7866/wangp_api/gallery/upload/tok', bytes: 3 });
});
