import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function afterPack({ appOutDir, packager }) {
    const platformName = packager.platform.name;

    // Remove Next.js SWC native binaries that don't belong on this target platform.
    // They are bundled because `next` is in dependencies, but only the host-platform
    // binary is ever used at runtime in the Electron app.
    const nextDir = path.join(appOutDir,
        platformName === 'mac'
            ? `${packager.appInfo.productName}.app/Contents/Resources`
            : 'resources',
        'app.asar.unpacked/node_modules/@next'
    );

    if (fs.existsSync(nextDir)) {
        const keepPrefix = platformName === 'mac' ? 'swc-darwin'
            : platformName === 'windows' ? 'swc-win32'
            : 'swc-linux';

        for (const entry of fs.readdirSync(nextDir)) {
            if (entry.startsWith('swc-') && !entry.startsWith(keepPrefix)) {
                const fullPath = path.join(nextDir, entry);
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log(`  • removed foreign SWC binary  path=${fullPath}`);
            }
        }
    }

    if (platformName !== 'mac') return;

    const appPath = path.join(appOutDir, `${packager.appInfo.productName}.app`);
    console.log(`  • ad-hoc signing  path=${appPath}`);
    execSync(`codesign --deep --force --sign - "${appPath}"`, { stdio: 'inherit' });
    console.log(`  • ad-hoc signing complete`);
}
