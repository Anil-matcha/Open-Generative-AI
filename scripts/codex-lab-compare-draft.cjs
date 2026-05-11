#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const labRoot = path.join(repoRoot, "experiments/codex-internal-multimodal-lab");
const defaultAssetIndex = path.join(labRoot, "output/asset-index.json");
const defaultOut = path.join(labRoot, "output/multi-image-comparison-draft.md");

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return path.resolve(repoRoot, args[index + 1]);
}

function getNumberArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  const value = Number(args[index + 1]);
  return Number.isFinite(value) ? value : fallback;
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function formatScore(scores, key) {
  return scores && Number.isFinite(scores[key]) ? String(scores[key]) : "-";
}

const assetIndexFile = getArg("--asset-index", defaultAssetIndex);
const outFile = getArg("--out", defaultOut);
const minAssets = getNumberArg("--min-assets", 2);
const acceptedOnly = !args.includes("--all-statuses");

if (!fs.existsSync(assetIndexFile)) {
  console.error(`Asset index not found: ${toRepoPath(assetIndexFile)}`);
  process.exitCode = 1;
  return;
}

const assetIndex = readJson(assetIndexFile);
const typeLabels = Object.fromEntries(
  (assetIndex.types ?? []).map((type) => [type.id, type.label])
);

const allAssets = (assetIndex.assets ?? []).map((asset) => {
  const workspacePath = path.join(repoRoot, asset.workspace_path);
  const exists = fs.existsSync(workspacePath);
  const stat = exists ? fs.statSync(workspacePath) : null;

  return {
    ...asset,
    typeLabel: typeLabels[asset.type] ?? asset.type,
    workspacePath,
    exists,
    bytes: stat?.size ?? 0,
    updatedAt: stat?.mtime?.toISOString() ?? "",
  };
});

const assets = allAssets
  .filter((asset) => (acceptedOnly ? asset.status === "accepted" : true))
  .sort((a, b) => (b.scores?.usability ?? 0) - (a.scores?.usability ?? 0));

if (assets.length < minAssets) {
  console.error(
    `Need at least ${minAssets} assets for comparison, found ${assets.length}.`
  );
  process.exitCode = 1;
  return;
}

const missingAssets = assets.filter((asset) => !asset.exists);
if (missingAssets.length > 0) {
  console.error(
    `Missing asset files: ${missingAssets
      .map((asset) => asset.workspace_path)
      .join(", ")}`
  );
  process.exitCode = 1;
  return;
}

const generatedAt = new Date().toISOString();
const assetTable = assets
  .map(
    (asset) =>
      `| ${asset.id} | ${asset.typeLabel} | \`${asset.workspace_path}\` | ${formatScore(
        asset.scores,
        "usability"
      )} | ${formatScore(asset.scores, "prompt_control")} | ${formatScore(
        asset.scores,
        "visual_fit"
      )} | ${formatScore(asset.scores, "text_risk")} | ${asset.bytes} |`
  )
  .join("\n");

const codexPrompts = assets
  .map(
    (asset, index) =>
      `${index + 1}. 查看 \`${asset.workspace_path}\`，记录它的主体、构图、色彩、文本风险、最适合的页面位置和可复用 Prompt 词。`
  )
  .join("\n");

const pairRows = [];
for (let i = 0; i < assets.length; i += 1) {
  for (let j = i + 1; j < assets.length; j += 1) {
    pairRows.push(
      `| ${assets[i].filename} vs ${assets[j].filename} |  |  |  |`
    );
  }
}

const markdown = `# 多图对比分析草稿

## 基本信息

- 草稿生成时间：${generatedAt}
- 资产索引：\`${toRepoPath(assetIndexFile)}\`
- 输出文件：\`${toRepoPath(outFile)}\`
- 资产范围：${acceptedOnly ? "accepted assets only" : "all statuses"}
- 工作流设定：本脚本只生成多图对比草稿，不调用外部 API，不替代 Codex 多模态观察。

## 待对比资产

| id | 类型 | 路径 | 可用性 | Prompt 控制 | 视觉贴合 | 文本风险 | bytes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
${assetTable}

## Codex 多图观察提示

${codexPrompts}

## 一、整体一致性

- 共同风格基因：
- 共同色彩与材质：
- 共同叙事方向：
- 系列感是否成立：

## 二、单图分工

| 资产 | 最适合用途 | 最强视觉点 | 主要风险 | 建议使用位置 |
| --- | --- | --- | --- | --- |
${assets.map((asset) => `| ${asset.filename} |  |  |  |  |`).join("\n")}

## 三、两两差异矩阵

| 对比组 | 相同点 | 差异点 | 是否需要重生成 |
| --- | --- | --- | --- |
${pairRows.join("\n")}

## 四、可复用风格规则

1.
2.
3.

## 五、下游 Prompt 线索

\`\`\`text
主体：
场景：
风格：
构图：
颜色：
避免：
\`\`\`

## 六、结论

- 可直接复用资产：
- 需要裁切或二次生成资产：
- 下一轮最值得测试的变体：
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, markdown, "utf8");
console.log(`Wrote ${toRepoPath(outFile)} from ${assets.length} asset(s).`);
