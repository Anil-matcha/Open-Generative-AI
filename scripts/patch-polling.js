#!/usr/bin/env node
// Patches ALL workflow-builder copies (both the Vibe-Workflow submodule and the
// local workflow-builder-local package, src AND compiled dist) to:
//   1. Remove the "No run_id available!. Click 'Run All' button" guard so a single
//      node can be generated without first clicking "Run All".
//   2. Convert setInterval polling into immediate call + 500ms interval (faster results).
//
// This runs on every Vercel build (prebuild hook), so whichever copy actually gets
// bundled, the guard is stripped and polling is fast.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Every directory that may contain workflow-builder node components.
const targetDirs = [
  'packages/workflow-builder-local/src/components',
  'packages/workflow-builder-local/dist/components',
  'packages/Vibe-Workflow/packages/workflow-builder/src/components',
  'packages/Vibe-Workflow/packages/workflow-builder/dist/components',
].map((d) => path.join(root, d));

const nodeTargets = ['ImageNode', 'VideoNode', 'TextNode', 'AudioNode', 'ApiNode', 'VideoCombiner'];

let patched = 0;

// ── 1. Remove the runId guard everywhere ────────────────────────────────────
function stripGuard(src) {
  let out = src;

  // JSX source form:
  //   if (!runId) {
  //     toast.error("No run_id available!. Click 'Run All' button");
  //     return;
  //   }                       (closing brace may have a trailing semicolon)
  out = out.replace(
    /\n[ \t]*if \(!runId\) \{\s*\n[ \t]*toast\.error\("No run_id available![^"]*"\);\s*\n[ \t]*return;\s*\n[ \t]*\};?/g,
    ''
  );

  // Babel-compiled generator form:
  //   if (runId) { _context.n = N; break; }
  //   _reactHotToast.toast.error("No run_id available!...");
  //   return _context.a(2);
  // → _context.n = N; break;   (unconditionally advance to the next state)
  out = out.replace(
    /if \(runId\) \{\s*\n([ \t]*)(\w+)\.n = (\d+);\s*\n[ \t]*break;\s*\n[ \t]*\}\s*\n[ \t]*_reactHotToast\.toast\.error\("No run_id available![^"]*"\);\s*\n[ \t]*return \2\.a\(2\);/g,
    '$2.n = $3;\n$1break;'
  );

  return out;
}

// ── 2. Speed up polling (src .jsx only — compiled dist already runs) ─────────
function speedUpPolling(src, isNodeFlow) {
  let out = src;
  if (isNodeFlow) {
    out = out.replace(
      /const pollRunIdStatus = \(runId\) => \{\n    const interval = setInterval\(\(\) => \{/,
      'const pollRunIdStatus = (runId) => {\n    let interval; const _check = () => {'
    );
    out = out.replace(
      /    \}, \d+\);\n  \};\n\n  const handleRunWorkflow/,
      '    }; _check(); interval = setInterval(_check, 500);\n  };\n\n  const handleRunWorkflow'
    );
  } else {
    out = out.replace(
      /const interval = setInterval\(\(\) => \{/g,
      'let interval; const _check = () => {'
    );
    out = out.replace(
      /    \}, \d+\);\n  \};/g,
      '    }; _check(); interval = setInterval(_check, 500);\n  };'
    );
  }
  return out;
}

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) { console.log(`Skip (dir not found): ${path.relative(root, dir)}`); continue; }
  const isDist = dir.includes('/dist/');
  const ext = isDist ? '.js' : '.jsx';

  for (const name of [...nodeTargets, 'NodeFlow']) {
    const file = path.join(dir, `${name}${ext}`);
    if (!fs.existsSync(file)) continue;

    let src = fs.readFileSync(file, 'utf8');
    const orig = src;

    src = stripGuard(src);
    // Only rewrite polling timing in .jsx sources; compiled dist uses different syntax.
    if (!isDist) src = speedUpPolling(src, name === 'NodeFlow');

    if (src !== orig) {
      fs.writeFileSync(file, src, 'utf8');
      patched++;
      console.log(`Patched: ${path.relative(root, file)}`);
    }
  }
}

console.log(`patch-polling: ${patched} file(s) patched`);
