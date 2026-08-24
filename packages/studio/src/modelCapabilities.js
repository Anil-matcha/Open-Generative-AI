const MEDIA_CONFIG = {
  image: {
    explicitField: "imageField",
    explicitMax: "maxImages",
    fields: [
      "images_list",
      "image_urls",
      "reference_images",
      "image_url",
      "start_image_url",
      "first_image_url",
    ],
    singularParam: "image_url",
    pluralParam: "images_list",
  },
  video: {
    explicitField: "videoField",
    explicitMax: "maxVideos",
    fields: [
      "videos_list",
      "video_files",
      "video_urls",
      "reference_videos",
      "video_url",
    ],
    singularParam: "video_url",
    pluralParam: "videos_list",
  },
  audio: {
    explicitField: "audioField",
    explicitMax: "maxAudios",
    fields: [
      "audios_list",
      "audio_files",
      "audio_urls",
      "reference_audios",
      "audio_url",
    ],
    singularParam: "audio_url",
    pluralParam: "audios_list",
  },
};

function uniqueUrls(urls) {
  return [...new Set((urls || []).filter(Boolean))];
}

export function getMediaCapability(model, mediaType) {
  const config = MEDIA_CONFIG[mediaType];
  if (!config || !model) {
    return {
      field: null,
      maxItems: 0,
      isArray: false,
      separateLastItem: false,
      lastField: null,
    };
  }

  const explicitField = model[config.explicitField];
  const schemaField = Object.entries(model.inputs || {}).find(
    ([, input]) => input?.field === mediaType,
  )?.[0];
  const field =
    explicitField ||
    config.fields.find((name) => model.inputs?.[name]) ||
    schemaField ||
    null;
  const input = field ? model.inputs?.[field] : null;
  const isArray = input?.type === "array" || /(?:_list|_urls|_files)$/.test(field || "");
  const explicitMax = model[config.explicitMax];
  let maxItems = field
    ? (explicitMax || (isArray ? input?.maxItems || input?.max_items || 1 : 1))
    : 0;

  const lastField = mediaType === "image"
    ? model.lastImageField ||
      ["last_image", "last_image_url", "end_image_url"].find(
        (name) => model.inputs?.[name],
      ) ||
      null
    : null;
  const separateLastItem = !!lastField;
  if (separateLastItem) maxItems = Math.max(maxItems, 2);

  return { field, maxItems, isArray, separateLastItem, lastField };
}

export function getModelMediaCapabilities(model) {
  return {
    image: getMediaCapability(model, "image"),
    video: getMediaCapability(model, "video"),
    audio: getMediaCapability(model, "audio"),
  };
}

export function shouldDisableVideoPrompt(model, mode) {
  return Boolean(
    model && mode === "v2v" && !model.hasPrompt && !model.imageField,
  );
}

export function buildReferenceParams(
  model,
  { imageUrls = [], endImageUrl = null, videoUrls = [], audioUrls = [] } = {},
) {
  const capabilities = getModelMediaCapabilities(model);
  const params = {};

  const images = uniqueUrls(imageUrls).slice(0, capabilities.image.maxItems);
  if (capabilities.image.field && images.length > 0) {
    if (capabilities.image.separateLastItem) {
      params.image_url = images[0];
      const lastImage = endImageUrl || images[1];
      if (lastImage) params.last_image = lastImage;
    } else if (capabilities.image.isArray) {
      params.images_list = images;
    } else {
      params.image_url = images[0];
    }
  }

  const videos = uniqueUrls(videoUrls).slice(0, capabilities.video.maxItems);
  if (capabilities.video.field && videos.length > 0) {
    params[capabilities.video.isArray ? "videos_list" : "video_url"] =
      capabilities.video.isArray ? videos : videos[0];
  }

  const audios = uniqueUrls(audioUrls).slice(0, capabilities.audio.maxItems);
  if (capabilities.audio.field && audios.length > 0) {
    params[capabilities.audio.isArray ? "audios_list" : "audio_url"] =
      capabilities.audio.isArray ? audios : audios[0];
  }

  return params;
}

function normalizedUrls(params, capability, singularParam, pluralParam) {
  if (!capability.field) return [];
  const direct = params[capability.field];
  if (Array.isArray(direct) && direct.length > 0) return direct;
  if (direct) return [direct];
  const plural = params[pluralParam];
  if (Array.isArray(plural) && plural.length > 0) return plural;
  const singular = params[singularParam];
  return singular ? [singular] : [];
}

function mediaTypeForInput(inputName, input) {
  for (const [mediaType, config] of Object.entries(MEDIA_CONFIG)) {
    if (
      input?.field === mediaType ||
      config.fields.includes(inputName) ||
      config.fields.includes(input?.field)
    ) {
      return mediaType;
    }
  }
  return null;
}

export function mapReferenceParams(model, params = {}) {
  const capabilities = getModelMediaCapabilities(model);
  const payload = {};

  for (const mediaType of Object.keys(MEDIA_CONFIG)) {
    const config = MEDIA_CONFIG[mediaType];
    const capability = capabilities[mediaType];
    const urls = normalizedUrls(
      params,
      capability,
      config.singularParam,
      config.pluralParam,
    ).slice(0, capability.maxItems);
    if (urls.length === 0) continue;
    payload[capability.field] = capability.isArray ? urls : urls[0];
  }

  // Some workflows intentionally declare more than one field of the same
  // media type (for example Wan: an optional start frame plus reference
  // images). Keep those secondary declared fields instead of collapsing them
  // into the primary capability selected above.
  for (const [inputName, input] of Object.entries(model?.inputs || {})) {
    const mediaType = mediaTypeForInput(inputName, input);
    if (!mediaType || capabilities[mediaType].field === inputName) continue;
    const value = params[inputName];
    if (value === undefined || value === null || value === "") continue;
    if (input?.type === "array") {
      const values = (Array.isArray(value) ? value : [value])
        .filter(Boolean)
        .slice(0, input.maxItems || input.max_items || Number.POSITIVE_INFINITY);
      if (values.length > 0) payload[inputName] = values;
    } else {
      payload[inputName] = Array.isArray(value) ? value[0] : value;
    }
  }

  const imageCapability = capabilities.image;
  const directLastImage =
    imageCapability.lastField && imageCapability.lastField !== imageCapability.field
      ? params[imageCapability.lastField]
      : null;
  const lastImage = directLastImage || params.last_image;
  if (lastImage && imageCapability.lastField) {
    if (imageCapability.lastField === imageCapability.field && imageCapability.isArray) {
      const images = payload[imageCapability.field] || [];
      if (!images.includes(lastImage)) payload[imageCapability.field] = [...images, lastImage];
    } else {
      payload[imageCapability.lastField] = Array.isArray(lastImage)
        ? lastImage[0]
        : lastImage;
    }
  }

  return payload;
}

export function recordGenerationSource(sources, familyId, requestId, modelId) {
  return {
    ...sources,
    [familyId]: { requestId, modelId },
  };
}
