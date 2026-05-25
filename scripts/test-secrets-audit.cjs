const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const MAX_TEXT_FILE_BYTES = 20 * 1024 * 1024;
let asar = null;
try {
  asar = require("@electron/asar");
} catch {
  asar = null;
}

const ARTIFACT_ROOTS = [
  "dist",
  ".next/server",
  ".next/static",
  ".next/standalone",
  "release",
  "release-linux-docker",
  "output",
];

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".log",
  ".map",
  ".mjs",
  ".nsh",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next/cache",
]);

const GENERIC_SECRET_PATTERNS = [
  { name: "OpenAI-style API key", regex: /\bsk-[A-Za-z0-9][A-Za-z0-9_-]{20,}\b/g },
  { name: "Anthropic API key", regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
  { name: "OpenRouter API key", regex: /\bsk-or-v1-[A-Za-z0-9_-]{20,}\b/g },
  { name: "Hugging Face token", regex: /\bhf_[A-Za-z0-9]{20,}\b/g },
  { name: "GitHub token", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/g },
  { name: "GitHub fine-grained token", regex: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
];

function isExcludedDirectory(absPath) {
  const relative = path.relative(ROOT, absPath).replace(/\\/g, "/");
  return [...EXCLUDED_DIRS].some((excluded) => relative === excluded || relative.startsWith(`${excluded}/`));
}

function collectFiles(absPath, files = []) {
  if (!fs.existsSync(absPath) || isExcludedDirectory(absPath)) return files;

  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absPath)) {
      collectFiles(path.join(absPath, entry), files);
    }
    return files;
  }

  if (!stat.isFile()) return files;
  const ext = path.extname(absPath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext)) return files;
  if (stat.size > MAX_TEXT_FILE_BYTES) return files;
  files.push(absPath);
  return files;
}

function collectLogFiles(absPath, files = []) {
  if (!fs.existsSync(absPath) || isExcludedDirectory(absPath)) return files;

  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absPath)) {
      collectLogFiles(path.join(absPath, entry), files);
    }
    return files;
  }

  if (stat.isFile() && path.extname(absPath).toLowerCase() === ".log" && stat.size <= MAX_TEXT_FILE_BYTES) {
    files.push(absPath);
  }
  return files;
}

function collectAsarFiles(absPath, files = []) {
  if (!fs.existsSync(absPath) || isExcludedDirectory(absPath)) return files;

  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absPath)) {
      collectAsarFiles(path.join(absPath, entry), files);
    }
    return files;
  }

  if (stat.isFile() && path.extname(absPath).toLowerCase() === ".asar") {
    files.push(absPath);
  }
  return files;
}

function isProbablyText(buffer) {
  return !buffer.includes(0);
}

function redact(value) {
  if (!value) return "";
  if (value.length <= 10) return "[redacted]";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function collectEnvSecretPatterns() {
  const secretNamePattern = /(API[_-]?KEY|TOKEN|SECRET|PASSWORD|ACCESS[_-]?KEY|AUTH|BEARER)/i;
  const ignoredValuePattern = /^(true|false|null|undefined|none|changeme|example|placeholder)$/i;
  return Object.entries(process.env)
    .filter(([name, value]) => secretNamePattern.test(name) && typeof value === "string")
    .map(([name, value]) => [name, value.trim()])
    .filter(([, value]) => value.length >= 16 && !ignoredValuePattern.test(value))
    .map(([name, value]) => ({
      name: `Environment secret ${name}`,
      regex: new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    }));
}

function findPatternMatches(text, file, patterns) {
  const findings = [];
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    let match = pattern.regex.exec(text);
    while (match) {
      findings.push({
        file,
        pattern: pattern.name,
        sample: redact(match[0]),
      });
      match = pattern.regex.exec(text);
    }
  }
  return findings;
}

function findSecrets(files) {
  const patterns = [...GENERIC_SECRET_PATTERNS, ...collectEnvSecretPatterns()];
  const findings = [];

  for (const file of files) {
    const buffer = fs.readFileSync(file);
    if (!isProbablyText(buffer)) continue;

    const text = buffer.toString("utf8");
    findings.push(...findPatternMatches(text, path.relative(ROOT, file).replace(/\\/g, "/"), patterns));
  }

  return findings;
}

function findAsarSecrets(asarFiles) {
  if (!asar || asarFiles.length === 0) return [];

  const patterns = [...GENERIC_SECRET_PATTERNS, ...collectEnvSecretPatterns()];
  const findings = [];

  for (const archive of asarFiles) {
    const archiveName = path.relative(ROOT, archive).replace(/\\/g, "/");
    const entries = asar.listPackage(archive);
    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext)) continue;
      const asarEntry = entry.replace(/^[/\\]+/, "");

      const stat = asar.statFile(archive, asarEntry);
      if (stat.files || stat.link || stat.unpacked) continue;
      if (stat.size > MAX_TEXT_FILE_BYTES) continue;

      const buffer = asar.extractFile(archive, asarEntry);
      if (!isProbablyText(buffer)) continue;

      const entryName = `${archiveName}:${entry}`;
      findings.push(...findPatternMatches(buffer.toString("utf8"), entryName, patterns));
    }
  }

  return findings;
}

function main() {
  const artifactFiles = ARTIFACT_ROOTS.flatMap((relativeRoot) => collectFiles(path.join(ROOT, relativeRoot)));
  const logFiles = collectLogFiles(ROOT);
  const asarFiles = ARTIFACT_ROOTS.flatMap((relativeRoot) => collectAsarFiles(path.join(ROOT, relativeRoot)));
  const files = [...new Set([...artifactFiles, ...logFiles])];
  const findings = [...findSecrets(files), ...findAsarSecrets([...new Set(asarFiles)])];

  const result = {
    ok: findings.length === 0,
    scannedRoots: ARTIFACT_ROOTS.filter((relativeRoot) => fs.existsSync(path.join(ROOT, relativeRoot))),
    scannedFiles: files.length,
    scannedAsarFiles: asarFiles.length,
    findings,
  };

  console.log(JSON.stringify(result, null, 2));
  if (findings.length) {
    throw new Error(`Secret audit found ${findings.length} potential secret(s) in build artifacts or logs.`);
  }
}

main();
