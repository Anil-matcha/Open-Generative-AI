# Repository Stabilization Plan

**Project:** Open-Higgsfield-AI Repository Health Recovery
**Triggers:** 25.8% fix-rate (83/322 commits), 12 submodule fixes, 19 CI/CD fixes since April 1
**Objective:** Transform from reactive firefighting to systematic engineering
**Methodology:** Superpowers Framework (TDD, Git Worktrees, Systematic Debugging)

---

## Phase 0: Current State Assessment

### Critical Blockers Identified
1. **Submodule misconfiguration** (12+ fix commits) - CI/CD breaks repeatedly
2. **Dirty worktrees** (3 active) - Risk of lost work, merge conflicts
3. **Lockfile inconsistency** (package-lock.json + pnpm-lock.yaml) - Build failures
4. **WIP commits on mainline** (22 commits) - Poor branch hygiene
5. **Netlify instability** (10+ fix commits) - Deployment pipeline fragile

---

## Phase 1: Immediate Stabilization (Today)

### Task 1.1: Worktree Cleanup Sprint
**Priority:** CRITICAL
**Time:** 30 minutes

**Actions:**
1.1.1 Inspect each worktree's modifications:
- `worktrees/director-router-fix`: `apps/director/frontend/src/director.js` modified
- `worktrees/landing-worktree`: `package-lock.json` modified
- `worktrees/vimax-conversion`: `vanilla/` directory untracked

1.1.2 Determine disposition for each:
- Commit to respective feature branch if work is valuable
- Discard if experimental/spam
- Move to proper branch if mislocated

1.1.3 Clean or commit, then prune inactive worktrees

**Verification:**
```bash
git worktree list
# Should show only main worktree + any actively developed feature branches
# All modified files staged/committed or discarded
```

**Success criteria:**
- Zero uncommitted changes across all worktrees
- Worktrees only on active feature branches
- No WIP on main

---

### Task 1.2: Submodule Pre-commit Hook
**Priority:** CRITICAL
**Time:** 15 minutes

**Actions:**
1.2.1 Create validation script `scripts/validate-submodules.js`:
- Parse `.gitmodules` to list configured submodules
- Run `git ls-files --stage | grep '^160000'` to get actual submodule paths
- Compare and fail if mismatch
- Exit code 1 on mismatch, print clear error

1.2.2 Install as Husky pre-commit hook:
```bash
# .husky/pre-commit
node scripts/validate-submodules.js
```

**Verification:**
```bash
# Test that hook catches submodule/.gitmodules mismatch
# (temporarily break it to verify)
```

**Success criteria:**
- Pre-commit blocks commits with submodule misconfiguration
- Clear error message directs maintainer to fix .gitmodules

---

### Task 1.3: Lockfile Consolidation
**Priority:** CRITICAL
**Time:** 45 minutes

**Actions:**
1.3.1 Remove `package-lock.json` (npm lockfile not used in pnpm monorepo)
```bash
rm package-lock.json
# Also check apps/*, packages/* for stray package-lock.json files
find . -name "package-lock.json" -not -path "./node_modules/*" -delete
```

1.3.2 Regenerate clean pnpm-lock.yaml:
```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: consolidate to pnpm lockfile only"
```

1.3.3 Update CI to fail on package-lock.json presence:
- Add check to CI: `if find . -name "package-lock.json" | grep -q .; then exit 1; fi`

**Verification:**
- `git status` shows only pnpm-lock.yaml tracked
- CI passes with pnpm-only workflow
- No lockfile conflicts in next 24h

**Success criteria:**
- Single source of truth for dependencies
- No more "Update pnpm-lock.yaml to sync" commits

---

## Phase 2: Submodule System Overhaul (This Week)

### Task 2.1: Submodule Inventory & Classification
**Priority:** CRITICAL
**Time:** 1 hour

**Actions:**
2.1.1 Run inventory:
```bash
git submodule status > docs/SUBMODULE_INVENTORY.md
git ls-files --stage | grep '^160000' > docs/CURRENT_SUBMODULES.txt
```

2.1.2 Classify each submodule:
- **Keep as submodule**: Required for development, no npm alternative
- **Migrate to package**: Published on npm, stable
- **Remove entirely**: Deprecated, unused

