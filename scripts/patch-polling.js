#!/usr/bin/env node
// Patches workflow-builder node components to:
// 1. Convert setInterval polling into immediate call + interval (faster result display)
// 2. Reduce polling interval to 500ms
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'packages/Vibe-Workflow/packages/workflow-builder/src/components');
// Node component files: each has exactly ONE setInterval (pollNodeStatus)
const nodeTargets = ['ImageNode', 'VideoNode', 'TextNode', 'AudioNode', 'ApiNode', 'VideoCombiner'];
// NodeFlow has multiple setIntervals — patch only pollRunIdStatus by targeting its unique context
const nodeFlowFile = path.join(dir, 'NodeFlow.jsx');

let patched = 0;
const total = nodeTargets.length + 1;

for (const name of nodeTargets) {
  const file = path.join(dir, `${name}.jsx`);
  if (!fs.existsSync(file)) { console.log(`Skip (not found): ${name}.jsx`); continue; }

  let src = fs.readFileSync(file, 'utf8');
  const orig = src;

  src = src.replace(
    /const interval = setInterval\(\(\) => \{/g,
    'let interval; const _check = () => {'
  );
  src = src.replace(
    /    \}, \d+\);\n  \};/g,
    '    }; _check(); interval = setInterval(_check, 500);\n  };'
  );

  if (src !== orig) { fs.writeFileSync(file, src, 'utf8'); patched++; console.log(`Patched: ${name}.jsx`); }
  else { console.log(`No change: ${name}.jsx`); }
}

// NodeFlow: targeted replacement — only pollRunIdStatus (closing identified by handleRunWorkflow following it)
if (fs.existsSync(nodeFlowFile)) {
  let src = fs.readFileSync(nodeFlowFile, 'utf8');
  const orig = src;

  // Target only the pollRunIdStatus opening (not pollArchitectStatus which uses async () =>)
  src = src.replace(
    /const pollRunIdStatus = \(runId\) => \{\n    const interval = setInterval\(\(\) => \{/,
    'const pollRunIdStatus = (runId) => {\n    let interval; const _check = () => {'
  );
  // Target only the closing that is immediately followed by handleRunWorkflow
  src = src.replace(
    /    \}, \d+\);\n  \};\n\n  const handleRunWorkflow/,
    '    }; _check(); interval = setInterval(_check, 500);\n  };\n\n  const handleRunWorkflow'
  );

  if (src !== orig) { fs.writeFileSync(nodeFlowFile, src, 'utf8'); patched++; console.log('Patched: NodeFlow.jsx'); }
  else { console.log('No change: NodeFlow.jsx'); }
}

console.log(`patch-polling: ${patched}/${total} files patched`);
