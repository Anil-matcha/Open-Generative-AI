#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APPS_DIR = path.join(__dirname, '..', 'src', 'apps');
const REPORT_MD = path.join(__dirname, '..', 'shell-app-audit.md');
const REPORT_JSON = path.join(__dirname, '..', 'shell-app-audit.json');

async function auditAll() {
  const apps = fs.readdirSync(APPS_DIR).filter(n => fs.statSync(path.join(APPS_DIR, n)).isDirectory());
  const results = [];

  for (const appId of apps) {
    const appPath = path.join(APPS_DIR, appId);
    const missingFiles = [];
    const missingFolders = [];

    ['index.jsx', 'index.js', 'manifest.js', 'routes.js', 'FEATURE_CHECKLIST.md'].forEach(f => {
      if (!fs.existsSync(path.join(appPath, f)) && !hasAnyFile(appPath, [f])) missingFiles.push(f);
    });
    ['components', 'services', 'assets', 'hooks', 'data'].forEach(f => {
      if (!fs.existsSync(path.join(appPath, f))) missingFolders.push(f);
    });

    let status = 'complete';
    if (missingFiles.length || missingFolders.length) status = missingFiles.length > 3 ? 'shell' : 'partial';

    results.push({
      appId,
      status,
      missingFiles,
      missingFolders,
      missingServices: fs.existsSync(path.join(appPath, 'services')) ? [] : ['services/'],
      missingAssets: fs.existsSync(path.join(appPath, 'assets')) ? [] : ['assets/'],
      recommendation: status === 'shell' ? 'Implement full contract or remove from src/apps/' : 'Add missing pieces and re-run audit'
    });
  }

  const md = `# Shell App Audit Report\n\nGenerated: ${new Date().toISOString()}\n\n` +
    results.map(r => `## ${r.appId}\n- Status: **${r.status}**\n- Missing files: ${r.missingFiles.join(', ') || 'none'}\n- Recommendation: ${r.recommendation}\n`).join('\n');

  fs.writeFileSync(REPORT_MD, md);
  fs.writeFileSync(REPORT_JSON, JSON.stringify(results, null, 2));
  console.log(`Audit complete. Reports written to shell-app-audit.md and .json`);
}

function hasAnyFile(dir, files) {
  return files.some(f => fs.existsSync(path.join(dir, f)));
}

auditAll().catch(console.error);
