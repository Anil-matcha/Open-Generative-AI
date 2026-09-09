import { videoModelCatalog } from "./modelFamilies.js";
import { getVeoConfiguration, resolveVeoVariant } from "./veoModels.js";
import { getVideoCommonOptions, getVideoCommonValues } from "./videoModelParameters.js";

const normalizeResolution = (value) => String(value).toLowerCase();
const modelForId = (modelId) => videoModelCatalog.variantById.get(modelId)?.model;

function matchingResolution(model, value) {
  return getVideoCommonOptions(model).resolutions.find((option) =>
    normalizeResolution(option) === normalizeResolution(value));
}

export function getVeoSelectionAdjustments({
  currentModelId, nativeResolution, commonValues = {}, selection, changes = {},
}) {
  const current = getVeoConfiguration(currentModelId);
  const target = getVeoConfiguration(selection.modelId);
  if (!current || current.familyId !== target?.familyId) return [];
  const adjustments = !Object.hasOwn(changes, "speed") && current.speed !== target.speed
    ? [{ key: "speed", from: current.speed, to: target.speed }]
    : [];
  const sourceModel = modelForId(currentModelId);
  const previous = getVideoCommonValues(sourceModel, {
    ...commonValues,
    resolution: matchingResolution(sourceModel, nativeResolution ?? commonValues.resolution),
  });
  const next = getVideoCommonValues(modelForId(selection.modelId), {
    ...commonValues, resolution: selection.resolution,
  });
  for (const key of ["aspectRatio", "duration", "resolution", "quality"]) {
    if (!Object.hasOwn(changes, key) && previous[key] !== undefined && next[key] !== undefined &&
        String(previous[key]) !== String(next[key])) {
      adjustments.push({ key, from: previous[key], to: next[key] });
    }
  }
  return adjustments;
}

export function planVeoSelection({
  familyId, workflowId = null, currentModelId, changes = {},
  nativeResolution, commonValues = {},
}) {
  if (Object.keys(changes).some((key) => key !== "speed" && key !== "resolution")) return null;
  const speedChanges = Object.hasOwn(changes, "speed") ? { speed: changes.speed } : {};
  let modelId = resolveVeoVariant({ familyId, workflowId, currentModelId, changes: speedChanges });
  // References have one service. Switching modes may select Standard, while
  // an explicit Fast or Lite request must never silently choose another one.
  if (!modelId && !Object.hasOwn(changes, "speed")) {
    modelId = resolveVeoVariant({ familyId, workflowId });
  }
  if (!modelId) return null;
  const model = modelForId(modelId);
  const current = getVeoConfiguration(currentModelId);
  const previous = current?.familyId === familyId ? commonValues : {};
  const desiredResolution = Object.hasOwn(changes, "resolution")
    ? changes.resolution
    : current?.familyId === familyId ? nativeResolution ?? previous.resolution : undefined;
  const matchedResolution = matchingResolution(model, desiredResolution);
  if (Object.hasOwn(changes, "resolution") && matchedResolution === undefined) return null;
  const resolution = getVideoCommonValues(model, {
    ...previous, resolution: matchedResolution,
  }).resolution;
  const selection = { modelId, ...(resolution === undefined ? {} : { resolution }) };
  return {
    selection,
    adjustments: getVeoSelectionAdjustments({
      currentModelId, nativeResolution, commonValues, selection, changes,
    }),
  };
}

export function getVeoResolutionOptions(
  familyId, workflowId = null, currentModelId = null, nativeResolution,
) {
  const config = getVeoConfiguration(currentModelId);
  if (!config || config.familyId !== familyId || !config.workflowIds.includes(workflowId)) {
    return { value: "", options: [] };
  }
  const model = modelForId(currentModelId);
  const resolution = getVideoCommonValues(model, {
    resolution: matchingResolution(model, nativeResolution),
  }).resolution;
  return {
    value: resolution === undefined ? "" : normalizeResolution(resolution),
    options: getVideoCommonOptions(model).resolutions.map((value) => ({
      value: normalizeResolution(value),
      label: normalizeResolution(value) === "4k" ? "4K" : String(value),
      modelId: currentModelId,
      resolution: value,
      disabled: false,
    })),
  };
}
