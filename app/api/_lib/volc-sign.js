import crypto from 'crypto';

const HOST = 'open.volcengineapi.com';
const SERVICE = 'ark';
const REGION = 'cn-beijing';
const ALGORITHM = 'HMAC-SHA256';

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function hmacHex(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex');
}

function sha256Hex(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function getDateTimeStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

export async function callVolcOpenAPI({ accessKeyId, secretAccessKey, action, version, body }) {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('VOLC_ACCESS_KEY / VOLC_SECRET_KEY не заданы в env');
  }

  const method = 'POST';
  const bodyStr = JSON.stringify(body || {});
  const xDate = getDateTimeStamp();
  const shortDate = xDate.slice(0, 8);
  const contentType = 'application/json';
  const payloadHash = sha256Hex(bodyStr);

  const rfc3986 = (s) =>
    encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  const params = { Action: action, Version: version };
  const query = Object.keys(params)
    .sort()
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join('&');

  const signedHeaders = 'content-type;host;x-content-sha256;x-date';
  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${HOST}\n` +
    `x-content-sha256:${payloadHash}\n` +
    `x-date:${xDate}\n`;

  const canonicalRequest = [
    method,
    '/',
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${shortDate}/${REGION}/${SERVICE}/request`;
  const stringToSign = [
    ALGORITHM,
    xDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(secretAccessKey, shortDate);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, 'request');
  const signature = hmacHex(kSigning, stringToSign);

  const authorization =
    `${ALGORITHM} Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${HOST}/?${query}`;
  const resp = await fetch(url, {
    method,
    headers: {
      'Content-Type': contentType,
      'X-Date': xDate,
      'X-Content-Sha256': payloadHash,
      'Authorization': authorization,
    },
    body: bodyStr,
  });

  const rawText = await resp.text();
  let json = {};
  try { json = JSON.parse(rawText); } catch {}

  if (!resp.ok || json?.ResponseMetadata?.Error) {
    const err = json?.ResponseMetadata?.Error;
    console.error(`[volc-sign] ${action} FAILED ${resp.status}`);
    console.error('[volc-sign] response:', rawText.slice(0, 400));
    throw new Error(
      `Volc ${action} failed: ${resp.status} ${err?.Code || ''} ${err?.Message || rawText.slice(0, 200)}`
    );
  }
  return json?.Result ?? json;
}
