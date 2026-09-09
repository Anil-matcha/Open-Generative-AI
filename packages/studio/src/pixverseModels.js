import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const PIXVERSE_FAMILY_NAMES = Object.freeze({
  "pixverse-6": "PixVerse 6",
  "pixverse-5.5": "PixVerse 5.5",
  "pixverse-5": "PixVerse 5",
  "pixverse-4.5": "PixVerse 4.5",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {},
  facetLabels: {},
  registerVariants(register) {
    for (const version of ["6", "5.5", "5", "4.5"]) {
      const familyId = `pixverse-${version}`;
      register(`pixverse-v${version}-t2v`, familyId, [null]);
      register(`pixverse-v${version}-i2v`, familyId,
        version === "6" ? ["animate_image"] : ["animate_image", "keyframes"]);
    }
    register("pixverse-v6-transition", "pixverse-6", ["keyframes"]);
    register("pixverse-v6-extend", "pixverse-6", ["extend_uploaded_video"]);
  },
});

export const {
  getConfiguration: getPixVerseConfiguration,
  resolveVariant: resolvePixVerseVariant,
} = registry;

export const PIXVERSE_MODEL_GROUP = Object.freeze({
  copyKey: "pixverse",
  familyNames: PIXVERSE_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: registry.workflowVariants,
  resolveVariant: resolvePixVerseVariant,
  getVariantOptions: registry.getVariantOptions,
});
