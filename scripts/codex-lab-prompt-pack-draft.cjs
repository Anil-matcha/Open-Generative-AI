#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const labRoot = path.join(repoRoot, "experiments/codex-internal-multimodal-lab");
const defaultBrief = path.join(labRoot, "input/brief.md");
const defaultAnalysis = path.join(labRoot, "output/analysis.md");
const defaultOut = path.join(labRoot, "output/prompt-pack-draft.json");
const defaultImagegenOut = path.join(labRoot, "output/imagegen-prompts-draft.jsonl");

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1 || index === args.length - 1) {
    return fallback;
  }
  return path.resolve(repoRoot, args[index + 1]);
}

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function stripInlineCode(value) {
  return value.replace(/`([^`]+)`/g, "$1").trim();
}

function splitList(value) {
  return stripInlineCode(value)
    .split(/[、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSections(markdown) {
  const sections = { root: [] };
  let current = "root";

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = [];
      continue;
    }

    sections[current].push(line);
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, lines]) => [key, lines.join("\n").trim()])
  );
}

function parseKeyedBullets(section) {
  const values = {};

  for (const line of section.split(/\r?\n/)) {
    const match = line.match(/^\s*-\s*([^：:]+)[：:]\s*(.+?)\s*$/);
    if (!match) {
      continue;
    }

    values[match[1].trim()] = stripInlineCode(match[2]);
  }

  return values;
}

function firstParagraph(section) {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("-"))
    .join(" ")
    .trim();
}

function slugify(value, fallback) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function boolFromZh(value) {
  if (!value) {
    return false;
  }

  return /^(是|true|yes|需要)$/i.test(value.trim());
}

function cleanSize(value) {
  const match = value.match(/\d+\s*x\s*\d+/i);
  return match ? match[0].replace(/\s+/g, "") : value;
}

function normalizeNegative(value) {
  const source = splitList(value);
  const rules = [
    [/外部.*api.*logo|external.*api.*logo/i, "no external API logos"],
    [/随机品牌|brand/i, "no random brand marks"],
    [/乱码|错误文字|fake.*text|gibberish/i, "no readable fake UI text"],
    [/水印|watermark/i, "no watermark"],
    [/过度科幻|sci-fi/i, "no sci-fi overload"],
    [/杂乱|clutter/i, "no messy clutter"],
  ];
  const normalized = new Set();

  for (const item of source) {
    const rule = rules.find(([pattern]) => pattern.test(item));
    normalized.add(rule ? rule[1] : `avoid ${item}`);
  }

  return Array.from(normalized).join(", ");
}

function extractPromptClues(analysisText) {
  const marker = "## 六、下游 Prompt 线索";
  const index = analysisText.indexOf(marker);
  if (index === -1) {
    return "";
  }

  return analysisText.slice(index + marker.length).trim();
}

const briefFile = getArg("--brief", defaultBrief);
const analysisFile = getArg("--analysis", defaultAnalysis);
const outFile = getArg("--out", defaultOut);
const imagegenOutFile = getArg("--imagegen-out", defaultImagegenOut);
const writeImagegenOut = !args.includes("--no-imagegen-out");

if (!fs.existsSync(briefFile)) {
  console.error(`Brief not found: ${toRepoPath(briefFile)}`);
  process.exitCode = 1;
  return;
}

const briefText = fs.readFileSync(briefFile, "utf8");
const sections = parseSections(briefText);
const usage = parseKeyedBullets(sections["使用场景"] ?? "");
const core = parseKeyedBullets(sections["核心画面"] ?? "");
const style = parseKeyedBullets(sections["风格方向"] ?? "");
const spec = parseKeyedBullets(sections["输出规格"] ?? "");

const goal = firstParagraph(sections["目标"] ?? "") || "生成一组可用于项目测试的概念资产。";
const notes = firstParagraph(sections["备注"] ?? "");
const filename = spec["资产文件名"] || "concept-draft.png";
const assetName = path.basename(filename, path.extname(filename));
const assetKey = slugify(assetName.replace(/^concept[-_]/i, ""), "asset");
const promptId = `codex-lab-${assetKey}`;
const finalPath = `public/assets/codex-lab/${filename}`;
const candidatePath = `experiments/codex-internal-multimodal-lab/output/generated-assets/${filename}`;
const aspectRatio = spec["画幅"] || "16:9";
const recommendedSizeRaw = spec["建议尺寸"] || "1536x864";
const recommendedSize = cleanSize(recommendedSizeRaw);
const audience = splitList(usage["目标用户"] || "");
const assetUsage = splitList(usage["最终资产用途"] || "");
const negative = core["必须避免"] || "外部品牌、错误文字、水印、杂乱构图";
const negativeEn = normalizeNegative(negative);
const analysisExists = fs.existsSync(analysisFile);
const analysisClues = analysisExists
  ? extractPromptClues(fs.readFileSync(analysisFile, "utf8"))
  : "";

const zhPrompt = [
  goal,
  core["主体"] ? `主体：${core["主体"]}` : "",
  core["场景"] ? `场景：${core["场景"]}` : "",
  core["情绪"] ? `情绪：${core["情绪"]}` : "",
  core["必须出现"] ? `必须出现：${core["必须出现"]}` : "",
  style["风格关键词"] ? `风格关键词：${style["风格关键词"]}` : "",
  style["色彩倾向"] ? `色彩：${style["色彩倾向"]}` : "",
  style["构图偏好"] ? `构图：${style["构图偏好"]}` : "",
  notes,
]
  .filter(Boolean)
  .join(" ");

const imagegenPrompt = [
  "Use case: productivity-visual",
  `Asset type: ${aspectRatio} project concept image`,
  `Primary request: ${goal}`,
  core["主体"] ? `Subject: ${core["主体"]}` : "",
  core["场景"] ? `Scene/backdrop: ${core["场景"]}` : "",
  "Style/medium: polished product concept art for an internal AI workflow lab, not an actual UI screenshot.",
  style["构图偏好"] ? `Composition/framing: ${style["构图偏好"]}` : `Composition/framing: ${aspectRatio} frame with clear hierarchy.`,
  core["情绪"] ? `Lighting/mood: ${core["情绪"]}` : "",
  style["色彩倾向"] ? `Color palette: ${style["色彩倾向"]}` : "",
  style["参考素材路径"] ? `Reference input: ${style["参考素材路径"]}` : "",
  `Constraints: ${negativeEn}`,
]
  .filter(Boolean)
  .join("\n");

const promptPack = {
  meta: {
    name: `codex-lab-${slugify(assetName, "concept-pack")}`,
    language: "zh-CN",
    created_at: new Date().toISOString().slice(0, 10),
    generator: "scripts/codex-lab-prompt-pack-draft.cjs",
    reasoning_workflow: "Codex GPT-5.5 xhigh handoff draft",
    image_model_path: "Codex imagegen built-in",
    runtime_api_integration: false,
    source_brief: toRepoPath(briefFile),
    source_analysis: analysisExists ? toRepoPath(analysisFile) : null,
  },
  brief: {
    goal,
    page_or_module: usage["页面或模块"] || "",
    audience,
    asset_usage: assetUsage,
    reference_material: style["参考素材路径"] || "",
    notes,
  },
  structured_prompt: {
    zh: zhPrompt,
    en_scaffold: imagegenPrompt,
    negative,
    negative_en: negativeEn,
    analysis_prompt_clues: analysisClues,
  },
  shot_list: [
    {
      id: "input",
      purpose: "表现图片/截图或参考素材输入",
      framing: "left-side source image or local folder area",
      visual_notes: "use abstract thumbnails and file shapes; avoid readable fake filenames",
    },
    {
      id: "reasoning",
      purpose: "表现中文分析报告、Prompt 卡片和结构化推理",
      framing: "center report and prompt-card area",
      visual_notes: "use clear blocks, icons, and short placeholder labels instead of generated text",
    },
    {
      id: "asset",
      purpose: "表现 imagegen 概念图输出和项目资产落点",
      framing: "right-side final concept image board",
      visual_notes: "make the accepted asset preview the strongest focal point",
    },
  ],
  parameters: {
    recommended_aspect_ratio: aspectRatio,
    recommended_size: recommendedSize,
    recommended_size_note: recommendedSizeRaw,
    transparent_background: boolFromZh(spec["是否需要透明背景"]),
    quality: "high",
    iteration_count: 1,
    acceptance_checks: [
      "能看出输入、分析、Prompt、输出之间的关系",
      "主体和用途与 brief 一致",
      "没有外部服务标识、随机品牌或水印",
      "没有把错误文字当成关键信息",
      "可追溯到 source_brief 和 source_prompt_id",
    ],
  },
  imagegen_prompts: [
    {
      id: promptId,
      target: finalPath,
      use_case: "productivity-visual",
      prompt: imagegenPrompt,
    },
  ],
  asset_plan: [
    {
      filename,
      candidate_path: candidatePath,
      final_path: finalPath,
      source_prompt_id: promptId,
      status: "draft",
    },
  ],
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `${JSON.stringify(promptPack, null, 2)}\n`, "utf8");

if (writeImagegenOut) {
  const jsonl = promptPack.imagegen_prompts
    .map((item) => JSON.stringify(item))
    .join("\n");
  fs.mkdirSync(path.dirname(imagegenOutFile), { recursive: true });
  fs.writeFileSync(imagegenOutFile, `${jsonl}\n`, "utf8");
}

const extra = writeImagegenOut ? ` and ${toRepoPath(imagegenOutFile)}` : "";
console.log(`Wrote ${toRepoPath(outFile)}${extra}.`);
