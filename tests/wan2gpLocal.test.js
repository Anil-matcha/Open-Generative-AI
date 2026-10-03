const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const local = require('../electron/lib/wan2gpLocal');

const FAKE_DIR = path.join(__dirname, 'fixtures', 'fake-wan2gp');
// The fake wgp.py is a node script, so node plays the part of python.
const fakeInstall = () => local.resolveInstall({ dir: FAKE_DIR, python: process.execPath });
const tmpRunDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'wan2gp-run-'));

function isAlive(pid) {
    try { process.kill(pid, 0); return true; } catch { return false; }
}

test('resolveInstall defaults python to the Wan2GP venv', () => {
    assert.equal(local.resolveInstall({ dir: '' }), null);
    const posix = local.resolveInstall({ dir: '/opt/Wan2GP' }, 'linux');
    assert.equal(posix.python, path.join('/opt/Wan2GP', 'venv', 'bin', 'python'));
    assert.equal(posix.wgpPath, path.join('/opt/Wan2GP', 'wgp.py'));
    const custom = local.resolveInstall({ dir: '/opt/Wan2GP', python: '/usr/bin/python3.11' });
    assert.equal(custom.python, '/usr/bin/python3.11');
});

test('checkInstall explains what is missing', () => {
    assert.match(local.checkInstall(null).error, /not set/);
    assert.match(local.checkInstall(local.resolveInstall({ dir: '/definitely/not/here' })).error, /Folder not found/);
    assert.match(local.checkInstall(local.resolveInstall({ dir: os.tmpdir() })).error, /wgp\.py not found/);
    assert.match(local.checkInstall(local.resolveInstall({ dir: FAKE_DIR, python: '/no/python' })).error, /Python not found/);
    assert.deepEqual(local.checkInstall(fakeInstall()), { ok: true });
});

test('localModelStatus reads defaults/*.json and checks ckpts for weights', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wan2gp-install-'));
    fs.mkdirSync(path.join(dir, 'defaults'));
    fs.mkdirSync(path.join(dir, 'ckpts'));
    const def = (urls) => JSON.stringify({ model: { name: 'x', URLs: urls } });
    fs.writeFileSync(path.join(dir, 'defaults', 't2v_1.3B.json'), def(['https://hf.co/x/resolve/main/wan_1.3B.safetensors']));
    fs.writeFileSync(path.join(dir, 'defaults', 't2v_2_2.json'), def(['https://hf.co/x/resolve/main/wan22_bf16.safetensors', 'https://hf.co/x/resolve/main/wan22_int8.safetensors']));
    fs.writeFileSync(path.join(dir, 'defaults', 'flux.json'), def('t2v_1.3B'));
    fs.writeFileSync(path.join(dir, 'ckpts', 'wan_1.3B.safetensors'), '');

    const status = local.localModelStatus(local.resolveInstall({ dir }), ['t2v_1.3B', 't2v_2_2', 'flux', 'ltx2_22B_distilled']);

    assert.equal(status.get('t2v_1.3B'), 'available');
    assert.equal(status.get('t2v_2_2'), 'missing');
    assert.equal(status.get('flux'), 'installed');
    assert.equal(status.has('ltx2_22B_distilled'), false);
});

test('runGeneration writes settings.json, streams progress and resolves the media path', async () => {
    const runDir = tmpRunDir();
    const events = [];
    const settings = { model_type: 't2v_1.3B', prompt: 'ok', seed: 7, image_start: '/tmp/start.png' };
    const { done } = local.runGeneration({ install: fakeInstall(), settings, runDir, onProgress: e => events.push(e) });
    const mediaPath = await done;

    assert.equal(mediaPath, path.join(runDir, 'out', 'seed7_ok.mp4'));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(runDir, 'settings.json'), 'utf-8')), settings);
    assert.deepEqual(events.map(e => e.status), ['loading', 'generating', 'generating', 'decoding', 'saving']);
    const log = fs.readFileSync(path.join(runDir, 'wgp.log'), 'utf-8');
    assert.match(log, /PYTHONUNBUFFERED=1/);
    assert.match(log, /image_start=\/tmp\/start\.png/);
});

test('runGeneration rejects with a readable error and the log tail', async () => {
    const { done } = local.runGeneration({ install: fakeInstall(), settings: { model_type: 't2v_1.3B', prompt: 'fail' }, runDir: tmpRunDir() });
    await assert.rejects(done, (err) => {
        assert.match(err.message, /^GPU ran out of memory/);
        assert.match(err.message, /CUDA out of memory/);
        return true;
    });
});

test('killTree stops wgp.py and the processes it spawned', { skip: process.platform === 'win32' }, async () => {
    const runDir = tmpRunDir();
    const { child, done } = local.runGeneration({ install: fakeInstall(), settings: { model_type: 't2v_1.3B', prompt: 'hang' }, runDir });
    const pidFile = path.join(runDir, 'out', 'child.pid');
    for (let i = 0; i < 100 && !fs.existsSync(pidFile); i++) await new Promise(r => setTimeout(r, 50));
    const grandchild = Number(fs.readFileSync(pidFile, 'utf-8'));
    assert.ok(isAlive(child.pid) && isAlive(grandchild));

    local.killTree(child);
    await assert.rejects(done, /stopped \(SIGTERM\)/);
    for (let i = 0; i < 40 && isAlive(grandchild); i++) await new Promise(r => setTimeout(r, 50));
    assert.equal(isAlive(child.pid), false);
    assert.equal(isAlive(grandchild), false);
});

test('dryRun validates the install with --dry-run', async () => {
    const ok = await local.dryRun({ install: fakeInstall(), settings: { model_type: 't2v_1.3B', prompt: 'x' }, runDir: tmpRunDir() });
    assert.deepEqual(ok, { ok: true, message: 'Wan2GP validated a test task.' });

    const broken = await local.dryRun({ install: local.resolveInstall({ dir: FAKE_DIR, python: '/no/python' }), settings: {}, runDir: tmpRunDir() });
    assert.equal(broken.ok, false);
});
