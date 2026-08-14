const test = require('node:test');
const assert = require('node:assert/strict');

const { toBufferFromPayload } = require('../lib/binaryPayload');

test('toBufferFromPayload handles string payloads', async () => {
  const result = await toBufferFromPayload('hello');
  assert.equal(result.toString('utf8'), 'hello');
});

test('toBufferFromPayload handles Blob payloads', async () => {
  const blob = new Blob(['world']);
  const result = await toBufferFromPayload(blob);
  assert.equal(result.toString('utf8'), 'world');
});
