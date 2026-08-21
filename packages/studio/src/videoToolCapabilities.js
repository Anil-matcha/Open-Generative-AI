const HEYGEN_TRANSLATION_LANGUAGES = Object.freeze([
  "English",
  "Spanish",
  "French",
  "Hindi",
  "Italian",
  "German",
  "Polish",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Dutch",
  "Turkish",
  "Korean",
  "Danish",
  "Arabic",
  "Romanian",
  "Mandarin",
  "Filipino",
  "Swedish",
  "Indonesian",
  "Ukrainian",
  "Greek",
  "Czech",
  "Bulgarian",
  "Malay",
  "Slovak",
  "Croatian",
  "Tamil",
  "Finnish",
  "Russian",
  "Afrikaans (South Africa)",
  "Albanian (Albania)",
  "Amharic (Ethiopia)",
  "Arabic (Algeria)",
  "Arabic (Bahrain)",
  "Arabic (Egypt)",
  "Arabic (Iraq)",
  "Arabic (Jordan)",
  "Arabic (Kuwait)",
  "Arabic (Lebanon)",
  "Arabic (Libya)",
  "Arabic (Morocco)",
  "Arabic (Oman)",
  "Arabic (Qatar)",
  "Arabic (Saudi Arabia)",
  "Arabic (Syria)",
  "Arabic (Tunisia)",
  "Arabic (United Arab Emirates)",
  "Arabic (Yemen)",
  "Armenian (Armenia)",
  "Azerbaijani (Latin, Azerbaijan)",
  "Bangla (Bangladesh)",
  "Basque",
  "Bengali (India)",
  "Bosnian (Bosnia and Herzegovina)",
  "Bulgarian (Bulgaria)",
  "Burmese (Myanmar)",
  "Catalan",
  "Chinese (Cantonese, Traditional)",
  "Chinese (Jilu Mandarin, Simplified)",
  "Chinese (Mandarin, Simplified)",
  "Chinese (Northeastern Mandarin, Simplified)",
  "Chinese (Southwestern Mandarin, Simplified)",
  "Chinese (Taiwanese Mandarin, Traditional)",
  "Chinese (Wu, Simplified)",
  "Chinese (Zhongyuan Mandarin Henan, Simplified)",
  "Chinese (Zhongyuan Mandarin Shaanxi, Simplified)",
  "Croatian (Croatia)",
  "Czech (Czechia)",
  "Danish (Denmark)",
  "Dutch (Belgium)",
  "Dutch (Netherlands)",
  "English (Australia)",
  "English (Canada)",
  "English (Hong Kong SAR)",
  "English (India)",
  "English (Ireland)",
  "English (Kenya)",
  "English (New Zealand)",
  "English (Nigeria)",
  "English (Philippines)",
  "English (Singapore)",
  "English (South Africa)",
  "English (Tanzania)",
  "English (UK)",
  "English (United States)",
  "Estonian (Estonia)",
  "Filipino (Philippines)",
  "Finnish (Finland)",
  "French (Belgium)",
  "French (Canada)",
  "French (France)",
  "French (Switzerland)",
  "Galician",
  "Georgian (Georgia)",
  "German (Austria)",
  "German (Germany)",
  "German (Switzerland)",
  "Greek (Greece)",
  "Gujarati (India)",
  "Hebrew (Israel)",
  "Hindi (India)",
  "Hungarian (Hungary)",
  "Icelandic (Iceland)",
  "Indonesian (Indonesia)",
  "Irish (Ireland)",
  "Italian (Italy)",
  "Japanese (Japan)",
  "Javanese (Latin, Indonesia)",
  "Kannada (India)",
  "Kazakh (Kazakhstan)",
  "Khmer (Cambodia)",
  "Korean (Korea)",
  "Lao (Laos)",
  "Latvian (Latvia)",
  "Lithuanian (Lithuania)",
  "Macedonian (North Macedonia)",
  "Malay (Malaysia)",
  "Malayalam (India)",
  "Maltese (Malta)",
  "Marathi (India)",
  "Mongolian (Mongolia)",
  "Nepali (Nepal)",
  "Norwegian Bokmål (Norway)",
  "Pashto (Afghanistan)",
  "Persian (Iran)",
  "Polish (Poland)",
  "Portuguese (Brazil)",
  "Portuguese (Portugal)",
  "Romanian (Romania)",
  "Russian (Russia)",
  "Serbian (Latin, Serbia)",
  "Sinhala (Sri Lanka)",
  "Slovak (Slovakia)",
  "Slovenian (Slovenia)",
  "Somali (Somalia)",
  "Spanish (Argentina)",
  "Spanish (Bolivia)",
  "Spanish (Chile)",
  "Spanish (Colombia)",
  "Spanish (Costa Rica)",
  "Spanish (Cuba)",
  "Spanish (Dominican Republic)",
  "Spanish (Ecuador)",
  "Spanish (El Salvador)",
  "Spanish (Equatorial Guinea)",
  "Spanish (Guatemala)",
  "Spanish (Honduras)",
  "Spanish (Mexico)",
  "Spanish (Nicaragua)",
  "Spanish (Panama)",
  "Spanish (Paraguay)",
  "Spanish (Peru)",
  "Spanish (Puerto Rico)",
  "Spanish (Spain)",
  "Spanish (United States)",
  "Spanish (Uruguay)",
  "Spanish (Venezuela)",
  "Sundanese (Indonesia)",
  "Swahili (Kenya)",
  "Swahili (Tanzania)",
  "Swedish (Sweden)",
  "Tamil (India)",
  "Tamil (Malaysia)",
  "Tamil (Singapore)",
  "Tamil (Sri Lanka)",
  "Telugu (India)",
  "Thai (Thailand)",
  "Turkish (Türkiye)",
  "Ukrainian (Ukraine)",
  "Urdu (India)",
  "Urdu (Pakistan)",
  "Uzbek (Latin, Uzbekistan)",
  "Vietnamese (Vietnam)",
  "Welsh (United Kingdom)",
  "Zulu (South Africa)",
  "English - Your Accent",
  "English - American Accent",
]);

