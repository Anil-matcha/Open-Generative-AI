import { createGroupedVideoRegistry } from "./groupedVideoRegistry.js";

export const ALIBABA_FAMILY_NAMES = Object.freeze({
  "wan-3": "Wan 3.0",
  "wan-2.7": "Wan 2.7",
  "wan-2.6": "Wan 2.6",
  "wan-2.5": "Wan 2.5",
  "wan-2.2": "Wan 2.2",
  "wan-2.1": "Wan 2.1",
});

const registry = createGroupedVideoRegistry({
  facetOptions: {
    profile: [
      { value: "standard", label: "Standard" },
      { value: "prime", label: "Prime" },
      { value: "spicy", label: "Spicy" },
    ],
    speed: [
      { value: "standard", label: "Standard" },
      { value: "fast", label: "Fast" },
    ],
  },
  facetLabels: { profile: "Model", speed: "Speed" },
  registerVariants(register) {
    for (const profile of ["standard", "prime", "spicy"]) {
      const stem = `wan3.0${profile === "standard" ? "" : `-${profile}`}`;
      register(`${stem}-text-to-video`, "wan-3", [null], { profile });
      register(`${stem}-image-to-video`, "wan-3", ["animate_image", "keyframes"], { profile });
      register(`${stem}-reference-to-video`, "wan-3", ["references"], { profile });
    }

    for (const version of ["2.7", "2.6", "2.5", "2.2", "2.1"]) {
      const stem = `wan${version}`;
      const familyId = `wan-${version}`;
      register(`${stem}-text-to-video`, familyId, [null]);
      register(`${stem}-image-to-video`, familyId,
        version === "2.7" || version === "2.2" ? ["animate_image", "keyframes"] : ["animate_image"]);
    }

    for (const version of ["2.7", "2.6"]) {
      register(`wan${version}-image-to-video-spicy`, `wan-${version}`, ["animate_image"], { profile: "spicy" });
    }
    for (const mode of ["text", "image"]) {
      register(`wan2.5-${mode}-to-video-fast`, "wan-2.5", mode === "text" ? [null] : ["animate_image"], { speed: "fast" });
    }

    register("wan2.7-reference-to-video", "wan-2.7", ["references"]);
    register("wan2.7-video-edit", "wan-2.7", ["edit_video"]);
    register("wan2.7-video-extend", "wan-2.7", ["extend_uploaded_video"]);
    register("wan2.2-5b-fast-t2v", "wan-2.2", [null], { speed: "fast" });
    register("wan2.2-spicy-image-to-video", "wan-2.2", ["animate_image"], { profile: "spicy" });
    register("wan2.2-edit-video", "wan-2.2", ["edit_video"]);
    register("wan2.2-spicy-video-extend", "wan-2.2", ["extend_uploaded_video"], { profile: "spicy" });
    register("wan2.2-animate", "wan-2.2", ["motion_transfer"]);
    register("wan2.1-reference-video", "wan-2.1", ["references"]);
  },
});

export const {
  workflowVariants: ALIBABA_WORKFLOW_VARIANTS,
  getConfiguration: getAlibabaConfiguration,
  getVariants: getAlibabaVariants,
  resolveVariant: resolveAlibabaVariant,
  getVariantOptions: getAlibabaVariantOptions,
} = registry;

export const ALIBABA_MODEL_GROUP = Object.freeze({
  copyKey: "alibaba",
  familyNames: ALIBABA_FAMILY_NAMES,
  configurations: registry.configurations,
  workflowVariants: ALIBABA_WORKFLOW_VARIANTS,
  resolveVariant: resolveAlibabaVariant,
  getVariantOptions: getAlibabaVariantOptions,
});
