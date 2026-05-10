#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const defaultInput = path.join(
  repoRoot,
  "experiments/codex-internal-multimodal-lab/input/screenshots"
);
const defaultOut = path.join(
  repoRoot,
  "experiments/codex-internal-multimodal-lab/output/analysis-draft.md"
);

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return path.resolve(repoRoot, args[index + 1]);
}

const inputDir = getArg("--input", defaultInput);
const outFile = getArg("--out", defaultOut);
const titleIndex = args.indexOf("--title");
const title =
  titleIndex !== -1 && titleIndex < args.length - 1
    ? args[titleIndex + 1]
    : "新截图分析草稿";

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    if (!imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      return [];
    }
    return [fullPath];
  });
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

const images = walk(inputDir)
  .map((filePath) => {
    const stat = fs.statSync(filePath);
    return {
      filePath,
      repoPath: toRepoPath(filePath),
      bytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
    };
  })
  .sort((a, b) => a.repoPath.localeCompare(b.repoPath));

if (images.length === 0) {
  console.error(`No screenshots found in ${toRepoPath(inputDir)}`);
  process.exitCode = 1;
  return;
}

const generatedAt = new Date().toISOString();
const imageList = images
  .map(
    (image, index) =>
      `${index + 1}. \`${image.repoPath}\` (${image.bytes} bytes, updated ${image.updatedAt})`
  )
  .join("\n");

const promptList = images
  .map(
    (image, index) =>
      `- 图 ${index + 1}：请查看 \`${image.repoPath}\`，补充主体、场景、关键文字、构图、风险和下游 Prompt 线索。`
  )
  .join("\n");

const markdown = `# ${title}

## 基本信息

- 草稿生成时间：${generatedAt}
- 输入目录：\`${toRepoPath(inputDir)}\`
- 输出文件：\`${toRepoPath(outFile)}\`
- 工作流设定：本脚本只生成结构化草稿，不调用外部 API，不替代 Codex 多模态观察。

## 待分析截图

${imageList}

## Codex 分析提示

${promptList}

## 一、画面事实

- 主体：
- 场景：
- 明显文字：
- 关键元素：
- 视觉状态：

## 二、构图与层级

- 视线入口：
- 信息层级：
- 留白与拥挤点：
- 画幅适配风险：

## 三、风格提取

- 风格关键词：
- 色彩：
- 光影：
- 材质：
- 可复用 Prompt 片段：

## 四、问题与风险

- 可读性问题：
- 品牌一致性问题：
- 生成图误差风险：
- 需要人工确认的信息：

## 五、可执行建议

1.
2.
3.

## 六、下游 Prompt 线索

\`\`\`text
主体：
场景：
风格：
构图：
避免：
\`\`\`
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, markdown, "utf8");
console.log(`Wrote ${toRepoPath(outFile)} from ${images.length} screenshot(s).`);
