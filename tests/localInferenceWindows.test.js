const test = require('node:test');
const assert = require('node:assert/strict');

const {
    pickBinaryAssetForPlatform,
    rankWindowsAssets,
    describeExitCode,
} = require('../electron/lib/localInferenceAssets');

const WIN_ZIPS = [
    'cudart-sd-bin-win-cu12-x64.zip',
    'sd-master-c6dfa9d-bin-win-cuda12-x64.zip',
    'sd-master-c6dfa9d-bin-win-vulkan-x64.zip',
    'sd-master-c6dfa9d-bin-win-cpu-x64.zip',
];

test('windows picker defaults to the CPU build and recognises win-cpu-x64 (#356)', () => {
    assert.equal(
        pickBinaryAssetForPlatform({ platform: 'win32', arch: 'x64', zipNames: WIN_ZIPS }),
        'sd-master-c6dfa9d-bin-win-cpu-x64.zip'
    );
});

test('windows picker prefers CUDA for NVIDIA and Vulkan otherwise, never the cudart zip (#260)', () => {
    assert.deepEqual(rankWindowsAssets({ zipNames: WIN_ZIPS, gpu: 'nvidia' }), [
        'sd-master-c6dfa9d-bin-win-cuda12-x64.zip',
        'sd-master-c6dfa9d-bin-win-vulkan-x64.zip',
        'sd-master-c6dfa9d-bin-win-cpu-x64.zip',
    ]);
    assert.equal(
        rankWindowsAssets({ zipNames: WIN_ZIPS, gpu: 'other' })[0],
        'sd-master-c6dfa9d-bin-win-vulkan-x64.zip'
    );
});

test('describeExitCode maps Windows loader failures to guidance', () => {
    assert.match(describeExitCode(3221225781, 'win32'), /0xC0000135/);
    assert.match(describeExitCode(3236495362, 'win32'), /0xC0E90002/);
    assert.equal(describeExitCode(1, 'win32'), '');
});