const KLING_EDIT_TOOL_IDS = Object.freeze([
  "kling-o1-video-edit",
  "kling-o1-video-edit-fast",
  "kling-o1-standard-video-edit",
]);

const HAPPY_HORSE_EDIT_TOOL_IDS = Object.freeze([
  "happy-horse-1-video-edit-1080p",
  "happy-horse-1-video-edit-720p",
  "happy-horse-1.1-video-edit-1080p",
  "happy-horse-1.1-video-edit-720p",
]);

const REQUIRED_EDIT_TOOL_IDS = Object.freeze([
  ...KLING_EDIT_TOOL_IDS,
  "gemini-omni-video-edit",
  "runway-aleph-v2v",
  "wan2.2-edit-video",
  "wan2.7-video-edit",
  ...HAPPY_HORSE_EDIT_TOOL_IDS,
]);

const REQUIRED_EXTEND_TOOL_IDS = Object.freeze([
  "seedance-v1.5-pro-video-extend",
  "seedance-v1.5-pro-video-extend-fast",
  "wan2.2-spicy-video-extend",
  "wan2.7-video-extend",
  "pixverse-v6-extend",
]);

const KLING_ASPECT_RATIO_TOOL_IDS = new Set([
  "kling-o1-video-edit",
  "kling-o1-video-edit-fast",
]);

const HAPPY_HORSE_VIDEO_CONSTRAINTS = Object.freeze({
  key: "happy-horse-video-edit",
  allowedMimeTypes: Object.freeze(["video/mp4", "video/quicktime"]),
  allowedExtensions: Object.freeze([".mp4", ".mov"]),
  maxBytes: 100 * 1024 * 1024,
  minDurationSeconds: 3,
  maxDurationSeconds: 60,
  minShortSide: 320,
  maxLongSide: 2160,
  requirements:
    "MP4 or MOV, 3–60 seconds, up to 100 MB, shorter side at least 320px, and longer side at most 2160px. H.264 is recommended; frame rate above 8 fps is verified by the provider.",
});

