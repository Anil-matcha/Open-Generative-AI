import {
  i2iModels,
  i2vModels,
  t2iModels,
  t2vModels,
  v2vModels,
} from "./models.js";
import { getModelMediaCapabilities } from "./modelCapabilities.js";

const IMAGE_FAMILY_ALIASES = {
  "bytedance-seededit-v3": "bytedance-seedream-v3",
  "bytedance-seedream-edit-v4": "bytedance-seedream-v4",
  "bytedance-seedream-v4-edit": "bytedance-seedream-v4",
  "bytedance-seedream-v5.0": "seedream-5.0",
  "bytedance-seedream-v5.0-edit": "seedream-5.0",
  "seedream-5.0-edit": "seedream-5.0",
  "bytedance-seedream-5.0-pro": "seedream-5.0",
  "bytedance-seedream-5.0-pro-edit": "seedream-5.0",
  "google-imagen4-fast": "google-imagen4",
  "google-imagen4-ultra": "google-imagen4",
  "flux-2-klein-4b": "flux-2-klein",
  "flux-2-klein-9b": "flux-2-klein",
  "flux-2-klein-4b-turbo": "flux-2-klein",
  "flux-2-klein-9b-turbo": "flux-2-klein",
  "flux-2-klein-4b-text-to-image-lora": "flux-2-klein",
  "flux-2-klein-9b-text-to-image-lora": "flux-2-klein",
  "flux-2-klein-4b-edit": "flux-2-klein",
  "flux-2-klein-9b-edit": "flux-2-klein",
  "flux-2-klein-4b-turbo-edit": "flux-2-klein",
  "flux-2-klein-9b-turbo-edit": "flux-2-klein",
  "flux-2-klein-4b-edit-lora": "flux-2-klein",
  "flux-2-klein-9b-edit-lora": "flux-2-klein",
  "flux-dev-lora": "flux-dev",
  "flux-2-dev-edit": "flux-2-dev",
  "flux-2-flex-edit": "flux-2-flex",
  "flux-2-pro-edit": "flux-2-pro",
  "gpt-image-1.5-edit": "gpt-image-1.5",
  "gpt-image-2-edit": "gpt-image-2",
  "gpt4o-image-to-image": "gpt4o",
  "gpt4o-text-to-image": "gpt4o",
  "grok-imagine-image-to-image": "grok-imagine",
  "grok-imagine-text-to-image": "grok-imagine",
  "grok-imagine-text-to-image-quality": "grok-imagine",
  "ideogram-v3-reframe": "ideogram-v3",
  "ideogram-v3-t2i": "ideogram-v3",
  "kling-o1-edit-image": "kling-o1",
  "kling-o1-text-to-image": "kling-o1",
  "kling-o3-image": "kling-o3",
  "kling-o3-image-edit": "kling-o3",
  "midjourney-v7-image-to-image": "midjourney-v7-text-to-image",
  "midjourney-v7-omni-reference": "midjourney-v7",
  "midjourney-v7-style-reference": "midjourney-v7",
  "midjourney-v7-text-to-image": "midjourney-v7-text-to-image",
  "minimax-image-01-subject-reference": "minimax-image-01",
  "nano-banana-edit": "nano-banana",
  "nano-banana-2-edit": "nano-banana-2",
  "nano-banana-2-lite-edit": "nano-banana-2-lite",
  "nano-banana-effects": "nano-banana",
  "nano-banana-pro-edit": "nano-banana-pro",
  "qwen-image-edit": "qwen-image",
  "qwen-image-2.0-pro": "qwen-image-2.0",
  "qwen-image-2.0-edit": "qwen-image-2.0",
  "qwen-image-2.0-pro-edit": "qwen-image-2.0",
  "qwen-image-edit-plus": "qwen-plus",
  "qwen-image-edit-plus-lora": "qwen-plus",
  "qwen3-pro-text-to-image": "qwen3",
  "qwen3-pro-image-to-image": "qwen3",
  "reve-image-edit": "reve",
  "reve-text-to-image": "reve",
  "bytedance-seedream-v4.5-edit": "bytedance-seedream-v4.5",
  "vidu-q2-reference-to-image": "vidu-q2",
  "vidu-q2-text-to-image": "vidu-q2",
  "wan2.7-image-edit-pro": "wan2.7",
  "wan2.7-text-to-image-pro": "wan2.7",
};

