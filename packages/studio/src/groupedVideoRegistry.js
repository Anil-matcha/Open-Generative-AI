import { i2vModels, t2vModels, v2vModels } from "./models.js";

const MODEL_IDS = new Set([...t2vModels, ...i2vModels, ...v2vModels].map((model) => model.id));
const EMPTY_OPTIONS = Object.freeze([]);

function coordinateKey({ profile, speed }) {
  return `${profile}\u0000${speed}`;
}

export function createGroupedVideoRegistry({ facetOptions, facetLabels, registerVariants }) {
  const configurations = new Map();
  const selectionIndex = new Map();

  registerVariants((modelId, familyId, workflowIds, facets = {}) => {
    if (!MODEL_IDS.has(modelId)) return;
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
  });

  for (const workflows of selectionIndex.values()) {
    for (const group of workflows.values()) {
      Object.freeze(group.modelIds);
      group.fields = Object.entries(facetOptions).flatMap(([key, options]) => {
        const values = new Set(group.modelIds.map((modelId) => configurations.get(modelId)[key]));
        return values.size > 1 ? [{
          key, label: facetLabels[key],
          options: Object.freeze(options.filter((option) => values.has(option.value))),
        }] : [];
      });
    }
  }

  const workflowVariants = Object.freeze(Object.fromEntries(
    [...selectionIndex].map(([familyId, workflows]) => [familyId, Object.freeze(Object.fromEntries(
      [...workflows].filter(([workflowId]) => workflowId !== null)
        .map(([workflowId, group]) => [workflowId, group.modelIds]),
    ))]),
  ));

  function getConfiguration(modelId) {
    return configurations.get(modelId) || null;
  }

  function getVariants(familyId, workflowId = null) {
    return selectionIndex.get(familyId)?.get(workflowId)?.modelIds || EMPTY_OPTIONS;
  }

  function resolveVariant({ familyId, workflowId = null, currentModelId = null, changes = {} }) {
    if (Object.keys(changes).some((key) => key !== "profile" && key !== "speed")) return null;
    const group = selectionIndex.get(familyId)?.get(workflowId);
    if (!group) return null;
    const current = getConfiguration(currentModelId);
    const selected = current?.familyId === familyId ? current : group.defaultConfiguration;
    const key = coordinateKey({ ...selected, ...changes });
    const services = group.variants.get(key);
    if (!services) return null;
    if (current?.familyId === familyId && current.workflowIds.includes(workflowId) &&
        coordinateKey(current) === key) return currentModelId;
    return services.get(selected.service) || services.values().next().value;
  }

  function getVariantOptions(familyId, workflowId = null, currentModelId = null) {
    const group = selectionIndex.get(familyId)?.get(workflowId);
    if (!group) return EMPTY_OPTIONS;
    const current = getConfiguration(currentModelId);
    const selected = current?.familyId === familyId ? current : group.defaultConfiguration;
    return group.fields.map((field) => ({ ...field, value: selected[field.key] }));
  }

  return { configurations, workflowVariants, getConfiguration, getVariants, resolveVariant, getVariantOptions };
}
