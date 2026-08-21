import assert from 'node:assert/strict';
import test from 'node:test';
import { handleDirectUploadProxy } from '../../src/lib/handleDirectUploadProxy.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';

const env = { UPLOAD_PROXY_RATE_LIMIT: '20' };
const apiKey = 'mu-test-key-123456';

function requestWith(file) {
  const body = new FormData();
  body.append('file', file);
  body.append('ignored', 'client-controlled-field');
  return new Request('https://local.test/api/v1/upload_file', {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body,
  });
}

test('legacy direct upload route applies validation and reconstructs the form', async () => {
  resetRateLimitStore();
  const file = new File(
    [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    'photo.png',
    { type: 'image/png' },
  );
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response('{"url":"https://cdn.example/photo.png"}', {
      status: 200,
      headers: { 'content-type': 'application/json', 'set-cookie': 'bad=1' },
    });
  };

  try {
    const response = await handleDirectUploadProxy(requestWith(file), { env });
    assert.equal(response.status, 200);
    assert.equal(captured.url, 'https://api.muapi.ai/api/v1/upload_file');
    assert.equal(captured.options.headers.get('x-api-key'), apiKey);
    assert.equal(captured.options.headers.get('content-type'), null);
    assert.equal(captured.options.body.get('ignored'), null);
    assert.equal(response.headers.get('set-cookie'), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('legacy direct upload route rejects spoofed files before upstream fetch', async () => {
  resetRateLimitStore();
  const spoofed = new File(['<html>not a png</html>'], 'photo.png', { type: 'image/png' });
  let called = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    called = true;
    return new Response(null, { status: 204 });
  };

  try {
    const response = await handleDirectUploadProxy(requestWith(spoofed), { env });
    assert.equal(response.status, 400);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
