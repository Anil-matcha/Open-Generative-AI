import { i2vModels, t2vModels } from "./models.js";

export const VEO_FAMILY_NAMES = Object.freeze({
  "veo-4": "Veo 4",
  "veo-3.1": "Veo 3.1",
  "veo-3": "Veo 3",
});

const SPEED_OPTIONS = Object.freeze([
  { value: "standard", label: "Standard" },
  { value: "fast", label: "Fast" },
  { value: "lite", label: "Lite" },
]);
const EMPTY_OPTIONS = Object.freeze([]);
const modelIds = new Set([...t2vModels, ...i2vModels].map((model) => model.id));
const configurations = new Map();
const selectionIndex = new Map();

function register(modelId, familyId, speed, workflowIds) {
  if (!modelIds.has(modelId)) return;
  configurations.set(modelId, Object.freeze({
    familyId, speed, workflowIds: Object.freeze(workflowIds),
  }));
  let workflows = selectionIndex.get(familyId);
  if (!workflows) selectionIndex.set(familyId, workflows = new Map());
  for (const workflowId of workflowIds) {
    let variants = workflows.get(workflowId);
    if (!variants) workflows.set(workflowId, variants = new Map());
    variants.set(speed, modelId);
  }
}

// Generation variants only. Extension and 4K upscaling require a previous
// request ID and remain separate tools in the model menu.
for (const [familyId, prefix, speeds] of [
  ["veo-3", "veo3", ["standard", "fast"]],
  ["veo-3.1", "veo3.1", ["standard", "fast", "lite"]],
  ["veo-4", "veo-4", ["standard"]],
]) {
  for (const speed of speeds) {
    const stem = `${prefix}${speed === "standard" ? "" : `-${speed}`}`;
    register(`${stem}-text-to-video`, familyId, speed, [null]);
    register(`${stem}-image-to-video`, familyId, speed,
      familyId === "veo-3.1" ? ["animate_image", "keyframes"] : ["animate_image"]);
  }
}
register("veo3.1-reference-to-video", "veo-3.1", "standard", ["references"]);

const tools = new Map([
  ["veo3.1-extend-video", { key: "continueGenerated", order: 0 }],
  ["veo3.1-4k-video", { key: "upscale", order: 1 }],
]);

export function getVeoToolConfiguration(modelId) {
  return tools.get(modelId);
}

export const VEO_WORKFLOW_VARIANTS = Object.freeze(Object.fromEntries(
  [...selectionIndex].map(([familyId, workflows]) => [familyId, Object.freeze(Object.fromEntries(
    [...workflows].filter(([workflowId]) => workflowId !== null)
      .map(([workflowId, variants]) => [workflowId, Object.freeze([...variants.values()])]),
  ))]),
));

export function getVeoConfiguration(modelId) {
  return configurations.get(modelId) || null;
}

export function resolveVeoVariant({
  familyId, workflowId = null, currentModelId = null, changes = {},
}) {
  if (Object.keys(changes).some((key) => key !== "speed")) return null;
  const variants = selectionIndex.get(familyId)?.get(workflowId);
  if (!variants) return null;
  const current = getVeoConfiguration(currentModelId);
  const speed = changes.speed ?? (current?.familyId === familyId ? current.speed : "standard");
  return variants.get(speed) || null;
}

export function getVeoVariantOptions(familyId, workflowId = null, currentModelId = null) {
  const variants = selectionIndex.get(familyId)?.get(workflowId);
  if (!variants || variants.size < 2) return EMPTY_OPTIONS;
  const current = getVeoConfiguration(currentModelId);
  return [{
    key: "speed",
    label: "Speed",
    value: current?.familyId === familyId ? current.speed : "standard",
    options: SPEED_OPTIONS.filter((option) => variants.has(option.value)),
  }];
}

export const VEO_MODEL_GROUP = Object.freeze({
  familyNames: VEO_FAMILY_NAMES,
  configurations,
  workflowVariants: VEO_WORKFLOW_VARIANTS,
  resolveVariant: resolveVeoVariant,
  getVariantOptions: getVeoVariantOptions,
});
