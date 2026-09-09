import { i2vModels, t2vModels, v2vModels } from "./models.js";

// Endpoint coordinates are separate from ordinary generation parameters for
// routes whose schema has no native resolution input.
const FACETS = Object.freeze(["profile", "speed", "resolution"]);
const modelIds = new Set(
  [...t2vModels, ...i2vModels, ...v2vModels].map((model) => model.id),
);
const configurations = new Map();

export const SEEDANCE_FAMILY_NAMES = Object.freeze({
  "seedance-2.5": "Seedance 2.5",
  "seedance-2": "Seedance 2.0",
  "seedance-1.5": "Seedance 1.5 Pro",
  "seedance-pro": "Seedance 1.0 Pro",
  "seedance-lite": "Seedance 1.0 Lite",
});

const PROFILE_OPTIONS = Object.freeze([
  { value: "standard", label: "Standard" },
  { value: "intl", label: "International" },
  { value: "vip", label: "VIP" },
  { value: "mini", label: "Mini" },
  { value: "spicy", label: "Spicy" },
  { value: "mini_spicy", label: "Mini Spicy" },
  { value: "legacy", label: "Original" },
  { value: "legacy_new", label: "Original updated" },
]);
const FACET_OPTIONS = Object.freeze({
  profile: PROFILE_OPTIONS,
  speed: [
    { value: "standard", label: "Standard" },
    { value: "fast", label: "Fast" },
  ],
  resolution: [
    { value: "default", label: "Automatic", description: "Uses the model variant’s default resolution." },
    { value: "480p", label: "480p" },
    { value: "1080p", label: "1080p" },
    { value: "4k", label: "4K" },
  ],
});

function register(modelId, familyId, workflowIds, facets = {}) {
  // The service matrix is explicit, but not every version offers every cell.
  // Only endpoints present in the local provider catalog become selectable.
  if (!modelIds.has(modelId)) return;
  configurations.set(modelId, Object.freeze({
    familyId,
    profile: "standard",
    speed: "standard",
    resolution: "default",
    ...facets,
    workflowIds: Object.freeze(workflowIds),
  }));
}

const MODERN_WORKFLOWS = Object.freeze({
  text: { stem: "text-to-video", workflowId: null },
  image: { stem: "image-to-video", workflowId: "animate_image" },
  keyframes: { stem: "first-last-frame", workflowId: "keyframes" },
  references: { stem: "omni-reference", workflowId: "references" },
  edit: { stem: "video-edit", workflowId: "edit_video" },
  extend: { stem: "video-extend", workflowId: "extend_uploaded_video" },
});

for (const profile of ["standard", "intl", "spicy"]) {
  for (const { stem, workflowId } of Object.values(MODERN_WORKFLOWS)) {
    for (const resolution of ["default", "480p", "1080p", "4k"]) {
      const usesNativeResolution = profile === "spicy" &&
        resolution === "default" &&
        (workflowId === null || workflowId === "animate_image");
      register(
        `seedance-2.5-${profile === "standard" ? "" : `${profile}-`}${stem}${resolution === "default" ? "" : `-${resolution}`}`,
        "seedance-2.5",
        [workflowId],
        { profile, resolution, ...(usesNativeResolution ? { usesNativeResolution: true } : {}) },
      );
    }
  }
}

for (const profile of ["standard", "vip", "mini", "spicy", "mini_spicy"]) {
  const prefix = profile === "standard" ? "" : `${profile.replace("_", "-")}-`;
  const modes = profile === "standard" || profile === "vip"
    ? ["text", "image", "keyframes", "references"]
    : profile === "mini" ? ["text", "image", "references"] : ["text", "image"];
  for (const mode of modes) {
    const { stem, workflowId } = MODERN_WORKFLOWS[mode];
    const endpointStem = profile === "standard" && mode === "references"
      ? "omni-reference-no-video"
      : stem;
    for (const speed of ["standard", "fast"]) {
      for (const resolution of ["default", "1080p", "4k"]) {
        register(
          `seedance-2-${prefix}${endpointStem}${speed === "fast" ? "-fast" : ""}${resolution === "default" ? "" : `-${resolution}`}`,
          "seedance-2",
          [workflowId],
          { profile, speed, resolution },
        );
      }
    }
  }
}

