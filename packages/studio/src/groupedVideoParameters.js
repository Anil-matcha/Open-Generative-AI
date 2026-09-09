import {
  getSeedanceResolutionOptions,
  getSeedanceSelectionAdjustments,
  planSeedanceSelection,
} from "./seedanceParameters.js";
import { SEEDANCE_MODEL_GROUP } from "./seedanceModels.js";
import { VEO_MODEL_GROUP } from "./veoModels.js";
import { MINIMAX_MODEL_GROUP } from "./minimaxModels.js";
import { ALIBABA_MODEL_GROUP } from "./alibabaModels.js";
import { alibabaParameters } from "./alibabaParameters.js";
import { HAPPY_HORSE_MODEL_GROUP } from "./happyHorseModels.js";
import { happyHorseParameters } from "./happyHorseParameters.js";
import { KLING_MODEL_GROUP } from "./klingModels.js";
import { klingParameters } from "./klingParameters.js";
import {
  getMiniMaxResolutionOptions,
  getMiniMaxSelectionAdjustments,
  planMiniMaxSelection,
} from "./minimaxParameters.js";
import { getGroupedVideoConfiguration } from "./groupedVideoModels.js";
import { videoModelCatalog } from "./modelFamilies.js";
import { getVideoWorkflowMediaAdjustments } from "./videoWorkflows.js";
import {
  getVeoResolutionOptions,
  getVeoSelectionAdjustments,
  planVeoSelection,
} from "./veoParameters.js";

const groups = [
  { familyNames: KLING_MODEL_GROUP.familyNames, ...klingParameters },
  { familyNames: HAPPY_HORSE_MODEL_GROUP.familyNames, ...happyHorseParameters },
  { familyNames: ALIBABA_MODEL_GROUP.familyNames, ...alibabaParameters },
  {
    familyNames: SEEDANCE_MODEL_GROUP.familyNames,
    plan: planSeedanceSelection,
    resolutions: getSeedanceResolutionOptions,
    adjustments: getSeedanceSelectionAdjustments,
  },
  {
    familyNames: VEO_MODEL_GROUP.familyNames,
    plan: planVeoSelection,
    resolutions: getVeoResolutionOptions,
    adjustments: getVeoSelectionAdjustments,
  },
  {
    familyNames: MINIMAX_MODEL_GROUP.familyNames,
    plan: planMiniMaxSelection,
    resolutions: getMiniMaxResolutionOptions,
    adjustments: getMiniMaxSelectionAdjustments,
  },
];
const handlersByFamilyId = new Map();
for (const group of groups) {
  for (const familyId of Object.keys(group.familyNames)) handlersByFamilyId.set(familyId, group);
}

function mediaAdjustments({ currentModelId, selection, currentWorkflowId, workflowId = currentWorkflowId, media }) {
  if (!media || !currentWorkflowId || workflowId !== currentWorkflowId ||
      getGroupedVideoConfiguration(currentModelId)?.familyId !==
        getGroupedVideoConfiguration(selection.modelId)?.familyId) return [];
  return getVideoWorkflowMediaAdjustments(
    videoModelCatalog.variantById.get(currentModelId)?.model,
    videoModelCatalog.variantById.get(selection.modelId)?.model,
    workflowId, media,
  );
}

export function planGroupedVideoSelection(options) {
  const plan = handlersByFamilyId.get(options.familyId)?.plan(options);
  if (!plan) return null;
  const adjustments = mediaAdjustments({ ...options, selection: plan.selection });
  return adjustments.length > 0
    ? { ...plan, adjustments: [...plan.adjustments, ...adjustments] }
    : plan;
}

export function getGroupedVideoResolutionOptions(familyId, ...args) {
  return handlersByFamilyId.get(familyId)?.resolutions(familyId, ...args) ?? { value: "", options: [] };
}

export function getGroupedVideoSelectionAdjustments(options) {
  const familyId = getGroupedVideoConfiguration(options.selection.modelId)?.familyId;
  return [
    ...(handlersByFamilyId.get(familyId)?.adjustments(options) ?? []),
    ...mediaAdjustments(options),
  ];
}
