async function toBufferFromPayload(payload) {
  if (typeof Blob !== 'undefined' && payload instanceof Blob) {
    return Buffer.from(await payload.arrayBuffer());
  }

  if (typeof payload === 'string') {
    return Buffer.from(payload, 'utf8');
  }

  if (payload && typeof payload === 'object' && typeof payload.arrayBuffer === 'function') {
    return Buffer.from(await payload.arrayBuffer());
  }

  if (payload && typeof payload === 'object' && typeof payload.buffer === 'object') {
    return Buffer.from(payload.buffer);
  }

  return Buffer.from(payload);
}

module.exports = { toBufferFromPayload };
