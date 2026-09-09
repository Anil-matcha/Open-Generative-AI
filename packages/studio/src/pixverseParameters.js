import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getPixVerseConfiguration, resolvePixVerseVariant } from "./pixverseModels.js";

export const pixverseParameters = createNativeVideoParameters({
  getConfiguration: getPixVerseConfiguration,
  resolveVariant: resolvePixVerseVariant,
});
