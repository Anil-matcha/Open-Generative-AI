import { i2vModels, t2vModels } from "./models.js";

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
const EMPTY_OPTIONS = Object.freeze([]);
const modelIds = new Set([...t2vModels, ...i2vModels].map((model) => model.id));
const configurations = new Map();
const selectionIndex = new Map();

function coordinateKey({ profile, speed }) {
  return `${profile}\u0000${speed}`;
}

function register(modelId, familyId, workflowIds, facets = {}) {
  if (!modelIds.has(modelId)) return;
  const config = Object.freeze({
    familyId, profile: "standard", speed: "standard", service: "standard",
    ...facets, workflowIds: Object.freeze(workflowIds),
  });
  configurations.set(modelId, config);
  let workflows = selectionIndex.get(familyId);
  if (!workflows) selectionIndex.set(familyId, workflows = new Map());
  for (const workflowId of workflowIds) {
    let group = workflows.get(workflowId);
    if (!group) {
      group = { modelIds: [], variants: new Map(), defaultConfiguration: config };
      workflows.set(workflowId, group);
    }
    group.modelIds.push(modelId);
    const key = coordinateKey(config);
    let services = group.variants.get(key);
    if (!services) group.variants.set(key, services = new Map());
    services.set(config.service, modelId);
  }
}

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

for (const workflows of selectionIndex.values()) {
  for (const group of workflows.values()) {
    Object.freeze(group.modelIds);
    group.fields = Object.entries(FACET_OPTIONS).flatMap(([key, options]) => {
      const values = new Set(group.modelIds.map((modelId) => configurations.get(modelId)[key]));
      return values.size > 1 ? [{
        key, label: FACET_LABELS[key],
        options: Object.freeze(options.filter((option) => values.has(option.value))),
      }] : [];
    });
  }
}

export const MINIMAX_WORKFLOW_VARIANTS = Object.freeze(Object.fromEntries(
  [...selectionIndex].map(([familyId, workflows]) => [familyId, Object.freeze(Object.fromEntries(
    [...workflows].filter(([workflowId]) => workflowId !== null)
      .map(([workflowId, group]) => [workflowId, group.modelIds]),
  ))]),
));

export function getMiniMaxConfiguration(modelId) {
  return configurations.get(modelId) || null;
}

export function getMiniMaxVariants(familyId, workflowId = null) {
  return selectionIndex.get(familyId)?.get(workflowId)?.modelIds || EMPTY_OPTIONS;
}

export function resolveMiniMaxVariant({
  familyId, workflowId = null, currentModelId = null, changes = {},
}) {
  if (Object.keys(changes).some((key) => key !== "profile" && key !== "speed")) return null;
  const group = selectionIndex.get(familyId)?.get(workflowId);
  if (!group) return null;
  const current = getMiniMaxConfiguration(currentModelId);
  const selected = current?.familyId === familyId ? current : group.defaultConfiguration;
  const key = coordinateKey({ ...selected, ...changes });
  const services = group.variants.get(key);
  if (!services) return null;
  if (current?.familyId === familyId && current.workflowIds.includes(workflowId) &&
      coordinateKey(current) === key) return currentModelId;
  return services.get(selected.service) || services.values().next().value;
}

export function getMiniMaxVariantOptions(familyId, workflowId = null, currentModelId = null) {
  const group = selectionIndex.get(familyId)?.get(workflowId);
  if (!group) return EMPTY_OPTIONS;
  const current = getMiniMaxConfiguration(currentModelId);
  const selected = current?.familyId === familyId ? current : group.defaultConfiguration;
  return group.fields.map((field) => ({ ...field, value: selected[field.key] }));
}

export const MINIMAX_MODEL_GROUP = Object.freeze({
  copyKey: "minimax",
  familyNames: MINIMAX_FAMILY_NAMES,
  configurations,
  workflowVariants: MINIMAX_WORKFLOW_VARIANTS,
  resolveVariant: resolveMiniMaxVariant,
  getVariantOptions: getMiniMaxVariantOptions,
});
