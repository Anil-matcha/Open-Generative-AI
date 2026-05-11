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

function buildAssetProfiles(baseFilename, baseAspectRatio, baseSize) {
  return {
    hero: {
      assetType: "hero",
      promptKey: "hero",
      filename: baseFilename || "concept-hero.png",
      useCase: "productivity-visual",
      assetTypePrompt: "web page hero concept image",
      purpose: "页面主视觉、工作流总览、实验文档封面",
      aspectRatio: baseAspectRatio || "16:9",
      recommendedSize: baseSize || "1536x864",
      composition: "wide landscape frame, left-to-right workflow path, strong focal point on the final asset preview",
    },
    character: {
      assetType: "character",
      promptKey: "agent",
      filename: "concept-character.png",
      useCase: "stylized-concept",
      assetTypePrompt: "square assistant concept portrait",
      purpose: "智能体头像、能力卡片、内部角色化表达",
      aspectRatio: "1:1",
      recommendedSize: "1024x1024",
      composition: "centered square portrait, strong silhouette, readable at thumbnail size, generous padding",
    },
    scene: {
      assetType: "scene",
      promptKey: "scene",
      filename: "concept-scene.png",
      useCase: "illustration-story",
      assetTypePrompt: "scene style frame",
      purpose: "场景风格板、分镜参考、创作流程说明",
      aspectRatio: "3:2",
      recommendedSize: "1536x1024",
      composition: "cinematic landscape-style frame, clear separation between input, reasoning, and output zones",
    },
  };
}

function getSelectedProfiles(assetType, profiles) {
  if (assetType === "all") {
    return [profiles.hero, profiles.character, profiles.scene];
  }

  if (!profiles[assetType]) {
    throw new Error(`Unsupported asset type "${assetType}". Use all, hero, character, or scene.`);
  }

  return [profiles[assetType]];
}

function buildPrimaryRequest(profile, goal) {
  if (profile.assetType === "character") {
    return `基于 brief 派生一个 Codex Lab 智能体概念头像，用于表达本地多模态分析与 Prompt 创作能力。原始目标：${goal}`;
  }

  if (profile.assetType === "scene") {
    return `基于 brief 派生一个本地多模态创作工作流的场景风格板，用于表达从素材输入到概念图资产输出的创作现场。原始目标：${goal}`;
  }

  return goal;
}

function buildSubject(profile, core) {
  if (profile.assetType === "character") {
    return "an abstract calm assistant presence made from analysis panes, image tiles, prompt cards, and subtle light geometry; avoid a literal robot or human face";
  }

  if (profile.assetType === "scene") {
    return "the transformation moment from screenshots and references into Chinese analysis notes, prompt cards, storyboard panels, and final concept assets";
  }

  return core["主体"] || "local AI multimodal workflow lab with image analysis reports, prompt cards, and concept assets";
}

function buildImagegenPrompt(profile, context) {
  const primaryRequest = buildPrimaryRequest(profile, context.goal);
  const subject = buildSubject(profile, context.core);

  return [
    `Use case: ${profile.useCase}`,
    `Asset type: ${profile.assetTypePrompt}`,
    `Primary request: ${primaryRequest}`,
    `Subject: ${subject}`,
    context.core["场景"] ? `Scene/backdrop: ${context.core["场景"]}` : "",
    "Style/medium: polished product concept art for an internal AI workflow lab, not an actual UI screenshot.",
    `Composition/framing: ${profile.composition}`,
    context.core["情绪"] ? `Lighting/mood: ${context.core["情绪"]}` : "",
    context.style["色彩倾向"] ? `Color palette: ${context.style["色彩倾向"]}` : "",
    context.style["参考素材路径"] ? `Reference input: ${context.style["参考素材路径"]}` : "",
    `Constraints: ${context.negativeEn}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const briefFile = getArg("--brief", defaultBrief);
const analysisFile = getArg("--analysis", defaultAnalysis);
const outFile = getArg("--out", defaultOut);
const imagegenOutFile = getArg("--imagegen-out", defaultImagegenOut);
const assetTypeArg = getRawArg("--asset-type", "all");
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
const profiles = buildAssetProfiles(filename, aspectRatio, recommendedSize);
let selectedProfiles;

try {
  selectedProfiles = getSelectedProfiles(assetTypeArg, profiles);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
  return;
}

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

const imagegenPrompts = selectedProfiles.map((profile) => {
  const target = `public/assets/codex-lab/${profile.filename}`;
  return {
    id: `codex-lab-${profile.promptKey}`,
    asset_type: profile.assetType,
    target,
    use_case: profile.useCase,
    prompt: buildImagegenPrompt(profile, { core, goal, negativeEn, style }),
  };
});

const assetPlan = selectedProfiles.map((profile) => ({
  filename: profile.filename,
  candidate_path: `experiments/codex-internal-multimodal-lab/output/generated-assets/${profile.filename}`,
  final_path: `public/assets/codex-lab/${profile.filename}`,
  source_prompt_id: `codex-lab-${profile.promptKey}`,
  asset_type: profile.assetType,
  status: "draft",
}));

const aspectRatios = Object.fromEntries(
  selectedProfiles.map((profile) => [profile.assetType, profile.aspectRatio])
);
const recommendedSizes = Object.fromEntries(
  selectedProfiles.map((profile) => [profile.assetType, profile.recommendedSize])
);

const promptPack = {
  meta: {
    name: `codex-lab-${assetTypeArg}-concept-pack`,
    language: "zh-CN",
    created_at: new Date().toISOString().slice(0, 10),
    generator: "scripts/codex-lab-prompt-pack-draft.cjs",
    reasoning_workflow: "Codex GPT-5.5 xhigh handoff draft",
    image_model_path: "Codex imagegen built-in",
    runtime_api_integration: false,
    asset_type: assetTypeArg,
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
    en_scaffold: imagegenPrompts.map((item) => item.prompt).join("\n\n---\n\n"),
    negative,
    negative_en: negativeEn,
    analysis_prompt_clues: analysisClues,
  },
  asset_variants: selectedProfiles.map((profile) => ({
    asset_type: profile.assetType,
    prompt_id: `codex-lab-${profile.promptKey}`,
    filename: profile.filename,
    purpose: profile.purpose,
    aspect_ratio: profile.aspectRatio,
    recommended_size: profile.recommendedSize,
  })),
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
    recommended_aspect_ratio:
      selectedProfiles.length === 1 ? selectedProfiles[0].aspectRatio : "mixed",
    recommended_aspect_ratios: aspectRatios,
    recommended_size:
      selectedProfiles.length === 1 ? selectedProfiles[0].recommendedSize : "mixed",
    recommended_sizes: recommendedSizes,
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
  imagegen_prompts: imagegenPrompts,
  asset_plan: assetPlan,
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
