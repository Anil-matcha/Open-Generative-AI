/**
 * Model media capability detection and reference parameter building.
 *
 * Determines which media fields (image, video, audio) a model supports,
 * how many items it accepts, and builds the correct payload structure
 * for multi-image, last-frame, and other advanced input patterns.
 *
 * @module modelCapabilities
 */

// ─── Types ─────────────────────────────────────────────────────

/** Supported media types for model inputs. */
type MediaType = 'image' | 'video' | 'audio';

/** Configuration for a single media type's field detection. */
interface MediaConfig {
  explicitField: string;
  explicitMax: string;
  fields: string[];
  singularParam: string;
  pluralParam: string;
}

/** Capability descriptor for a model's media input support. */
interface MediaCapability {
  field: string | null;
  maxItems: number;
  isArray: boolean;
  separateLastItem: boolean;
  lastField: string | null;
}

/** Aggregated media capabilities for a model. */
interface ModelMediaCapabilities {
  image: MediaCapability;
  video: MediaCapability;
  audio: MediaCapability;
}

/** A model definition object (subset of fields used by this module). */
interface ModelInfo {
  imageField?: string;
  videoField?: string;
  audioField?: string;
  maxImages?: number;
  maxVideos?: number;
  maxAudios?: number;
  hasPrompt?: boolean;
  lastImageField?: string;
  inputs?: Record<string, ModelInputInfo>;
}

/** A single model input definition (subset). */
interface ModelInputInfo {
  type?: string;
  field?: string;
  maxItems?: number;
  max_items?: number;
}

/** Parameters for building reference media payloads. */
interface ReferenceParams {
  imageUrls?: string[];
  endImageUrl?: string | null;
  videoUrls?: string[];
  audioUrls?: string[];
}

/** Generic generation parameters passed by studio components. */
interface GenerationParams {
  [key: string]: unknown;
}

/** Record of generation sources keyed by model family. */
interface GenerationSources {
  [familyId: string]: { requestId: string; modelId: string };
}

// ─── Constants ─────────────────────────────────────────────────

const MEDIA_CONFIG: Record<MediaType, MediaConfig> = {
  image: {
    explicitField: 'imageField',
    explicitMax: 'maxImages',
    fields: [
      'images_list',
      'image_urls',
      'reference_images',
      'image_url',
      'start_image_url',
      'first_image_url',
    ],
    singularParam: 'image_url',
    pluralParam: 'images_list',
  },
  video: {
    explicitField: 'videoField',
    explicitMax: 'maxVideos',
    fields: [
      'videos_list',
      'video_files',
      'video_urls',
      'reference_videos',
      'video_url',
    ],
    singularParam: 'video_url',
    pluralParam: 'videos_list',
  },
  audio: {
    explicitField: 'audioField',
    explicitMax: 'maxAudios',
    fields: [
      'audios_list',
      'audio_files',
      'audio_urls',
      'reference_audios',
      'audio_url',
    ],
    singularParam: 'audio_url',
    pluralParam: 'audios_list',
  },
};

// ─── Helpers ────────────────────────────────────────────────────

function uniqueUrls(urls: (string | undefined | null)[] | undefined): string[] {
  return [...new Set((urls || []).filter(Boolean) as string[])];
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Detect a model's capability for a specific media type.
 * Returns the field name, max item count, and whether it expects
 * an array or single value.
 */
export function getMediaCapability(
  model: ModelInfo | undefined | null,
  mediaType: MediaType,
): MediaCapability {
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

  const explicitField = model[config.explicitField as keyof ModelInfo] as string | undefined;
  const schemaField = Object.entries(model.inputs || {}).find(
    ([, input]) => input?.field === mediaType,
  )?.[0];
  const field =
    explicitField ||
    config.fields.find((name) => model.inputs?.[name]) ||
    schemaField ||
    null;
  const input = field ? model.inputs?.[field] : null;
  const isArray = input?.type === 'array' || /(?:_list|_urls|_files)$/.test(field || '');
  const explicitMax = model[config.explicitMax as keyof ModelInfo] as number | undefined;
  let maxItems = field
    ? (explicitMax || (isArray ? input?.maxItems || input?.max_items || 1 : 1))
    : 0;

  const lastField: string | null =
    mediaType === 'image'
      ? (model.lastImageField as string) ||
        ['last_image', 'last_image_url', 'end_image_url'].find(
          (name) => model.inputs?.[name],
        ) ||
        null
      : null;
  const separateLastItem = !!lastField;
  if (separateLastItem) maxItems = Math.max(maxItems, 2);

  return { field, maxItems, isArray, separateLastItem, lastField };
}

/**
 * Get all media capabilities (image, video, audio) for a model.
 */
export function getModelMediaCapabilities(model: ModelInfo): ModelMediaCapabilities {
  return {
    image: getMediaCapability(model, 'image'),
    video: getMediaCapability(model, 'video'),
    audio: getMediaCapability(model, 'audio'),
  };
}

/**
 * Determine whether the prompt input should be disabled for a video model.
 * V2V models without explicit prompt support don't need a text prompt.
 */
export function shouldDisableVideoPrompt(
  model: ModelInfo | undefined | null,
  mode: string,
): boolean {
  return Boolean(
    model && mode === 'v2v' && !model.hasPrompt && !model.imageField,
  );
}

/**
 * Build reference media parameters from URL arrays.
 * Handles multi-image with separate last-image field, array vs singular params,
 * and caps at model's max item limits.
 */
export function buildReferenceParams(
  model: ModelInfo,
  { imageUrls = [], endImageUrl = null, videoUrls = [], audioUrls = [] }: ReferenceParams = {},
): Record<string, string | string[]> {
  const capabilities = getModelMediaCapabilities(model);
  const params: Record<string, string | string[]> = {};

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
    params[capabilities.video.isArray ? 'videos_list' : 'video_url'] =
      capabilities.video.isArray ? videos : videos[0];
  }

  const audios = uniqueUrls(audioUrls).slice(0, capabilities.audio.maxItems);
  if (capabilities.audio.field && audios.length > 0) {
    params[capabilities.audio.isArray ? 'audios_list' : 'audio_url'] =
      capabilities.audio.isArray ? audios : audios[0];
  }

  return params;
}