const VIDEO_TOOL_OVERRIDES = Object.create(null);

for (const id of REQUIRED_EDIT_TOOL_IDS) {
  VIDEO_TOOL_OVERRIDES[id] = {
    hasPrompt: true,
    promptRequired: true,
    operation: "edit",
  };
}

for (const id of REQUIRED_EXTEND_TOOL_IDS) {
  VIDEO_TOOL_OVERRIDES[id] = {
    hasPrompt: true,
    promptRequired: true,
    operation: "extend",
  };
}

for (const id of KLING_EDIT_TOOL_IDS) {
  const inputs = {};

  if (KLING_ASPECT_RATIO_TOOL_IDS.has(id)) {
    inputs.aspect_ratio = {
      title: "Aspect ratio",
      type: "string",
      enum: ["16:9", "9:16", "1:1"],
      default: "16:9",
      configurable: true,
    };
  }
  inputs.keep_original_sound = {
    title: "Keep original sound",
    type: "boolean",
    default: true,
    configurable: true,
  };

  VIDEO_TOOL_OVERRIDES[id] = {
    ...VIDEO_TOOL_OVERRIDES[id],
    inputs,
    payloadDefaults: { images_list: [] },
  };
}

Object.assign(VIDEO_TOOL_OVERRIDES, {
  "video-watermark-remover": {
    hasPrompt: false,
    operation: "watermark",
  },
  "ai-video-upscaler": {
    hasPrompt: false,
    operation: "upscale",
    summary:
      "Upscale the source video to the selected resolution. This integration exposes target resolution and audio preservation; it does not expose an output-format setting.",
    inputs: {
      resolution: {
        title: "Target resolution",
        type: "string",
        enum: ["720p", "1080p", "2k", "4k"],
        default: "720p",
        configurable: true,
      },
      copy_audio: {
        title: "Keep audio",
        type: "boolean",
        default: true,
        configurable: true,
      },
    },
  },
  "heygen-video-translate": {
    hasPrompt: false,
    operation: "translate",
    summary:
      "Source language is automatic and cannot be configured in this integration. Choose a target language. Voice translation and lip sync are automatic; separate audio and subtitle settings are not available.",
    inputs: {
      language: {
        title: "Target language",
        type: "string",
        enum: HEYGEN_TRANSLATION_LANGUAGES,
        default: "Hindi",
        configurable: true,
      },
    },
  },
  "topaz-video-upscale": {
    hasPrompt: false,
    operation: "upscale",
    summary:
      "Upscale the source video by the selected factor. Processing time varies; an estimate isn't available for this tool.",
    inputs: {
      upscale_factor: {
        title: "Upscale factor",
        type: "integer",
        enum: [1, 2, 4],
        default: 2,
        configurable: true,
      },
    },
  },
  "ltx-2.3-video-extend": {
    hasPrompt: true,
    promptRequired: false,
    operation: "extend",
    estimateCost: true,
    inputs: {
      duration: {
        title: "Extend duration",
        type: "integer",
        enum: Array.from({ length: 20 }, (_, index) => index + 1),
        default: 5,
        configurable: true,
      },
    },
  },
  "seedance-v2.0-extend": {
    hasPrompt: true,
    promptRequired: false,
    operation: "extend",
  },
  "seedance-2-extend": {
    hasPrompt: true,
    promptRequired: false,
    operation: "extend",
  },
  "seedance-2-vip-extend": {
    hasPrompt: true,
    promptRequired: false,
    operation: "extend",
  },
  "seedance-2-vip-extend-1080p": {
    hasPrompt: true,
    promptRequired: false,
    operation: "extend",
  },
  "veo3.1-extend-video": {
    hasPrompt: true,
    promptRequired: true,
    operation: "extend",
  },
  "veo3.1-4k-video": {
    hasPrompt: false,
    promptRequired: false,
    operation: "upscale",
    actionLabel: "Create 4K video",
    summary: "Create a 4K version of a completed Veo 3.1 video.",
  },
  "grok-imagine-extend": {
    hasPrompt: true,
    promptRequired: true,
    operation: "extend",
    inputs: {
      extend_times: {
        title: "Extend duration",
        type: "integer",
        enum: [6, 10],
        default: 6,
        configurable: true,
      },
    },
  },
  "runway-aleph-v2v": {
    ...VIDEO_TOOL_OVERRIDES["runway-aleph-v2v"],
    inputs: {
      aspect_ratio: {
        title: "Aspect ratio",
        type: "string",
        enum: ["9:16", "16:9", "1:1", "4:3", "3:4", "21:9"],
        default: "16:9",
        configurable: true,
      },
    },
  },
  "pixverse-v6-extend": {
    ...VIDEO_TOOL_OVERRIDES["pixverse-v6-extend"],
    inputs: {
      resolution: {
        title: "Resolution",
        type: "string",
        enum: ["360p", "540p", "720p", "1080p"],
        default: "720p",
        configurable: true,
      },
      duration: {
        title: "Duration",
        type: "integer",
        enum: Array.from({ length: 15 }, (_, index) => index + 1),
        default: 5,
        configurable: true,
      },
      generate_audio_switch: {
        title: "Generate audio",
        type: "boolean",
        default: false,
        configurable: true,
      },
      negative_prompt: {
        title: "Negative prompt",
        type: "string",
        configurable: true,
        optional: true,
      },
      style: {
        title: "Style",
        type: "string",
        enum: ["anime", "3d_animation", "clay", "comic", "cyberpunk"],
        configurable: true,
        optional: true,
      },
    },
  },
});

