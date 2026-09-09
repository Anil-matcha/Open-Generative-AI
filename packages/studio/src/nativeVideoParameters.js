import { videoModelCatalog } from "./modelFamilies.js";
import {
  formatVideoResolution,
  getVideoCommonOptions,
  getVideoCommonValues,
  matchingVideoResolution,
  normalizeVideoResolution,
} from "./videoModelParameters.js";

const modelForId = (modelId) => videoModelCatalog.variantById.get(modelId)?.model;
const FACETS = ["profile", "speed"];
const SELECTION_KEYS = [...FACETS, "resolution"];

// Native parameters and fixed output sizes share controls. Only providers with
// separate resolution endpoints supply additional candidates for those controls.
export function createNativeVideoParameters({ getConfiguration, resolveVariant, getResolutionVariants }) {
  function adjustments({ currentModelId, nativeResolution, commonValues = {}, selection, changes = {} }) {
    const current = getConfiguration(currentModelId);
    const target = getConfiguration(selection.modelId);
    if (!current || current.familyId !== target?.familyId) return [];
    const result = FACETS.filter((key) => !Object.hasOwn(changes, key) && current[key] !== target[key])
      .map((key) => ({ key, from: current[key], to: target[key] }));
    const sourceModel = modelForId(currentModelId);
    const previous = getVideoCommonValues(sourceModel, {
      ...commonValues,
      resolution: matchingVideoResolution(sourceModel, nativeResolution ?? commonValues.resolution),
    });
    const next = getVideoCommonValues(modelForId(selection.modelId), {
      ...commonValues, resolution: selection.resolution,
    });
    for (const key of ["aspectRatio", "duration", "resolution", "quality"]) {
      if (!Object.hasOwn(changes, key) && previous[key] !== undefined && next[key] !== undefined &&
          String(previous[key]).toLowerCase() !== String(next[key]).toLowerCase()) {
        result.push({ key, from: previous[key], to: next[key] });
      }
    }
    return result;
  }

  function plan({ familyId, workflowId = null, currentModelId, changes = {}, nativeResolution, commonValues = {} }) {
    if (Object.keys(changes).some((key) => !SELECTION_KEYS.includes(key))) return null;
    const facetChanges = Object.fromEntries(FACETS.filter((key) => Object.hasOwn(changes, key))
      .map((key) => [key, changes[key]]));
    let modelId = resolveVariant({ familyId, workflowId, currentModelId, changes: facetChanges });
    if (!modelId && Object.keys(facetChanges).length === 0) modelId = resolveVariant({ familyId, workflowId });
    if (!modelId) return null;
    const current = getConfiguration(currentModelId);
    const target = getConfiguration(modelId);
    const sameFamily = current?.familyId === familyId;
    const explicitResolution = Object.hasOwn(changes, "resolution");
    const desiredResolution = explicitResolution ? changes.resolution
      : sameFamily ? nativeResolution ?? commonValues.resolution : undefined;
    let resolution = matchingVideoResolution(modelForId(modelId), desiredResolution);
    if (resolution === undefined && getResolutionVariants) {
      let fallback;
      for (const candidateId of getResolutionVariants(familyId, workflowId)) {
        const config = getConfiguration(candidateId);
        if (config.profile !== target.profile) continue;
        const match = matchingVideoResolution(modelForId(candidateId), desiredResolution);
        if (match === undefined) continue;
        if (config.speed === target.speed) {
          modelId = candidateId;
          resolution = match;
          break;
        }
        if (explicitResolution && !Object.hasOwn(changes, "speed") && !fallback) {
          fallback = { modelId: candidateId, resolution: match };
        }
      }
      if (resolution === undefined && fallback) ({ modelId, resolution } = fallback);
    }
    if (explicitResolution && resolution === undefined) return null;
    resolution = getVideoCommonValues(modelForId(modelId), { resolution }).resolution;
    const selection = { modelId, ...(resolution === undefined ? {} : { resolution }) };
    return { selection, adjustments: adjustments({ currentModelId, nativeResolution, commonValues, selection, changes }) };
  }

  function resolutions(familyId, workflowId = null, currentModelId = null, nativeResolution) {
    const config = getConfiguration(currentModelId);
    if (!config || config.familyId !== familyId || !config.workflowIds.includes(workflowId)) {
      return { value: "", options: [] };
    }
    const model = modelForId(currentModelId);
    const resolution = getVideoCommonValues(model, {
      resolution: matchingVideoResolution(model, nativeResolution),
    }).resolution;
    const candidates = getResolutionVariants ? getResolutionVariants(familyId, workflowId) : [currentModelId];
    const values = new Set();
    for (const modelId of candidates) {
      if (getConfiguration(modelId).profile !== config.profile) continue;
      for (const value of getVideoCommonOptions(modelForId(modelId)).resolutions) values.add(normalizeVideoResolution(value));
    }
    const options = [...values].map((value) => {
      const selection = plan({ familyId, workflowId, currentModelId, changes: { resolution: value } })?.selection;
      return { value, label: formatVideoResolution(value), ...selection, disabled: !selection };
    });
    return { value: resolution === undefined ? "" : normalizeVideoResolution(resolution), options };
  }

  return { plan, resolutions, adjustments };
}
