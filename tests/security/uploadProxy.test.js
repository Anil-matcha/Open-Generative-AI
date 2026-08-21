import assert from 'node:assert/strict';
import test from 'node:test';
import { handleUploadProxy } from '../../src/lib/handleUploadProxy.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';
import {
  createUploadTicket,
  resetUsedUploadTickets,
  UPLOAD_TICKET_FIELD,
} from '../../src/lib/uploadTicket.js';

const env = {
  UPLOAD_PROXY_TICKET_SECRET: 'test-only-secret-that-is-longer-than-thirty-two-characters',
  UPLOAD_PROXY_RATE_LIMIT: '20',
};
const apiKey = 'mu-test-key-123456';
const targetUrl = 'https://uploads.s3.us-east-1.amazonaws.com/';

function pngFile() {
  return new File(
    [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])],
    'photo.png',
    { type: 'image/png' },
  );
}

function ticketFor(key = apiKey, objectKey = 'uploads/photo.png') {
  return createUploadTicket({
    apiKey: key,
    targetUrl,
    fields: {
      key: objectKey,
      policy: 'server-signed-policy',
      'x-amz-signature': 'server-signed-signature',
      'Content-Type': 'image/png',
    },
    env,
  });
}

function uploadRequest(ticket, key = apiKey) {
  const form = new FormData();
  form.append(UPLOAD_TICKET_FIELD, ticket);
  form.append('x-proxy-target-url', 'https://attacker.example/upload');
  form.append('policy', 'client-overwrite-attempt');
  form.append('file', pngFile());
  return new Request('https://local.test/api/upload-binary', {
    method: 'POST',
    headers: { 'x-api-key': key },
    body: form,
  });
}

test('upload proxy reconstructs trusted fields and ignores client targets and signing fields', async () => {
  resetRateLimitStore();
  resetUsedUploadTickets();
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response(null, { status: 204 });
  };

  try {
    const response = await handleUploadProxy(uploadRequest(ticketFor()), { env });
    assert.equal(response.status, 204);
    assert.equal(captured.url, targetUrl);
    assert.equal(captured.options.redirect, 'manual');
    assert.equal(captured.options.body.get('policy'), 'server-signed-policy');
    assert.equal(captured.options.body.get('x-proxy-target-url'), null);
    assert.equal(captured.options.body.get(UPLOAD_TICKET_FIELD), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upload proxy rejects missing auth and tickets bound to another key', async () => {
  resetRateLimitStore();
  resetUsedUploadTickets();
  const noAuthForm = new FormData();
  noAuthForm.append(UPLOAD_TICKET_FIELD, ticketFor());
  noAuthForm.append('file', pngFile());
  const noAuth = await handleUploadProxy(new Request('https://local.test/api/upload-binary', {
    method: 'POST',
    body: noAuthForm,
  }), { env });
  assert.equal(noAuth.status, 401);

  const wrongKey = await handleUploadProxy(uploadRequest(ticketFor(apiKey), 'mu-different-key-987654'), { env });
  assert.equal(wrongKey.status, 401);
});

test('upload proxy validates the signed storage object extension, not the client filename', async () => {
  resetRateLimitStore();
  resetUsedUploadTickets();
  let called = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    called = true;
    return new Response(null, { status: 204 });
  };

  try {
    const response = await handleUploadProxy(uploadRequest(ticketFor(apiKey, 'uploads/photo.svg')), { env });
    assert.equal(response.status, 400);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('upload proxy rate limits repeated attempts', async () => {
  resetRateLimitStore();
  resetUsedUploadTickets();
  const tightEnv = { ...env, UPLOAD_PROXY_RATE_LIMIT: '1' };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });

  try {
    assert.equal((await handleUploadProxy(uploadRequest(ticketFor()), { env: tightEnv })).status, 204);
    assert.equal((await handleUploadProxy(uploadRequest(ticketFor()), { env: tightEnv })).status, 429);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('successful upload tickets cannot be replayed in the same server process', async () => {
  resetRateLimitStore();
  resetUsedUploadTickets();
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response(null, { status: 204 });
  };

  try {
    const ticket = ticketFor();
    assert.equal((await handleUploadProxy(uploadRequest(ticket), { env })).status, 204);
    assert.equal((await handleUploadProxy(uploadRequest(ticket), { env })).status, 409);
    assert.equal(fetchCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
