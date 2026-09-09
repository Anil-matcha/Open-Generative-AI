import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getHappyHorseConfiguration, getHappyHorseVariants, resolveHappyHorseVariant } from "./happyHorseModels.js";

export const happyHorseParameters = createNativeVideoParameters({
  getConfiguration: getHappyHorseConfiguration,
  resolveVariant: resolveHappyHorseVariant,
  getResolutionVariants: getHappyHorseVariants,
});