const IMAGE_FAMILY_NAMES = {
  "flux-2-klein": "Flux 2 Klein",
  "flux-dev": "Flux Dev",
  gpt4o: "GPT-4o",
  "grok-imagine": "Grok Imagine",
  "google-imagen4": "Google Imagen 4",
  "kling-o3": "Kling O3",
  "seedream-5.0": "Seedream 5.0",
  "qwen-image-2.0": "Qwen Image 2.0",
  "qwen-plus": "Qwen Image Edit Plus",
  qwen3: "Qwen 3",
  "wan2.7": "Wan 2.7",
};

const VIDEO_FAMILY_ALIASES = {
  "ai-video-upscaler-pro": "ai-video-upscaler",
  "hunyuan-fast-text-to-video": "hunyuan",
  "hunyuan-image-to-video": "hunyuan",
  "hunyuan-text-to-video": "hunyuan",
  "video-effects": "ai-video-effects",
};

const VIDEO_FAMILY_NAMES = {
  "ai-video-upscaler": "AI Video Upscaler",
  hunyuan: "Hunyuan",
};

function videoVariantKey(model) {
  const endpoint = model.endpoint || model.id;
  const effectOptions = model.inputs?.name?.enum;
  return effectOptions?.length
    ? `${endpoint}\u0000${effectOptions.join("\u0000")}`
    : endpoint;
}

const PREFERRED_IMAGE_VARIANTS = {
  "flux-2-klein": {
    t2i: "flux-2-klein-4b",
    i2i: "flux-2-klein-4b-edit",
  },
  "flux-dev": { t2i: "flux-dev" },
  "google-imagen4": { t2i: "google-imagen4" },
  gpt4o: { i2i: "gpt4o-image-to-image" },
  "midjourney-v7": { i2i: "midjourney-v7-image-to-image" },
  "nano-banana": { i2i: "nano-banana-edit" },
  "qwen-image-2.0": {
    t2i: "qwen-image-2.0",
    i2i: "qwen-image-2.0-edit",
  },
  "qwen-plus": { i2i: "qwen-image-edit-plus" },
  qwen3: {
    t2i: "qwen3-text-to-image",
    i2i: "qwen3-image-to-image",
  },
  "seedream-5.0": {
    t2i: "bytedance-seedream-v5.0",
    i2i: "bytedance-seedream-v5.0-edit",
  },
  "wan2.7": {
    t2i: "wan2.7-text-to-image",
    i2i: "wan2.7-image-edit",
  },
};

const PREFERRED_VIDEO_VARIANTS = {
  "kling-v3": {
    t2v: "kling-v3.0-standard-text-to-video",
    i2v: "kling-v3.0-standard-image-to-video",
    v2v: "kling-v3.0-std-motion-control",
  },
};

function normalizeVersion(value) {
  return value.replace(/^v/i, "").replace(/\.0$/, "");
}

