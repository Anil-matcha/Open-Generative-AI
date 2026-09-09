import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getXaiConfiguration, resolveXaiVariant } from "./xaiModels.js";

export const xaiParameters = createNativeVideoParameters({
  getConfiguration: getXaiConfiguration,
  resolveVariant: resolveXaiVariant,
});
