import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = {};
const { formatApiError } = await import('../src/lib/muapi.js').catch(() => ({}));

test('402 explains credits are needed', { skip: !formatApiError }, () => {
  assert.match(formatApiError(402, 'Payment Required', '{}'), /credits/i);
});
test('401 explains API key', { skip: !formatApiError }, () => {
  assert.match(formatApiError(401, 'Unauthorized', ''), /API key/);
});
test('other errors keep status', { skip: !formatApiError }, () => {
  assert.match(formatApiError(500, 'Err', 'boom'), /500.*boom/);
});
