const http = require('http');

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function startMockUpstream() {
  const requests = [];
  let origin = 'http://127.0.0.1';

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, origin);
    const body = await readBody(request);
    const record = {
      method: request.method,
      path: url.pathname,
      search: url.search,
      headers: request.headers,
      bodyText: body.toString('utf8'),
    };
    requests.push(record);

    if (url.pathname === '/predictions') {
      sendJson(response, 200, { ok: true, route: 'api-v1', method: request.method });
      return;
    }

    if (url.pathname === '/models') {
      sendJson(response, 200, { ok: true, route: 'provider-v1' });
      return;
    }

    if (url.pathname === '/upload') {
      sendJson(response, 200, { url: '/public/mock-upload.png' });
      return;
    }

    if (url.pathname === '/workflow/get-workflow-defs') {
      sendJson(response, 200, { ok: true, route: 'workflow', items: [] });
      return;
    }

    if (url.pathname === '/agents/templates/agents') {
      sendJson(response, 200, { ok: true, route: 'agents', agents: [] });
      return;
    }

    if (url.pathname === '/app/get_file_upload_url') {
      sendJson(response, 200, {
        ok: true,
        route: 'app',
        url: `${origin}/s3-upload`,
        fields: { key: 'mock/file.png' },
      });
      return;
    }

    if (url.pathname === '/s3-upload') {
      response.writeHead(204);
      response.end();
      return;
    }

    sendJson(response, 404, { error: 'Mock route not implemented.', path: url.pathname });
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      origin = `http://127.0.0.1:${address.port}`;
      server.off('error', reject);
      resolve({
        origin,
        requests,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()));
          }),
      });
    });
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function findRequest(mock, path) {
  return mock.requests.find((request) => request.path === path);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Expected JSON response, got: ${text.slice(0, 160)}`);
  }
}

async function runCheck(checks, name, callback) {
  await callback();
  checks.push(name);
}

async function main() {
  const checks = [];
  const mock = await startMockUpstream();
  process.env.HFSY_TEMP_IMAGE_BASE = mock.origin;

  const { TOKEN_HEADER, startDesktopApiProxy } = require('../electron/lib/desktopApiProxy.js');
  const proxy = await startDesktopApiProxy();

  const proxyFetch = (path, init = {}) => {
    const headers = new Headers(init.headers || {});
    headers.set(TOKEN_HEADER, proxy.token);
    return fetch(`${proxy.origin}${path}`, { ...init, headers });
  };

  try {
    await runCheck(checks, 'rejects unauthorized proxy requests', async () => {
      const response = await fetch(`${proxy.origin}/api/provider/status`);
      const data = await readJson(response);
      assert(response.status === 401, `Expected 401, got ${response.status}`);
      assert(Boolean(data.request_id), 'Unauthorized response should include request_id.');
    });

    await runCheck(checks, 'returns provider status through desktop proxy', async () => {
      const response = await proxyFetch('/api/provider/status');
      const data = await readJson(response);
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(data.summary?.total === 6, 'Provider status should include all desktop health checks.');
      assert(Boolean(data.request_id), 'Provider status should include request_id.');
    });

    await runCheck(checks, 'proxies /api/api/v1 requests to configured upstream', async () => {
      const response = await proxyFetch('/api/api/v1/predictions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': 'desktop-test-key',
          'x-provider-base-url': mock.origin,
        },
        body: JSON.stringify({ model: 'mock-model', prompt: 'hello' }),
      });
      const data = await readJson(response);
      const request = findRequest(mock, '/predictions');
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(data.route === 'api-v1', 'Expected api-v1 upstream payload.');
      assert(request?.headers['x-api-key'] === 'desktop-test-key', 'x-api-key should reach provider upstream.');
      assert(request?.headers.authorization === 'Bearer desktop-test-key', 'authorization should reach provider upstream.');
      assert(!request?.headers[TOKEN_HEADER], 'Desktop proxy token must not be forwarded upstream.');
    });

    await runCheck(checks, 'proxies /api/provider/v1 requests to provider base', async () => {
      const response = await proxyFetch('/api/provider/v1/models', {
        headers: {
          'x-api-key': 'desktop-test-key',
          'x-provider-base-url': mock.origin,
        },
      });
      const data = await readJson(response);
      const request = findRequest(mock, '/models');
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(data.route === 'provider-v1', 'Expected provider-v1 upstream payload.');
      assert(request?.headers.authorization === 'Bearer desktop-test-key', 'provider auth should be bearer.');
    });

    await runCheck(checks, 'uploads provider images through desktop proxy', async () => {
      const formData = new FormData();
      formData.append('file', new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' }), 'tiny.png');
      const response = await proxyFetch('/api/provider/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await readJson(response);
      const request = findRequest(mock, '/upload');
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(data.url === `${mock.origin}/public/mock-upload.png`, 'Provider upload should normalize returned URL.');
      assert(request?.search.includes('returnFormat=full'), 'Provider upload should call configured upload endpoint.');
    });

    await runCheck(checks, 'proxies workflow route family', async () => {
      const response = await proxyFetch('/api/workflow/get-workflow-defs?cursor=1', {
        headers: {
          'x-api-key': 'desktop-test-key',
          'x-provider-base-url': mock.origin,
        },
      });
      const data = await readJson(response);
      const request = findRequest(mock, '/workflow/get-workflow-defs');
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(data.route === 'workflow', 'Expected workflow upstream payload.');
      assert(request?.search === '?cursor=1', 'Workflow query string should be preserved.');
      assert(!request?.headers[TOKEN_HEADER], 'Desktop proxy token must not be forwarded on workflow routes.');
    });

    await runCheck(checks, 'proxies agents route family', async () => {
      const response = await proxyFetch('/api/agents/templates/agents?is_template=true', {
        headers: {
          'x-api-key': 'desktop-test-key',
          'x-provider-base-url': mock.origin,
        },
      });
      const data = await readJson(response);
      const request = findRequest(mock, '/agents/templates/agents');
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(data.route === 'agents', 'Expected agents upstream payload.');
      assert(request?.search === '?is_template=true', 'Agents query string should be preserved.');
    });

    let appUploadPayload = null;
    await runCheck(checks, 'proxies app route family and rewrites upload target', async () => {
      const response = await proxyFetch('/api/app/get_upload_file', {
        headers: {
          'x-api-key': 'desktop-test-key',
          'x-provider-base-url': mock.origin,
        },
      });
      appUploadPayload = await readJson(response);
      const request = findRequest(mock, '/app/get_file_upload_url');
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(Boolean(request), 'App alias should target get_file_upload_url upstream path.');
      assert(appUploadPayload.url === '/api/upload-binary', 'App upload URL should be rewritten to local proxy.');
      assert(appUploadPayload.fields?.['x-proxy-target-url'] === `${mock.origin}/s3-upload`, 'Original upload target should be preserved in form fields.');
    });

    await runCheck(checks, 'uploads app binary payloads to rewritten target', async () => {
      const formData = new FormData();
      Object.entries(appUploadPayload.fields || {}).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      formData.append('file', new Blob([Buffer.from('mock-upload')], { type: 'application/octet-stream' }), 'mock.bin');

      const response = await proxyFetch('/api/upload-binary', {
        method: 'POST',
        body: formData,
      });
      const request = findRequest(mock, '/s3-upload');
      assert(response.status === 204, `Expected 204, got ${response.status}`);
      assert(Boolean(request), 'Binary upload should reach rewritten target.');
      assert(!request.bodyText.includes('x-proxy-target-url'), 'Proxy-only upload target field should not be forwarded.');
      assert(request.bodyText.includes('mock-upload'), 'Binary upload body should preserve file content.');
    });

    console.log(JSON.stringify({
      ok: true,
      checks,
      upstreamRequests: mock.requests.map((request) => `${request.method} ${request.path}${request.search}`),
    }, null, 2));
  } finally {
    await proxy.close();
    await mock.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
