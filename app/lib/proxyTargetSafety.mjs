// Server-side validator + IP-pinned dispatcher for fetches whose target URL
// is supplied by the client (the upload-binary proxy routes).
//
// Without this, /api/upload-binary and /api/v1/upload-binary accept any URL
// in the x-proxy-target-url form field and POST to it server-side, which is
// a textbook SSRF (cloud metadata, internal admin APIs, etc.). The intended
// targets are S3 presigned URLs returned by the upstream MuAPI service.
//
// Defense in depth:
//   1. Require https://
//   2. Reject embedded credentials
//   3. Reject literal IPs in private / loopback / link-local / cloud-metadata
//      ranges (covers IPv4, IPv4-mapped IPv6, IPv4-compatible IPv6, IPv6 ULA,
//      IPv6 link-local, multicast, CGNAT 100.64.0.0/10).
//   4. DNS-resolve the hostname and reject the request if *any* returned
//      address falls in those same ranges.
//   5. Pin the connection to the validated IP via an undici Agent so that a
//      racing DNS flip between validation and fetch cannot redirect the
//      request to a private IP (canonical DNS-rebinding defense).
//   6. Optional operator allowlist via PROXY_TARGET_ALLOWED_HOSTS — comma-
//      separated host suffixes (e.g. "s3.amazonaws.com,storage.googleapis.com").
//      When set, only hostnames matching one of the suffixes are accepted.

import dns from 'node:dns/promises';
import net from 'node:net';
import { Agent } from 'undici';

const IPV4_BLOCKED_RANGES = [
    [0x0A000000, 0xFF000000], // 10.0.0.0/8
    [0xAC100000, 0xFFF00000], // 172.16.0.0/12
    [0xC0A80000, 0xFFFF0000], // 192.168.0.0/16
    [0x7F000000, 0xFF000000], // 127.0.0.0/8 loopback
    [0xA9FE0000, 0xFFFF0000], // 169.254.0.0/16 link-local + cloud metadata
    [0x64400000, 0xFFC00000], // 100.64.0.0/10 CGNAT
    [0x00000000, 0xFF000000], // 0.0.0.0/8 "this" network
    [0xC0000200, 0xFFFFFF00], // 192.0.2.0/24 TEST-NET-1
    [0xC6336400, 0xFFFFFF00], // 198.51.100.0/24 TEST-NET-2
    [0xCB007100, 0xFFFFFF00], // 203.0.113.0/24 TEST-NET-3
    [0xE0000000, 0xF0000000], // 224.0.0.0/4 multicast
    [0xF0000000, 0xF0000000], // 240.0.0.0/4 reserved
    [0xFFFFFFFF, 0xFFFFFFFF], // 255.255.255.255 broadcast
];

function ipv4ToInt(addr) {
    const parts = addr.split('.');
    if (parts.length !== 4) return null;
    let n = 0;
    for (const p of parts) {
        const v = Number(p);
        if (!Number.isInteger(v) || v < 0 || v > 255) return null;
        n = (n * 256) + v;
    }
    return n >>> 0;
}

export function isPrivateIPv4(addr) {
    const n = ipv4ToInt(addr);
    if (n === null) return true; // malformed — fail closed
    return IPV4_BLOCKED_RANGES.some(([base, mask]) => (n & mask) === (base & mask));
}

