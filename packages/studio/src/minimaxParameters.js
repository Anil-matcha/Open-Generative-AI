import { getMiniMaxConfiguration, getMiniMaxVariants, resolveMiniMaxVariant } from "./minimaxModels.js";
import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { normalizeVideoResolution } from "./videoModelParameters.js";

const nativeParameters = createNativeVideoParameters({
  getConfiguration: getMiniMaxConfiguration,
  resolveVariant: resolveMiniMaxVariant,
  getResolutionVariants: getMiniMaxVariants,
});

const isHailuo02Keyframes = (familyId, workflowId) =>
  familyId === "minimax-hailuo-02" && workflowId === "keyframes";

export const getMiniMaxSelectionAdjustments = nativeParameters.adjustments;

export function planMiniMaxSelection(options) {
  const plan = nativeParameters.plan(options);
  if (!plan || !isHailuo02Keyframes(options.familyId, options.workflowId) ||
      normalizeVideoResolution(plan.selection.resolution) !== "512p") return plan;
  if (Object.hasOwn(options.changes || {}, "resolution")) return null;

  // First & last frames require 768P or 1080P; 512P supports the first frame only.
  // https://platform.minimax.io/docs/api-reference/video-generation-fl2v
  const { selection } = nativeParameters.plan({
    ...options, changes: { ...options.changes, resolution: "768P" },
  });
  return { selection, adjustments: nativeParameters.adjustments({ ...options, selection }) };
}

export function getMiniMaxResolutionOptions(familyId, workflowId = null, currentModelId = null, nativeResolution) {
  const field = nativeParameters.resolutions(familyId, workflowId, currentModelId, nativeResolution);
  if (!isHailuo02Keyframes(familyId, workflowId)) return field;
  return {
    ...field,
    value: field.value === "512p" ? "768p" : field.value,
    options: field.options.filter((option) => option.value !== "512p"),
  };
}
