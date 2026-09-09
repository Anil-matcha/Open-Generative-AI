import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const HAPPY_HORSE_FAMILY_NAMES = Object.freeze({
  "happy-horse-1.1": "Happy Horse 1.1",
  "happy-horse-1": "Happy Horse 1.0",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {},
  facetLabels: {},
  registerVariants(register) {
    for (const familyId of Object.keys(HAPPY_HORSE_FAMILY_NAMES)) {
      for (const service of ["720p", "1080p"]) {
        for (const [mode, workflowId] of [
          ["text-to-video", null],
          ["image-to-video", "animate_image"],
          ["reference-to-video", "references"],
          ["video-edit", "edit_video"],
        ]) {
          register(`${familyId}-${mode}-${service}`, familyId, [workflowId], { service });
        }
      }
    }
  },
});

export const {
  getConfiguration: getHappyHorseConfiguration,
  getVariants: getHappyHorseVariants,
  resolveVariant: resolveHappyHorseVariant,
} = registry;

export const HAPPY_HORSE_MODEL_GROUP = Object.freeze({
  copyKey: "happyHorse",
  familyNames: HAPPY_HORSE_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: registry.workflowVariants,
  resolveVariant: resolveHappyHorseVariant,
  getVariantOptions: registry.getVariantOptions,
});
