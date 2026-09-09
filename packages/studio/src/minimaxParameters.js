import { getMiniMaxConfiguration, getMiniMaxVariants, resolveMiniMaxVariant } from "./minimaxModels.js";
import { createNativeVideoParameters } from "./nativeVideoParameters.js";

export const {
  plan: planMiniMaxSelection,
  resolutions: getMiniMaxResolutionOptions,
  adjustments: getMiniMaxSelectionAdjustments,
} = createNativeVideoParameters({
  getConfiguration: getMiniMaxConfiguration,
  resolveVariant: resolveMiniMaxVariant,
  getResolutionVariants: getMiniMaxVariants,
});
