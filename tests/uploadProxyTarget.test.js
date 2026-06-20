const test = require('node:test');
const assert = require('node:assert/strict');

async function loadValidator() {
    const { validateUploadProxyTarget } = await import('../src/lib/uploadProxyTarget.js');
    return validateUploadProxyTarget;
}

test('validateUploadProxyTarget accepts common S3 upload hosts', async () => {
    const validateUploadProxyTarget = await loadValidator();

    assert.deepEqual(
        validateUploadProxyTarget('https://my-bucket.s3.amazonaws.com/'),
        { ok: true, url: 'https://my-bucket.s3.amazonaws.com/' }
    );
    assert.deepEqual(
        validateUploadProxyTarget('https://my-bucket.s3.us-east-1.amazonaws.com/'),
        { ok: true, url: 'https://my-bucket.s3.us-east-1.amazonaws.com/' }
    );
    assert.deepEqual(
        validateUploadProxyTarget('https://s3.amazonaws.com/my-bucket'),
        { ok: true, url: 'https://s3.amazonaws.com/my-bucket' }
    );
    assert.deepEqual(
        validateUploadProxyTarget('https://s3.us-east-1.amazonaws.com/my-bucket'),
        { ok: true, url: 'https://s3.us-east-1.amazonaws.com/my-bucket' }
    );
});

test('validateUploadProxyTarget rejects missing targets', async () => {
    const validateUploadProxyTarget = await loadValidator();

    assert.deepEqual(validateUploadProxyTarget(), { ok: false, reason: 'missing_target' });
    assert.deepEqual(validateUploadProxyTarget(''), { ok: false, reason: 'missing_target' });
    assert.deepEqual(validateUploadProxyTarget('   '), { ok: false, reason: 'missing_target' });
});

test('validateUploadProxyTarget rejects unsafe protocols', async () => {
    const validateUploadProxyTarget = await loadValidator();

    assert.deepEqual(
        validateUploadProxyTarget('http://my-bucket.s3.amazonaws.com/'),
        { ok: false, reason: 'unsafe_protocol' }
    );
    assert.deepEqual(
        validateUploadProxyTarget('file:///etc/passwd'),
        { ok: false, reason: 'unsafe_protocol' }
    );
});

test('validateUploadProxyTarget rejects invalid URLs', async () => {
    const validateUploadProxyTarget = await loadValidator();

    assert.deepEqual(
        validateUploadProxyTarget('not a url'),
        { ok: false, reason: 'invalid_url' }
    );
});

test('validateUploadProxyTarget rejects S3-like hosts with empty labels', async () => {
    const validateUploadProxyTarget = await loadValidator();

    for (const target of [
        'https://.s3.amazonaws.com/',
        'https://..s3.amazonaws.com/',
        'https://foo..s3.amazonaws.com/',
    ]) {
        assert.deepEqual(
            validateUploadProxyTarget(target),
            { ok: false, reason: 'host_not_allowed' },
            target
        );
    }
});

test('validateUploadProxyTarget rejects blocked host literals', async () => {
    const validateUploadProxyTarget = await loadValidator();

    assert.deepEqual(
        validateUploadProxyTarget('https://169.254.169.254/latest/meta-data/'),
        { ok: false, reason: 'host_not_allowed' }
    );
    assert.deepEqual(
        validateUploadProxyTarget('https://localhost:9000/bucket'),
        { ok: false, reason: 'host_not_allowed' }
    );
    assert.deepEqual(
        validateUploadProxyTarget('https://192.168.1.10/up'),
        { ok: false, reason: 'host_not_allowed' }
    );
});

test('validateUploadProxyTarget honors the allowed hosts env override', async () => {
    const validateUploadProxyTarget = await loadValidator();

    assert.deepEqual(
        validateUploadProxyTarget('https://minio.internal.example.com/bucket', {
            env: { UPLOAD_PROXY_ALLOWED_HOSTS: 'minio.internal.example.com' },
        }),
        { ok: true, url: 'https://minio.internal.example.com/bucket' }
    );
    assert.deepEqual(
        validateUploadProxyTarget('https://other.internal.example.com/bucket', {
            env: { UPLOAD_PROXY_ALLOWED_HOSTS: 'minio.internal.example.com' },
        }),
        { ok: false, reason: 'host_not_allowed' }
    );
});

test('validateUploadProxyTarget reads process env at call time', async () => {
    const validateUploadProxyTarget = await loadValidator();
    const previousAllowedHosts = process.env.UPLOAD_PROXY_ALLOWED_HOSTS;

    try {
        process.env.UPLOAD_PROXY_ALLOWED_HOSTS = 'uploads.example.com';
        assert.deepEqual(
            validateUploadProxyTarget('https://uploads.example.com/bucket'),
            { ok: true, url: 'https://uploads.example.com/bucket' }
        );

        process.env.UPLOAD_PROXY_ALLOWED_HOSTS = 'other.example.com';
        assert.deepEqual(
            validateUploadProxyTarget('https://uploads.example.com/bucket'),
            { ok: false, reason: 'host_not_allowed' }
        );
    } finally {
        if (previousAllowedHosts === undefined) {
            delete process.env.UPLOAD_PROXY_ALLOWED_HOSTS;
        } else {
            process.env.UPLOAD_PROXY_ALLOWED_HOSTS = previousAllowedHosts;
        }
    }
});

test('validateUploadProxyTarget blocks unsafe hosts even when env allows them', async () => {
    const validateUploadProxyTarget = await loadValidator();
    const previousAllowedHosts = process.env.UPLOAD_PROXY_ALLOWED_HOSTS;

    try {
        process.env.UPLOAD_PROXY_ALLOWED_HOSTS = 'localhost,192.168.1.10';

        assert.deepEqual(
            validateUploadProxyTarget('https://localhost:9000/bucket'),
            { ok: false, reason: 'host_not_allowed' }
        );
        assert.deepEqual(
            validateUploadProxyTarget('https://192.168.1.10/up'),
            { ok: false, reason: 'host_not_allowed' }
        );
        assert.deepEqual(
            validateUploadProxyTarget('https://8.8.8.8/up'),
            { ok: false, reason: 'host_not_allowed' }
        );
    } finally {
        if (previousAllowedHosts === undefined) {
            delete process.env.UPLOAD_PROXY_ALLOWED_HOSTS;
        } else {
            process.env.UPLOAD_PROXY_ALLOWED_HOSTS = previousAllowedHosts;
        }
    }
});
