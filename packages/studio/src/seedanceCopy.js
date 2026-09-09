import { getVideoWorkflowMediaSlots } from "./videoWorkflows.js";

export function getSeedanceModeDescription(model, workflowId, copy) {
  const description = copy.modeDescriptions[workflowId || "text"];
  if (workflowId !== "references" || !model) return description;

  const media = getVideoWorkflowMediaSlots(model, workflowId)
    .map((slot) => copy.referenceMediaTypes[slot.mediaType])
    .join(" · ");
  return `${description} ${copy.referenceSupport.replace("{media}", media)}`;
}
