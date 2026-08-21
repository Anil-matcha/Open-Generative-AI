const DEFAULT_S3_REGION_PATTERN = /^[a-z0-9-]+$/;

function normalizeHostname(hostname) {
    return hostname.toLowerCase().replace(/\.$/, '');
}

function parseAllowedHosts(env) {
    return (env.UPLOAD_PROXY_ALLOWED_HOSTS || '')
        .split(',')
        .map((host) => normalizeHostname(host.trim()))
        .filter(Boolean);
}

function parseIpV4(hostname) {
    const parts = hostname.split('.');
    if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part))) {
        return null;
    }

    const octets = parts.map((part) => Number(part));
    if (octets.some((octet) => octet < 0 || octet > 255)) {
        return null;
    }

    return octets;
}

function isIpLiteral(hostname) {
    return Boolean(parseIpV4(hostname)) || hostname.includes(':');
}

function isBlockedIpV4(hostname) {
    const octets = parseIpV4(hostname);
    if (!octets) {
        return false;
    }

    const [first, second] = octets;
    return (
        first === 0 ||
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168)
    );
}

function isBlockedHost(hostname) {
    const normalized = normalizeHostname(hostname).replace(/^\[|\]$/g, '');

    return (
        normalized === 'localhost' ||
        normalized === '::1' ||
        isIpLiteral(normalized) ||
        isBlockedIpV4(normalized)
    );
}

function isAllowedS3Host(hostname) {
    // Reject empty labels (leading dot, trailing dot, or consecutive dots).
    if (hostname.split('.').some((label) => label === '')) {
        return false;
    }

    if (hostname === 's3.amazonaws.com') {
        return true;
    }

    if (hostname.endsWith('.s3.amazonaws.com')) {
        return hostname.length > '.s3.amazonaws.com'.length;
    }

    const labels = hostname.split('.');
    if (labels.length === 4 && labels[0] === 's3' && labels[2] === 'amazonaws' && labels[3] === 'com') {
        return DEFAULT_S3_REGION_PATTERN.test(labels[1]);
    }

    if (labels.length >= 5 && labels[labels.length - 2] === 'amazonaws' && labels[labels.length - 1] === 'com') {
        const s3LabelIndex = labels.findIndex((label) => label === 's3');
        return (
            s3LabelIndex > 0 &&
            labels.length - s3LabelIndex === 4 &&
            DEFAULT_S3_REGION_PATTERN.test(labels[s3LabelIndex + 1])
        );
    }

    return false;
}

const FILE_TYPES = new Map([
    ['jpg', new Set(['image/jpeg'])],
    ['jpeg', new Set(['image/jpeg'])],
    ['png', new Set(['image/png'])],
    ['webp', new Set(['image/webp'])],
    ['gif', new Set(['image/gif'])],
    ['avif', new Set(['image/avif'])],
    ['mp4', new Set(['video/mp4', 'audio/mp4'])],
    ['webm', new Set(['video/webm', 'audio/webm'])],
    ['mov', new Set(['video/quicktime'])],
    ['mp3', new Set(['audio/mpeg'])],
    ['wav', new Set(['audio/wav', 'audio/x-wav'])],
    ['ogg', new Set(['audio/ogg'])],
    ['flac', new Set(['audio/flac'])],
    ['txt', new Set(['text/plain'])],
]);

function normalizeMime(value) {
    const mime = String(value || '').toLowerCase().split(';')[0].trim();
    return mime === 'audio/mp3' ? 'audio/mpeg' : mime;
}

function extensionOf(filename) {
    const match = String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match?.[1] || '';
}

function startsWith(bytes, signature) {
    return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes, start, end) {
    return String.fromCharCode(...bytes.slice(start, end));
}

function matchesMagicBytes(mime, bytes) {
    if (mime === 'image/jpeg') return startsWith(bytes, [0xff, 0xd8, 0xff]);
    if (mime === 'image/png') return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (mime === 'image/gif') return ['GIF87a', 'GIF89a'].includes(ascii(bytes, 0, 6));
    if (mime === 'image/webp') return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP';
    if (mime === 'image/avif') {
        return ascii(bytes, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(bytes, 8, 12));
    }
    if (mime === 'video/mp4' || mime === 'audio/mp4' || mime === 'video/quicktime') {
        return ascii(bytes, 4, 8) === 'ftyp';
    }
    if (mime === 'video/webm' || mime === 'audio/webm') return startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
    if (mime === 'audio/mpeg') {
        return ascii(bytes, 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    }
    if (mime === 'audio/wav' || mime === 'audio/x-wav') {
        return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WAVE';
    }
    if (mime === 'audio/ogg') return ascii(bytes, 0, 4) === 'OggS';
    if (mime === 'audio/flac') return ascii(bytes, 0, 4) === 'fLaC';
    if (mime === 'text/plain') {
        if (bytes.includes(0)) return false;
        try {
            new TextDecoder('utf-8', { fatal: true }).decode(bytes);
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

export function getUploadMaxBytes(env = process.env) {
    const parsed = Number(env.UPLOAD_PROXY_MAX_BYTES || 50 * 1024 * 1024);
    if (!Number.isFinite(parsed) || parsed <= 0) return 50 * 1024 * 1024;
    return Math.min(parsed, 100 * 1024 * 1024);
}

export function isBlockedFileType(filename = '', contentType = '') {
    const extension = extensionOf(filename);
    const mime = normalizeMime(contentType);
    return !extension || !mime || !FILE_TYPES.get(extension)?.has(mime);
}

export async function validateUploadedFile(file, {
    signedFilename = '',
    signedContentType = '',
    env = process.env,
} = {}) {
    if (!file || typeof file.arrayBuffer !== 'function') return { ok: false, reason: 'missing_file' };
    if (!Number.isFinite(file.size) || file.size <= 0) return { ok: false, reason: 'empty_file' };
    if (file.size > getUploadMaxBytes(env)) return { ok: false, reason: 'file_too_large' };

    const filename = signedFilename || file.name;
    const mime = normalizeMime(signedContentType || file.type);
    if (isBlockedFileType(filename, mime)) return { ok: false, reason: 'file_type_not_allowed' };

    const browserMime = normalizeMime(file.type);
    if (browserMime && browserMime !== mime) return { ok: false, reason: 'content_type_mismatch' };

    const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (!matchesMagicBytes(mime, bytes)) return { ok: false, reason: 'content_signature_mismatch' };
    return { ok: true, mime };
}

export function validateUploadProxyTarget(rawTarget, { env = process.env } = {}) {
    if (typeof rawTarget !== 'string' || rawTarget.trim() === '') {
        return { ok: false, reason: 'missing_target' };
    }

    let url;
    try {
        url = new URL(rawTarget);
    } catch {
        return { ok: false, reason: 'invalid_url' };
    }

    if (url.protocol !== 'https:') {
        return { ok: false, reason: 'unsafe_protocol' };
    }

    if (url.username || url.password || (url.port && url.port !== '443') || url.hash) {
        return { ok: false, reason: 'unsafe_url_components' };
    }

    const hostname = normalizeHostname(url.hostname);
    if (isBlockedHost(hostname)) {
        return { ok: false, reason: 'host_not_allowed' };
    }

    const allowedHosts = parseAllowedHosts(env);
    if (!isAllowedS3Host(hostname) && !allowedHosts.includes(hostname)) {
        return { ok: false, reason: 'host_not_allowed' };
    }

    return { ok: true, url: url.toString() };
}
