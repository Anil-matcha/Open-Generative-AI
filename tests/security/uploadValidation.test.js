import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isBlockedFileType,
  validateUploadedFile,
  validateUploadProxyTarget,
} from '../../src/lib/uploadProxyTarget.js';

test('upload targets accept approved S3 hosts and reject unsafe destinations', () => {
  assert.equal(validateUploadProxyTarget('https://bucket.s3.us-east-1.amazonaws.com/').ok, true);
  assert.equal(validateUploadProxyTarget('http://bucket.s3.amazonaws.com/').reason, 'unsafe_protocol');
  assert.equal(validateUploadProxyTarget('https://127.0.0.1/upload').reason, 'host_not_allowed');
  assert.equal(validateUploadProxyTarget('https://bucket.s3.amazonaws.com:8443/').reason, 'unsafe_url_components');
  assert.equal(validateUploadProxyTarget('https://bucket.s3.amazonaws.com.evil.example/').reason, 'host_not_allowed');
});

test('file policy is allowlist-based', () => {
  assert.equal(isBlockedFileType('photo.png', 'image/png'), false);
  assert.equal(isBlockedFileType('photo.svg', 'image/svg+xml'), true);
  assert.equal(isBlockedFileType('page.html', 'text/html'), true);
  assert.equal(isBlockedFileType('photo.png', 'text/html'), true);
  assert.equal(isBlockedFileType('no-extension', 'image/png'), true);
});

test('file validation checks size, MIME consistency, and magic bytes', async () => {
  const png = new File(
    [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])],
    'photo.png',
    { type: 'image/png' },
  );
  assert.equal((await validateUploadedFile(png)).ok, true);

  const spoofed = new File(['<html>not an image</html>'], 'photo.png', { type: 'image/png' });
  assert.equal((await validateUploadedFile(spoofed)).reason, 'content_signature_mismatch');

  const mismatch = new File(['plain text'], 'notes.txt', { type: 'text/plain' });
  assert.equal(
    (await validateUploadedFile(mismatch, { signedContentType: 'image/png' })).reason,
    'file_type_not_allowed',
  );

  assert.equal(
    (await validateUploadedFile(png, { env: { UPLOAD_PROXY_MAX_BYTES: '4' } })).reason,
    'file_too_large',
  );
});
