const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
const PRODUCT_NAME = PACKAGE_JSON.build?.productName || 'Open Generative AI';
const PACKAGE_NAME = 'open-generative-ai';
const COMMAND_NAME = 'open-generative-ai';
const INSTALL_DIR_NAME = PACKAGE_NAME;
const LINUX_DEPENDS = [
    'libasound2t64 | libasound2',
    'libatk-bridge2.0-0',
    'libatk1.0-0',
    'libc6',
    'libcairo2',
    'libcups2t64 | libcups2',
    'libdrm2',
    'libgbm1',
    'libglib2.0-0',
    'libgtk-3-0',
    'libnspr4',
    'libnss3',
    'libpango-1.0-0',
    'libx11-6',
    'libx11-xcb1',
    'libxcb-dri3-0',
    'libxcomposite1',
    'libxdamage1',
    'libxext6',
    'libxfixes3',
    'libxkbcommon0',
    'libxrandr2',
    'xdg-utils',
].join(', ');

function parseArgs(argv) {
    const args = {};

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (!arg.startsWith('--')) continue;

        const [rawKey, inlineValue] = arg.slice(2).split('=');
        if (inlineValue !== undefined) {
            args[rawKey] = inlineValue;
            continue;
        }

        const nextValue = argv[i + 1];
        if (nextValue && !nextValue.startsWith('--')) {
            args[rawKey] = nextValue;
            i += 1;
        } else {
            args[rawKey] = true;
        }
    }

    return args;
}

function toDebArch(arch) {
    if (arch === 'x64') return 'amd64';
    if (arch === 'arm64') return 'arm64';
    return arch;
}

function getDefaultAppDir(arch) {
    const folderName = arch === 'arm64' ? 'linux-arm64-unpacked' : 'linux-unpacked';
    return path.join(REPO_ROOT, 'release', folderName);
}

function detectExecutableName(appDir) {
    const preferredNames = [PRODUCT_NAME, PACKAGE_JSON.productName, PACKAGE_JSON.name]
        .filter(Boolean);

    for (const fileName of preferredNames) {
        const fullPath = path.join(appDir, fileName);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            return fileName;
        }
    }

    const denyList = new Set([
        'chrome-sandbox',
        'chrome_crashpad_handler',
    ]);

    const candidates = fs.readdirSync(appDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => !denyList.has(name))
        .filter((name) => !name.endsWith('.so') && !name.includes('.so.'))
        .filter((name) => (fs.statSync(path.join(appDir, name)).mode & 0o111) !== 0);

    if (candidates.length === 0) {
        throw new Error(`Could not detect the packaged executable in ${appDir}`);
    }

    return candidates[0];
}

function writeFile(targetPath, contents, mode) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, contents);
    if (mode) fs.chmodSync(targetPath, mode);
}

function main() {
    if (process.platform !== 'linux') {
        console.error('This packaging script must be run on Linux.');
        process.exit(1);
    }

    const args = parseArgs(process.argv.slice(2));
    const arch = args.arch || process.arch;
    const debArch = toDebArch(arch);
    const appDir = path.resolve(args['app-dir'] || getDefaultAppDir(arch));
    const outputDir = path.resolve(args['output-dir'] || path.join(REPO_ROOT, 'release'));
    const version = args.version || PACKAGE_JSON.version;

    if (!fs.existsSync(appDir)) {
        console.error(`Packaged app directory not found: ${appDir}`);
        process.exit(1);
    }

    const executableName = detectExecutableName(appDir);
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'oga-deb-'));
    const packageRoot = path.join(tempRoot, 'pkgroot');
    const installDir = path.join(packageRoot, 'opt', INSTALL_DIR_NAME);
    const wrapperPath = path.join(packageRoot, 'usr', 'bin', COMMAND_NAME);
    const desktopPath = path.join(packageRoot, 'usr', 'share', 'applications', `${PACKAGE_NAME}.desktop`);
    const iconPath = path.join(packageRoot, 'usr', 'share', 'pixmaps', `${PACKAGE_NAME}.png`);
    const controlPath = path.join(packageRoot, 'DEBIAN', 'control');
    const outputPath = path.join(outputDir, `${PACKAGE_NAME}_${version}_${debArch}.deb`);

    fs.mkdirSync(outputDir, { recursive: true });
    fs.cpSync(appDir, installDir, { recursive: true });

    const chromeSandboxPath = path.join(installDir, 'chrome-sandbox');
    if (fs.existsSync(chromeSandboxPath)) {
        fs.chmodSync(chromeSandboxPath, 0o4755);
    }

    writeFile(
        wrapperPath,
        `#!/bin/sh\nexec "/opt/${INSTALL_DIR_NAME}/${executableName}" "$@"\n`,
        0o755
    );

    writeFile(
        desktopPath,
        `[Desktop Entry]
Name=${PRODUCT_NAME}
Exec=${COMMAND_NAME}
Icon=${PACKAGE_NAME}
Type=Application
Categories=Graphics;Utility;
Terminal=false
StartupNotify=true
`,
        0o644
    );

    fs.mkdirSync(path.dirname(iconPath), { recursive: true });
    fs.copyFileSync(path.join(REPO_ROOT, 'public', 'banner.png'), iconPath);
    fs.chmodSync(iconPath, 0o644);

    writeFile(
        controlPath,
        `Package: ${PACKAGE_NAME}
Version: ${version}
Section: graphics
Priority: optional
Architecture: ${debArch}
Maintainer: Open Generative AI Team
Depends: ${LINUX_DEPENDS}
Description: Local-first generative AI studio for image, video, and design workflows
`,
        0o644
    );

    execFileSync('dpkg-deb', ['--build', '--root-owner-group', packageRoot, outputPath], {
        stdio: 'inherit',
    });

    fs.rmSync(tempRoot, { recursive: true, force: true });
    console.log(`Created ${outputPath}`);
}

main();
