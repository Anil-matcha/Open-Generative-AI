import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateJsonSafety, getContentSafetyMode } from '../../src/lib/contentSafety.js';
import { serializeSafePayload } from '../../src/lib/clientContentSafety.js';

test('content safety defaults to enforcement', () => {
  assert.equal(getContentSafetyMode({}), 'enforce');
  const result = evaluateJsonSafety(JSON.stringify({ prompt: 'explicit sexual content involving a minor' }), { env: {} });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'sexual_content_involving_minors');
});

test('audit mode records matches without blocking and off requires explicit configuration', () => {
  const audit = evaluateJsonSafety(JSON.stringify({ prompt: 'non-consensual sexual assault scene' }), {
    env: { CONTENT_SAFETY_MODE: 'audit' },
  });
  assert.equal(audit.allowed, true);
  assert.equal(audit.audited, true);

  const off = evaluateJsonSafety(JSON.stringify({ prompt: 'explicit sexual content involving a minor' }), {
    env: { CONTENT_SAFETY_MODE: 'off' },
  });
  assert.deepEqual(off, { allowed: true, mode: 'off' });
});

test('operators can add blocked terms without editing code', () => {
  const result = evaluateJsonSafety(JSON.stringify({ prompt: 'render the forbidden-brand logo' }), {
    env: { CONTENT_SAFETY_BLOCKED_TERMS: 'forbidden-brand' },
  });
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'operator_blocked_term');
});

test('direct Electron/Vite requests enforce the same policy before serialization', () => {
  assert.throws(
    () => serializeSafePayload({ prompt: 'explicit sexual content involving a minor' }, { env: {} }),
    /blocked by content safety policy/,
  );
  assert.equal(
    serializeSafePayload({ prompt: 'a peaceful landscape' }, { env: {} }),
    '{"prompt":"a peaceful landscape"}',
  );
});
