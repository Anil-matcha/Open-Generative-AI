import { getModelMediaCapabilities } from "./modelCapabilities.js";
import {
  videoModelCatalog,
  videoModelPickerEntryByVariantId,
} from "./modelFamilies.js";
import { getSeedanceConfiguration } from "./seedanceModels.js";
import {
  GROUPED_VIDEO_WORKFLOW_VARIANTS,
  getGroupedVideoConfiguration,
  resolveGroupedVideoVariant,
} from "./groupedVideoModels.js";

export const VIDEO_WORKFLOW_IDS = Object.freeze([
  "animate_image",
  "keyframes",
  "references",
  "edit_video",
  "extend_uploaded_video",
  "motion_transfer",
]);

const WORKFLOW_DEFINITIONS = Object.freeze({
  animate_image: { id: "animate_image", label: "Animate Image" },
  keyframes: { id: "keyframes", label: "Start & End Frames" },
  references: { id: "references", label: "References" },
  edit_video: { id: "edit_video", label: "Edit Video" },
  extend_uploaded_video: {
    id: "extend_uploaded_video",
    label: "Extend Video",
  },
  motion_transfer: { id: "motion_transfer", label: "Motion Transfer" },
});

const WORKFLOW_REQUIRED_MEDIA = Object.freeze({
  animate_image: Object.freeze({
    startFrame: "Please upload an image to animate.",
  }),
  keyframes: Object.freeze({
    startFrame: "Please upload a start frame.",
    endFrame: "Please upload an end frame.",
  }),
  edit_video: Object.freeze({
    sourceVideo: "Please upload a source video.",
  }),
  extend_uploaded_video: Object.freeze({
    sourceVideo: "Please upload a source video.",
  }),
  motion_transfer: Object.freeze({
    characterImage: "Please upload a character image.",
    drivingVideo: "Please upload a motion video.",
  }),
});

// Opt-in only: models outside this registry retain their existing behavior.
export const VIDEO_WORKFLOW_VARIANTS = Object.freeze({
  "gemini-omni": {
    animate_image: ["gemini-omni-image-to-video"],
    references: ["gemini-omni-image-to-video"],
    edit_video: ["gemini-omni-video-edit"],
  },
  "grok-imagine-video": {
    animate_image: ["grok-imagine-video-1-5-preview"],
    references: ["grok-imagine-image-to-video"],
  },
  "pixverse-6": {
    animate_image: ["pixverse-v6-i2v"],
    keyframes: ["pixverse-v6-transition"],
  },
  "ltx-2.3": {
    animate_image: ["ltx-2.3-image-to-video"],
    extend_uploaded_video: ["ltx-2.3-video-extend"],
  },
  ...GROUPED_VIDEO_WORKFLOW_VARIANTS,
});

function createVariantGroup(variants) {
  const uniqueVariants = [];
  const seen = new Set();
  for (const variant of variants) {
    if (seen.has(variant.model.id)) continue;
    seen.add(variant.model.id);
    uniqueVariants.push(variant);
  }

  return {
    variants: uniqueVariants,
    variantIds: new Set(uniqueVariants.map((variant) => variant.model.id)),
  };
}

