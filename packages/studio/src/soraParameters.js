import { createNativeVideoParameters } from "./nativeVideoParameters.js";
import { getSoraConfiguration, resolveSoraVariant } from "./soraModels.js";

export const soraParameters = createNativeVideoParameters({
  getConfiguration: getSoraConfiguration,
  resolveVariant: resolveSoraVariant,
});
