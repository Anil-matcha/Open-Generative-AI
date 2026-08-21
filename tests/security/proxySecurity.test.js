import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMuapiUrl,
  getApiKeyFromRequest,
  proxyMuapi,
  sanitizeUpstreamHeaders,
} from '../../src/lib/muapiProxy.js';

test('API key parsing requires a plausible header value', () => {
  assert.equal(getApiKeyFromRequest(new Request('https://local.test')), null);
  assert.equal(
    getApiKeyFromRequest(new Request('https://local.test', { headers: { authorization: 'Bearer mu-test-key-123' } })),
    'mu-test-key-123',
  );
  assert.equal(
    getApiKeyFromRequest(new Request('https://local.test', { headers: { 'x-api-key': 'mu-header-key-123' } })),
    'mu-header-key-123',
  );
});

test('proxy headers remove browser identity, forwarding, and alternate credentials', () => {
  const request = new Request('https://local.test/api/example', {
    headers: {
      authorization: 'Bearer alternate-secret',
      cookie: 'session=secret',
      'x-api-key': 'client-key',
      'x-forwarded-host': 'attacker.example',
      'sec-fetch-site': 'cross-site',
      'content-type': 'application/json',
      accept: 'application/json',
    },
  });
  const headers = sanitizeUpstreamHeaders(request, 'trusted-key');
  assert.equal(headers.get('authorization'), null);
  assert.equal(headers.get('cookie'), null);
  assert.equal(headers.get('x-forwarded-host'), null);
  assert.equal(headers.get('sec-fetch-site'), null);
  assert.equal(headers.get('x-api-key'), 'trusted-key');
  assert.equal(headers.get('accept'), 'application/json');
});

test('proxy URL construction encodes path segments and rejects traversal', () => {
  assert.equal(
    buildMuapiUrl('api/v1', ['jobs', 'hello world'], '?limit=1'),
    'https://api.muapi.ai/api/v1/jobs/hello%20world?limit=1',
  );
  assert.throws(() => buildMuapiUrl('api/v1', ['..']), /Invalid proxy path/);
});

test('proxy requires auth and blocks unsafe JSON before contacting upstream', async () => {
  let fetchCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const unauthenticated = await proxyMuapi(new Request('https://local.test/api/v1/jobs'), {
      prefix: 'api/v1',
      pathSegments: ['jobs'],
    });
    assert.equal(unauthenticated.status, 401);

    const blocked = await proxyMuapi(new Request('https://local.test/api/v1/jobs', {
      method: 'POST',
      headers: { 'x-api-key': 'mu-test-key-123', 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'sexual explicit image involving a child' }),
    }), { prefix: 'api/v1', pathSegments: ['jobs'] });
    assert.equal(blocked.status, 422);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('authenticated proxy strips dangerous headers on the upstream call', async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json', 'set-cookie': 'bad=1' } });
  };

  try {
    const response = await proxyMuapi(new Request('https://local.test/api/v1/jobs?limit=1', {
      headers: {
        'x-api-key': 'mu-test-key-123',
        cookie: 'browser=secret',
        'x-forwarded-host': 'attacker.example',
      },
    }), { prefix: 'api/v1', pathSegments: ['jobs'] });

    assert.equal(response.status, 200);
    assert.equal(captured.url, 'https://api.muapi.ai/api/v1/jobs?limit=1');
    assert.equal(captured.options.headers.get('x-api-key'), 'mu-test-key-123');
    assert.equal(captured.options.headers.get('cookie'), null);
    assert.equal(response.headers.get('set-cookie'), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