export function isPrivateIPv6(addr) {
    const lower = addr.toLowerCase();

    // Loopback / unspecified
    if (lower === '::1' || lower === '::') return true;

    // Multicast ff00::/8
    if (lower.startsWith('ff')) return true;

    // Unique local fc00::/7 — first byte 0xfc or 0xfd
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

    // Link-local fe80::/10 — first 10 bits are 1111111010 → fe8x..feax/feax..febx
    if (lower.startsWith('fe8') || lower.startsWith('fe9') ||
        lower.startsWith('fea') || lower.startsWith('feb')) return true;

    // IPv4-mapped / IPv4-compatible in dotted form (e.g. ::ffff:169.254.169.254)
    const dottedMapped = lower.match(/^::(ffff(:0)?:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (dottedMapped && dottedMapped[3]) {
        return isPrivateIPv4(dottedMapped[3]);
    }

    // IPv4-mapped in hex form — Node's URL parser normalizes
    // ::ffff:169.254.169.254 → ::ffff:a9fe:a9fe, so we have to recognize this.
    const hexMapped = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMapped) {
        const wrapped = hexGroupsToIpv4(hexMapped[1], hexMapped[2]);
        if (wrapped) return isPrivateIPv4(wrapped);
    }

    // IPv4-compatible in hex form (deprecated but still represents an IPv4)
    const hexCompat = lower.match(/^::([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexCompat) {
        const wrapped = hexGroupsToIpv4(hexCompat[1], hexCompat[2]);
        if (wrapped) return isPrivateIPv4(wrapped);
    }

    // 6to4 2002::/16 — wrapped IPv4 in first 32 bits; reject if wrapped IPv4 is private
    if (lower.startsWith('2002:')) {
        const parts = lower.split(':');
        if (parts.length >= 3) {
            const wrapped = hexGroupsToIpv4(parts[1] || '0', parts[2] || '0');
            if (wrapped && isPrivateIPv4(wrapped)) return true;
        }
    }

    return false;
}

function hexGroupsToIpv4(hiStr, loStr) {
    const hi = parseInt(hiStr || '0', 16);
    const lo = parseInt(loStr || '0', 16);
    if (!Number.isFinite(hi) || !Number.isFinite(lo)) return null;
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}

export function isPrivateAddress(addr, family) {
    if (family === 4) return isPrivateIPv4(addr);
    if (family === 6) return isPrivateIPv6(addr);
    return true; // unknown family — fail closed
}

function getAllowlist() {
    const raw = process.env.PROXY_TARGET_ALLOWED_HOSTS;
    if (!raw) return null;
    return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

function hostnameAllowed(hostname, allowlist) {
    if (!allowlist) return true;
    const h = hostname.toLowerCase();
    return allowlist.some(suffix => h === suffix || h.endsWith('.' + suffix));
}

function stripBrackets(hostname) {
    return hostname.startsWith('[') && hostname.endsWith(']')
        ? hostname.slice(1, -1)
        : hostname;
}

function buildPinnedDispatcher(address, family) {
    return new Agent({
        connect: {
            lookup: (_hostname, _opts, cb) => cb(null, address, family),
        },
    });
}

export async function validateAndPinProxyTarget(rawUrl, lookupFn = dns.lookup) {
    if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
        throw new Error('proxy target URL is required');
    }
    let u;
    try {
        u = new URL(rawUrl);
    } catch {
        throw new Error('proxy target URL is not a valid URL');
    }

    if (u.protocol !== 'https:') {
        throw new Error(`proxy target URL must use https (got ${u.protocol})`);
    }
    if (u.username || u.password) {
        throw new Error('proxy target URL must not embed credentials');
    }

    const bareHost = stripBrackets(u.hostname);

    const allowlist = getAllowlist();
    if (!hostnameAllowed(bareHost, allowlist)) {
        throw new Error(`proxy target host is not in PROXY_TARGET_ALLOWED_HOSTS allowlist`);
    }

    // 1. Literal IP in the hostname → validate directly, no DNS.
    if (net.isIP(bareHost)) {
        const family = net.isIPv6(bareHost) ? 6 : 4;
        if (isPrivateAddress(bareHost, family)) {
            throw new Error(`proxy target resolves to a non-public IP (${bareHost})`);
        }
        return { url: u.toString(), dispatcher: buildPinnedDispatcher(bareHost, family) };
    }

    // 2. DNS hostname → resolve and verify every record.
    let records;
    try {
        records = await lookupFn(bareHost, { all: true, verbatim: true });
    } catch (err) {
        throw new Error(`proxy target hostname did not resolve: ${err.code || err.message}`);
    }
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error('proxy target hostname did not resolve to any address');
    }
    for (const r of records) {
        if (isPrivateAddress(r.address, r.family)) {
            throw new Error(`proxy target resolves to a non-public IP (${r.address})`);
        }
    }

    // 3. Pin the connection to the first validated record so a racing DNS
    //    flip cannot redirect the request to a private IP between this check
    //    and the fetch dispatch.
    const pinned = records[0];
    return {
        url: u.toString(),
        dispatcher: buildPinnedDispatcher(pinned.address, pinned.family),
    };
}
