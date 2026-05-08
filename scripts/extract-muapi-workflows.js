#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'muapi-workflow-urls.txt';
const outputFile = process.argv[3] || 'muapi-workflows.discovered.json';

const inputPath = path.resolve(process.cwd(), inputFile);
const outputPath = path.resolve(process.cwd(), outputFile);

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split(/\r?\n/);
const urlRegex = /https:\/\/api\.muapi\.ai\/workflow\/([A-Za-z0-9_-]+)\/api-execute/gi;

const byId = new Map();

lines.forEach((line, index) => {
  let match;
  while ((match = urlRegex.exec(line)) !== null) {
    const workflowId = match[1];
    const nameGuess = line
      .replace(match[0], '')
      .replace(/^[-*\d.\s:|]+/, '')
      .trim();

    if (!byId.has(workflowId)) {
      byId.set(workflowId, {
        id: workflowId,
        name: nameGuess || null,
        sourceLine: index + 1,
        sourceText: line.trim() || null,
      });
    } else if (!byId.get(workflowId).name && nameGuess) {
      byId.get(workflowId).name = nameGuess;
    }
  }
});

const workflows = Array.from(byId.values());
const payload = {
  generatedAt: new Date().toISOString(),
  inputFile: path.basename(inputPath),
  totalDiscovered: workflows.length,
  workflows,
};

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
console.log(`Discovered ${workflows.length} workflow IDs -> ${outputPath}`);
