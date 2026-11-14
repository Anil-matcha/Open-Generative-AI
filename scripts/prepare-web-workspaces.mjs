import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const manifests = [
  'packages/studio/package.json',
  'packages/Vibe-Workflow/packages/workflow-builder/package.json',
  'packages/Open-Poe-AI/packages/agents/package.json',
  'packages/Open-AI-Design-Agent/packages/design-agent/package.json',
];
if (manifests.some(path => !existsSync(path))) {
  if (!existsSync('.git')) {
    throw new Error('Workspace packages are missing. Import the GitHub fork with its public submodules, or run git submodule update --init --recursive before uploading sources.');
  }
  const result = spawnSync('git', ['submodule', 'update', '--init', '--recursive'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Could not initialize the pinned public workspace submodules.');
}
for (const path of manifests) {
  if (!existsSync(path)) throw new Error(`Required workspace manifest is missing: ${path}`);
}
console.log('All four web workspace manifests are available.');
