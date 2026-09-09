import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getKlingConfiguration, getKlingVariants, resolveKlingVariant } from "./klingModels.js";

export const klingParameters = createNativeVideoParameters({
  getConfiguration: getKlingConfiguration,
  resolveVariant: resolveKlingVariant,
  getResolutionVariants: getKlingVariants,
});
