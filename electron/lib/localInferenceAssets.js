const path = require('path');

// Ordered Windows candidates, best first. `gpu` is 'nvidia' | 'other' | null.
// The CPU build (win-cpu-x64, formerly win-avx2-x64) is the safest default: it
// runs everywhere. GPU builds are preferred only when a matching GPU was
// detected; callers should validate the binary and fall back down the list.
function rankWindowsAssets({ zipNames, gpu = null }) {
    const isSdCliZip = (name) => /^sd-/.test(name) && !/^cudart-/.test(name) && name.includes('-bin-');
    const candidates = zipNames.filter(isSdCliZip);
    const cpuTags = ['win-cpu-x64', 'win-avx2-x64', 'win-avx-x64', 'win-avx512-x64', 'win-noavx-x64'];
    const order = gpu === 'nvidia'
        ? ['win-cuda12-x64', 'win-cu12-x64', 'win-vulkan-x64', ...cpuTags]
        : gpu === 'other'
            ? ['win-vulkan-x64', ...cpuTags]
            : cpuTags;
    const ranked = [];
    for (const tag of order) {
        for (const name of candidates) {
            if (name.includes(tag) && !ranked.includes(name)) ranked.push(name);
        }
    }
    return ranked;
}

// Windows NTSTATUS exit codes commonly seen from sd-cli.exe, as user-facing hints.
function describeExitCode(code, platform = process.platform) {
    if (typeof code !== 'number') return '';
    const hex = (code >>> 0).toString(16).toUpperCase();
    if (platform !== 'win32' && code >= 0) return '';
    switch (code >>> 0) {
        case 0xC0000135:
            return 'A required DLL is missing (0xC0000135). The installed engine is incomplete or needs the Microsoft Visual C++ 2015-2022 x64 Redistributable. Re-install the engine in Settings > Local Models (the CPU build is the most compatible), or install the redistributable from aka.ms/vs/17/release/vc_redist.x64.exe. ';
        case 0xC000007B:
            return 'The engine and its DLLs are for different architectures (0xC000007B). Re-install the engine in Settings > Local Models. ';
        case 0xC0000005:
            return 'The engine crashed with an access violation (0xC0000005), usually a GPU driver or out-of-memory problem. Try a smaller model or the CPU engine build. ';
        case 0xC0000409:
            return 'The engine aborted (0xC0000409), usually out of memory. Try a smaller model or lower resolution. ';
        default:
            if ((code >>> 0) >= 0xC0000000) {
                return `The engine crashed with Windows error 0x${hex}. This is usually a GPU backend (CUDA/Vulkan) or memory problem; try the CPU engine build, update your GPU driver, or use a smaller model. `;
            }
            return '';
    }
}

function pickBinaryAssetForPlatform({ platform, arch, zipNames, gpu = null }) {
    const isSdCliZip = (name) => name.startsWith('sd-master-') || name.includes('-bin-');
    const candidates = zipNames.filter(isSdCliZip);

    if (platform === 'darwin') {
        if (arch !== 'arm64') return null;
        return candidates.find((name) => name.includes('Darwin') && name.includes('arm64')) || null;
    }

    if (platform === 'win32') {
        return rankWindowsAssets({ zipNames, gpu })[0] || null;
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

// A Location header may be relative (Hugging Face sends one after a repo rename).
function resolveRedirectUrl(location, requestUrl) {
    if (!location) throw new Error(`Redirect from ${requestUrl} has no Location header`);
    return new URL(location, requestUrl).toString();
}

module.exports = {
    getBundledBinaryResourceDir,
    pickBinaryAssetForPlatform,
    rankWindowsAssets,
    describeExitCode,
    resolveRedirectUrl,
};
