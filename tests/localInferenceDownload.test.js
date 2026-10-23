const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const { downloadFile } = require('../electron/lib/localInferenceDownload');

async function withServer(handler, run) {
    const server = http.createServer(handler);
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    try {
        return await run(`http://127.0.0.1:${server.address().port}/model.bin`);
    } finally {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }
}

async function withTempDir(run) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'oga-download-'));
    try {
        return await run(dir);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function writeResumeState(destination, sourceUrl, contents, etag = '"v1"') {
    fs.writeFileSync(destination + '.part', contents);
    fs.writeFileSync(
        destination + '.part.meta.json',
        JSON.stringify({ version: 1, sourceUrl, etag })
    );
}

async function expectSocketClosed(socketClosed, getSocket, message) {
    let timeout;
    try {
        await Promise.race([
            socketClosed,
            new Promise((_, reject) => {
                timeout = setTimeout(() => {
                    getSocket()?.destroy();
                    reject(new Error(message));
                }, 1000);
            }),
        ]);
    } finally {
        clearTimeout(timeout);
    }
}

test('resumes only with a matching strong ETag and strict HTTP 206 range', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        const progress = [];
        let requestHeaders;
        await withServer((req, res) => {
            requestHeaders = req.headers;
            res.writeHead(206, {
                'Content-Range': 'bytes 6-10/11',
                'Content-Length': '5',
                ETag: '"v1"',
            });
            res.end('world');
        }, async (url) => {
            writeResumeState(destination, url, 'hello ');
            await downloadFile(url, destination, (value) => progress.push(value));
        });
        assert.equal(requestHeaders.range, 'bytes=6-');
        assert.equal(requestHeaders['if-range'], '"v1"');
        assert.equal(fs.readFileSync(destination, 'utf8'), 'hello world');
        assert.equal(progress.at(-1), 1);
    });
});

test('revalidates an Xet-style headerless HTTP 416 with canonical HEAD', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        const requests = [];
        await withServer((req, res) => {
            requests.push({
                method: req.method,
                path: req.url,
                range: req.headers.range,
                ifRange: req.headers['if-range'],
            });
            if (req.url === '/model.bin') {
                res.writeHead(302, { Location: '/xet-asset' });
                res.end();
            } else if (req.method === 'HEAD') {
                res.writeHead(200, { 'Content-Length': '8', ETag: '"v1"' });
                res.end();
            } else {
                res.writeHead(416, { 'Content-Length': '0' });
                res.end();
            }
        }, async (url) => {
            writeResumeState(destination, url, 'complete');
            await downloadFile(url, destination);
        });
        assert.deepEqual(requests, [
            { method: 'GET', path: '/model.bin', range: 'bytes=8-', ifRange: '"v1"' },
            { method: 'GET', path: '/xet-asset', range: 'bytes=8-', ifRange: '"v1"' },
            { method: 'HEAD', path: '/model.bin', range: undefined, ifRange: undefined },
            { method: 'HEAD', path: '/xet-asset', range: undefined, ifRange: undefined },
        ]);
        assert.equal(fs.readFileSync(destination, 'utf8'), 'complete');
        assert.equal(fs.existsSync(destination + '.part.meta.json'), false);
    });
});

test('retries one pre-response socket failure after a redirect', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        const requests = [];
        let assetRequests = 0;
        await withServer((req, res) => {
            requests.push(req.url);
            if (req.url === '/model.bin') {
                res.writeHead(302, { Location: '/asset' });
                res.end();
                return;
            }
            assetRequests += 1;
            if (assetRequests === 1) {
                req.socket.destroy();
                return;
            }
            res.writeHead(200, { 'Content-Length': '5' });
            res.end('model');
        }, async (url) => {
            await downloadFile(url, destination, undefined, {
                maxRetries: 1,
                retryDelayMs: 0,
            });
        });
        assert.deepEqual(requests, ['/model.bin', '/asset', '/asset']);
        assert.equal(fs.readFileSync(destination, 'utf8'), 'model');
    });
});

test('carries one retry budget across redirects', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        const requests = [];
        let rootRequests = 0;
        let assetRequests = 0;
        await withServer((req, res) => {
            requests.push(req.url);
            if (req.url === '/model.bin') {
                rootRequests += 1;
                if (rootRequests === 1) {
                    req.socket.destroy();
                    return;
                }
                res.writeHead(302, { Location: '/asset' });
                res.end();
                return;
            }
            assetRequests += 1;
            if (assetRequests === 1) {
                req.socket.destroy();
                return;
            }
            res.writeHead(200, { 'Content-Length': '5' });
            res.end('model');
        }, async (url) => {
            await assert.rejects(downloadFile(url, destination, undefined, {
                maxRetries: 1,
                retryDelayMs: 0,
            }));
        });
        assert.deepEqual(requests, ['/model.bin', '/model.bin', '/asset']);
        assert.equal(fs.existsSync(destination), false);
    });
});

test('does not promote after HEAD ETag mismatch and preserves the old partial if fresh GET fails', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        let requestCount = 0;
        await withServer((req, res) => {
            requestCount += 1;
            if (requestCount === 1) {
                res.writeHead(416, { 'Content-Length': '0' });
                res.end();
            } else if (req.method === 'HEAD') {
                res.writeHead(200, { 'Content-Length': '3', ETag: '"v2"' });
                res.end();
            } else {
                res.writeHead(200, { 'Content-Length': '5', ETag: '"v2"' });
                res.flushHeaders();
                res.write('fr');
                setImmediate(() => res.socket.destroy());
            }
        }, async (url) => {
            writeResumeState(destination, url, 'old');
            await assert.rejects(downloadFile(url, destination));
            assert.equal(fs.readFileSync(destination + '.part', 'utf8'), 'old');
            assert.equal(fs.existsSync(destination + '.part.meta.json'), true);
            assert.equal(fs.existsSync(destination + '.part.fresh'), false);
            assert.equal(fs.existsSync(destination), false);
        });
        assert.equal(requestCount, 3);
    });
});

