#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const {
  defaultIndex,
  readJson,
  repoRoot,
  toRepoPath,
  validateAssetIndex,
} = require("./codex-lab-asset-index-validate.cjs");

const defaultReport = path.join(
  repoRoot,
  "experiments/codex-internal-multimodal-lab/output/asset-check-report.md"
);

function getArg(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return path.resolve(repoRoot, args[index + 1]);
}

function toAbs(repoPath) {
  return path.join(repoRoot, repoPath);
}

function readPngInfo(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.length < 24) {
    return { format: path.extname(filePath).replace(".", "") || "unknown" };
  }

  return {
    format: "png",
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readPromptIds(filePath) {
  if (!fs.existsSync(filePath)) {
    return new Set();
  }

  if (filePath.endsWith(".jsonl")) {
    const ids = fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line).id)
      .filter(Boolean);
    return new Set(ids);
  }

  if (filePath.endsWith(".json")) {
    const json = readJson(filePath);
    return new Set((json.imagegen_prompts ?? []).map((item) => item.id).filter(Boolean));
  }

  return new Set();
}

function checkAsset(asset) {
  const errors = [];
  const warnings = [];
  const finalPath = toAbs(asset.workspace_path);
  const candidatePath = toAbs(asset.candidate_path);
  const promptFile = toAbs(asset.source_prompt_file);
  const briefFile = toAbs(asset.source_brief);
  const analysisFile = toAbs(asset.source_analysis);

  const finalExists = fs.existsSync(finalPath);
  const candidateExists = fs.existsSync(candidatePath);
  const promptFileExists = fs.existsSync(promptFile);
  const briefExists = fs.existsSync(briefFile);
  const analysisExists = fs.existsSync(analysisFile);

  if (!finalExists) {
    errors.push("final asset missing");
  }
  if (!candidateExists) {
    warnings.push("candidate copy missing");
  }
  if (!promptFileExists) {
    errors.push("source prompt file missing");
  }
  if (!briefExists) {
    errors.push("source brief missing");
  }
  if (!analysisExists) {
    warnings.push("source analysis missing");
  }

  let imageInfo = { format: "missing", width: 0, height: 0 };
  let bytes = 0;
  if (finalExists) {
    const stat = fs.statSync(finalPath);
    bytes = stat.size;
    imageInfo = readPngInfo(finalPath);
    if (bytes <= 0) {
      errors.push("final asset is empty");
    }
    if (imageInfo.format === "png" && (!imageInfo.width || !imageInfo.height)) {
      errors.push("png dimensions could not be read");
    }
  }

  if (promptFileExists) {
    const promptIds = readPromptIds(promptFile);
    if (!promptIds.has(asset.source_prompt_id)) {
      errors.push(`source prompt id not found: ${asset.source_prompt_id}`);
    }
  }

  return {
    asset,
    bytes,
    candidateExists,
    errors,
    finalExists,
    imageInfo,
    promptFileExists,
    warnings,
  };
}

function buildReport(indexFile, checks, schemaResult) {
  const rows = checks
    .map((check) => {
      const size =
        check.imageInfo.width && check.imageInfo.height
          ? `${check.imageInfo.width}x${check.imageInfo.height}`
          : "-";
      const status = check.errors.length === 0 ? "pass" : "fail";
      return `| ${check.asset.id} | ${check.asset.type} | ${status} | ${size} | ${check.bytes} | ${check.asset.source_prompt_id} |`;
    })
    .join("\n");

  const issues = checks.flatMap((check) => [
    ...check.errors.map((item) => `- error ${check.asset.id}: ${item}`),
    ...check.warnings.map((item) => `- warning ${check.asset.id}: ${item}`),
  ]);

  return [
    "# Asset Check Report",
    "",
    `- Index: \`${toRepoPath(indexFile)}\``,
    `- Generated at: ${new Date().toISOString()}`,
    `- Schema errors: ${schemaResult.errors.length}`,
    `- Schema warnings: ${schemaResult.warnings.length}`,
    `- Asset errors: ${checks.reduce((sum, check) => sum + check.errors.length, 0)}`,
    `- Asset warnings: ${checks.reduce((sum, check) => sum + check.warnings.length, 0)}`,
    "",
    "## Assets",
    "",
    "| id | type | status | dimensions | bytes | prompt id |",
    "| --- | --- | --- | ---: | ---: | --- |",
    rows,
    "",
    "## Issues",
    "",
    ...(issues.length > 0 ? issues : ["- None"]),
    "",
  ].join("\n");
}

function runCli() {
  const args = process.argv.slice(2);
  const indexFile = getArg(args, "--index", defaultIndex);
  const reportFile = getArg(args, "--report", defaultReport);
  const writeReport = !args.includes("--no-report");

  if (!fs.existsSync(indexFile)) {
    console.error(`Asset index not found: ${toRepoPath(indexFile)}`);
    process.exitCode = 1;
    return;
  }

  const assetIndex = readJson(indexFile);
  const schemaResult = validateAssetIndex(assetIndex);
  const checks = (assetIndex.assets ?? []).map(checkAsset);
  const assetErrorCount = checks.reduce((sum, check) => sum + check.errors.length, 0);

  if (writeReport) {
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    fs.writeFileSync(reportFile, buildReport(indexFile, checks, schemaResult), "utf8");
  }

  for (const warning of schemaResult.warnings) {
    console.warn(`warning: ${warning}`);
  }
  for (const check of checks) {
    for (const warning of check.warnings) {
      console.warn(`warning: ${check.asset.id}: ${warning}`);
    }
    for (const error of check.errors) {
      console.error(`error: ${check.asset.id}: ${error}`);
    }
  }

  if (schemaResult.errors.length > 0 || assetErrorCount > 0) {
    for (const error of schemaResult.errors) {
      console.error(`error: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const extra = writeReport ? `; report ${toRepoPath(reportFile)}` : "";
  console.log(`asset-check-ok: ${checks.length} asset(s)${extra}.`);
}

runCli();
