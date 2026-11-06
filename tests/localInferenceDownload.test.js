// Mock the `electron` native module (not installed here) so that
// electron/lib/localInference.js — which requires `electron` at module load —
// can be required and its `downloadFile` function unit-tested.
const Module = require('node:module');
const path = require('node:path');
const electronMockPath = path.join(__dirname, 'electron-mock.js');
const _resolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
    if (request === 'electron') {
        return electronMockPath;
    }
    return _resolveFilename.call(this, request, ...rest);
};

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');

const { downloadFile } = require('../electron/lib/localInference');

// Start a throwaway HTTP server that serves `body` for every request.
function serveBody(body) {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Content-Length': String(body.length),
            });
            res.end(body);
        });
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

test('downloadFile downloads the complete body to destPath', async () => {
    const body = Buffer.alloc(1024 * 1024, 65); // 1 MiB
    const server = await serveBody(body);
    const port = server.address().port;
    const url = `http://127.0.0.1:${port}/model.bin`;
    const destDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oga-download-test-'));
    const destPath = path.join(destDir, 'model.bin');
    let progressCalls = 0;

    try {
        await downloadFile(url, destPath, () => { progressCalls += 1; });
        const written = fs.readFileSync(destPath);
        assert.deepStrictEqual(written, body);
        assert.ok(progressCalls > 0, 'onProgress should be invoked during download');
    } finally {
        server.close();
        fs.rmSync(destDir, { recursive: true, force: true });
    }
});

test('downloadFile follows an HTTP redirect', async () => {
    const body = Buffer.from('redirected-content');
    let hitTarget = false;
    const server = http.createServer((req, res) => {
        if (req.url === '/from') {
            res.writeHead(302, { Location: '/to' });
            res.end();
        } else {
            hitTarget = true;
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Content-Length': String(body.length),
            });
            res.end(body);
        }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const url = `http://127.0.0.1:${port}/from`;
    const destDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oga-download-test-'));
    const destPath = path.join(destDir, 'model.bin');

    try {
        await downloadFile(url, destPath, () => {});
        assert.strictEqual(hitTarget, true, 'the redirect target should have been hit');
        assert.deepStrictEqual(fs.readFileSync(destPath), body);
    } finally {
        server.close();
        fs.rmSync(destDir, { recursive: true, force: true });
    }
});
