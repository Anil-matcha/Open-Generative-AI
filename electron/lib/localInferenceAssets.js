const path = require('path');

function pickBinaryAssetForPlatform({ platform, arch, zipNames }) {
    const isSdCliZip = (name) => name.startsWith('sd-master-') || name.includes('-bin-');
    const candidates = zipNames.filter(isSdCliZip);

    if (platform === 'darwin') {
        if (arch !== 'arm64') return null;
        return candidates.find((name) => name.includes('Darwin') && name.includes('arm64')) || null;
    }

    if (platform === 'win32') {
        const winCandidates = candidates.filter((name) => /win-(avx2?|avx512|noavx|cuda12|cu12)-x64/.test(name));
        const order = ['win-avx2-x64', 'win-avx-x64', 'win-avx512-x64', 'win-noavx-x64', 'win-cuda12-x64', 'win-cu12-x64'];
        for (const tag of order) {
            const hit = winCandidates.find((name) => name.includes(tag));
            if (hit) return hit;
        }
        return null;
    }

    if (platform === 'linux' && arch === 'arm64') {
        const linuxArmCandidates = candidates.filter((name) =>
            name.includes('Linux') && (name.includes('aarch64') || name.includes('arm64'))
        );
        const plain = linuxArmCandidates.find((name) => !name.includes('rocm') && !name.includes('vulkan'));
        return plain
            || linuxArmCandidates.find((name) => name.includes('vulkan'))
            || linuxArmCandidates.find((name) => name.includes('rocm'))
            || null;
    }

    const linuxCandidates = candidates.filter((name) => name.includes('Linux') && name.includes('x86_64'));
    const plain = linuxCandidates.find((name) => !name.includes('rocm') && !name.includes('vulkan'));
    return plain
        || linuxCandidates.find((name) => name.includes('vulkan'))
        || linuxCandidates.find((name) => name.includes('rocm'))
        || null;
}

function getBundledBinaryResourceDir({ resourcesPath, platform, arch }) {
    const pathLib = platform === 'win32' ? path.win32 : path.posix;
    return pathLib.join(resourcesPath, 'local-ai', `${platform}-${arch}`, 'bin');
}

module.exports = {
    getBundledBinaryResourceDir,
    pickBinaryAssetForPlatform,
};