VIDEO_TOOL_OVERRIDES["seedance-v1.5-pro-video-extend"] = {
  ...VIDEO_TOOL_OVERRIDES["seedance-v1.5-pro-video-extend"],
  estimateCost: true,
  payloadDefaults: {
    resolution: "720p",
    duration: 5,
    generate_audio: true,
    camera_fixed: false,
  },
};

for (const id of HAPPY_HORSE_EDIT_TOOL_IDS) {
  VIDEO_TOOL_OVERRIDES[id] = {
    ...VIDEO_TOOL_OVERRIDES[id],
    estimateCost: true,
    summary:
      "Edit a source video with a required natural-language instruction.",
    guidance:
      "Upload one source video that meets the listed requirements, then describe the edit you want.",
    videoConstraints: HAPPY_HORSE_VIDEO_CONSTRAINTS,
  };
}

const ACTION_LABELS = Object.freeze({
  edit: "Edit video",
  extend: "Extend video",
  process: "Process video",
  translate: "Translate video",
  upscale: "Upscale video",
  watermark: "Remove watermark",
});

const PROMPT_LABELS = Object.freeze({
  edit: "Describe how to edit the video",
  extend: "Describe how to continue the video",
  process: "Describe the result you want",
});

const CONTINUATION_FAMILIES = Object.freeze({
  seedance: {
    sourceModelIds: Object.freeze([
      "seedance-v2.0-t2v",
      "seedance-v2.0-i2v",
      "seedance-v2.0-extend",
      "seedance-2-extend",
      "seedance-2-vip-extend",
      "seedance-2-vip-extend-1080p",
    ]),
    sourceLabel: "Seedance 2.0 source video",
    emptySourceMessage:
      "Select a completed Seedance 2.0 video before continuing.",
  },
  veo31: {
    sourceModelIds: Object.freeze([
      "veo3.1-text-to-video",
      "veo3.1-fast-text-to-video",
      "veo3.1-image-to-video",
      "veo3.1-fast-image-to-video",
      "veo3.1-reference-to-video",
    ]),
    sourceDefaultResolutions: Object.freeze({
      "veo3.1-text-to-video": "1080p",
      "veo3.1-fast-text-to-video": "1080p",
      "veo3.1-image-to-video": "1080p",
      "veo3.1-fast-image-to-video": "1080p",
    }),
  },
  grok: {
    sourceModelIds: Object.freeze([
      "grok-imagine-text-to-video",
      "grok-imagine-image-to-video",
    ]),
    sourceLabel: "Grok Imagine source video",
    emptySourceMessage:
      "Select a completed Grok Imagine video before extending it.",
  },
});

