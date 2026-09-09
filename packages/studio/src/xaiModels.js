import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const XAI_FAMILY_NAMES = Object.freeze({
  "grok-imagine-video-1.5": "Grok Imagine 1.5 Preview",
  "grok-imagine-video": "Grok Imagine",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {},
  facetLabels: {},
  registerVariants(register) {
    register("grok-imagine-text-to-video", "grok-imagine-video", [null]);
    register("grok-imagine-image-to-video", "grok-imagine-video", ["references"]);
    register("grok-imagine-video-1-5-preview", "grok-imagine-video-1.5", ["animate_image", "references"]);
  },
});

export const {
  getConfiguration: getXaiConfiguration,
  resolveVariant: resolveXaiVariant,
} = registry;

export const XAI_MODEL_GROUP = Object.freeze({
  copyKey: "xai",
  familyNames: XAI_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: registry.workflowVariants,
  resolveVariant: resolveXaiVariant,
  getVariantOptions: registry.getVariantOptions,
});
