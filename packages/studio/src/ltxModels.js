import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const LTX_FAMILY_NAMES = Object.freeze({
  "ltx-2.5": "LTX 2.5",
  "ltx-2.3": "LTX 2.3",
  "ltx-2": "LTX 2",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {
    profile: [
      { value: "standard", label: "Standard" },
      { value: "pro", label: "Pro" },
      { value: "fast", label: "Fast" },
    ],
  },
  facetLabels: { profile: "Generation" },
  registerVariants(register) {
    for (const [service, profile] of [["19b", "standard"], ["pro", "pro"], ["fast", "fast"]]) {
      register(`ltx-2-${service}-text-to-video`, "ltx-2", [null], { profile });
      register(`ltx-2-${service}-image-to-video`, "ltx-2", ["animate_image"], { profile });
    }
    for (const version of ["2.5", "2.3"]) {
      const familyId = `ltx-${version}`;
      register(`${familyId}-text-to-video`, familyId, [null]);
      register(`${familyId}-image-to-video`, familyId,
        version === "2.5" ? ["animate_image", "keyframes"] : ["animate_image"]);
    }
    register("ltx-2.3-video-extend", "ltx-2.3", ["extend_uploaded_video"]);
  },
});

export const {
  getConfiguration: getLtxConfiguration,
  resolveVariant: resolveLtxVariant,
} = registry;

export const LTX_MODEL_GROUP = Object.freeze({
  copyKey: "ltx",
  familyNames: LTX_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: registry.workflowVariants,
  resolveVariant: resolveLtxVariant,
  getVariantOptions: (...args) => registry.getVariantOptions(...args)
    .map((field) => ({ ...field, advanced: false })),
});
