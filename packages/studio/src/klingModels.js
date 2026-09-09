import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const KLING_FAMILY_NAMES = Object.freeze({
  "kling-v3": "Kling 3.0",
  "kling-v3-omni": "Kling 3.0 Omni",
  "kling-o1": "Kling O1",
  "kling-v2.6": "Kling 2.6",
  "kling-v2.5": "Kling 2.5 Turbo",
  "kling-v2.1": "Kling 2.1",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {
    profile: [
      { value: "standard", label: "Standard" },
      { value: "pro", label: "Pro" },
      { value: "fast", label: "Fast" },
      { value: "master", label: "Master" },
    ],
    speed: [
      { value: "standard", label: "Standard" },
      { value: "fast", label: "Fast" },
    ],
  },
  facetLabels: { profile: "Generation", speed: "Speed" },
  registerVariants(register) {
    for (const service of ["standard", "pro", "4k"]) {
      register(`kling-v3.0-${service}-text-to-video`, "kling-v3", [null], { service });
      register(`kling-v3.0-${service}-image-to-video`, "kling-v3", ["animate_image", "keyframes"], { service });
      register(`kling-v3.0-omni-${service}-text-to-video`, "kling-v3-omni", [null], { service });
      register(`kling-v3.0-omni-${service}-image-to-video`, "kling-v3-omni", ["references"], { service });
    }
    for (const service of ["standard", "pro"]) {
      register(`kling-v3-turbo-${service}-text-to-video`, "kling-v3", [null], { service, speed: "fast" });
      register(`kling-v3-turbo-${service}-image-to-video`, "kling-v3", ["animate_image"], { service, speed: "fast" });
      for (const version of ["3.0", "2.6"]) {
        register(`kling-v${version}-${service === "standard" ? "std" : service}-motion-control`,
          version === "3.0" ? "kling-v3" : "kling-v2.6", ["motion_transfer"], { profile: service });
      }
      const stem = `kling-o1${service === "standard" ? "-standard" : ""}`;
      register(`${stem}-image-to-video`, "kling-o1", ["animate_image", "keyframes"], { profile: service });
      register(`${stem}-reference-to-video`, "kling-o1", ["references"], { profile: service });
      register(`${stem}-video-edit`, "kling-o1", ["edit_video"], { profile: service });
      register(`kling-v2.5-turbo-${service === "standard" ? "std" : service}-i2v`,
        "kling-v2.5", ["animate_image"], { profile: service });
      register(`kling-v2.1-${service}-i2v`, "kling-v2.1",
        service === "pro" ? ["animate_image", "keyframes"] : ["animate_image"], { profile: service });
    }
    register("kling-o1-text-to-video", "kling-o1", [null], { profile: "pro" });
    register("kling-o1-video-edit-fast", "kling-o1", ["edit_video"], { profile: "fast" });
    for (const [mode, workflowIds] of [["t2v", [null]], ["i2v", ["animate_image"]]]) {
      register(`kling-v2.6-pro-${mode}`, "kling-v2.6", workflowIds, { profile: "pro" });
    }
    register("kling-v2.5-turbo-pro-t2v", "kling-v2.5", [null], { profile: "pro" });
    register("kling-v2.1-master-t2v", "kling-v2.1", [null], { profile: "master" });
    register("kling-v2.1-master-i2v", "kling-v2.1", ["animate_image"], { profile: "master" });
  },
});

export const {
  getConfiguration: getKlingConfiguration,
  getVariants: getKlingVariants,
  resolveVariant: resolveKlingVariant,
} = registry;

export const KLING_MODEL_GROUP = Object.freeze({
  copyKey: "kling",
  familyNames: KLING_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: registry.workflowVariants,
  resolveVariant: resolveKlingVariant,
  getVariantOptions: (...args) => registry.getVariantOptions(...args)
    .map((field) => ({ ...field, advanced: false })),
});
