import { getVeoConfiguration, resolveVeoVariant } from "./veoModels.js";
import { createNativeVideoParameters } from "./nativeVideoParameters.js";

export const {
  plan: planVeoSelection,
  resolutions: getVeoResolutionOptions,
  adjustments: getVeoSelectionAdjustments,
} = createNativeVideoParameters({ getConfiguration: getVeoConfiguration, resolveVariant: resolveVeoVariant });
