import assert from 'node:assert/strict';
import test from 'node:test';
import {
  consumeUploadTicket,
  createUploadTicket,
  protectUploadCredentials,
  UPLOAD_TICKET_FIELD,
} from '../../src/lib/uploadTicket.js';

const env = {
  UPLOAD_PROXY_TICKET_SECRET: 'test-only-secret-that-is-longer-than-thirty-two-characters',
};

const credentials = {
  apiKey: 'mu-test-key-123456',
  targetUrl: 'https://uploads.s3.us-east-1.amazonaws.com/',
  fields: {
    key: 'uploads/example.png',
    policy: 'sensitive-policy',
    'x-amz-signature': 'sensitive-signature',
    'Content-Type': 'image/png',
  },
};

test('upload tickets decrypt only for the API key that requested them', () => {
  const now = 1_700_000_000_000;
  const ticket = createUploadTicket({ ...credentials, env, now });
  const valid = consumeUploadTicket(ticket, { apiKey: credentials.apiKey, env, now: now + 1000 });
  assert.equal(valid.ok, true);
  assert.equal(valid.targetUrl, credentials.targetUrl);
  assert.equal(valid.fields.policy, 'sensitive-policy');

  const wrongKey = consumeUploadTicket(ticket, { apiKey: 'mu-other-key-987654', env, now: now + 1000 });
  assert.deepEqual(wrongKey, { ok: false, reason: 'credential_mismatch' });
});

test('upload tickets reject expiration and tampering', () => {
  const now = 1_700_000_000_000;
  const ticket = createUploadTicket({ ...credentials, env, now });
  assert.equal(
    consumeUploadTicket(ticket, { apiKey: credentials.apiKey, env, now: now + 601_000 }).ok,
    false,
  );

  const tampered = `${ticket.slice(0, -1)}${ticket.endsWith('A') ? 'B' : 'A'}`;
  assert.deepEqual(
    consumeUploadTicket(tampered, { apiKey: credentials.apiKey, env, now: now + 1000 }),
    { ok: false, reason: 'invalid_ticket' },
  );
});

test('protected browser credentials expose only the object key and opaque ticket', () => {
  const safe = protectUploadCredentials(
    { url: credentials.targetUrl, fields: credentials.fields, prefix: 'https://cdn.example/' },
    { apiKey: credentials.apiKey, proxyUrl: '/api/upload-binary', env },
  );

  assert.equal(safe.url, '/api/upload-binary');
  assert.equal(safe.fields.key, credentials.fields.key);
  assert.equal(typeof safe.fields[UPLOAD_TICKET_FIELD], 'string');
  assert.equal(safe.fields.policy, undefined);
  assert.equal(safe.fields['x-amz-signature'], undefined);
  assert.equal(JSON.stringify(safe).includes('amazonaws.com'), false);
  assert.equal(JSON.stringify(safe).includes('sensitive-signature'), false);
});