function createWorkflowCatalog() {
  const familyById = new Map();

  for (const [familyId, configuredWorkflows] of Object.entries(VIDEO_WORKFLOW_VARIANTS)) {
    const family = videoModelCatalog.familyById.get(familyId);
    if (!family) continue;

    const workflows = [];
    const workflowById = new Map();
    const workflowIdsByVariantId = new Map();
    const workflowVariantIds = new Set();

    for (const workflowId of VIDEO_WORKFLOW_IDS) {
      const variants = (configuredWorkflows[workflowId] || [])
        .map((variantId) => videoModelCatalog.variantById.get(variantId))
        .filter(
          (variant) =>
            variant &&
            videoModelCatalog.familyByVariantId.get(variant.model.id)?.id === familyId,
        );
      if (variants.length === 0) continue;

      const workflow = {
        ...WORKFLOW_DEFINITIONS[workflowId],
        ...createVariantGroup(variants),
      };
      workflows.push(workflow);
      workflowById.set(workflowId, workflow);
      for (const variant of variants) {
        workflowVariantIds.add(variant.model.id);
        const ids = workflowIdsByVariantId.get(variant.model.id) || [];
        ids.push(workflowId);
        workflowIdsByVariantId.set(variant.model.id, ids);
      }
    }

    const base = createVariantGroup(
      family.variants.t2v.filter(
        (variant) =>
          !workflowVariantIds.has(variant.model.id) &&
          !variant.model.requiresRequestId,
      ),
    );

    const unmanagedByMode = new Map();
    const unmanagedVariantIds = new Set();
    for (const mode of ["t2v", "i2v", "v2v"]) {
      const unmanaged = createVariantGroup(
        family.variants[mode].filter(
          (variant) =>
            !base.variantIds.has(variant.model.id) &&
            !workflowVariantIds.has(variant.model.id) &&
            !variant.model.requiresRequestId,
        ),
      );
      if (unmanaged.variants.length > 0) {
        unmanagedByMode.set(mode, unmanaged);
        for (const variant of unmanaged.variants) {
          unmanagedVariantIds.add(variant.model.id);
        }
      }
    }

    familyById.set(familyId, {
      family,
      familyId,
      base,
      hasBase: base.variants.length > 0,
      workflows,
      workflowById,
      workflowIdsByVariantId,
      unmanagedByMode,
      unmanagedVariantIds,
    });
  }

  return { familyById };
}

export const videoWorkflowCatalog = createWorkflowCatalog();

export function getVideoWorkflowFamily(familyId) {
  return videoWorkflowCatalog.familyById.get(familyId) || null;
}

export function getVideoWorkflowControlState(workflowFamilyOrId, variantId = null) {
  const workflowFamily = typeof workflowFamilyOrId === "string"
    ? getVideoWorkflowFamily(workflowFamilyOrId)
    : workflowFamilyOrId;
  if (!workflowFamily) return { kind: "hidden", workflow: null };

  if (variantId && (
    videoModelCatalog.variantById.get(variantId)?.model.requiresRequestId ||
    workflowFamily.unmanagedVariantIds?.has(variantId)
  )) {
    return { kind: "hidden", workflow: null };
  }

  if (!workflowFamily.hasBase && workflowFamily.workflows.length === 1) {
    return { kind: "hidden", workflow: workflowFamily.workflows[0] };
  }
  if (workflowFamily.workflows.length === 1) {
    return { kind: "direct", workflow: workflowFamily.workflows[0] };
  }
  if (workflowFamily.workflows.length > 1) {
    return { kind: "menu", workflow: null };
  }
  return { kind: "hidden", workflow: null };
}

export function getVideoWorkflowControlLabel(workflow) {
  return workflow?.label || "+ Source";
}

export function getVideoWorkflowGroup(familyId, workflowId = null) {
  const workflowFamily = getVideoWorkflowFamily(familyId);
  if (!workflowFamily) return null;
  return workflowId === null
    ? workflowFamily.base
    : workflowFamily.workflowById.get(workflowId) || null;
}

function variantForId(group, variantId) {
  return group?.variantIds.has(variantId)
    ? videoModelCatalog.variantById.get(variantId) || null
    : null;
}

function variantForPickerEntry(group, variantId) {
  const entry = videoModelPickerEntryByVariantId.get(variantId);
  if (!entry) return null;
  return group.variants.find(
    (candidate) => videoModelPickerEntryByVariantId.get(candidate.model.id) === entry,
  ) || null;
}

const COMPATIBILITY_TOKENS = Object.freeze([
  "4k",
  "1080p",
  "720p",
  "480p",
  "pro",
  "standard",
  "std",
  "turbo",
  "fast",
  "lite",
  "open",
  "vip",
  "mini",
  "spicy",
]);

