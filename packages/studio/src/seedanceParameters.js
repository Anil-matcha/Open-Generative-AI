import { videoModelCatalog } from "./modelFamilies.js";
import {
  getSeedanceConfiguration,
  getSeedanceEndpointResolution,
  getSeedanceVariantOptions,
  resolveSeedanceVariant,
} from "./seedanceModels.js";

import {
  getVideoCommonOptions,
  getVideoCommonValues,
  matchingVideoParameterValue as matchingValue,
} from "./videoModelParameters.js";

function resolutionLabel(value) {
  return String(value).toLowerCase() === "4k" ? "4K" : String(value);
}

function modelForId(modelId) {
  return videoModelCatalog.variantById.get(modelId)?.model;
}

function followsSourceVideoResolution(modelId) {
  const config = getSeedanceConfiguration(modelId);
  if (config.resolution !== "default" || !config.workflowIds.includes("extend_uploaded_video") ||
    getVideoCommonOptions(modelForId(modelId)).resolutions.length) return false;
  return !getSeedanceVariantOptions(config.familyId, "extend_uploaded_video", modelId)
    .some((field) => field.key === "resolution" && field.options.some((option) =>
      !option.disabled && option.value !== "default"));
}

// Index actual catalog models once. A plan scans only the requested family's
// mode, whose native resolution and common-parameter ranges are bounded.
const selectionCandidates = new Map();
for (const { model } of videoModelCatalog.variantById.values()) {
  const config = getSeedanceConfiguration(model.id);
  if (!config) continue;
  let workflows = selectionCandidates.get(config.familyId);
  if (!workflows) selectionCandidates.set(config.familyId, workflows = new Map());
  const candidate = { model, config, options: getVideoCommonOptions(model) };
  for (const workflowId of config.workflowIds) {
    let candidates = workflows.get(workflowId);
    if (!candidates) workflows.set(workflowId, candidates = []);
    candidates.push(candidate);
  }
}

const RESOLUTION_SIZE = Object.freeze({ "480p": 480, "720p": 720, "1080p": 1080, "4k": 2160 });
const normalizeResolution = (value) => value === undefined ? undefined : String(value).toLowerCase();

function effectiveResolution(modelId, nativeResolution) {
  const config = getSeedanceConfiguration(modelId);
  if (!config) return undefined;
  const fixed = getSeedanceEndpointResolution(modelId);
  if (fixed !== undefined) return fixed;
  const native = getVideoCommonValues(modelForId(modelId), { resolution: nativeResolution }).resolution;
  if (native !== undefined) return normalizeResolution(native);
  return followsSourceVideoResolution(modelId) ? undefined : "default";
}

function resolutionScore(value, preferred) {
  if (value === preferred) return [0, 0];
  if (preferred === undefined || preferred === "default") return [1, 0];
  const size = RESOLUTION_SIZE[value];
  const preferredSize = RESOLUTION_SIZE[preferred];
  if (!size || !preferredSize) return [3, 0];
  // Preserve detail when an exact size is unavailable. Only use a smaller
  // output when the requested mode has no size at or above the old one.
  return size >= preferredSize ? [1, size - preferredSize] : [2, preferredSize - size];
}