function imageFamilyId(model) {
  return (IMAGE_FAMILY_ALIASES[model.id] || model.id)
    .toLowerCase()
    .replace(/-(text-to-image|image-to-image|image-edit)(?=-|$)/g, "")
    .replace(/-(t2i|i2i)(?=-|$)/g, "")
    .replace(/-edit(?=-|$)/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

function videoFamilyId(model) {
  const modelId = model.id.toLowerCase();
  const id = VIDEO_FAMILY_ALIASES[modelId] || modelId;
  let match = id.match(/^kling-(v?\d+(?:\.\d+)?|o1)(?:-|$)/);
  if (match) return `kling-${match[1].toLowerCase() === "o1" ? "o1" : `v${normalizeVersion(match[1])}`}`;

  match = id.match(/^seedance-(v?\d+(?:\.\d+)?|lite|pro)(?:-|$)/);
  if (match) return `seedance-${normalizeVersion(match[1])}`;

  match = id.match(/^wan(\d+(?:\.\d+)?)(?:-|$)/);
  if (match) return `wan-${normalizeVersion(match[1])}`;

  match = id.match(/^veo-?(\d+(?:\.\d+)?)(?:-|$)/);
  if (match) return `veo-${normalizeVersion(match[1])}`;

  match = id.match(/^pixverse-v?(\d+(?:\.\d+)?)(?:-|$)/);
  if (match) return `pixverse-${normalizeVersion(match[1])}`;

  match = id.match(/^vidu-(v?\d+(?:\.\d+)?|q\d+)(?:-|$)/);
  if (match) return `vidu-${normalizeVersion(match[1])}`;

  match = id.match(/^ltx-(\d+(?:\.\d+)?)(?:-|$)/);
  if (match) return `ltx-${normalizeVersion(match[1])}`;

  match = id.match(/^happy-horse-(\d+(?:\.\d+)?)(?:-|$)/);
  if (match) return `happy-horse-${normalizeVersion(match[1])}`;

  match = id.match(/^minimax-hailuo-(\d+(?:\.\d+)?)(?:-|$)/);
  if (match) return `minimax-hailuo-${normalizeVersion(match[1])}`;

  if (id.startsWith("minimax-h3")) return "minimax-h3";
  if (id.startsWith("openai-sora-2")) return "sora-2";
  if (id.startsWith("grok-imagine")) return "grok-imagine-video";
  if (id.startsWith("gemini-omni")) return "gemini-omni";

  return id
    .replace(/-(text-to-video|image-to-video|reference-to-video)(?=-|$)/g, "")
    .replace(/-(t2v|i2v|v2v)(?=-|$)/g, "")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
}

function cleanImageFamilyName(name) {
  return name
    .replace(/\s+(Text To Image|Image To Image|Text to Image|Image to Image|T2I|I2I)$/i, "")
    .replace(/\s+Edit$/i, "")
    .trim();
}

function videoFamilyName(familyId, fallbackName) {
  const versionedNames = [
    [/^kling-v(.+)$/, "Kling v"],
    [/^seedance-(.+)$/, "Seedance "],
    [/^wan-(.+)$/, "Wan "],
    [/^veo-(.+)$/, "Veo "],
    [/^pixverse-(.+)$/, "Pixverse v"],
    [/^vidu-(.+)$/, "Vidu "],
    [/^ltx-(.+)$/, "LTX "],
    [/^happy-horse-(.+)$/, "Happy Horse "],
    [/^minimax-hailuo-(.+)$/, "Hailuo "],
  ];

  for (const [pattern, prefix] of versionedNames) {
    const match = familyId.match(pattern);
    if (match) return `${prefix}${match[1].replace(/^q/i, "Q")}`;
  }

  const names = {
    "gemini-omni": "Gemini Omni",
    "grok-imagine-video": "Grok Imagine",
    "kling-o1": "Kling O1",
    "minimax-h3": "MiniMax H3",
    "sora-2": "Sora 2",
  };
  return VIDEO_FAMILY_NAMES[familyId] || names[familyId] || fallbackName;
}

function videoSeriesVersion(family) {
  const match = family.id.match(
    /^(kling-v|seedance-|wan-|veo-|pixverse-|vidu-q|ltx-|happy-horse-|minimax-hailuo-)(\d+(?:\.\d+)?)/,
  );
  return match ? { series: match[1], version: Number(match[2]) } : null;
}

function imageSeriesVersion(family) {
  const patterns = [
    [/^gpt-image-(\d+(?:\.\d+)?)/, "gpt-image"],
    [/^hunyuan-image-(\d+(?:\.\d+)?)/, "hunyuan-image"],
    [/^midjourney-v(\d+(?:\.\d+)?)/, "midjourney"],
    [/^qwen-image-(\d+(?:\.\d+)?)/, "qwen-image"],
    [/^wan(\d+(?:\.\d+)?)/, "wan-image"],
    [/^(?:bytedance-)?seedream-v?(\d+(?:\.\d+)?)/, "seedream-image"],
  ];
  for (const [pattern, series] of patterns) {
    const match = family.id.match(pattern);
    if (match) return { series, version: Number(match[1]) };
  }
  return null;
}

function stripFamilyPrefix(name, family) {
  const patterns = {
    "grok-imagine-video": /^Grok Imagine\s*/i,
    "minimax-h3": /^MiniMax H3\s*/i,
    "sora-2": /^(?:Openai\s+)?Sora 2\s*/i,
  };
  if (patterns[family.id]) return name.replace(patterns[family.id], "");

  if (family.id === "kling-v3") return name.replace(/^Kling\s+v?3(?:\.0)?\s*/i, "");

  const versionPatterns = [
    [/^kling-v(.+)$/, (version) => new RegExp(`^Kling\\s+v?${version.replace(".", "\\.")}(?:\\.0)?\\s*`, "i")],
    [/^seedance-(.+)$/, (version) => new RegExp(`^Seedance\\s+v?${version.replace(".", "\\.")}(?:\\.0)?\\s*`, "i")],
    [/^wan-(.+)$/, (version) => new RegExp(`^Wan\\s*${version.replace(".", "\\.")}\\s*`, "i")],
    [/^veo-(.+)$/, (version) => new RegExp(`^Veo\\s*${version.replace(".", "\\.")}\\s*`, "i")],
    [/^pixverse-(.+)$/, (version) => new RegExp(`^Pixverse\\s+v?${version.replace(".", "\\.")}\\s*`, "i")],
    [/^vidu-(.+)$/, (version) => new RegExp(`^Vidu\\s+${version.replace(/^q/i, "Q").replace(".", "\\.")}\\s*`, "i")],
    [/^ltx-(.+)$/, (version) => new RegExp(`^LTX\\s+${version.replace(".", "\\.")}\\s*`, "i")],
    [/^happy-horse-(.+)$/, (version) => new RegExp(`^Happy Horse\\s+${version.replace(".", "\\.")}\\s*`, "i")],
    [/^minimax-hailuo-(.+)$/, (version) => new RegExp(`^(?:MiniMax\\s+)?Hailuo\\s+${version.replace(".", "\\.")}\\s*`, "i")],
  ];
  for (const [familyPattern, createNamePattern] of versionPatterns) {
    const match = family.id.match(familyPattern);
    if (match) return name.replace(createNamePattern(match[1]), "");
  }

  const escapedName = family.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return name.replace(new RegExp(`^${escapedName}\\s*`, "i"), "");
}

function buildCatalog(modeLists, config) {
  const sourceEntries = [];
  const familyParents = new Map();
  const endpointOwners = new Map();

  const findFamily = (id) => {
    let root = id;
    while (familyParents.get(root) !== root) root = familyParents.get(root);
    let current = id;
    while (familyParents.get(current) !== current) {
      const next = familyParents.get(current);
      familyParents.set(current, root);
      current = next;
    }
    return root;
  };

  const unionFamilies = (ownerId, duplicateId) => {
    const ownerRoot = findFamily(ownerId);
    const duplicateRoot = findFamily(duplicateId);
    if (ownerRoot !== duplicateRoot) familyParents.set(duplicateRoot, ownerRoot);
  };

  modeLists.forEach(({ mode, models }) => {
    const denominator = Math.max(models.length - 1, 1);
    models.forEach((model, index) => {
      const id = config.familyId(model);
      if (!familyParents.has(id)) familyParents.set(id, id);
      const endpoint = model.endpoint || model.id;
      const endpointOwner = endpointOwners.get(endpoint);
      if (endpointOwner) unionFamilies(endpointOwner, id);
      else endpointOwners.set(endpoint, id);
      sourceEntries.push({ model, mode, freshness: index / denominator, familyId: id });
    });
  });

  const familyMap = new Map();
  sourceEntries.forEach((entry) => {
      const id = findFamily(entry.familyId);
      entry.familyId = id;
      const { model, mode, freshness } = entry;
      const family = familyMap.get(id) || {
        id,
        name: "",
        provider: model.provider || "muapi",
        provider_name: model.provider_name || "Muapi",
        rawVariants: {},
        freshness: 0,
      };
      (family.rawVariants[mode] ||= []).push(entry);
      family.freshness = Math.max(family.freshness, freshness);
      familyMap.set(id, family);
  });

  const families = [...familyMap.values()].map((family) => {
    const preferredMode = config.namingModes.find((mode) => family.rawVariants[mode]?.length);
    const namingEntry = [...family.rawVariants[preferredMode]].sort(
      (a, b) => b.freshness - a.freshness,
    )[0];
    family.name = config.familyName(family.id, namingEntry.model.name);
    family.provider = namingEntry.model.provider || family.provider;
    family.provider_name = namingEntry.model.provider_name || family.provider_name;
    family.variants = {};
    family.supports = {};

    modeLists.forEach(({ mode }) => {
      const seenIds = new Set();
      const seenEndpoints = new Set();
      const variants = (family.rawVariants[mode] || [])
        .sort((a, b) => b.freshness - a.freshness)
        .filter(({ model }) => {
          if (seenIds.has(model.id)) return false;
          seenIds.add(model.id);
          const endpoint = config.variantKey?.(model) || model.endpoint || model.id;
          if (seenEndpoints.has(endpoint)) return false;
          seenEndpoints.add(endpoint);
          return true;
        })
        .map((entry) => ({ ...entry }));

      family.variants[mode] = variants;
      family.supports[mode] = variants.length > 0;
    });

    family.searchText = [
      family.id,
      family.name,
      ...Object.values(family.rawVariants).flatMap((variants) =>
        variants.flatMap(({ model }) => [model.id, model.name]),
      ),
    ]
      .join(" ")
      .toLowerCase();
    delete family.rawVariants;
    return family;
  });

  families.forEach((family) => {
    family.sortFreshness = family.freshness;
  });
  if (config.seriesVersion) {
    const seriesGroups = new Map();
    families.forEach((family) => {
      const versionInfo = config.seriesVersion(family);
      if (!versionInfo) return;
      let entries = seriesGroups.get(versionInfo.series);
      if (!entries) {
        entries = [];
        seriesGroups.set(versionInfo.series, entries);
      }
      entries.push({ family, version: versionInfo.version });
    });
    seriesGroups.forEach((entries) => {
      const freshnessSlots = entries
        .map(({ family }) => family.freshness)
        .sort((a, b) => b - a);
      entries
        .sort(
          (a, b) =>
            b.version - a.version || b.family.freshness - a.family.freshness,
        )
        .forEach(({ family }, index) => {
          family.sortFreshness = freshnessSlots[index];
        });
    });
  }
  families.sort(
    (a, b) => b.sortFreshness - a.sortFreshness || a.name.localeCompare(b.name),
  );

  const familyById = new Map(families.map((family) => [family.id, family]));
  const familyByVariantId = new Map();
  const variantById = new Map();
  families.forEach((family) => {
    Object.values(family.variants).forEach((variants) => {
      variants.forEach((variant) => {
        familyByVariantId.set(variant.model.id, family);
        variantById.set(variant.model.id, variant);
      });
    });
  });
  sourceEntries.forEach((entry) => {
    const family = familyById.get(entry.familyId);
    familyByVariantId.set(entry.model.id, family);
    if (!variantById.has(entry.model.id)) {
      variantById.set(entry.model.id, { ...entry });
    }
  });

  return {
    families,
    familyById,
    familyByVariantId,
    variantById,
    preferredVariants: config.preferredVariants || {},
  };
}

function getPickerEntryByVariantId(catalog, variantId) {
  return catalog === imageModelCatalog
    ? imageModelPickerEntryByVariantId.get(variantId)
    : videoModelPickerEntryByVariantId.get(variantId);
}

export function getFamilyVariant(catalog, familyOrId, mode, currentVariantId = null) {
  const family =
    typeof familyOrId === "string" ? catalog.familyById.get(familyOrId) : familyOrId;
  const variants = family?.variants[mode] || [];
  if (variants.length === 0) return null;

  const currentFamily = currentVariantId
    ? catalog.familyByVariantId.get(currentVariantId)
    : null;
  if (currentFamily?.id === family.id) {
    const currentVariant = catalog.variantById.get(currentVariantId);
    if (currentVariant?.mode === mode) return currentVariant;
    const currentEntry = getPickerEntryByVariantId(catalog, currentVariantId);
    return currentEntry?.variantsByMode[mode] || null;
  }

  const preferredId = catalog.preferredVariants[family.id]?.[mode];
  const preferred = preferredId ? catalog.variantById.get(preferredId) : null;
  if (preferred) return preferred;

  return variants[0];
}

export function getImageReferenceVariant(catalog, familyOrId, currentVariantId) {
  const family =
    typeof familyOrId === "string" ? catalog.familyById.get(familyOrId) : familyOrId;
  const currentVariant = catalog.variantById.get(currentVariantId);
  if (
    family &&
    catalog.familyByVariantId.get(currentVariantId)?.id === family.id &&
    getModelMediaCapabilities(currentVariant?.model).image.maxItems > 0
  ) {
    return currentVariant;
  }
  return getFamilyVariant(catalog, family, "i2i", currentVariantId);
}

export const imageModelCatalog = buildCatalog(
  [
    { mode: "t2i", models: t2iModels },
    { mode: "i2i", models: i2iModels },
  ],
  {
    familyId: imageFamilyId,
    familyName: (id, fallback) => IMAGE_FAMILY_NAMES[id] || cleanImageFamilyName(fallback),
    namingModes: ["t2i", "i2i"],
    preferredVariants: PREFERRED_IMAGE_VARIANTS,
    seriesVersion: imageSeriesVersion,
  },
);

export const videoModelCatalog = buildCatalog(
  [
    { mode: "t2v", models: t2vModels },
    { mode: "i2v", models: i2vModels },
    { mode: "v2v", models: v2vModels },
  ],
  {
    familyId: videoFamilyId,
    familyName: videoFamilyName,
    namingModes: ["t2v", "i2v", "v2v"],
    preferredVariants: PREFERRED_VIDEO_VARIANTS,
    seriesVersion: videoSeriesVersion,
    variantKey: videoVariantKey,
  },
);

const PICKER_INPUT_SUFFIX = /\s+(?:Text|Image)\s+To\s+(?:Image|Video)$/i;
const PICKER_INPUT_ID_SUFFIX = /-(?:text-to-image|image-to-image|text-to-video|image-to-video|reference-to-video|t2i|i2i|t2v|i2v|v2v)$/;
const PICKER_MEDIA_FIELDS = new Set([
  "image_url",
  "images_list",
  "image_urls",
  "reference_images",
  "start_image_url",
  "first_image_url",
  "last_image",
  "last_image_url",
  "end_image_url",
  "video_url",
  "videos_list",
  "video_urls",
  "reference_videos",
  "audio_url",
  "audios_list",
  "audio_urls",
  "reference_audios",
]);
const PICKER_SCHEMA_METADATA = new Set(["name", "title", "description", "examples"]);

function normalizePickerName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function pickerBaseName(model, isAlias) {
  const name = model.name.replace(PICKER_INPUT_SUFFIX, "").trim();
  return isAlias ? name.replace(/\s+Edit$/i, "").trim() : name;
}

function pickerDisplayName(model, family, isAlias) {
  const baseName = pickerBaseName(model, isAlias);
  const suffix = stripFamilyPrefix(baseName, family).trim();
  return suffix !== baseName
    ? (suffix ? `${family.name} ${suffix}` : family.name)
    : baseName;
}

function aliasProfile(modelId, alias) {
  const ignoredTokens = new Set([
    "bytedance",
    "edit",
    "image",
    "reference",
    "text",
    "to",
    "video",
    "t2i",
    "i2i",
    "t2v",
    "i2v",
    "v2v",
  ]);
  const tokens = (value) => value
    .toLowerCase()
    .replace(/\bv(?=\d)/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const aliasTokens = new Set(tokens(alias));
  return tokens(modelId)
    .filter((token) => !aliasTokens.has(token) && !ignoredTokens.has(token))
    .join("-");
}

function formatAliasProfile(profile) {
  const special = { lora: "LoRA" };
  return profile
    .split("-")
    .filter(Boolean)
    .map((token) => special[token] || (/^\d+b$/.test(token)
      ? token.toUpperCase()
      : token[0].toUpperCase() + token.slice(1)))
    .join(" ");
}

function normalizePickerSchema(value) {
  if (Array.isArray(value)) return value.map(normalizePickerSchema);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .filter((key) => !PICKER_SCHEMA_METADATA.has(key))
      .sort()
      .map((key) => [key, normalizePickerSchema(value[key])]),
  );
}

function pickerContractKey(model) {
  const inputs = Object.fromEntries(
    Object.entries(model.inputs || {})
      .filter(
        ([name, input]) =>
          !PICKER_MEDIA_FIELDS.has(name) &&
          !["image", "video", "audio"].includes(input?.field),
      )
      .map(([name, input]) => [name, normalizePickerSchema(input)]),
  );
  return JSON.stringify({
    hasPrompt: model.hasPrompt !== false,
    promptRequired: !!model.promptRequired,
    inputs: normalizePickerSchema(inputs),
  });
}

function pickerIdentity(model, aliases, aliasTargets) {
  const alias = aliases[model.id] || (aliasTargets.has(model.id) ? model.id : null);
  if (alias) {
    const profile = aliasProfile(model.id, alias);
    return { key: `alias:${alias}:${profile}`, profile };
  }

  const inputStem = model.id.toLowerCase().replace(PICKER_INPUT_ID_SUFFIX, "");
  if (inputStem !== model.id.toLowerCase()) {
    return { key: `input:${inputStem}:${pickerContractKey(model)}`, profile: null };
  }
  return { key: `model:${model.id}`, profile: null };
}

function buildModelPickerEntries(catalog, modes, aliases) {
  const entries = [];
  const aliasTargets = new Set(Object.values(aliases));

  for (const family of catalog.families) {
    const familyEntries = new Map();
    for (const mode of modes) {
      for (const variant of family.variants[mode] || []) {
        const identity = pickerIdentity(variant.model, aliases, aliasTargets);
        const isAlias = identity.key.startsWith("alias:");
        let entry = familyEntries.get(identity.key);
        if (!entry) {
          entry = {
            id: `${family.id}:${variant.model.id}`,
            family,
            name: isAlias
              ? [family.name, formatAliasProfile(identity.profile)].filter(Boolean).join(" ")
              : pickerDisplayName(variant.model, family, false),
            variantIds: new Set(),
            variantsByMode: {},
          };
          familyEntries.set(identity.key, entry);
        }
        entry.variantIds.add(variant.model.id);
        entry.variantsByMode[mode] ||= variant;
      }
    }

    const nameCounts = new Map();
    for (const entry of familyEntries.values()) {
      const key = normalizePickerName(entry.name);
      nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
    }

    for (const entry of familyEntries.values()) {
      entry.defaultVariant = modes
        .map((mode) => entry.variantsByMode[mode])
        .find(Boolean) || null;
      const duplicateName = nameCounts.get(normalizePickerName(entry.name)) > 1;
      if (duplicateName) {
        const entryModes = Object.keys(entry.variantsByMode);
        if (entryModes.length === 1 && ["i2i", "i2v"].includes(entryModes[0])) {
          entry.name = `${entry.name} Image`;
        } else if (entryModes.length === 1 && entryModes[0] === "v2v") {
          entry.name = `${entry.name} Video`;
        } else {
          entry.name = entry.defaultVariant.model.name;
        }
      }
      if (normalizePickerName(entry.name) === normalizePickerName(family.name)) {
        entry.name = family.name;
      }
      entry.searchText = `${family.searchText} ${entry.name}`.toLowerCase();
      entries.push(Object.freeze(entry));
    }
  }

  return Object.freeze(entries);
}

export const imageModelPickerEntries = buildModelPickerEntries(
  imageModelCatalog,
  ["t2i", "i2i"],
  IMAGE_FAMILY_ALIASES,
);

export const videoModelPickerEntries = buildModelPickerEntries(
  videoModelCatalog,
  ["t2v", "i2v", "v2v"],
  VIDEO_FAMILY_ALIASES,
);

function indexModelPickerEntries(entries, catalog) {
  const entryByVariantId = new Map();
  const entryByModeEndpoint = new Map();

  for (const entry of entries) {
    for (const variantId of entry.variantIds) {
      entryByVariantId.set(variantId, entry);
    }
    for (const [mode, variant] of Object.entries(entry.variantsByMode)) {
      const endpoint = variant.model.endpoint || variant.model.id;
      entryByModeEndpoint.set(`${mode}\u0000${endpoint}`, entry);
    }
  }

  for (const [variantId, variant] of catalog.variantById) {
    if (entryByVariantId.has(variantId)) continue;
    const endpoint = variant.model.endpoint || variant.model.id;
    const entry = entryByModeEndpoint.get(`${variant.mode}\u0000${endpoint}`);
    if (entry) entryByVariantId.set(variantId, entry);
  }
  return entryByVariantId;
}

export const imageModelPickerEntryByVariantId = indexModelPickerEntries(
  imageModelPickerEntries,
  imageModelCatalog,
);

export const videoModelPickerEntryByVariantId = indexModelPickerEntries(
  videoModelPickerEntries,
  videoModelCatalog,
);
