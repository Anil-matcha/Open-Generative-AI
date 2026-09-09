import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getLtxConfiguration, resolveLtxVariant } from "./ltxModels.js";

export const ltxParameters = createNativeVideoParameters({
  getConfiguration: getLtxConfiguration,
  resolveVariant: resolveLtxVariant,
});
