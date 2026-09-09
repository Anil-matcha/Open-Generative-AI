import {
  getSeedanceResolutionOptions,
  getSeedanceSelectionAdjustments,
  planSeedanceSelection,
} from "./seedanceParameters.js";
import { SEEDANCE_MODEL_GROUP } from "./seedanceModels.js";
import { VEO_MODEL_GROUP } from "./veoModels.js";
import { getGroupedVideoConfiguration } from "./groupedVideoModels.js";
import {
  getVeoResolutionOptions,
  getVeoSelectionAdjustments,
  planVeoSelection,
} from "./veoParameters.js";

const groups = [
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
];
const handlersByFamilyId = new Map();
for (const group of groups) {
  for (const familyId of Object.keys(group.familyNames)) handlersByFamilyId.set(familyId, group);
}

export function planGroupedVideoSelection(options) {
  return handlersByFamilyId.get(options.familyId)?.plan(options) ?? null;
}

export function getGroupedVideoResolutionOptions(familyId, ...args) {
  return handlersByFamilyId.get(familyId)?.resolutions(familyId, ...args) ?? { value: "", options: [] };
}

export function getGroupedVideoSelectionAdjustments(options) {
  const familyId = getGroupedVideoConfiguration(options.selection.modelId)?.familyId;
  return handlersByFamilyId.get(familyId)?.adjustments(options) ?? [];
}
