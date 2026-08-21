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

const REQUIRED_EDIT_TOOL_IDS = Object.freeze([
  "kling-o1-video-edit",
  "kling-o1-video-edit-fast",
  "kling-o1-standard-video-edit",
  "gemini-omni-video-edit",
  "runway-aleph-v2v",
  "wan2.2-edit-video",
  "wan2.7-video-edit",
  "happy-horse-1-video-edit-1080p",
  "happy-horse-1-video-edit-720p",
  "happy-horse-1.1-video-edit-1080p",
  "happy-horse-1.1-video-edit-720p",
]);

const REQUIRED_EXTEND_TOOL_IDS = Object.freeze([
  "seedance-v1.5-pro-video-extend",
  "seedance-v1.5-pro-video-extend-fast",
  "wan2.2-spicy-video-extend",
  "wan2.7-video-extend",
  "pixverse-v6-extend",
]);

const KLING_EDIT_TOOL_IDS = new Set([
  "kling-o1-video-edit",
  "kling-o1-video-edit-fast",
  "kling-o1-standard-video-edit",
]);

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
  VIDEO_TOOL_OVERRIDES[id] = {
    ...VIDEO_TOOL_OVERRIDES[id],
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
      "Translate the video's speech with synchronized voice and lip movement. The source language is detected automatically.",
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
  },
  "grok-imagine-extend": {
    hasPrompt: true,
    promptRequired: true,
    operation: "extend",
    inputs: {
      extend_times: {
        title: "Extend duration",
        type: "integer",
        enum: Array.from({ length: 25 }, (_, index) => index + 6),
        default: 6,
        configurable: true,
      },
    },
  },
});

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
      "veo3.1-lite-text-to-video",
      "veo3.1-image-to-video",
      "veo3.1-fast-image-to-video",
      "veo3.1-lite-image-to-video",
      "veo3.1-reference-to-video",
      "veo3.1-extend-video",
    ]),
    sourceLabel: "Veo 3.1 source video",
    emptySourceMessage:
      "Select a completed Veo 3.1 video before running this operation.",
  },
  grok: {
    sourceModelIds: Object.freeze([
      "grok-imagine-text-to-video",
      "grok-imagine-image-to-video",
      "grok-imagine-extend",
    ]),
    sourceLabel: "Grok Imagine source video",
    emptySourceMessage:
      "Select a completed Grok Imagine video before extending it.",
  },
});

const CONTINUATION_TARGETS = Object.freeze({
  "seedance-v2.0-extend": { family: "seedance", promptRequired: false },
  "seedance-2-extend": { family: "seedance", promptRequired: false },
  "seedance-2-vip-extend": { family: "seedance", promptRequired: false },
  "seedance-2-vip-extend-1080p": {
    family: "seedance",
    promptRequired: false,
  },
  "veo3.1-extend-video": { family: "veo31", promptRequired: true },
  "veo3.1-4k-video": { family: "veo31", promptRequired: false },
  "grok-imagine-extend": { family: "grok", promptRequired: true },
});

function mergeInputs(modelInputs = {}, overrideInputs = {}) {
  const inputs = { ...modelInputs };
  for (const [key, override] of Object.entries(overrideInputs)) {
    inputs[key] = { ...modelInputs[key], ...override };
  }
  return inputs;
}

export function getVideoToolCapabilities(model) {
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
    };
  }

  const showPrompt =
    capabilities.hasPrompt ?? Boolean(capabilities.inputs?.prompt);
  const promptRequired = showPrompt && Boolean(capabilities.promptRequired);
  const operation = capabilities.operation || "process";
  const promptLabel = PROMPT_LABELS[operation] || PROMPT_LABELS.process;

  return {
    actionLabel: ACTION_LABELS[operation] || ACTION_LABELS.process,
    promptPlaceholder: promptRequired ? promptLabel : `${promptLabel} (optional)`,
    promptRequired,
    showPrompt,
    summary:
      capabilities.summary ||
      capabilities.description ||
      `${capabilities.name || "The selected tool"} is ready to process the video.`,
    uploadTitle: `Upload source video for ${capabilities.name || "this tool"}`,
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
    if (value !== undefined) payload[input.key] = value;
  }
  return payload;
}

export function getVideoToolPayloadDefaults(model) {
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

  return {
    ...CONTINUATION_FAMILIES[target.family],
    ...target,
  };
}

export function getCompatibleContinuationSources(modelOrId, history = []) {
  const config = getContinuationConfig(modelOrId);
  if (!config) return [];
  const compatibleModelIds = new Set(config.sourceModelIds);

  return history.filter(
    (entry) =>
      Boolean(entry?.requestId && entry?.url) &&
      compatibleModelIds.has(entry.model),
  );
}