test('cleans stale fresh output and transactionally replaces a legacy partial', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        let staleFreshWasRemoved;
        fs.writeFileSync(destination + '.part', 'legacy');
        fs.writeFileSync(destination + '.part.fresh', 'stale');
        await withServer((_req, res) => {
            staleFreshWasRemoved = !fs.existsSync(destination + '.part.fresh');
            res.writeHead(200, { 'Content-Length': '5', ETag: '"v2"' });
            res.end('fresh');
        }, (url) => downloadFile(url, destination));
        assert.equal(staleFreshWasRemoved, true);
        assert.equal(fs.readFileSync(destination, 'utf8'), 'fresh');
        assert.equal(fs.existsSync(destination + '.part'), false);
        assert.equal(fs.existsSync(destination + '.part.fresh'), false);
    });
});

test('rejects a malformed streaming redirect without crashing and closes its socket', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        let socket;
        let interval;
        let resolveClosed;
        const closed = new Promise((resolve) => { resolveClosed = resolve; });
        await withServer((req, res) => {
            socket = req.socket;
            socket.once('close', () => {
                clearInterval(interval);
                resolveClosed();
            });
            res.on('error', () => {});
            res.writeHead(302, { Location: 'http://[' });
            res.flushHeaders();
            interval = setInterval(() => res.write(Buffer.alloc(1024)), 2);
        }, async (url) => {
            await assert.rejects(downloadFile(url, destination), /fetch failed|Invalid URL/);
            await expectSocketClosed(closed, () => socket, 'malformed redirect socket stayed open');
        });
    });
});

test('closes a streaming HTTP error response after rejection', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        let socket;
        let interval;
        let resolveClosed;
        const closed = new Promise((resolve) => { resolveClosed = resolve; });
        await withServer((req, res) => {
            socket = req.socket;
            socket.once('close', () => {
                clearInterval(interval);
                resolveClosed();
            });
            res.on('error', () => {});
            res.writeHead(500);
            res.flushHeaders();
            interval = setInterval(() => res.write(Buffer.alloc(1024)), 2);
        }, async (url) => {
            await assert.rejects(downloadFile(url, destination), /HTTP 500/);
            await expectSocketClosed(closed, () => socket, 'HTTP 500 socket stayed open');
        });
    });
});

test('rejects a mismatched HTTP 206 range without appending to the partial', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        await withServer((_req, res) => {
            res.writeHead(206, {
                'Content-Range': 'bytes 5-9/10',
                'Content-Length': '5',
                ETag: '"v1"',
            });
            res.end('world');
        }, async (url) => {
            writeResumeState(destination, url, 'hello ');
            await assert.rejects(downloadFile(url, destination), /started at 5, expected 6/);
            assert.equal(fs.readFileSync(destination + '.part', 'utf8'), 'hello ');
        });
    });
});

test('cancels the response when the output stream fails', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        const originalCreateWriteStream = fs.createWriteStream;
        let socket;
        let interval;
        let resolveClosed;
        const closed = new Promise((resolve) => { resolveClosed = resolve; });
        await withServer((req, res) => {
            socket = req.socket;
            socket.once('close', () => {
                clearInterval(interval);
                resolveClosed();
            });
            res.on('error', () => {});
            res.writeHead(200, { 'Content-Length': '1000000', ETag: '"v1"' });
            res.flushHeaders();
            interval = setInterval(() => res.write(Buffer.alloc(1024)), 2);
        }, async (url) => {
            fs.createWriteStream = (...args) => {
                const stream = originalCreateWriteStream(...args);
                process.nextTick(() => stream.destroy(new Error('simulated write failure')));
                return stream;
            };
            try {
                await assert.rejects(downloadFile(url, destination), /simulated write failure/);
                await expectSocketClosed(closed, () => socket, 'write failure socket stayed open');
            } finally {
                fs.createWriteStream = originalCreateWriteStream;
            }
        });
    });
});

test('closes fresh output before cleanup after an aborted response', async () => {
    await withTempDir(async (dir) => {
        const destination = path.join(dir, 'model.bin');
        const freshPath = destination + '.part.fresh';
        const originalCreateWriteStream = fs.createWriteStream;
        const originalUnlinkSync = fs.unlinkSync;
        let freshStream;
        let freshWasCleaned = false;
        let requestCount = 0;

        fs.writeFileSync(destination + '.part', 'legacy');
        fs.createWriteStream = (...args) => {
            const stream = originalCreateWriteStream(...args);
            if (args[0] === freshPath) freshStream = stream;
            return stream;
        };
        fs.unlinkSync = (filePath) => {
            if (filePath === freshPath) {
                assert.equal(freshStream?.closed, true);
                freshWasCleaned = true;
            }
            return originalUnlinkSync(filePath);
        };

        try {
            await withServer((_req, res) => {
                requestCount += 1;
                res.writeHead(200, { 'Content-Length': '5' });
                res.flushHeaders();
                res.write('fr');
                setImmediate(() => res.socket.destroy());
            }, async (url) => {
                await assert.rejects(downloadFile(url, destination));
            });
        } finally {
            fs.createWriteStream = originalCreateWriteStream;
            fs.unlinkSync = originalUnlinkSync;
        }

        assert.equal(requestCount, 1);
        assert.equal(freshWasCleaned, true);
        assert.equal(fs.existsSync(freshPath), false);
    });
});
