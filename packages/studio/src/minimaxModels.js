import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const MINIMAX_FAMILY_NAMES = Object.freeze({
  "minimax-h3": "MiniMax H3",
  "minimax-hailuo-2.3": "Hailuo 2.3",
  "minimax-hailuo-02": "Hailuo 02",
});

const FACET_OPTIONS = Object.freeze({
  profile: [
    { value: "standard", label: "Standard" },
    { value: "lora", label: "LoRA" },
    { value: "spicy", label: "Spicy" },
  ],
  speed: [
    { value: "standard", label: "Standard" },
    { value: "fast", label: "Fast" },
  ],
});
const FACET_LABELS = Object.freeze({ profile: "Customization", speed: "Speed" });
const registry = createGroupedVideoRegistry({
  facetOptions: FACET_OPTIONS,
  facetLabels: FACET_LABELS,
  registerVariants(register) {
    // Standard/Pro and official/Open endpoints are selected by resolution, while
    // speed and optional LoRA/Spicy profiles remain explicit generation choices.
    for (const familyId of ["minimax-hailuo-02", "minimax-hailuo-2.3"]) {
      for (const service of ["standard", "pro"]) {
        register(`${familyId}-${service}-t2v`, familyId, [null], { service });
        register(`${familyId}-${service}-i2v`, familyId,
          familyId === "minimax-hailuo-02" ? ["animate_image", "keyframes"] : ["animate_image"],
          { service });
      }
    }
    register("minimax-hailuo-2.3-fast", "minimax-hailuo-2.3", ["animate_image"], { speed: "fast" });

    for (const service of ["official", "open"]) {
      const stem = `minimax-h3${service === "open" ? "-open" : ""}`;
      register(`${stem}-text-to-video`, "minimax-h3", [null], { service });
      register(`${stem}-image-to-video`, "minimax-h3", ["animate_image", "keyframes"], { service });
      register(`${stem}-reference-to-video`, "minimax-h3", ["references"], { service });
    }
    for (const [stem, workflowIds] of [
      ["text-to-video", [null]],
      ["image-to-video", ["animate_image", "keyframes"]],
      ["reference-to-video", ["references"]],
    ]) {
      register(`minimax-h3-${stem}-lora`, "minimax-h3", workflowIds, { profile: "lora", service: "open" });
    }
    register("minimax-h3-image-to-video-spicy", "minimax-h3", ["animate_image", "keyframes"], {
      profile: "spicy", service: "open",
    });
  },
});

export const {
  workflowVariants: MINIMAX_WORKFLOW_VARIANTS,
  getConfiguration: getMiniMaxConfiguration,
  getVariants: getMiniMaxVariants,
  resolveVariant: resolveMiniMaxVariant,
  getVariantOptions: getMiniMaxVariantOptions,
} = registry;

export const MINIMAX_MODEL_GROUP = Object.freeze({
  copyKey: "minimax",
  familyNames: MINIMAX_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: MINIMAX_WORKFLOW_VARIANTS,
  resolveVariant: resolveMiniMaxVariant,
  getVariantOptions: getMiniMaxVariantOptions,
});