// ─── Internal helpers ──────────────────────────────────────────

function normalizedUrls(
  model: ModelInfo,
  params: GenerationParams,
  capability: MediaCapability,
  singularParam: string,
  pluralParam: string,
): string[] {
  if (!capability.field) return [];
  const direct = params[capability.field];
  if (Array.isArray(direct)) return direct as string[];
  if (direct) return [direct as string];
  // A separately declared media field has its own role (for example Wan's
  // optional image_url anchor); it is not an alias for the primary input.
  const plural = model?.inputs?.[pluralParam] ? undefined : params[pluralParam];
  if (Array.isArray(plural) && plural.length > 0) return plural as string[];
  const singular = model?.inputs?.[singularParam] ? undefined : params[singularParam];
  return singular ? [singular as string] : [];
}

function mediaTypeForInput(
  inputName: string,
  input: ModelInputInfo | undefined,
): MediaType | null {
  for (const [mediaType, config] of Object.entries(MEDIA_CONFIG) as [MediaType, MediaConfig][]) {
    if (
      input?.field === mediaType ||
      config.fields.includes(inputName) ||
      config.fields.includes(input?.field || '')
    ) {
      return mediaType;
    }
  }
  return null;
}

/**
 * Map user-facing generation params to the API payload structure.
 *
 * This is the primary entry point for building media reference parameters.
 * It handles:
 * - Primary media fields (image_url, video_url, audio_url)
 * - Array vs singular parameter selection
 * - Multi-image with separate last-image field
 * - Secondary declared fields (e.g., Wan's optional start frame + reference images)
 * - Max item enforcement per model capability
 */
export function mapReferenceParams(
  model: ModelInfo,
  params: GenerationParams = {},
): Record<string, unknown> {
  const capabilities = getModelMediaCapabilities(model);
  const payload: Record<string, unknown> = {};

  for (const mediaType of Object.keys(MEDIA_CONFIG) as MediaType[]) {
    const config = MEDIA_CONFIG[mediaType];
    const capability = capabilities[mediaType];
    const urls = normalizedUrls(
      model,
      params,
      capability,
      config.singularParam,
      config.pluralParam,
    ).slice(0, capability.maxItems);
    if (urls.length === 0) continue;
    payload[capability.field!] = capability.isArray ? urls : urls[0];
  }

  // Some workflows intentionally declare more than one field of the same
  // media type (for example Wan: an optional start frame plus reference
  // images). Keep those secondary declared fields instead of collapsing them
  // into the primary capability selected above.
  for (const [inputName, input] of Object.entries(model?.inputs || {})) {
    const mediaType = mediaTypeForInput(inputName, input as ModelInputInfo);
    if (!mediaType || capabilities[mediaType].field === inputName) continue;
    const value = params[inputName];
    if (value === undefined || value === null || value === '') continue;
    if (input?.type === 'array') {
      const values = (Array.isArray(value) ? value : [value])
        .filter(Boolean)
        .slice(0, (input as ModelInputInfo).maxItems || (input as ModelInputInfo).max_items || Number.POSITIVE_INFINITY);
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
      const images = (payload[imageCapability.field!] as string[]) || [];
      if (!images.includes(lastImage as string))
        payload[imageCapability.field!] = [...images, lastImage as string];
    } else {
      payload[imageCapability.lastField] = Array.isArray(lastImage)
        ? (lastImage as string[])[0]
        : lastImage;
    }
  }

  return payload;
}

/**
 * Record a generation source for tracking which model family produced a result.
 */
export function recordGenerationSource(
  sources: GenerationSources,
  familyId: string,
  requestId: string,
  modelId: string,
): GenerationSources {
  return {
    ...sources,
    [familyId]: { requestId, modelId },
  };
}