for (const [stem, workflowId] of [
  ["t2v", null],
  ["i2v", "animate_image"],
  ["omni-reference", "references"],
]) {
  for (const resolution of ["default", "480p"]) {
    register(
      `seedance-2-${stem}${resolution === "default" ? "" : `-${resolution}`}`,
      "seedance-2",
      [workflowId],
      { profile: "legacy", resolution },
    );
  }
  // Historical IDs are persisted in projects. They are aliases of the same
  // endpoint, not additional service choices.
  if (stem !== "omni-reference") {
    register(`seedance-v2.0-${stem}`, "seedance-2", [workflowId], { profile: "legacy" });
  }
}
for (const [stem, workflowId] of [
  ["t2v", null],
  ["first-last", "keyframes"],
  ["omni", "references"],
]) {
  register(`seedance-2-new-${stem}`, "seedance-2", [workflowId], { profile: "legacy_new" });
}

for (const [familyId, prefix] of [
  ["seedance-1.5", "seedance-v1.5-pro"],
  ["seedance-pro", "seedance-pro"],
  ["seedance-lite", "seedance-lite"],
]) {
  for (const speed of ["standard", "fast"]) {
    const suffix = speed === "fast" ? "-fast" : "";
    register(`${prefix}-t2v${suffix}`, familyId, [null], { speed });
    // Only Lite and 1.5 expose an end-frame input in this catalog.
    register(`${prefix}-i2v${suffix}`, familyId,
      familyId === "seedance-pro" ? ["animate_image"] : ["animate_image", "keyframes"],
      { speed });
    register(`${prefix}-video-extend${suffix}`, familyId, ["extend_uploaded_video"], { speed });
  }
}
register("seedance-lite-reference-video", "seedance-lite", ["references"]);

export function getSeedanceConfiguration(modelId) {
  return configurations.get(modelId) || null;
}

// MuAPI's family tables specify 720p for unsuffixed services that do not
// expose a native resolution input:
// https://muapi.ai/seedance-2.5 and https://muapi.ai/seedance-2 (2026-09-09).
// Older API routes with no documented size deliberately remain unspecified.
export function getSeedanceEndpointResolution(modelId) {
  const config = getSeedanceConfiguration(modelId);
  if (!config) return undefined;
  if (config.usesNativeResolution) return undefined;
  if (config.resolution !== "default") return config.resolution;
  if (config.familyId === "seedance-2.5" ||
      (config.familyId === "seedance-2" && ["standard", "vip", "spicy"].includes(config.profile))) return "720p";
  return undefined;
}

// These operations consume a previous result or an uploaded video; they are
// separate from the generation variants in the model-version picker.
const seedanceTools = new Map([
  ["seedance-2-extend", { group: "continueGenerated", variant: "standard", order: 0 }],
  ["seedance-v2.0-extend", { group: "continueGenerated", variant: "standard", order: 0 }],
  ["seedance-2-vip-extend", { group: "continueGenerated", variant: "vip", order: 1 }],
  ["seedance-2-vip-extend-1080p", { group: "continueGenerated", variant: "vip", resolution: "1080p", order: 2 }],
  ["seedance-2-watermark-remover", { group: "removeWatermark", variant: "standard", order: 0 }],
  ["seedance-2-video-watermark-remover-pro", { group: "removeWatermark", variant: "pro", order: 1 }],
]);

export function getSeedanceToolConfiguration(modelId) {
  return seedanceTools.get(modelId);
}

function coordinateKey({ profile, speed, resolution }) {
  return `${profile}\u0000${speed}\u0000${resolution}`;
}

const FACET_LABELS = Object.freeze({
  profile: "Model variant", speed: "Speed", resolution: "Resolution",
});
const EMPTY_OPTIONS = Object.freeze([]);
const profilePriority = new Map(PROFILE_OPTIONS.map((option, index) => [option.value, index]));

function defaultScore(config) {
  return profilePriority.get(config.profile) * 100 +
    (config.speed === "standard" ? 0 : 10) +
    (config.resolution === "default" ? 0 : 1);
}

