import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const SORA_FAMILY_NAMES = Object.freeze({
  "sora-2": "Sora 2",
  "openai-sora": "Sora",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {
    profile: [
      { value: "standard", label: "Standard" },
      { value: "pro", label: "Pro" },
    ],
  },
  facetLabels: { profile: "Generation" },
  registerVariants(register) {
    register("openai-sora", "openai-sora", [null]);
    for (const [service, profile] of [["", "standard"], ["-pro", "pro"]]) {
      const stem = `openai-sora-2${service}`;
      register(`${stem}-text-to-video`, "sora-2", [null], { profile });
      register(`${stem}-image-to-video`, "sora-2", ["animate_image"], { profile });
    }
  },
});

export const {
  getConfiguration: getSoraConfiguration,
  resolveVariant: resolveSoraVariant,
} = registry;

export const SORA_MODEL_GROUP = Object.freeze({
  copyKey: "sora",
  familyNames: SORA_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: registry.workflowVariants,
  resolveVariant: resolveSoraVariant,
  getVariantOptions: (...args) => registry.getVariantOptions(...args)
    .map((field) => ({ ...field, advanced: false })),
});
