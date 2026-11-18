const test = require('node:test');
const assert = require('node:assert/strict');

const {
    pickBinaryAssetForPlatform,
    getBundledBinaryResourceDir,
    resolveRedirectUrl,
} = require('../electron/lib/localInferenceAssets');

test('pickBinaryAssetForPlatform prefers native linux arm64 assets', () => {
    const zipNames = [
        'sd-master-abc-bin-Linux-Ubuntu-24.04-x86_64.zip',
        'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64.zip',
        'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64-vulkan.zip',
    ];

    const picked = pickBinaryAssetForPlatform({
        platform: 'linux',
        arch: 'arm64',
        zipNames,
    });

    assert.equal(picked, 'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64.zip');
});

test('resolveRedirectUrl resolves a relative Location against the request URL', () => {
    assert.equal(
        resolveRedirectUrl(
            '/Comfy-Org/Z-Image-Turbo/resolve/main/split_files/vae/ae.safetensors',
            'https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/vae/ae.safetensors'
        ),
        'https://huggingface.co/Comfy-Org/Z-Image-Turbo/resolve/main/split_files/vae/ae.safetensors'
    );
});

test('resolveRedirectUrl keeps an absolute Location unchanged', () => {
    assert.equal(
        resolveRedirectUrl('https://cdn.example.com/file?sig=1', 'https://huggingface.co/a/b'),
        'https://cdn.example.com/file?sig=1'
    );
});

test('resolveRedirectUrl rejects a redirect with no Location', () => {
    assert.throws(
        () => resolveRedirectUrl(undefined, 'https://huggingface.co/a/b'),
        /no Location header/
    );
});

test('getBundledBinaryResourceDir resolves linux arm64 bundled path', () => {
    const bundledDir = getBundledBinaryResourceDir({
        resourcesPath: '/opt/Open Generative AI/resources',
        platform: 'linux',
        arch: 'arm64',
    });

    assert.equal(
        bundledDir,
        '/opt/Open Generative AI/resources/local-ai/linux-arm64/bin'
    );
});