function buildSelectionIndex() {
  const families = new Map();
  for (const [modelId, config] of configurations) {
    let family = families.get(config.familyId);
    if (!family) {
      family = { workflows: new Map(), coordinates: new Map() };
      families.set(config.familyId, family);
    }
    const key = coordinateKey(config);
    family.coordinates.set(key, config);
    const score = defaultScore(config);
    for (const workflowId of config.workflowIds) {
      let group = family.workflows.get(workflowId);
      if (!group) {
        group = {
          modelIds: [],
          variantByCoordinates: new Map(),
          optionsByCoordinates: new Map(),
          facetValues: Object.fromEntries(FACETS.map((facet) => [facet, new Set()])),
          defaultConfiguration: config,
          defaultScore: score,
        };
        family.workflows.set(workflowId, group);
      }
      group.modelIds.push(modelId);
      const existingId = group.variantByCoordinates.get(key);
      // Historical v2.0 IDs share an endpoint with the current catalog IDs.
      if (!existingId || existingId.startsWith("seedance-v2.0-")) {
        group.variantByCoordinates.set(key, modelId);
      }
      if (score < group.defaultScore) {
        group.defaultConfiguration = config;
        group.defaultScore = score;
      }
      for (const facet of FACETS) group.facetValues[facet].add(config[facet]);
    }
  }

  // Workflows (at most six) and facet values are bounded by the explicit
  // matrices above. Precompute each choice once; rendering only looks it up.
  for (const family of families.values()) {
    for (const group of family.workflows.values()) {
      const fields = FACETS.flatMap((key) => group.facetValues[key].size > 1 ? [{
        key,
        label: FACET_LABELS[key],
        options: FACET_OPTIONS[key].filter((option) => group.facetValues[key].has(option.value)),
      }] : []);
      for (const [coordinates, config] of family.coordinates) {
        const options = fields.map((field) => Object.freeze({
          key: field.key,
          label: field.label,
          value: config[field.key],
          options: Object.freeze(field.options.map((option) => Object.freeze({
            ...option,
            disabled: !group.variantByCoordinates.has(coordinateKey({
              ...config, [field.key]: option.value,
            })),
          }))),
        }));
        group.optionsByCoordinates.set(coordinates, Object.freeze(options));
      }
      delete group.facetValues;
      delete group.defaultScore;
    }
  }
  return families;
}

const selectionIndex = buildSelectionIndex();

export const SEEDANCE_WORKFLOW_VARIANTS = Object.freeze(Object.fromEntries(
  [...selectionIndex].map(([familyId, family]) => [familyId, Object.freeze(Object.fromEntries(
    [...family.workflows]
      .filter(([workflowId]) => workflowId !== null)
      .map(([workflowId, group]) => [workflowId, Object.freeze(group.modelIds)]),
  ))]),
));

export function resolveSeedanceVariant({
  familyId,
  workflowId = null,
  currentModelId = null,
  changes = {},
}) {
  if (Object.keys(changes).some((key) => !FACETS.includes(key))) return null;
  const group = selectionIndex.get(familyId)?.workflows.get(workflowId);
  if (!group) return null;
  const current = getSeedanceConfiguration(currentModelId);
  const coordinates = current?.familyId === familyId
    ? current
    : group.defaultConfiguration;
  const requestedKey = coordinateKey({ ...coordinates, ...changes });
  if (current?.familyId === familyId && current.workflowIds.includes(workflowId) &&
      coordinateKey(current) === requestedKey) return currentModelId;
  return group.variantByCoordinates.get(requestedKey) || null;
}

export function getSeedanceVariantOptions(familyId, workflowId = null, currentModelId = null) {
  const group = selectionIndex.get(familyId)?.workflows.get(workflowId);
  if (!group) return EMPTY_OPTIONS;
  const current = getSeedanceConfiguration(currentModelId);
  const selected = current?.familyId === familyId ? current : group.defaultConfiguration;
  return group.optionsByCoordinates.get(coordinateKey(selected));
}

export const SEEDANCE_MODEL_GROUP = Object.freeze({
  copyKey: "seedance",
  familyNames: SEEDANCE_FAMILY_NAMES,
  configurations,
  workflowVariants: SEEDANCE_WORKFLOW_VARIANTS,
  resolveVariant: resolveSeedanceVariant,
  getVariantOptions: getSeedanceVariantOptions,
});
