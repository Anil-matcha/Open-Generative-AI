import test from 'node:test';
import assert from 'node:assert/strict';

import {
    isPrivateIPv4,
    isPrivateIPv6,
    isPrivateAddress,
    validateAndPinProxyTarget,
} from '../app/lib/proxyTargetSafety.mjs';

// --- IPv4 range coverage ---

test('isPrivateIPv4 rejects loopback', () => {
    assert.equal(isPrivateIPv4('127.0.0.1'), true);
    assert.equal(isPrivateIPv4('127.255.255.254'), true);
});

test('isPrivateIPv4 rejects RFC1918 ranges', () => {
    assert.equal(isPrivateIPv4('10.0.0.1'), true);
    assert.equal(isPrivateIPv4('10.255.255.255'), true);
    assert.equal(isPrivateIPv4('172.16.0.1'), true);
    assert.equal(isPrivateIPv4('172.31.255.255'), true);
    assert.equal(isPrivateIPv4('192.168.1.1'), true);
});

test('isPrivateIPv4 rejects link-local and cloud metadata 169.254.0.0/16', () => {
    assert.equal(isPrivateIPv4('169.254.0.1'), true);
    assert.equal(isPrivateIPv4('169.254.169.254'), true); // AWS / GCP metadata
});

test('isPrivateIPv4 rejects CGNAT 100.64.0.0/10', () => {
    assert.equal(isPrivateIPv4('100.64.0.1'), true);
    assert.equal(isPrivateIPv4('100.127.255.254'), true);
    // 100.63.x and 100.128.x are public
    assert.equal(isPrivateIPv4('100.63.255.255'), false);
    assert.equal(isPrivateIPv4('100.128.0.1'), false);
});

test('isPrivateIPv4 rejects 0.0.0.0/8 and broadcast', () => {
    assert.equal(isPrivateIPv4('0.0.0.0'), true);
    assert.equal(isPrivateIPv4('0.1.2.3'), true);
    assert.equal(isPrivateIPv4('255.255.255.255'), true);
});

test('isPrivateIPv4 rejects multicast 224.0.0.0/4 and reserved 240.0.0.0/4', () => {
    assert.equal(isPrivateIPv4('224.0.0.1'), true);
    assert.equal(isPrivateIPv4('239.255.255.255'), true);
    assert.equal(isPrivateIPv4('240.0.0.1'), true);
});

test('isPrivateIPv4 fails closed on malformed input', () => {
    assert.equal(isPrivateIPv4('not.an.ip.address'), true);
    assert.equal(isPrivateIPv4('1.2.3'), true);
    assert.equal(isPrivateIPv4(''), true);
});

test('isPrivateIPv4 accepts public addresses', () => {
    assert.equal(isPrivateIPv4('8.8.8.8'), false);
    assert.equal(isPrivateIPv4('1.1.1.1'), false);
    assert.equal(isPrivateIPv4('52.84.150.39'), false); // representative public AWS CloudFront IP
});

// --- IPv6 range coverage ---

test('isPrivateIPv6 rejects loopback and unspecified', () => {
    assert.equal(isPrivateIPv6('::1'), true);
    assert.equal(isPrivateIPv6('::'), true);
});

test('isPrivateIPv6 rejects ULA fc00::/7', () => {
    assert.equal(isPrivateIPv6('fc00::1'), true);
    assert.equal(isPrivateIPv6('fd12:3456:789a::1'), true);
});

test('isPrivateIPv6 rejects link-local fe80::/10', () => {
    assert.equal(isPrivateIPv6('fe80::1'), true);
    assert.equal(isPrivateIPv6('feb0::1'), true);
});

test('isPrivateIPv6 rejects multicast', () => {
    assert.equal(isPrivateIPv6('ff02::1'), true);
});

test('isPrivateIPv6 rejects IPv4-mapped private addresses', () => {
    assert.equal(isPrivateIPv6('::ffff:127.0.0.1'), true);
    assert.equal(isPrivateIPv6('::ffff:169.254.169.254'), true);
    assert.equal(isPrivateIPv6('::ffff:10.0.0.1'), true);
});

test('isPrivateIPv6 rejects IPv4-compatible private addresses', () => {
    assert.equal(isPrivateIPv6('::127.0.0.1'), true);
});

test('isPrivateIPv6 rejects 6to4 wrapping private IPv4', () => {
    // 2002:a00:1:: wraps 10.0.0.1 (0x0a000001 → ::a:0:1::)
    assert.equal(isPrivateIPv6('2002:a00:1::'), true);
    // 2002:7f00:1:: wraps 127.0.0.1
    assert.equal(isPrivateIPv6('2002:7f00:1::'), true);
});

test('isPrivateIPv6 accepts public addresses', () => {
    assert.equal(isPrivateIPv6('2001:4860:4860::8888'), false); // Google DNS
    assert.equal(isPrivateIPv6('2606:4700:4700::1111'), false); // Cloudflare DNS
});

// --- isPrivateAddress dispatcher ---

test('isPrivateAddress fails closed on unknown family', () => {
    assert.equal(isPrivateAddress('1.2.3.4', 0), true);
    assert.equal(isPrivateAddress('1.2.3.4', undefined), true);
});

// --- validateAndPinProxyTarget end-to-end ---

