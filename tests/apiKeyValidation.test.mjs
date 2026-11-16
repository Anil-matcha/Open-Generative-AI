import test from 'node:test';
import assert from 'node:assert/strict';

import { validateApiKey } from '../components/apiKeyValidation.mjs';

test('accepts and trims an ASCII API key', () => {
  assert.deepEqual(validateApiKey('  valid-api-key_123  '), {
    value: 'valid-api-key_123',
  });
});

test('rejects an empty API key', () => {
  assert.deepEqual(validateApiKey('   '), {
    error: 'Please enter your API key',
  });
});

test('rejects characters that cannot be encoded in an HTTP header', () => {
  for (const value of ['key\u200b', 'key\ud83d\ude00']) {
    assert.deepEqual(validateApiKey(value), {
      error: 'API key contains characters that cannot be sent in an HTTP header',
    });
  }
});