2.1.3 Document in `docs/SUBMODULE_POLICY.md`:
- List of approved submodules with purpose
- Migration plan for non-essential ones
- Maintenance checklist

---

### Task 2.2: Fix Duplicate Submodule URLs
**Priority:** CRITICAL
**Issue:** 4 submodules point to same repo (videoremixai-vfx duplicated):
```
[videoremixai-vfx] → https://github.com/deangilmoreremix/videoremixai-vfx.git
[videoremixai-vfx-source] → https://github.com/deangilmoreremix/videoremixai-vfx.git (same!)
[apps/ai-vfx] → https://github.com/deangilmoreremix/videoremixai-vfx.git (same!)
[apps/ai-vfx-source] → https://github.com/deangilmoreremix/videoremixai-vfx.git (same!)
```

**Hypothesis:** Copy-paste error; likely should be:
- `ai-vfx-source` → source code for ai-vfx app
- `videoremixai-vfx-source` → separate source repo

**TDD Validation:**
2.2.1 Write test `tests/unit/submodule-config.unit.spec.ts`:
```typescript
describe('Submodule Configuration', () => {
  it('should have unique URLs for each submodule', () => {
    const gitmodules = parseGitmodules('.gitmodules');
    const urls = gitmodules.map(s => s.url);
    const uniqueUrls = new Set(urls);
    expect(urls.length).toBe(uniqueUrls.size);
  });

  it('should have .gitmodules entry for every filesystem submodule', () => {
    const configured = getConfiguredSubmodules('.gitmodules');
    const actual = getActualSubmodules();
    expect(actual).toEqual(expect.arrayContaining(configured));
  });
});
```

2.2.2 Run test (should fail)
2.2.3 Fix .gitmodules URLs
2.2.4 Re-run test (should pass)
2.2.5 Commit with `fix(submodules): correct duplicate URLs`

---

### Task 2.3: Resolve Detached HEAD Submodules
**Priority:** HIGH
**Issue:** Submodules showing detached HEAD (no branch tracking)

**Actions:**
2.3.1 For each submodule in detached state:
```bash
cd modules/CineGen
git checkout main  # or appropriate branch
git pull
cd ../..
```

2.3.2 Record correct commit in superproject:
```bash
git add modules/CineGen
git commit -m "chore(submodule): track CineGen main branch"
```

2.3.3 Push to update remote

---

### Task 2.4: Add Submodule CI Validation
**Priority:** HIGH

**Actions:**
2.4.1 Create GitHub Actions workflow `.github/workflows/submodule-check.yml`:
```yaml
name: Submodule Validation
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
      - name: Validate submodule configuration
        run: node scripts/validate-submodules.js
```

2.4.2 Add to required checks on main branch protection

---

## Phase 3: CI/CD Pipeline Hardening (This Week)

### Task 3.1: Fix GitHub Actions Failures
**Priority:** HIGH
**Based on commit 6fbb7a1**

**Actions:**
3.1.1 Edit `.github/workflows/comprehensive-testing.yml`:
- Replace `npm ci` → `npm install` (lockfile already committed)
- Fix `junit-report-merger` command: remove invalid `-d` flag
- Add graceful handling for missing test result XML files

3.1.2 Add submodule validation step before install

3.1.3 Cache both pnpm-lock and node_modules separately

**TDD:**
3.1.4 Write smoke test for CI workflow syntax validation
3.1.5 Run workflow dry-run via `act` locally if available

---

### Task 3.2: Netlify Configuration Consolidation
**Priority:** HIGH
**Based on 10+ Netlify fix commits**

**Actions:**
3.2.1 Audit current Netlify config:
```bash
# Check multiple sources:
cat netlify.toml
grep -A5 '"build"' package.json
cat vercel.json 2>/dev/null || echo "No vercel.json"
```

3.2.2 Establish single source of truth: **netlify.toml only**
- Remove Netlify-specific build scripts from package.json
- Ensure redirects/headers only in netlify.toml
- Remove vercel.json if conflicting

3.2.3 Fix known TOML syntax issues:
- Ensure proper brackets: `[[redirects]]` not `[redirects]` for arrays
- Quote all string values
- Validate with `toml-lint` (add as devDependency)