const fakeLookupReturning = (records) => async () => records;
const fakeLookupThrowing = (err) => async () => { throw err; };

test('rejects non-string and empty input', async () => {
    await assert.rejects(() => validateAndPinProxyTarget(undefined), /required/);
    await assert.rejects(() => validateAndPinProxyTarget(''), /required/);
    await assert.rejects(() => validateAndPinProxyTarget(null), /required/);
});

test('rejects malformed URLs', async () => {
    await assert.rejects(() => validateAndPinProxyTarget('not a url'), /not a valid URL/);
});

test('rejects non-https schemes', async () => {
    await assert.rejects(() => validateAndPinProxyTarget('http://example.com/'), /must use https/);
    await assert.rejects(() => validateAndPinProxyTarget('file:///etc/passwd'), /must use https/);
    await assert.rejects(() => validateAndPinProxyTarget('ftp://example.com/'), /must use https/);
});

test('rejects URLs with embedded credentials', async () => {
    const lookup = fakeLookupReturning([{ address: '8.8.8.8', family: 4 }]);
    await assert.rejects(
        () => validateAndPinProxyTarget('https://attacker:secret@example.com/path', lookup),
        /must not embed credentials/
    );
});

test('rejects literal private IPv4 hostnames without DNS', async () => {
    const lookup = async () => { throw new Error('DNS should not be consulted'); };
    await assert.rejects(
        () => validateAndPinProxyTarget('https://169.254.169.254/latest/meta-data/', lookup),
        /non-public IP/
    );
    await assert.rejects(
        () => validateAndPinProxyTarget('https://127.0.0.1/admin', lookup),
        /non-public IP/
    );
    await assert.rejects(
        () => validateAndPinProxyTarget('https://10.0.0.5/internal', lookup),
        /non-public IP/
    );
});

test('rejects literal private IPv6 hostnames without DNS', async () => {
    const lookup = async () => { throw new Error('DNS should not be consulted'); };
    await assert.rejects(
        () => validateAndPinProxyTarget('https://[::1]/admin', lookup),
        /non-public IP/
    );
    await assert.rejects(
        () => validateAndPinProxyTarget('https://[::ffff:169.254.169.254]/', lookup),
        /non-public IP/
    );
    await assert.rejects(
        () => validateAndPinProxyTarget('https://[fc00::1]/', lookup),
        /non-public IP/
    );
});

test('rejects hostnames that resolve to private IPs (DNS rebinding gate)', async () => {
    const lookup = fakeLookupReturning([
        { address: '8.8.8.8', family: 4 },
        { address: '127.0.0.1', family: 4 }, // mixed answer set — one bad record poisons the whole lookup
    ]);
    await assert.rejects(
        () => validateAndPinProxyTarget('https://attacker.example/', lookup),
        /non-public IP/
    );
});

test('rejects DNS resolution failure', async () => {
    const lookup = fakeLookupThrowing(Object.assign(new Error('nope'), { code: 'ENOTFOUND' }));
    await assert.rejects(
        () => validateAndPinProxyTarget('https://does-not-resolve.example/', lookup),
        /did not resolve/
    );
});

test('rejects DNS resolution returning empty list', async () => {
    const lookup = fakeLookupReturning([]);
    await assert.rejects(
        () => validateAndPinProxyTarget('https://no-records.example/', lookup),
        /did not resolve to any address/
    );
});

test('accepts public HTTPS URL resolving to a public IP', async () => {
    const lookup = fakeLookupReturning([{ address: '52.84.150.39', family: 4 }]);
    const out = await validateAndPinProxyTarget(
        'https://demo.s3.amazonaws.com/upload/abc?X-Amz-Signature=xyz',
        lookup
    );
    assert.equal(typeof out.url, 'string');
    assert.match(out.url, /^https:\/\/demo\.s3\.amazonaws\.com\//);
    assert.ok(out.dispatcher, 'pinned dispatcher should be returned');
});

test('accepts public HTTPS URL with literal public IPv6', async () => {
    const lookup = async () => { throw new Error('DNS should not be consulted'); };
    const out = await validateAndPinProxyTarget(
        'https://[2606:4700:4700::1111]/path',
        lookup
    );
    assert.equal(typeof out.url, 'string');
    assert.ok(out.dispatcher);
});

test('PROXY_TARGET_ALLOWED_HOSTS env restricts which hostnames are allowed', async () => {
    const original = process.env.PROXY_TARGET_ALLOWED_HOSTS;
    try {
        process.env.PROXY_TARGET_ALLOWED_HOSTS = 's3.amazonaws.com,storage.googleapis.com';
        const lookup = fakeLookupReturning([{ address: '52.84.150.39', family: 4 }]);

        // matches s3.amazonaws.com suffix → allowed
        const ok = await validateAndPinProxyTarget(
            'https://my-bucket.s3.amazonaws.com/upload',
            lookup
        );
        assert.match(ok.url, /amazonaws\.com/);

        // not in allowlist → rejected even though IP is public
        await assert.rejects(
            () => validateAndPinProxyTarget('https://evil.example/upload', lookup),
            /allowlist/
        );
    } finally {
        if (original === undefined) {
            delete process.env.PROXY_TARGET_ALLOWED_HOSTS;
        } else {
            process.env.PROXY_TARGET_ALLOWED_HOSTS = original;
        }
    }
});