const CONTINUATION_TARGETS = Object.freeze({
  "seedance-v2.0-extend": { family: "seedance" },
  "seedance-2-extend": { family: "seedance" },
  "seedance-2-vip-extend": { family: "seedance" },
  "seedance-2-vip-extend-1080p": { family: "seedance" },
  "veo3.1-extend-video": {
    family: "veo31",
    requiredSourceResolution: "720p",
    sourceLabel: "Veo 3.1 or Fast 720p source video",
    emptySourceMessage:
      "Select a completed 720p Veo 3.1 or Veo 3.1 Fast video before extending it.",
  },
  "veo3.1-4k-video": {
    family: "veo31",
    sourceLabel: "Veo 3.1 or Fast source video",
    emptySourceMessage:
      "Select a completed Veo 3.1 or Veo 3.1 Fast video before creating a 4K version.",
  },
  "grok-imagine-extend": { family: "grok" },
});

const MIN_CLIENT_TIMESTAMP = Date.UTC(2000, 0, 1);
const MAX_CLIENT_TIMESTAMP = Date.UTC(2101, 0, 1);

function mergeInputs(modelInputs = {}, overrideInputs = {}) {
  const inputs = { ...modelInputs };
  for (const [key, override] of Object.entries(overrideInputs)) {
    inputs[key] = { ...modelInputs[key], ...override };
  }
  return inputs;
}

function getVideoToolCapabilities(model) {
  if (!model) return null;
  const override = VIDEO_TOOL_OVERRIDES[model.id] || {};
  return {
    ...model,
    ...override,
    inputs: mergeInputs(model.inputs, override.inputs),
  };
}

export function getVideoToolPresentation(model) {
  const capabilities = getVideoToolCapabilities(model);
  if (!capabilities) {
    return {
      actionLabel: ACTION_LABELS.process,
      promptPlaceholder: PROMPT_LABELS.process,
      promptRequired: false,
      showPrompt: false,
      summary: "Upload a source video to continue.",
      uploadTitle: "Upload source video",
      estimateCost: false,
      guidance: "",
      videoConstraints: null,
    };
  }

  const showPrompt =
    capabilities.hasPrompt ?? Boolean(capabilities.inputs?.prompt);
  const promptRequired = showPrompt && Boolean(capabilities.promptRequired);
  const operation = capabilities.operation || "process";
  const promptLabel = PROMPT_LABELS[operation] || PROMPT_LABELS.process;

  return {
    actionLabel:
      capabilities.actionLabel || ACTION_LABELS[operation] || ACTION_LABELS.process,
    promptPlaceholder: promptRequired ? promptLabel : `${promptLabel} (optional)`,
    promptRequired,
    showPrompt,
    summary:
      capabilities.summary ||
      capabilities.description ||
      `${capabilities.name || "The selected tool"} is ready to process the video.`,
    uploadTitle: `Upload source video for ${capabilities.name || "this tool"}`,
    estimateCost: Boolean(capabilities.estimateCost),
    guidance: capabilities.guidance || "",
    videoConstraints: capabilities.videoConstraints || null,
  };
}

export function resolveVideoUploadTransition({
  mode,
  currentModel,
  defaultModel,
}) {
  const preservesSelection =
    (mode === "v2v" && Boolean(currentModel)) ||
    Boolean(currentModel?.inputs?.video_files);

  if (preservesSelection) {
    return {
      clearImage: false,
      clearPrompt: false,
      mode,
      model: currentModel,
    };
  }

  return {
    clearImage: mode === "i2v",
    clearPrompt: true,
    mode: "v2v",
    model: defaultModel,
  };
}

