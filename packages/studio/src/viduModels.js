import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const VIDU_FAMILY_NAMES = Object.freeze({
  "vidu-q3": "Vidu Q3",
  "vidu-q2": "Vidu Q2",
  "vidu-q1": "Vidu Q1",
  "vidu-2": "Vidu 2.0",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {
    speed: [
      { value: "standard", label: "Standard speed" },
      { value: "fast", label: "Fast" },
    ],
  },
  facetLabels: { speed: "Speed" },
  registerVariants(register) {
    for (const version of ["q3", "q2"]) {
      const familyId = `vidu-${version}`;
      for (const [service, speed] of [["pro", "standard"], ["turbo", "fast"]]) {
        const stem = `${familyId}-${service}`;
        register(`${stem}-text-to-video`, familyId, [null], { speed });
        register(`${stem}-image-to-video`, familyId, ["animate_image"], { speed });
        register(`${stem}-${version === "q3" ? "first-last-frames" : "start-end-video"}`,
          familyId, ["keyframes"], { speed });
      }
    }
    register("vidu-q2-reference", "vidu-q2", ["references"]);
    register("vidu-q1-reference", "vidu-q1", ["references"]);
    register("vidu-v2.0-t2v", "vidu-2", [null]);
    register("vidu-v2.0-i2v", "vidu-2", ["animate_image", "keyframes"]);
  },
});

export const {
  getConfiguration: getViduConfiguration,
  resolveVariant: resolveViduVariant,
} = registry;

export const VIDU_MODEL_GROUP = Object.freeze({
  copyKey: "vidu",
  familyNames: VIDU_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: registry.workflowVariants,
  resolveVariant: resolveViduVariant,
  getVariantOptions: registry.getVariantOptions,
});
