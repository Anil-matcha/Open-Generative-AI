import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const VEO_FAMILY_NAMES = Object.freeze({
  "veo-4": "Veo 4",
  "veo-3.1": "Veo 3.1",
  "veo-3": "Veo 3",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {
    speed: [
      { value: "standard", label: "Standard" },
      { value: "fast", label: "Fast" },
      { value: "lite", label: "Lite" },
    ],
  },
  facetLabels: { speed: "Speed" },
  registerVariants(register) {
    // Generation variants only. Extension and 4K upscaling require a previous
    // request ID and remain separate tools in the model menu.
    for (const [familyId, prefix, speeds] of [
      ["veo-3", "veo3", ["standard", "fast"]],
      ["veo-3.1", "veo3.1", ["standard", "fast", "lite"]],
      ["veo-4", "veo-4", ["standard"]],
    ]) {
      for (const speed of speeds) {
        const stem = `${prefix}${speed === "standard" ? "" : `-${speed}`}`;
        register(`${stem}-text-to-video`, familyId, [null], { speed });
        register(`${stem}-image-to-video`, familyId,
          familyId === "veo-3.1" ? ["animate_image", "keyframes"] : ["animate_image"], { speed });
      }
    }
    register("veo3.1-reference-to-video", "veo-3.1", ["references"]);
  },
});

const tools = new Map([
  ["veo3.1-extend-video", { key: "continueGenerated", order: 0 }],
  ["veo3.1-4k-video", { key: "upscale", order: 1 }],
]);

export function getVeoToolConfiguration(modelId) {
  return tools.get(modelId);
}

export const {
  workflowVariants: VEO_WORKFLOW_VARIANTS,
  getConfiguration: getVeoConfiguration,
  getVariantOptions: getVeoVariantOptions,
} = registry;

export function resolveVeoVariant(options) {
  const { changes = {} } = options;
  if (Object.keys(changes).some((key) => key !== "speed")) return null;
  return registry.resolveVariant({ ...options, changes: changes.speed == null ? {} : changes });
}

export const VEO_MODEL_GROUP = Object.freeze({
  copyKey: "veo",
  familyNames: VEO_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: VEO_WORKFLOW_VARIANTS,
  resolveVariant: resolveVeoVariant,
  getVariantOptions: getVeoVariantOptions,
});
