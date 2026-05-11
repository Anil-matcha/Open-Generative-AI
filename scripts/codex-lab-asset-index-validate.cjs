#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const labRoot = path.join(repoRoot, "experiments/codex-internal-multimodal-lab");
const defaultIndex = path.join(labRoot, "output/asset-index.json");
const defaultReport = path.join(labRoot, "output/asset-index-validation.md");

const scoreKeys = ["usability", "prompt_control", "visual_fit", "text_risk", "reuse"];
const knownStatuses = new Set(["accepted", "draft", "rejected", "needs-review"]);

function getArg(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return path.resolve(repoRoot, args[index + 1]);
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRelativeRepoPath(value) {
  return hasText(value) && !path.isAbsolute(value) && !value.split(/[\\/]/).includes("..");
}

function pushMissing(errors, scope, object, fields) {
  for (const field of fields) {
    if (!hasText(object[field])) {
      errors.push(`${scope}.${field} must be a non-empty string.`);
    }
  }
}

function validateAssetIndex(assetIndex) {
  const errors = [];
  const warnings = [];

  if (!isObject(assetIndex)) {
    return {
      errors: ["asset-index root must be an object."],
      warnings,
      assetCount: 0,
      typeCount: 0,
    };
  }

  if (!isObject(assetIndex.library)) {
    errors.push("library must be an object.");
  } else {
    pushMissing(errors, "library", assetIndex.library, [
      "name",
      "updated_at",
      "asset_root",
      "default_sort",
    ]);
    if (!Number.isInteger(assetIndex.library.version)) {
      errors.push("library.version must be an integer.");
    }
    if (!isObject(assetIndex.library.filters)) {
      errors.push("library.filters must be an object.");
    } else {
      for (const key of ["types", "statuses", "modes"]) {
        if (!Array.isArray(assetIndex.library.filters[key])) {
          errors.push(`library.filters.${key} must be an array.`);
        }
      }
    }
  }

  if (!Array.isArray(assetIndex.types) || assetIndex.types.length === 0) {
    errors.push("types must be a non-empty array.");
  }

  if (!Array.isArray(assetIndex.assets)) {
    errors.push("assets must be an array.");
  }

  const typeIds = new Set();
  for (const [index, type] of (assetIndex.types ?? []).entries()) {
    const scope = `types[${index}]`;
    if (!isObject(type)) {
      errors.push(`${scope} must be an object.`);
      continue;
    }
    pushMissing(errors, scope, type, ["id", "label", "description"]);
    if (hasText(type.id)) {
      if (typeIds.has(type.id)) {
        errors.push(`${scope}.id is duplicated: ${type.id}`);
      }
      typeIds.add(type.id);
    }
  }

  const filterTypes = new Set(assetIndex.library?.filters?.types ?? []);
  for (const typeId of typeIds) {
    if (!filterTypes.has(typeId)) {
      warnings.push(`type "${typeId}" is not listed in library.filters.types.`);
    }
  }

  const assetIds = new Set();
  const assetRoot = assetIndex.library?.asset_root;
  for (const [index, asset] of (assetIndex.assets ?? []).entries()) {
    const scope = `assets[${index}]`;
    if (!isObject(asset)) {
      errors.push(`${scope} must be an object.`);
      continue;
    }

    pushMissing(errors, scope, asset, [
      "id",
      "type",
      "filename",
      "purpose",
      "workspace_path",
      "candidate_path",
      "source_prompt_id",
      "source_prompt_file",
      "source_brief",
      "source_analysis",
      "imagegen_mode",
      "status",
      "created_at",
    ]);

    if (hasText(asset.id)) {
      if (assetIds.has(asset.id)) {
        errors.push(`${scope}.id is duplicated: ${asset.id}`);
      }
      assetIds.add(asset.id);
    }

    if (hasText(asset.type) && !typeIds.has(asset.type)) {
      errors.push(`${scope}.type "${asset.type}" is not declared in types.`);
    }

    if (hasText(asset.status) && !knownStatuses.has(asset.status)) {
      errors.push(`${scope}.status "${asset.status}" is not a known status.`);
    }

    if (hasText(asset.status) && !(assetIndex.library?.filters?.statuses ?? []).includes(asset.status)) {
      warnings.push(`${scope}.status "${asset.status}" is not listed in library.filters.statuses.`);
    }

    for (const field of [
      "workspace_path",
      "candidate_path",
      "source_prompt_file",
      "source_brief",
      "source_analysis",
    ]) {
      if (hasText(asset[field]) && !isRelativeRepoPath(asset[field])) {
        errors.push(`${scope}.${field} must be a safe relative repo path.`);
      }
    }

    if (hasText(assetRoot) && hasText(asset.workspace_path)) {
      const normalizedRoot = assetRoot.replace(/\\/g, "/").replace(/\/$/, "");
      if (!asset.workspace_path.replace(/\\/g, "/").startsWith(`${normalizedRoot}/`)) {
        errors.push(`${scope}.workspace_path must live under ${normalizedRoot}/.`);
      }
    }

    if (
      hasText(asset.filename) &&
      hasText(asset.workspace_path) &&
      path.basename(asset.workspace_path) !== asset.filename
    ) {
      errors.push(`${scope}.filename must match basename(workspace_path).`);
    }

    if (!isObject(asset.scores)) {
      errors.push(`${scope}.scores must be an object.`);
    } else {
      for (const scoreKey of scoreKeys) {
        const score = asset.scores[scoreKey];
        if (!Number.isFinite(score) || score < 0 || score > 100) {
          errors.push(`${scope}.scores.${scoreKey} must be a number from 0 to 100.`);
        }
      }
    }

    for (const field of ["tags", "usage"]) {
      if (!Array.isArray(asset[field]) || asset[field].some((item) => !hasText(item))) {
        errors.push(`${scope}.${field} must be an array of non-empty strings.`);
      }
    }
  }

  return {
    errors,
    warnings,
    assetCount: (assetIndex.assets ?? []).length,
    typeCount: (assetIndex.types ?? []).length,
  };
}

function buildReport(indexFile, result) {
  const lines = [
    "# Asset Index Schema Validation",
    "",
    `- Index: \`${toRepoPath(indexFile)}\``,
    `- Generated at: ${new Date().toISOString()}`,
    `- Assets: ${result.assetCount}`,
    `- Types: ${result.typeCount}`,
    `- Status: ${result.errors.length === 0 ? "pass" : "fail"}`,
    "",
    "## Errors",
    "",
    ...(result.errors.length > 0 ? result.errors.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Warnings",
    "",
    ...(result.warnings.length > 0 ? result.warnings.map((item) => `- ${item}`) : ["- None"]),
    "",
  ];
  return lines.join("\n");
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

  const result = validateAssetIndex(readJson(indexFile));

  if (writeReport) {
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    fs.writeFileSync(reportFile, buildReport(indexFile, result), "utf8");
  }

  for (const warning of result.warnings) {
    console.warn(`warning: ${warning}`);
  }

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`error: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const extra = writeReport ? `; report ${toRepoPath(reportFile)}` : "";
  console.log(`asset-index-schema-ok: ${result.assetCount} asset(s), ${result.typeCount} type(s)${extra}.`);
}

if (require.main === module) {
  runCli();
}

module.exports = {
  defaultIndex,
  labRoot,
  readJson,
  repoRoot,
  toRepoPath,
  validateAssetIndex,
};
