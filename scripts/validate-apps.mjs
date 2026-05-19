#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_DIR = path.join(__dirname, '..', 'src', 'apps');

const REQUIRED_FILES = ['index.jsx', 'index.js', 'manifest.js', 'routes.js', 'FEATURE_CHECKLIST.md'];
const REQUIRED_FOLDERS = ['components', 'services', 'assets'];
const CONDITIONAL_HOOKS = ['generation', 'upload', 'workflow', 'agent', 'async'];
const CONDITIONAL_DATA = ['presets', 'templates', 'node configs', 'agent templates', 'campaign templates', 'headshot styles', 'workflow configs'];

function hasAnyFile(dir, files) {
  return files.some(f => fs.existsSync(path.join(dir, f)));
}

function isShellApp(appPath, manifest) {
  const hasOnlyIndex = fs.readdirSync(appPath).filter(f => !f.startsWith('.')).length === 1 && hasAnyFile(appPath, ['index.jsx', 'index.js']);
  if (hasOnlyIndex) return true;
  if (!fs.existsSync(path.join(appPath, 'services'))) return true;
  if (!fs.existsSync(path.join(appPath, 'manifest.js'))) return true;
  if (!fs.existsSync(path.join(appPath, 'routes.js'))) return true;
  if (!fs.existsSync(path.join(appPath, 'FEATURE_CHECKLIST.md'))) return true;

  const indexContent = fs.readFileSync(path.join(appPath, hasAnyFile(appPath, ['index.jsx']) ? 'index.jsx' : 'index.js'), 'utf8');
  if (indexContent.includes('placeholder') || indexContent.includes('<div>App</div>')) return true;

  if (manifest?.requiredCapabilities?.some(c => CONDITIONAL_HOOKS.some(k => c.toLowerCase().includes(k))) && !fs.existsSync(path.join(appPath, 'hooks'))) return true;
  if (manifest?.requiredCapabilities?.some(c => CONDITIONAL_DATA.some(k => c.toLowerCase().includes(k))) && !fs.existsSync(path.join(appPath, 'data'))) return true;

  if (manifest?.requiredServices?.some(s => s.toLowerCase().includes('muapi') || s.toLowerCase().includes('openai')) && !fs.existsSync(path.join(appPath, 'services'))) return true;
  return false;
}

async function validateApp(appId) {
  const appPath = path.join(APPS_DIR, appId);
  const issues = [];
  let status = 'complete';

  if (!hasAnyFile(appPath, ['index.jsx', 'index.js'])) issues.push('Missing index.jsx or index.js');
  if (!fs.existsSync(path.join(appPath, 'manifest.js'))) issues.push('Missing manifest.js');
  if (!fs.existsSync(path.join(appPath, 'routes.js'))) issues.push('Missing routes.js');
  if (!fs.existsSync(path.join(appPath, 'FEATURE_CHECKLIST.md'))) issues.push('Missing FEATURE_CHECKLIST.md');

  REQUIRED_FOLDERS.forEach(folder => {
    if (!fs.existsSync(path.join(appPath, folder))) issues.push(`Missing required folder: ${folder}/`);
  });

  let manifest = null;
  try {
    manifest = (await import(`file://${path.join(appPath, 'manifest.js')}`)).appManifest;
  } catch (e) {
    issues.push('Invalid or unreadable manifest.js');
    status = 'broken';
  }

  if (isShellApp(appPath, manifest)) {
    status = 'shell';
    issues.push('Detected as shell app (placeholder, missing services/handlers/output logic)');
  }

  if (issues.length > 0 && status !== 'shell' && status !== 'broken') status = 'partial';

  return { appId, status, issues, manifest };
}

async function main() {
  const strict = process.argv.includes('--strict');
  const apps = fs.readdirSync(APPS_DIR).filter(name => fs.statSync(path.join(APPS_DIR, name)).isDirectory());
  console.log(`Validating ${apps.length} apps in src/apps/...\n`);

  let shellCount = 0;
  let partialCount = 0;

  for (const app of apps) {
    const result = await validateApp(app);
    const icon = result.status === 'complete' ? '✅' : result.status === 'partial' ? '⚠️' : result.status === 'shell' ? '❌' : '💥';
    console.log(`${icon} ${app}: ${result.status}`);
    if (result.issues.length) console.log(`   Issues: ${result.issues.join(', ')}`);
    if (result.status === 'shell') shellCount++;
    if (result.status === 'partial') partialCount++;
  }

  if (strict && (shellCount > 0 || partialCount > 0)) {
    console.log(`\n❌ Strict mode: ${shellCount} shell, ${partialCount} partial — failing validation.`);
    process.exit(1);
  } else if (strict) {
    console.log(`\n✅ Strict mode: all apps pass.`);
  }
}

main().catch(console.error);
