#!/usr/bin/env node
// Patches workflow-builder node components to:
// 1. Convert setInterval polling into immediate call + interval (faster result display)
// 2. Reduce polling interval to 500ms
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'packages/Vibe-Workflow/packages/workflow-builder/src/components');
const targets = ['ImageNode', 'VideoNode', 'TextNode', 'AudioNode', 'ApiNode', 'VideoCombiner'];

let patched = 0;
for (const name of targets) {
  const file = path.join(dir, `${name}.jsx`);
  if (!fs.existsSync(file)) { console.log(`Skip (not found): ${name}.jsx`); continue; }

  let src = fs.readFileSync(file, 'utf8');
  const orig = src;

  // 1. Replace setInterval opening line
  src = src.replace(
    /const interval = setInterval\(\(\) => \{/g,
    'let interval; const _check = () => {'
  );

  // 2. Replace closing line: "    }, NNNN);\n  };"
  //    (end of setInterval callback + end of pollNodeStatus arrow fn)
  src = src.replace(
    /    \}, \d+\);\n  \};/g,
    '    }; _check(); interval = setInterval(_check, 500);\n  };'
  );

  if (src !== orig) {
    fs.writeFileSync(file, src, 'utf8');
    patched++;
    console.log(`Patched: ${name}.jsx`);
  } else {
    console.log(`No change: ${name}.jsx`);
  }
}
console.log(`patch-polling: ${patched}/${targets.length} files patched`);
