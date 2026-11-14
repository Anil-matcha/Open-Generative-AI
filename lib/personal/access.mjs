const encoder = new TextEncoder();
export const SESSION_COOKIE = 'personal_studio_session';
export const SESSION_SECONDS = 12 * 60 * 60;

export function accessConfigured(env = process.env) {
  return Boolean(env.STUDIO_PASSWORD?.length >= 12 && env.STUDIO_SESSION_SECRET?.length >= 32);
}
function base64url(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
export async function issueSession(secret, now = Date.now()) {
  const expires = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${expires}.${await sign(expires, secret)}`;
}
export async function verifySession(token, secret, now = Date.now()) {
  if (!secret || !token || token.length > 100 || token.split('.').length !== 2) return false;
  const [expires, signature] = token.split('.');
  const seconds = Math.floor(now / 1000);
  if (!/^\d+$/.test(expires) || Number(expires) <= seconds || Number(expires) > seconds + SESSION_SECONDS) return false;
  const expected = await sign(expires, secret);
  if (signature?.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index++) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
}
export async function passwordMatches(candidate, password) {
  if (typeof candidate !== 'string' || candidate.length > 1024 || !password) return false;
  const [left, right] = await Promise.all([candidate, password].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const a = new Uint8Array(left), b = new Uint8Array(right);
  return a.reduce((difference, value, index) => difference | (value ^ b[index]), 0) === 0;
}