export function getVideoToolOptionDefinitions(model) {
  const capabilities = getVideoToolCapabilities(model);
  if (!capabilities) return [];

  return Object.entries(capabilities.inputs || {})
    .filter(([, input]) => input.configurable)
    .map(([key, input]) => ({ key, ...input }));
}

export function getDefaultVideoToolOptions(model) {
  const options = {};
  for (const input of getVideoToolOptionDefinitions(model)) {
    if (input.default !== undefined) options[input.key] = input.default;
  }
  return options;
}

export function serializeVideoToolOptions(model, values = {}) {
  const payload = {};
  for (const input of getVideoToolOptionDefinitions(model)) {
    const value = values[input.key];
    if (typeof value === "string") {
      const normalizedValue = value.trim();
      if (normalizedValue) payload[input.key] = normalizedValue;
    } else if (value !== undefined && value !== null) {
      payload[input.key] = value;
    }
  }
  return payload;
}

function getVideoToolPayloadDefaults(model) {
  const capabilities = getVideoToolCapabilities(model);
  return { ...(capabilities?.payloadDefaults || {}) };
}

export function buildVideoToolPayload(model, params = {}) {
  const capabilities = getVideoToolCapabilities(model);
  const videoField = capabilities?.videoField || "video_url";
  const payload = {
    [videoField]: params.video_url,
    ...getVideoToolPayloadDefaults(model),
  };

  if (capabilities?.imageField && params.image_url) {
    payload[capabilities.imageField] = params.image_url;
  }
  if (capabilities?.hasPrompt && params.prompt) {
    payload.prompt = params.prompt;
  }

  return {
    ...payload,
    ...serializeVideoToolOptions(model, params.options),
  };
}

export function getContinuationConfig(modelOrId) {
  const modelId = typeof modelOrId === "string" ? modelOrId : modelOrId?.id;
  const target = CONTINUATION_TARGETS[modelId];
  if (!target) return null;
  const model = typeof modelOrId === "string" ? { id: modelId } : modelOrId;
  const capabilities = getVideoToolCapabilities(model);

  return {
    ...CONTINUATION_FAMILIES[target.family],
    ...target,
    promptRequired: Boolean(capabilities?.promptRequired),
  };
}

function normalizeRequestId(value) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;

  const requestId = String(value).trim();
  if (!requestId) return null;

  if (/^\d+$/.test(requestId)) {
    const numericId = Number(requestId);
    if (
      Number.isFinite(numericId) &&
      numericId >= MIN_CLIENT_TIMESTAMP &&
      numericId < MAX_CLIENT_TIMESTAMP
    ) {
      return null;
    }
  }

  return requestId;
}

function resolveContinuationRequestId(entry) {
  if (!entry) return null;

  for (const candidate of [entry.requestId, entry.request_id, entry.id]) {
    const requestId = normalizeRequestId(candidate);
    if (requestId) return requestId;
  }

  return null;
}

export function getCompatibleContinuationSources(modelOrId, history = []) {
  const config = getContinuationConfig(modelOrId);
  if (!config) return [];
  const compatibleModelIds = new Set(config.sourceModelIds);
  const sources = [];

  for (const entry of history) {
    if (!entry?.url || !compatibleModelIds.has(entry.model)) continue;
    const requestId = resolveContinuationRequestId(entry);
    if (!requestId) continue;
    if (config.requiredSourceResolution) {
      const sourceResolution =
        entry.resolution || config.sourceDefaultResolutions?.[entry.model];
      if (
        String(sourceResolution).toLowerCase() !==
        config.requiredSourceResolution.toLowerCase()
      ) {
        continue;
      }
    }

    sources.push(
      entry.requestId === requestId ? entry : { ...entry, requestId },
    );
  }

  return sources;
}