function variantCompatibilityTokens(variantId) {
  const tokens = new Set(variantId.toLowerCase().split(/[^a-z0-9]+/));
  if (tokens.has("std")) tokens.add("standard");
  return COMPATIBILITY_TOKENS.filter((token) => tokens.has(token));
}

function variantForCompatibleId(group, variantId) {
  if (!variantId) return null;
  const expected = new Set(variantCompatibilityTokens(variantId));
  if (expected.size === 0) return null;

  let best = null;
  let bestScore = -Infinity;
  for (const candidate of group.variants) {
    const candidateTokens = new Set(variantCompatibilityTokens(candidate.model.id));
    let matches = 0;
    for (const token of expected) matches += Number(candidateTokens.has(token));
    const extras = [...candidateTokens].filter((token) => !expected.has(token)).length;
    const missing = [...expected].filter((token) => !candidateTokens.has(token)).length;
    const score = matches * 3 - extras - missing;
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

function resolveVariantFromGroup(group, currentVariantId, preferredVariantId) {
  if (!group || group.variants.length === 0) return null;
  return (
    variantForId(group, preferredVariantId) ||
    variantForId(group, currentVariantId) ||
    variantForPickerEntry(group, preferredVariantId) ||
    variantForPickerEntry(group, currentVariantId) ||
    variantForCompatibleId(group, preferredVariantId) ||
    variantForCompatibleId(group, currentVariantId) ||
    group.variants[0]
  );
}

function sameFamilyVariantId(familyId, variantId) {
  return videoModelCatalog.familyByVariantId.get(variantId)?.id === familyId
    ? variantId
    : null;
}

function resolveGroupedWorkflowVariant(
  familyId,
  workflowId,
  group,
  currentVariantId,
  preferredVariantId,
) {
  const current = getGroupedVideoConfiguration(currentVariantId);
  const preferred = getGroupedVideoConfiguration(preferredVariantId);
  const hasCurrent = current?.familyId === familyId;
  const hasPreferred = preferred?.familyId === familyId;
  // Remembering a workflow must not silently change a selected service,
  // speed, or endpoint resolution when the user changes its source mode.
  const canRestorePreferred = hasPreferred && (!hasCurrent || (
    current.profile === preferred.profile &&
    current.speed === preferred.speed &&
    current.resolution === preferred.resolution
  ));
  if (canRestorePreferred) {
    const remembered = variantForId(group, preferredVariantId);
    if (remembered) return remembered;
  }
  const variantId = resolveGroupedVideoVariant({
    familyId,
    workflowId,
    currentModelId: hasCurrent
      ? currentVariantId
      : hasPreferred ? preferredVariantId : null,
  });
  return variantForId(group, variantId);
}

export function resolveVideoWorkflowVariant(
  familyId,
  workflowId,
  currentVariantId = null,
  preferredVariantId = null,
) {
  const group = getVideoWorkflowGroup(familyId, workflowId);
  if (!group) return null;
  if (GROUPED_VIDEO_WORKFLOW_VARIANTS[familyId]) {
    return resolveGroupedWorkflowVariant(
      familyId, workflowId, group, currentVariantId, preferredVariantId,
    );
  }
  return resolveVariantFromGroup(
    group,
    sameFamilyVariantId(familyId, currentVariantId),
    sameFamilyVariantId(familyId, preferredVariantId),
  );
}

export function resolveVideoBaseVariant(
  familyId,
  currentVariantId = null,
  preferredVariantId = null,
) {
  const group = getVideoWorkflowGroup(familyId, null);
  if (!group) return null;
  if (GROUPED_VIDEO_WORKFLOW_VARIANTS[familyId]) {
    return resolveGroupedWorkflowVariant(
      familyId, null, group, currentVariantId, preferredVariantId,
    );
  }
  return resolveVariantFromGroup(
    group,
    sameFamilyVariantId(familyId, currentVariantId),
    sameFamilyVariantId(familyId, preferredVariantId),
  );
}

export function inferVideoWorkflowId(
  familyId,
  variantId,
  { hasEndFrame = false, preferredWorkflowId = null } = {},
) {
  const ids = getVideoWorkflowFamily(familyId)?.workflowIdsByVariantId.get(variantId) || [];
  if (ids.includes(preferredWorkflowId)) return preferredWorkflowId;
  if (hasEndFrame && ids.includes("keyframes")) return "keyframes";
  if (ids.includes("animate_image")) return "animate_image";
  return ids[0] || null;
}

export function resolvePersistedVideoWorkflowSelection(
  variantId,
  storedWorkflowId = null,
  { hasEndFrame = false } = {},
) {
  const family = videoModelCatalog.familyByVariantId.get(variantId) || null;
  const variant = videoModelCatalog.variantById.get(variantId) || null;
  const workflowFamily = family ? getVideoWorkflowFamily(family.id) : null;
  if (!family || !variant || !workflowFamily || variant.model.requiresRequestId) {
    return { family, variant, workflowId: null };
  }

  const storedWorkflow = workflowFamily.workflowById.get(storedWorkflowId);
  const workflowId = storedWorkflow?.variantIds.has(variantId)
    ? storedWorkflowId
    : inferVideoWorkflowId(family.id, variantId, { hasEndFrame });
  if (!workflowId) {
    if (workflowFamily.unmanagedVariantIds.has(variantId)) {
      return { family, variant, workflowId: null };
    }
    const baseVariant = resolveVideoBaseVariant(family.id, variantId);
    return {
      family,
      variant: baseVariant || variant,
      workflowId: null,
    };
  }

  const resolved = resolveVideoWorkflowVariant(family.id, workflowId, variantId);
  return {
    family,
    variant: resolved || variant,
    workflowId: resolved ? workflowId : null,
  };
}

export function getVideoWorkflowMediaConfig(model, workflowId) {
  const capabilities = getModelMediaCapabilities(model);
  const config = {
    imageLimit: capabilities.image.maxItems,
    videoLimit: capabilities.video.maxItems,
    audioLimit: capabilities.audio.maxItems,
    separateEndImage: capabilities.image.separateLastItem,
  };

  if (workflowId === "animate_image") {
    return {
      ...config,
      imageLimit: Math.min(config.imageLimit, 1),
      videoLimit: 0,
      separateEndImage: false,
    };
  }
  if (workflowId === "keyframes") {
    return {
      ...config,
      imageLimit: Math.min(config.imageLimit, 1),
      videoLimit: 0,
      separateEndImage: true,
    };
  }
  if (workflowId === "motion_transfer") {
    return {
      imageLimit: Math.min(config.imageLimit, 1),
      videoLimit: Math.min(config.videoLimit, 1),
      audioLimit: 0,
      separateEndImage: false,
    };
  }
  if (workflowId === "edit_video" || workflowId === "extend_uploaded_video") {
    return {
      ...config,
      imageLimit: workflowId === "extend_uploaded_video" &&
        getSeedanceConfiguration(model?.id)?.familyId === "seedance-2.5"
        ? Math.min(config.imageLimit, 1)
        : config.imageLimit,
      videoLimit: Math.min(config.videoLimit, 1),
      separateEndImage: false,
    };
  }
  return config;
}

function modelFamilyId(model) {
  return videoModelCatalog.familyByVariantId.get(model?.id)?.id || null;
}

function providerField(model, field) {
  if (!field) return null;
  const declaredField = model?.inputs?.[field]?.field;
  return declaredField && !["image", "video", "audio"].includes(declaredField)
    ? declaredField
    : field;
}

function mediaSlot(
  workflowId,
  id,
  mediaType,
  field,
  label,
  description,
  maxItems,
  options = {},
) {
  return Object.freeze({
    id,
    mediaType,
    field,
    label,
    description,
    maxItems,
    required: Boolean(WORKFLOW_REQUIRED_MEDIA[workflowId]?.[id]),
    isArray: false,
    ...options,
  });
}

const VISUAL_REFERENCE_SLOT_IDS = Object.freeze([
  "referenceImages",
  "referenceVideos",
]);
const MULTIMODAL_REFERENCE_SLOT_IDS = Object.freeze([
  "referenceImages",
  "referenceVideos",
  "referenceAudios",
]);
const WAN_REFERENCE_CONSTRAINT = Object.freeze({
  combinedSlotIds: VISUAL_REFERENCE_SLOT_IDS,
  combinedLimit: 5,
  requiredSlotIds: VISUAL_REFERENCE_SLOT_IDS,
  combinedLimitMessage: "Wan 2.7 supports up to 5 references in total.",
});
const MINIMAX_H3_REFERENCE_CONSTRAINT = Object.freeze({
  combinedSlotIds: MULTIMODAL_REFERENCE_SLOT_IDS,
  combinedLimit: 12,
  combinedLimitMessage: "MiniMax H3 supports up to 12 references in total.",
});
const KLING_O1_REFERENCE_CONSTRAINT = Object.freeze({
  combinedSlotIds: VISUAL_REFERENCE_SLOT_IDS,
  combinedLimit: 7,
  // A video reduces the image allowance from seven to four.
  slotWeights: Object.freeze({ referenceVideos: 3 }),
  requiredSlotIds: VISUAL_REFERENCE_SLOT_IDS,
  combinedLimitMessage: "Kling O1 supports up to 4 reference images when a video is included.",
});

export function getVideoWorkflowMediaSlots(model, workflowId) {
  if (!model || !workflowId) return [];
  const capabilities = getModelMediaCapabilities(model);
  const familyId = modelFamilyId(model);
  const imageField = providerField(model, capabilities.image.field);
  const videoField = providerField(model, capabilities.video.field);
  const audioField = providerField(model, capabilities.audio.field);
  const lastImageField = providerField(model, capabilities.image.lastField);
  const createMediaSlot = (...args) => mediaSlot(workflowId, ...args);

  if (workflowId === "animate_image") {
    return [
      imageField && createMediaSlot(
        "startFrame",
        "image",
        imageField,
        "Image",
        "Image to animate",
        1,
        { isArray: capabilities.image.isArray },
      ),
      audioField && createMediaSlot(
        "referenceAudios",
        "audio",
        audioField,
        "Audio",
        "Guiding audio",
        Math.max(capabilities.audio.maxItems, 1),
        { isArray: capabilities.audio.isArray },
      ),
    ].filter(Boolean);
  }
  if (workflowId === "keyframes") {
    if (!imageField) return [];
    const sharedArrayField = capabilities.image.isArray &&
      (!lastImageField || lastImageField === imageField);
    return [
      createMediaSlot(
        "startFrame",
        "image",
        imageField,
        "Start",
        "Start frame",
        1,
        sharedArrayField
          ? { index: 0, isArray: true }
          : { isArray: capabilities.image.isArray },
      ),
      createMediaSlot(
        "endFrame",
        "image",
        sharedArrayField ? imageField : lastImageField,
        "End",
        "End frame",
        1,
        sharedArrayField ? { index: 1, isArray: true } : {},
      ),
      audioField && createMediaSlot(
        "referenceAudios",
        "audio",
        audioField,
        "Audio",
        "Guiding audio",
        Math.max(capabilities.audio.maxItems, 1),
        { isArray: capabilities.audio.isArray },
      ),
    ].filter((slot) => slot?.field);
  }
  if (workflowId === "references") {
    if (familyId === "wan-2.7") {
      return [
        createMediaSlot(
          "anchorImage",
          "image",
          "image_url",
          "Start",
          "Start frame",
          1,
          { acceptDrop: false },
        ),
        createMediaSlot(
          "referenceImages",
          "image",
          "images_list",
          "Image",
          "Reference images",
          4,
          { isArray: true, ...WAN_REFERENCE_CONSTRAINT },
        ),
        createMediaSlot(
          "referenceVideos",
          "video",
          "videos_list",
          "Video",
          "Reference videos",
          4,
          { isArray: true, ...WAN_REFERENCE_CONSTRAINT },
        ),
      ];
    }
    const minimaxReferenceConstraint = familyId === "minimax-h3" ? {
      ...MINIMAX_H3_REFERENCE_CONSTRAINT,
      // Open H3 and LoRA support standalone audio references.
      requiredSlotIds: getGroupedVideoConfiguration(model.id)?.service === "official"
        ? VISUAL_REFERENCE_SLOT_IDS : MULTIMODAL_REFERENCE_SLOT_IDS,
    } : {};
    return [
      imageField && createMediaSlot(
        "referenceImages",
        "image",
        imageField,
        "Image",
        "Reference images",
        Math.max(capabilities.image.maxItems, 1),
        {
          isArray: capabilities.image.isArray,
          ...((getGroupedVideoConfiguration(model.id) &&
            model.inputs?.[capabilities.image.field]?.minItems > 0) ||
            model.id === "veo3.1-reference-to-video"
            ? {
              required: true,
              minItems: model.inputs?.[capabilities.image.field]?.minItems || 1,
              requiredMessage: "Please add a reference image.",
            }
            : {}),
          ...minimaxReferenceConstraint,
          ...(familyId === "kling-o1" && videoField
            ? KLING_O1_REFERENCE_CONSTRAINT
            : {}),
        },
      ),
      videoField && createMediaSlot(
        "referenceVideos",
        "video",
        videoField,
        "Video",
        "Reference videos",
        Math.max(capabilities.video.maxItems, 1),
        {
          isArray: capabilities.video.isArray,
          ...minimaxReferenceConstraint,
          ...(familyId === "kling-o1"
            ? KLING_O1_REFERENCE_CONSTRAINT
            : {}),
        },
      ),
      audioField && createMediaSlot(
        "referenceAudios",
        "audio",
        audioField,
        "Audio",
        "Reference audio",
        Math.max(capabilities.audio.maxItems, 1),
        {
          isArray: capabilities.audio.isArray,
          ...minimaxReferenceConstraint,
        },
      ),
    ].filter(Boolean);
  }
  if (workflowId === "edit_video") {
    return [
      videoField && createMediaSlot(
        "sourceVideo",
        "video",
        videoField,
        "Video",
        "Video to edit",
        1,
        { isArray: capabilities.video.isArray },
      ),
      imageField && createMediaSlot(
        "referenceImages",
        "image",
        imageField,
        "Image",
        "Reference images",
        Math.max(capabilities.image.maxItems, 1),
        { isArray: capabilities.image.isArray },
      ),
      audioField && createMediaSlot(
        "referenceAudios",
        "audio",
        audioField,
        "Audio",
        "Reference audio",
        Math.max(capabilities.audio.maxItems, 1),
        { isArray: capabilities.audio.isArray },
      ),
    ].filter(Boolean);
  }
  if (workflowId === "extend_uploaded_video") {
    return [
      videoField && createMediaSlot(
        "sourceVideo",
        "video",
        videoField,
        "Video",
        "Video to extend",
        1,
        { isArray: capabilities.video.isArray },
      ),
      familyId === "seedance-2.5" && lastImageField && createMediaSlot(
        "endFrame",
        "image",
        lastImageField,
        "End",
        "Optional target frame for the continuation",
        1,
      ),
      audioField && createMediaSlot(
        "referenceAudios",
        "audio",
        audioField,
        "Audio",
        "Reference audio",
        1,
        { isArray: capabilities.audio.isArray },
      ),
    ].filter(Boolean);
  }
  if (workflowId === "motion_transfer") {
    return [
      imageField && createMediaSlot(
        "characterImage",
        "image",
        imageField,
        "Character",
        "Character image",
        1,
        { isArray: capabilities.image.isArray },
      ),
      videoField && createMediaSlot(
        "drivingVideo",
        "video",
        videoField,
        "Motion",
        "Motion source video",
        1,
        { isArray: capabilities.video.isArray },
      ),
    ].filter(Boolean);
  }
  return [];
}

export function getVideoWorkflowDraftKey(familyId, workflowId) {
  return `${familyId}:${workflowId}`;
}

export function migrateVideoWorkflowMediaDrafts(drafts) {
  // Omni references used to share Kling 3.0's draft before becoming a separate model.
  const { "kling-v3:references": omniReferences, ...migrated } = drafts;
  const key = getVideoWorkflowDraftKey("kling-v3-omni", "references");
  if (omniReferences && !Object.hasOwn(migrated, key)) migrated[key] = omniReferences;
  return migrated;
}

export function appendVideoWorkflowMedia(
  drafts,
  draftKey,
  slot,
  urls,
  capacityMedia = null,
) {
  const currentDraft = drafts[draftKey] || {};
  const currentValues = currentDraft[slot.id] || [];
  const remaining = getVideoWorkflowSlotRemaining(
    slot,
    capacityMedia || currentDraft,
  );
  const existingUrls = new Set(currentValues);
  const additions = [...new Set((urls || []).filter(Boolean))]
    .filter((url) => !existingUrls.has(url))
    .slice(0, remaining);
  if (additions.length === 0) return drafts;
  return {
    ...drafts,
    [draftKey]: {
      ...currentDraft,
      [slot.id]: [...currentValues, ...additions],
    },
  };
}

export function removeVideoWorkflowMedia(drafts, draftKey, slotId, index) {
  const currentDraft = drafts[draftKey] || {};
  const values = currentDraft[slotId] || [];
  return {
    ...drafts,
    [draftKey]: {
      ...currentDraft,
      [slotId]: values.filter((_, itemIndex) => itemIndex !== index),
    },
  };
}

const LEGACY_MEDIA_KEYS = Object.freeze({
  startFrame: "imageUrls",
  endFrame: "endImageUrl",
  anchorImage: "anchorImageUrl",
  referenceImages: "imageUrls",
  referenceVideos: "videoUrls",
  referenceAudios: "audioUrls",
  sourceVideo: "videoUrls",
  characterImage: "imageUrls",
  drivingVideo: "videoUrls",
});

function mediaValues(media, slotId) {
  if (Object.prototype.hasOwnProperty.call(media || {}, slotId)) {
    const value = media[slotId];
    return (Array.isArray(value) ? value : [value]).filter(Boolean);
  }
  const legacyValue = media?.[LEGACY_MEDIA_KEYS[slotId]];
  return (Array.isArray(legacyValue) ? legacyValue : [legacyValue]).filter(Boolean);
}

export function projectVideoWorkflowMedia(model, workflowId, media = {}) {
  const projected = {};
  for (const slot of getVideoWorkflowMediaSlots(model, workflowId)) {
    const values = mediaValues(media, slot.id).slice(0, slot.maxItems);
    if (values.length > 0) projected[slot.id] = values;
  }
  return projected;
}

export function getVideoWorkflowMediaAdjustments(currentModel, nextModel, workflowId, media) {
  const current = projectVideoWorkflowMedia(currentModel, workflowId, media);
  const next = projectVideoWorkflowMedia(nextModel, workflowId, media);
  const counts = {};
  for (const slot of getVideoWorkflowMediaSlots(currentModel, workflowId)) {
    const count = counts[slot.mediaType] ||= { from: 0, to: 0 };
    count.from += current[slot.id]?.length || 0;
    count.to += next[slot.id]?.length || 0;
  }
  return Object.entries(counts)
    .filter(([, { from, to }]) => from > to)
    .map(([type, { from, to }]) => ({
      key: `${type}${to === 0 ? "Unused" : "Count"}`, from, to,
    }));
}

export function getVideoWorkflowSlotRemaining(slot, media = {}) {
  if (!slot) return 0;
  const ownRemaining = Math.max(
    slot.maxItems - mediaValues(media, slot.id).length,
    0,
  );
  if (!slot.combinedLimit || !slot.combinedSlotIds) return ownRemaining;
  const combinedCount = combinedMediaCount(media, slot.combinedSlotIds, slot.slotWeights);
  return Math.min(
    ownRemaining,
    Math.max(Math.floor((slot.combinedLimit - combinedCount) / (slot.slotWeights?.[slot.id] || 1)), 0),
  );
}

export function legacyVideoMediaToWorkflowDraft(model, workflowId, media = {}) {
  const draft = {};
  for (const slot of getVideoWorkflowMediaSlots(model, workflowId)) {
    const values = mediaValues(media, slot.id).slice(0, slot.maxItems);
    if (values.length > 0) draft[slot.id] = values;
  }
  return draft;
}

function mediaCount(media, slotId) {
  return mediaValues(media, slotId).length;
}

function combinedMediaCount(media, slotIds, slotWeights) {
  return slotIds.reduce(
    (total, slotId) => total + mediaCount(media, slotId) * (slotWeights?.[slotId] || 1),
    0,
  );
}

export function validateVideoWorkflowMedia(workflowId, media = {}, model = null) {
  const slots = getVideoWorkflowMediaSlots(model, workflowId);
  const activeMedia = model
    ? projectVideoWorkflowMedia(model, workflowId, media)
    : media;
  for (const [slotId, message] of Object.entries(
    WORKFLOW_REQUIRED_MEDIA[workflowId] || {},
  )) {
    if (mediaCount(activeMedia, slotId) === 0) {
      return { valid: false, message };
    }
  }
  for (const slot of slots) {
    if (slot.minItems && mediaCount(activeMedia, slot.id) < slot.minItems) {
      return { valid: false, message: slot.requiredMessage };
    }
  }

  if (workflowId === "references") {
    const combinedConstraint = slots.find(
      (slot) => slot.combinedLimit && slot.combinedSlotIds,
    );
    const requiredSlotIds = combinedConstraint?.requiredSlotIds ||
      MULTIMODAL_REFERENCE_SLOT_IDS;
    const requiredCount = requiredSlotIds.reduce(
      (total, slotId) => total + mediaCount(activeMedia, slotId),
      0,
    );
    if (requiredCount === 0) {
      return { valid: false, message: "Please add at least one reference." };
    }
    if (combinedConstraint) {
      const combinedCount = combinedMediaCount(
        activeMedia,
        combinedConstraint.combinedSlotIds,
        combinedConstraint.slotWeights,
      );
      if (combinedCount > combinedConstraint.combinedLimit) {
        return {
          valid: false,
          message: combinedConstraint.combinedLimitMessage,
        };
      }
    }
  }
  return { valid: true, message: "" };
}

export function buildVideoWorkflowMediaParams(model, workflowId, media = {}) {
  const payload = {};
  const activeMedia = projectVideoWorkflowMedia(model, workflowId, media);
  for (const slot of getVideoWorkflowMediaSlots(model, workflowId)) {
    const values = mediaValues(activeMedia, slot.id);
    if (!slot.field || values.length === 0) continue;
    if (slot.index !== undefined) {
      const current = Array.isArray(payload[slot.field]) ? payload[slot.field] : [];
      current[slot.index] = values[0];
      payload[slot.field] = current;
    } else if (slot.isArray) {
      payload[slot.field] = values;
    } else {
      payload[slot.field] = values[0];
    }
  }
  for (const [field, value] of Object.entries(payload)) {
    if (Array.isArray(value)) payload[field] = value.filter(Boolean);
  }
  return payload;
}