function compareScores(left, right) {
  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function commonAdjustments(model, previous) {
  const target = getVideoCommonValues(model, previous);
  return ["duration", "aspectRatio", "quality"].flatMap((key) =>
    previous[key] !== undefined && target[key] !== undefined && String(previous[key]) !== String(target[key])
      ? [{ key, from: previous[key], to: target[key] }] : []);
}

export function getSeedanceSelectionAdjustments({
  currentModelId,
  nativeResolution,
  commonValues = {},
  selection,
  changes = {},
}) {
  const current = getSeedanceConfiguration(currentModelId);
  const target = getSeedanceConfiguration(selection.modelId);
  if (!current || current.familyId !== target?.familyId) return [];
  const adjustments = ["profile", "speed"].flatMap((key) =>
    !Object.hasOwn(changes, key) && current[key] !== target[key]
      ? [{ key, from: current[key], to: target[key] }] : []);
  const sourceResolution = effectiveResolution(currentModelId, nativeResolution ?? commonValues.resolution);
  const resolution = effectiveResolution(selection.modelId, selection.resolution);
  if (!Object.hasOwn(changes, "resolution") && sourceResolution !== undefined && sourceResolution !== "default" &&
      resolution !== undefined && sourceResolution !== resolution) {
    adjustments.push({ key: "resolution", from: sourceResolution, to: resolution });
  }
  const visibleCommonValues = getVideoCommonValues(modelForId(currentModelId), commonValues);
  adjustments.push(...commonAdjustments(modelForId(selection.modelId), visibleCommonValues));
  return adjustments;
}

export function planSeedanceSelection({
  familyId,
  workflowId = null,
  currentModelId,
  changes = {},
  nativeResolution,
  commonValues = {},
}) {
  const candidates = selectionCandidates.get(familyId)?.get(workflowId);
  if (!candidates || Object.keys(changes).some((key) => !["profile", "speed", "resolution"].includes(key))) return null;
  const source = getSeedanceConfiguration(currentModelId);
  const current = source?.familyId === familyId ? source : null;
  const previous = current ? commonValues : {};
  const sourceResolution = current ? effectiveResolution(currentModelId, nativeResolution ?? commonValues.resolution) : undefined;
  const strict = resolveSeedanceSelection({ familyId, workflowId, currentModelId, changes,
    nativeResolution: nativeResolution ?? commonValues.resolution });
  const preferredResolution = current
    ? sourceResolution === "default" && strict
      ? effectiveResolution(strict.modelId, strict.resolution)
      : sourceResolution ?? normalizeResolution(nativeResolution ?? commonValues.resolution)
    : undefined;

  const finish = (selection) => ({ selection, adjustments: getSeedanceSelectionAdjustments({
    currentModelId, nativeResolution, commonValues, selection, changes,
  }) });
  // Keep the existing endpoint and values whenever they already satisfy the
  // request. Unknown/family-switching sources start at the actual defaults.
  if (strict && (!current || !commonAdjustments(modelForId(strict.modelId), previous).length)) return finish(strict);

  const defaultProfile = getSeedanceConfiguration(resolveSeedanceVariant({ familyId, workflowId }))?.profile;
  let best;
  for (const candidate of candidates) {
    if (Object.entries(changes).some(([key, value]) => key !== "resolution" && candidate.config[key] !== value)) continue;
    // Undocumented older services remain explicitly selectable and restorable,
    // but are never an automatic fallback for another service.
    if (candidate.config.profile.startsWith("legacy") &&
        candidate.config.profile !== current?.profile && changes.profile !== candidate.config.profile) continue;
    const { model, config, options } = candidate;
    let resolution = getVideoCommonValues(model).resolution;
    if (Object.hasOwn(changes, "resolution")) {
      if (changes.resolution === "default") {
        if (config.resolution !== "default") continue;
      } else {
        resolution = options.resolutions.find((value) => normalizeResolution(value) === normalizeResolution(changes.resolution));
        if (effectiveResolution(model.id, resolution) !== normalizeResolution(changes.resolution)) continue;
      }
    } else if (options.resolutions.length) {
      let score = resolutionScore(normalizeResolution(resolution), preferredResolution);
      for (const option of options.resolutions) {
        const nextScore = resolutionScore(normalizeResolution(option), preferredResolution);
        if (compareScores(nextScore, score) < 0) {
          resolution = option;
          score = nextScore;
        }
      }
    }
    const selection = { modelId: model.id, ...(resolution === undefined ? {} : { resolution }) };
    const common = commonAdjustments(model, previous);
    const score = [
      config.profile === current?.profile ? 0 : config.profile === defaultProfile ? 1 : 2,
      ...resolutionScore(effectiveResolution(model.id, resolution), preferredResolution),
      current && config.speed !== current.speed ? 1 : 0,
      common.length,
      model.id === strict?.modelId || model.id === currentModelId ? 0 : 1,
      config.profile === "standard" ? 0 : 1,
      config.speed === "standard" ? 0 : 1,
      config.resolution === "default" ? 0 : 1,
    ];
    if (!best || compareScores(score, best.score) < 0) best = { selection, score };
  }
  return best ? finish(best.selection) : null;
}

export function resolveSeedanceSelection({
  familyId,
  workflowId = null,
  currentModelId,
  changes = {},
  nativeResolution,
}) {
  const current = getSeedanceConfiguration(currentModelId);
  if (Object.keys(changes).some((key) => !["profile", "speed", "resolution"].includes(key))) return null;

  const resolve = (resolution) => resolveSeedanceVariant({
    familyId, workflowId, currentModelId,
    changes: { ...changes, ...(resolution === undefined ? {} : { resolution }) },
  });
  const withDefaultResolution = (modelId) => {
    if (!modelId) return null;
    const resolution = getVideoCommonValues(modelForId(modelId)).resolution;
    return { modelId, ...(resolution === undefined ? {} : { resolution }) };
  };

  const requestedResolution = changes.resolution;
  if (requestedResolution !== undefined && requestedResolution !== "default") {
    const size = normalizeResolution(requestedResolution);
    // Prefer a native-resolution route when the selected model exposes the
    // documented control. Dedicated size endpoints remain the fallback for
    // variants whose provider contract has no native resolution input.
    for (const modelId of new Set([resolve("default"), resolve(size)])) {
      if (!modelId) continue;
      const native = getVideoCommonOptions(modelForId(modelId)).resolutions
        .find((value) => normalizeResolution(value) === size);
      if (native !== undefined) return { modelId, resolution: native };
      if (getSeedanceEndpointResolution(modelId) === size) return { modelId };
    }
    return null;
  }
  if (!current || current.familyId !== familyId) return withDefaultResolution(resolve());

  // An explicit resolution choice may change the output. All other switches
  // must retain a known output size, even if its provider route changes.
  if (Object.hasOwn(changes, "resolution")) return withDefaultResolution(resolve());
  const sourceResolution = effectiveResolution(currentModelId, nativeResolution);
  if (sourceResolution === undefined || sourceResolution === "default") {
    const modelId = resolve();
    // Extension without an output-size control follows the source video.
    // The UI can retain its earlier native setting while this field is hidden
    // and restore that preference when returning to a compatible mode.
    if (modelId && followsSourceVideoResolution(currentModelId)) {
      const resolution = matchingValue(getVideoCommonOptions(modelForId(modelId)).resolutions, nativeResolution);
      if (resolution !== undefined) return { modelId, resolution };
    }
    return withDefaultResolution(modelId);
  }

  const outputResolution = normalizeResolution(sourceResolution);
  // Give a target's native-resolution route the first chance to retain the
  // current output size. This keeps documented Spicy controls on the base
  // route when switching into Spicy from a dedicated-size variant.
  const candidates = new Set([resolve("default"), resolve(), resolve(outputResolution)]);
  for (const modelId of candidates) {
    if (!modelId) continue;
    const nativeOptions = getVideoCommonOptions(modelForId(modelId)).resolutions;
    const resolution = nativeOptions.find((option) =>
      String(option).toLowerCase() === outputResolution);
    if (resolution !== undefined) return { modelId, resolution };
    if (getSeedanceEndpointResolution(modelId) === outputResolution) return { modelId };
    if (workflowId === "extend_uploaded_video" && followsSourceVideoResolution(modelId)) return { modelId };
  }
  return null;
}

// Preserve the native routes for the two Spicy entries that expose a native
// output-size input. Keep the fallback for catalogs that may still be stale.
export function migrateSeedanceResolutionSelection(modelId, resolution) {
  if (modelId !== "seedance-2.5-spicy-text-to-video" && modelId !== "seedance-2.5-spicy-image-to-video") return modelId;
  if (getVideoCommonOptions(modelForId(modelId)).resolutions.length) return modelId;
  return resolveSeedanceSelection({
    familyId: "seedance-2.5",
    workflowId: modelId.endsWith("image-to-video") ? "animate_image" : null,
    currentModelId: modelId,
    changes: { resolution: resolution || "1080p" },
  })?.modelId || modelId;
}

// Each output size appears once, regardless of whether the API selects it
// through a native parameter or a dedicated endpoint. Catalog candidates and
// the supported size set are bounded; this is one scan of the current mode.
export function getSeedanceResolutionOptions(
  familyId,
  workflowId = null,
  currentModelId = null,
  nativeResolution,
  commonValues = {},
) {
  const selected = getSeedanceConfiguration(currentModelId);
  if (!selected || selected.familyId !== familyId || !selected.workflowIds.includes(workflowId)) {
    return { value: "", options: [] };
  }
  const bySize = new Map();
  for (const { model, config, options } of selectionCandidates.get(familyId).get(workflowId)) {
    if (config.profile !== selected.profile || config.speed !== selected.speed) continue;
    const sizes = options.resolutions.length
      ? options.resolutions
      : [getSeedanceEndpointResolution(model.id)];
    for (const size of sizes) {
      if (size === undefined) continue;
      const value = normalizeResolution(size);
      const selection = {
        value,
        label: resolutionLabel(size),
        modelId: model.id,
        disabled: false,
        ...(options.resolutions.length ? { resolution: size } : {}),
      };
      const score = [commonAdjustments(model, commonValues).length, model.id === currentModelId ? 0 : 1];
      const existing = bySize.get(value);
      if (!existing || compareScores(score, existing.score) < 0) bySize.set(value, { selection, score });
    }
  }
  const value = effectiveResolution(currentModelId, nativeResolution);
  return {
    value: value === "default" || value === undefined ? "" : value,
    options: Object.keys(RESOLUTION_SIZE).flatMap((size) =>
      bySize.has(size) ? [bySize.get(size).selection] : []),
  };
}
