const test = require('node:test');
const assert = require('node:assert/strict');

const {
    pickBinaryAssetForPlatform,
    getBundledBinaryResourceDir,
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
