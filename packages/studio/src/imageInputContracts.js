const BASE_CONTRACT = Object.freeze({
  primaryImageRequired: false,
  primaryImageLabel: "Reference image",
  promptField: "prompt",
  promptRequired: false,
  promptPlaceholder: "Describe how to transform this image (optional)",
  auxiliaryImages: Object.freeze([]),
});

const requiredImage = (field, label) => Object.freeze({
  field,
  label,
  required: true,
});

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

export function normalizePrimaryImageUrls(imagesList, imageUrl) {
  const validImages = Array.isArray(imagesList) ? imagesList.filter(hasText) : [];
  if (validImages.length > 0) return validImages;
  return hasText(imageUrl) ? [imageUrl] : [];
}

const CONTRACTS = Object.freeze({
  "t2i:flux-pulid": Object.freeze({
    primaryImageRequired: true,
    promptRequired: true,
  }),
  "i2i:flux-pulid": Object.freeze({ promptRequired: true }),
  "t2i:flux-redux": Object.freeze({
    primaryImageRequired: true,
    promptRequired: true,
  }),
  "i2i:flux-redux": Object.freeze({ promptRequired: true }),
  "i2i:ai-dress-change": Object.freeze({
    primaryImageLabel: "Model image",
    auxiliaryImages: Object.freeze([
      requiredImage("garment_image_url", "Garment image"),
    ]),
  }),
  "i2i:ai-product-shot": Object.freeze({
    primaryImageLabel: "Product image",
    promptField: "scene_description",
    promptRequired: true,
    promptPlaceholder: "Describe the product scene",
  }),
  "i2i:ai-object-eraser": Object.freeze({
    primaryImageLabel: "Source image",
    auxiliaryImages: Object.freeze([
      requiredImage("mask_image_url", "Mask image"),
    ]),
  }),
  "i2i:gpt4o-edit": Object.freeze({
    primaryImageLabel: "Source image",
    promptRequired: true,
    promptPlaceholder: "Describe how to edit the image",
    auxiliaryImages: Object.freeze([
      requiredImage("mask_image_url", "Mask image"),
    ]),
  }),
  "i2i:add-image-watermark": Object.freeze({
    primaryImageLabel: "Source image",
    auxiliaryImages: Object.freeze([
      requiredImage("watermark_image_url", "Watermark image"),
    ]),
  }),
});

export function getImageInputContract(model, mode) {
  const contractKey = `${mode}:${model?.id}`;
  const patch = Object.hasOwn(CONTRACTS, contractKey)
    ? CONTRACTS[contractKey]
    : {};
  const isTextToImage = mode === "t2i";
  const promptRequired = patch.promptRequired ?? isTextToImage;
  return {
    ...BASE_CONTRACT,
    primaryImageRequired: mode === "i2i" || BASE_CONTRACT.primaryImageRequired,
    promptRequired,
    promptPlaceholder: promptRequired
      ? isTextToImage
        ? "Describe the image you want to create"
        : "Describe how to transform this image"
      : BASE_CONTRACT.promptPlaceholder,
    ...patch,
    auxiliaryImages: patch.auxiliaryImages || BASE_CONTRACT.auxiliaryImages,
  };
}

export function getAuxiliaryImageInputs(model, mode) {
  const configured = getImageInputContract(model, mode).auxiliaryImages;
  if (!model?.swapField || configured.some(({ field }) => field === model.swapField)) {
    return configured;
  }
  return [
    requiredImage(model.swapField, "Swap face image"),
    ...configured,
  ];
}

export function getImageInputValidationError(
  model,
  mode,
  {
    prompt = "",
    primaryImageUrls = [],
    auxiliaryImageUrls = {},
  } = {},
) {
  const contract = getImageInputContract(model, mode);
  if (contract.primaryImageRequired && !primaryImageUrls.some(hasText)) {
    return `Please upload a ${contract.primaryImageLabel.toLowerCase()}.`;
  }
  if (contract.promptRequired && !hasText(prompt)) {
    return contract.promptField === "scene_description"
      ? "Please enter a scene description."
      : "Please enter a prompt.";
  }
  const missingImage = getAuxiliaryImageInputs(model, mode).find(
    ({ field, required }) => required && !hasText(auxiliaryImageUrls[field]),
  );
  return missingImage
    ? `Please upload a ${missingImage.label.toLowerCase()}.`
    : null;
}

export function buildImageInputPayload(model, mode, params = {}) {
  const contract = getImageInputContract(model, mode);
  const payload = {};
  if (hasText(params.prompt)) {
    payload[contract.promptField] = params.prompt;
  }
  for (const { field } of getAuxiliaryImageInputs(model, mode)) {
    if (hasText(params[field])) payload[field] = params[field];
  }
  return payload;
}
