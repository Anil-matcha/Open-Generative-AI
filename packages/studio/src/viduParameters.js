import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getViduConfiguration, resolveViduVariant } from "./viduModels.js";

export const viduParameters = createNativeVideoParameters({
  getConfiguration: getViduConfiguration,
  resolveVariant: resolveViduVariant,
});