3.2.4 Add pre-deploy validation script:
```bash
#!/bin/bash
# scripts/validate-netlify.sh
if command -v toml-lint &> /dev/null; then
  toml-lint netlify.toml || exit 1
fi
# Build dry-run
npx netlify-cli build --dry || exit 1
```

3.2.5 Commit as: `fix(netlify): consolidate config to single source of truth`

---

## Phase 4: Branch Hygiene & Process (This Week)

### Task 4.1: WIP Cleanup
**Priority:** HIGH
**22 WIP commits must be removed from main**

**Actions:**
4.1.1 Find all WIP commits:
```bash
git log --all --oneline --grep="wip" > docs/WIP_COMMITS.txt
```

4.1.2 For each WIP commit on main:
- Check if work is complete → extract to feature branch
- Check if work is abandoned → revert commit with documented rationale
- Move uncommitted worktrees to proper branches

4.1.3 Enforce via pre-commit hook: reject commits with "wip" in message

---

### Task 4.2: Worktree Pruning
**Priority:** HIGH
**3 dirty worktrees identified**

**Actions:**
4.2.1 Inspect each:
```bash
# For each worktree:
cd worktrees/director-router-fix
git status
# Review apps/director/frontend/src/director.js
```

4.2.2 If work is valid and complete:
```bash
git add .
git commit -m "feat(director): fix router integration"
git checkout main
git merge feature/director-router-fix
```

4.2.3 If experimental:
```bash
git reset --hard HEAD
git checkout main
```

4.2.4 Delete worktree after cleanup:
```bash
cd /workspaces/Open-Higgsfield-AI
git worktree remove worktrees/director-router-fix
```

---

### Task 4.3: Branch Policy Documentation
**Priority:** MEDIUM

**Actions:**
4.3.1 Create `docs/GIT_POLICY.md`:
- Main branch: protected, no direct pushes
- Feature branches: prefix with `feature/`, `fix/`, `chore/`
- Commit message format: Conventional Commits
- Pre-commit hooks required

4.3.2 Add Husky hooks:
- `commit-msg`: validate format
- `pre-commit`: run submodule check, lockfile check
- `pre-push`: run tests (lightweight)

---

## Phase 5: Testing Reliability (Next Week)

### Task 5.1: Pin Test Dependencies
**Priority:** MEDIUM

**Actions:**
5.1.1 Pin Playwright browser versions in package.json:
```json
"devDependencies": {
  "@playwright/test": "^1.40.0"
}
```

5.1.2 Add test retry logic in CI:
```yaml
- name: Run E2E tests
  run: npx playwright test --retries=2
```

---

### Task 5.2: Coverage Enforcement
**Priority:** MEDIUM

**Actions:**
5.2.1 Set minimum threshold in `vitest.config.js`:
```js
test: {
  coverage: {
    reporter: ['text', 'json', 'html'],
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
}
```

5.2.2 Add coverage check to CI

---

## Phase 6: Superpowers Methodology Rollout (Next Month)

### Task 6.1: Team Documentation
**Priority:** LOW (but foundational)

**Actions:**
6.1.1 Create `docs/DEVELOPMENT_WORKFLOW.md` documenting:
- Superpowers phases for all future work
- TDD requirement: tests before implementation
- Worktree usage guidelines
- Review process

6.1.2 Create template directories:
```
.kilo/plans/
  template.md  # Plan template for all new features
.kilo/reviews/
  checklist.md  # Code review checklist
```

---

## Execution Status

**Current phase:** Phase 1 - Immediate Stabilization
**Estimated total time:** 4-6 hours
**Risk level:** Medium (worktree isolation recommended)

---

## Success Metrics

| Metric | Baseline | Target | Timeline |
|--------|---------|--------|----------|
| Fix commit ratio | 25.8% | <10% | 1 month |
| Submodule-related CI failures | 12+ in history | 0 | 1 week |
| Netlify fix commits | 10+ | 0 | 2 weeks |
| WIP commits on main | 22 | 0 | Immediate |
| Dirty worktrees | 3 | 0 | 2 hours |
| Test coverage | Unknown | ≥80% | 1 month |

---

## Next Step

Execute **Phase 1 Tasks** in order:
1. Worktree Cleanup Sprint
2. Submodule pre-commit hook
3. Lockfile consolidation

Proceed to Phase 2 only after all Phase 1 success criteria met.
