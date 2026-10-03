// Fake Wan2GP entry point for tests/wan2gpLocal.test.js.
// Run with node (the tests use process.execPath as the "python" binary).
// Behaviour is picked by the prompt in the settings file: ok | fail | hang.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const settingsPath = args[args.indexOf('--process') + 1];
const outDir = args.includes('--output-dir') ? args[args.indexOf('--output-dir') + 1] : null;
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

console.log(`WanGP CLI Mode - Processing settings: ${settingsPath}`);
console.log(`PYTHONUNBUFFERED=${process.env.PYTHONUNBUFFERED}`);

if (args.includes('--dry-run')) {
    console.log(`  Task 1: model=${settings.model_type}, steps=30, frames=81`);
    console.log('[DRY-RUN] Validation complete. 1/1 task(s) valid.');
    process.exit(0);
}

if (settings.prompt === 'fail') {
    console.log('Loading Model Fake...');
    console.error('Traceback (most recent call last):\n  File "wgp.py", line 1\ntorch.OutOfMemoryError: CUDA out of memory.');
    process.exit(1);
}

if (settings.prompt === 'hang') {
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    fs.writeFileSync(path.join(outDir, 'child.pid'), String(child.pid));
    console.log('  [1/30] Denoising | 1.0s');
    setInterval(() => {}, 1000);
    return;
}

console.log('Loading Model Fake...');
process.stdout.write('  [1/2] Denoising | 1.0s\r  [2/2] Denoising | 2.0s\n');
console.log('  [1/1] VAE Decoding | 3.0s');
const outFile = path.join(outDir, `seed${settings.seed}_${settings.prompt}.mp4`);
fs.writeFileSync(outFile, 'fake video');
console.log(`  [0/1] Saving File x.mp4Video file saved to Path: ${outFile}`);
console.log(`image_start=${settings.image_start || ''}`);
console.log('Queue completed: 1/1 tasks in 3s');
