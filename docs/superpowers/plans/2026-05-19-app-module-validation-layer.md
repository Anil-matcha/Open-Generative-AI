# App Module Validation Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight convention + validation layer so every app in `src/apps/[app-id]/` must prove it is a real, self-contained Higgsfield module (no more silent shell apps).

**Architecture:** Follow Approach A exactly — no Vite plugin, no monorepo migration, no complex AppModule. Add `scripts/validate-apps.mjs`, `scripts/audit-shell-apps.mjs`, `templates/FEATURE_CHECKLIST.template.md`, enforce manifest shape with dev warnings/errors in registry, and produce audit reports. Existing app imports and router behavior remain unchanged.

**Tech Stack:** Node.js (ESM via .mjs), plain filesystem checks, existing Vite/React app structure.

---

### Task 1: Create scripts directory and plan file references

**Files:**
- Create: `scripts/validate-apps.mjs`
- Create: `scripts/audit-shell-apps.mjs`
- Create: `templates/FEATURE_CHECKLIST.template.md`

- [ ] **Step 1: Verify scripts and templates directories exist**

```bash
mkdir -p scripts templates
ls -la scripts templates
```

Expected: Directories created with no error.

- [ ] **Step 2: Commit directory scaffolding**

```bash
git add scripts templates
git commit -m "chore: add scripts and templates directories for app validation"
```

### Task 2: Create FEATURE_CHECKLIST template

**Files:**
- Create: `templates/FEATURE_CHECKLIST.template.md`

- [ ] **Step 1: Write the complete template file**

```markdown
# Feature Checklist

## Source Repos
- Upstream:
- Fork:

## Required Screens
- [ ] Main screen
- [ ] Create screen if applicable
- [ ] Detail screen if applicable
- [ ] Result screen if applicable
- [ ] Settings/config screen if applicable

## Required Components
- [ ] Input/prompt area
- [ ] Upload area if applicable
- [ ] Presets/templates if applicable
- [ ] Generate/run button if applicable
- [ ] Progress/status if applicable
- [ ] Preview/result area
- [ ] Download/export
- [ ] Save to Library
- [ ] Handoff buttons if applicable

## Required Services
- [ ] API/generation service
- [ ] Status/polling service if applicable
- [ ] Upload/storage service if applicable
- [ ] Supabase persistence if applicable
- [ ] MuAPI adapter if applicable
- [ ] OpenAI adapter if applicable
- [ ] Output handoff service if applicable

## Required Assets
- [ ] Thumbnail
- [ ] Icons
- [ ] Demo/sample images if applicable
- [ ] Demo/sample videos if applicable
- [ ] Template previews if applicable

## Definition of Done
- [ ] Not a shell
- [ ] Route loads
- [ ] Main workflow works
- [ ] Output saves
- [ ] Output previews
- [ ] Build passes
```

- [ ] **Step 2: Commit the template**

```bash
git add templates/FEATURE_CHECKLIST.template.md
git commit -m "feat: add FEATURE_CHECKLIST.template.md for app contract"
```

### Task 3: Implement validate-apps.mjs

**Files:**
- Create: `scripts/validate-apps.mjs`

- [ ] **Step 1: Write the full validator script (ESM, filesystem scan + shell detection)**

```js
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

function validateApp(appId) {
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
  const apps = fs.readdirSync(APPS_DIR).filter(name => fs.statSync(path.join(APPS_DIR, name)).isDirectory());
  console.log(`Validating ${apps.length} apps in src/apps/...\n`);

  for (const app of apps) {
    const result = await validateApp(app);
    const icon = result.status === 'complete' ? '✅' : result.status === 'partial' ? '⚠️' : result.status === 'shell' ? '❌' : '💥';
    console.log(`${icon} ${app}: ${result.status}`);
    if (result.issues.length) console.log(`   Issues: ${result.issues.join(', ')}`);
  }
}

main().catch(console.error);
```

- [ ] **Step 2: Make script executable and test basic run**

```bash
chmod +x scripts/validate-apps.mjs
node scripts/validate-apps.mjs
```

Expected: Lists apps with ✅ / ⚠️ / ❌ status (no crash).

- [ ] **Step 3: Commit validator**

```bash
git add scripts/validate-apps.mjs
git commit -m "feat: add apps:validate script with shell detection rules"
```

### Task 4: Implement audit-shell-apps.mjs

**Files:**
- Create: `scripts/audit-shell-apps.mjs`

- [ ] **Step 1: Write the full audit script (produces .md + .json reports)**

```js
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
```

- [ ] **Step 2: Run audit and verify outputs**

```bash
node scripts/audit-shell-apps.mjs
ls -la shell-app-audit.*
```

Expected: Both report files created with current app statuses.

- [ ] **Step 3: Commit audit script and initial reports**

```bash
git add scripts/audit-shell-apps.mjs shell-app-audit.md shell-app-audit.json
git commit -m "feat: add apps:audit script + initial shell-app-audit reports"
```

### Task 5: Update package.json scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the two new scripts**

```json
"apps:validate": "node scripts/validate-apps.mjs",
"apps:audit": "node scripts/audit-shell-apps.mjs"
```

- [ ] **Step 2: Run the new scripts to confirm they work**

```bash
npm run apps:validate
npm run apps:audit
```

Expected: Both commands succeed and produce expected output/reports.

- [ ] **Step 3: Commit package.json update**

```bash
git add package.json
git commit -m "chore: add apps:validate and apps:audit npm scripts"
```

### Task 6: Minimal registry / manifest validation hook (non-breaking)

**Files:**
- Modify: any existing app registry or import site that touches manifests (e.g. `src/lib/projects/projectService.js` or central app loader if present)

- [ ] **Step 1: Locate the single best place to add a lightweight manifest shape check (read first, do not rewrite router)**

Use grep or read to find where `appManifest` is imported/used.

- [ ] **Step 2: Add a small helper that warns in dev and throws only on production status mismatch**

```js
function validateAppManifest(manifest, appId) {
  if (!manifest || !manifest.id || !manifest.status) {
    console.warn(`[AppRegistry] Incomplete manifest for ${appId}`);
    return false;
  }
  if (manifest.status === 'production' && (!manifest.requiredServices || manifest.requiredServices.length === 0)) {
    throw new Error(`[AppRegistry] Production app ${appId} missing requiredServices`);
  }
  return true;
}
```

Call it once on import/register. Keep change under 15 lines.

- [ ] **Step 3: Commit the minimal registry guard**

```bash
git add src/lib/projects/projectService.js   # or whichever file was edited
git commit -m "feat: add dev-time manifest shape validation warning"
```

### Task 7: Final verification

**Files:** (none new)

- [ ] **Step 1: Run full verification commands**

```bash
npm run apps:validate
npm run apps:audit
npm run build
```

Expected: validate/audit run successfully (may report shells/partials intentionally), build still passes, no runtime breakage for existing apps.

- [ ] **Step 2: Commit final state**

```bash
git add -A
git commit -m "chore: complete Approach A validation layer - ready for per-app fixes"
```

## Summary of Deliverables After Execution
- New files: 3 scripts + 1 template + 2 audit reports
- Changed files: package.json + 1 registry file (minimal)
- Audit results available in shell-app-audit.md/json
- Existing Higgsfield behavior 100% unchanged
- Clear pass/fail for future app fixes (e.g. make Open Pomelli pass validate)
