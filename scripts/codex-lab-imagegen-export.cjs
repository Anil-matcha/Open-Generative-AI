#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const labRoot = path.join(repoRoot, "experiments/codex-internal-multimodal-lab");
const defaultPromptPack = path.join(labRoot, "output/prompt-pack-draft.json");
const defaultOut = path.join(labRoot, "output/imagegen-prompts-batch.jsonl");

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return path.resolve(repoRoot, args[index + 1]);
}

function getRawArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return args[index + 1];
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

const promptPackFile = getArg("--prompt-pack", defaultPromptPack);
const outFile = getArg("--out", defaultOut);
const assetType = getRawArg("--asset-type", "all");

if (!fs.existsSync(promptPackFile)) {
  console.error(`Prompt pack not found: ${toRepoPath(promptPackFile)}`);
  process.exitCode = 1;
  return;
}

const promptPack = JSON.parse(fs.readFileSync(promptPackFile, "utf8"));
let prompts = promptPack.imagegen_prompts ?? [];

if (!Array.isArray(prompts) || prompts.length === 0) {
  console.error("promptPack.imagegen_prompts must be a non-empty array.");
  process.exitCode = 1;
  return;
}

if (assetType !== "all") {
  prompts = prompts.filter((prompt) => prompt.asset_type === assetType);
}

if (prompts.length === 0) {
  console.error(`No imagegen prompts matched asset type: ${assetType}`);
  process.exitCode = 1;
  return;
}

for (const [index, prompt] of prompts.entries()) {
  for (const field of ["id", "target", "use_case", "prompt"]) {
    if (typeof prompt[field] !== "string" || prompt[field].trim().length === 0) {
      console.error(`imagegen_prompts[${index}].${field} must be a non-empty string.`);
      process.exitCode = 1;
      return;
    }
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${prompts.map((prompt) => JSON.stringify(prompt)).join("\n")}\n`, "utf8");

console.log(`imagegen-export-ok: wrote ${toRepoPath(outFile)} from ${prompts.length} prompt(s).`);
