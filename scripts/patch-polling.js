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

// ── 1b. Use the synchronous node-run response directly ──────────────────────
// POST /node/{id}/run is synchronous and already returns the finished result.
// Relying on pollNodeStatus afterwards fails across serverless instances (the
// poll may hit a different instance whose in-memory store is empty). So apply
// the result from the POST response immediately and only fall back to polling
// if the response is still processing. ES5-safe so it works in src AND dist.
const SYNC_RESPONSE_SNIPPET =
  '{ var _r = response.data; var _nd = _r && _r.nodes && (_r.nodes[id] || Object.values(_r.nodes)[0]); ' +
  'var _lt = _nd && _nd[_nd.length - 1]; ' +
  'if (_lt && (_lt.status === "succeeded" || _lt.status === "completed") && _lt.result && _lt.result.outputs) { ' +
  'var _o = _lt.result.outputs; ' +
  'data && data.onDataChange && data.onDataChange(id, { outputs: _o, resultUrl: (_o[0] && _o[0].value) || "", isLoading: false, errorMsg: null, outputHistory: (data.outputHistory || []).concat([_lt]) }); ' +
  '} else if (_lt && _lt.status === "failed") { ' +
  'data && data.onDataChange && data.onDataChange(id, { isLoading: false, errorMsg: "Generation failed" }); ' +
  '} else { pollNodeStatus(_r.run_id); } }';

function useSyncResponse(src) {
  return src.replace(/pollNodeStatus\(response\.data\.run_id\);/g, SYNC_RESPONSE_SNIPPET);
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
    src = useSyncResponse(src);
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
