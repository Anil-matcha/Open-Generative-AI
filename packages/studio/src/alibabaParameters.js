import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getAlibabaConfiguration, resolveAlibabaVariant } from "./alibabaModels.js";

export const alibabaParameters = createNativeVideoParameters({
  getConfiguration: getAlibabaConfiguration,
  resolveVariant: resolveAlibabaVariant,
});
