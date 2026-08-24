export const T2I_DIMENSION_RATIOS = Object.freeze([
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:2',
  '21:9',
]);

export const I2I_DIMENSION_RATIOS = Object.freeze([
  '1:1',
  '16:9',
  '9:16',
]);

const gcd = (left, right) => {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
};

const lcm = (left, right) => (left * right) / gcd(left, right);

const parseAspectRatio = (aspectRatio) => {
  const match = /^(\d+):(\d+)$/.exec(aspectRatio || '');
  if (!match) return null;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width === 0 || height === 0) {
    return null;
  }

  const divisor = gcd(width, height);
  return { width: width / divisor, height: height / divisor };
};

const isDimensionInput = (input) => {
  const defaultValue = input?.default;
  const minimum = input?.minValue;
  const maximum = input?.maxValue;
  const step = input?.step;

  return Number.isSafeInteger(defaultValue) &&
    Number.isSafeInteger(minimum) &&
    Number.isSafeInteger(maximum) &&
    Number.isSafeInteger(step) &&
    minimum > 0 &&
    step > 0 &&
    minimum <= defaultValue &&
    defaultValue <= maximum &&
    minimum % step === 0;
};

export const getImageSizeCapability = (model) => {
  const aspectRatio = model?.inputs?.aspect_ratio;
  if (Array.isArray(aspectRatio?.enum) && aspectRatio.enum.length > 0) {
    return { type: 'aspect_ratio', input: aspectRatio };
  }

  const width = model?.inputs?.width;
  const height = model?.inputs?.height;
  if (isDimensionInput(width) && isDimensionInput(height)) {
    return { type: 'dimensions', width, height };
  }

  return { type: 'none' };
};

export const resolveImageDimensions = (model, aspectRatio) => {
  const capability = getImageSizeCapability(model);
  const ratio = parseAspectRatio(aspectRatio);
  if (capability.type !== 'dimensions' || !ratio) return null;

  const widthStep = capability.width.step;
  const heightStep = capability.height.step;
  const scaleStep = lcm(
    widthStep / gcd(widthStep, ratio.width),
    heightStep / gcd(heightStep, ratio.height),
  );
  const minimumScale = Math.ceil(Math.max(
    capability.width.minValue / ratio.width,
    capability.height.minValue / ratio.height,
  ) / scaleStep) * scaleStep;
  const maximumScale = Math.floor(Math.min(
    capability.width.maxValue / ratio.width,
    capability.height.maxValue / ratio.height,
  ) / scaleStep) * scaleStep;

  if (minimumScale > maximumScale) return null;

  const defaultArea = capability.width.default * capability.height.default;
  const targetScale = Math.sqrt(defaultArea / (ratio.width * ratio.height));
  const nearestScale = Math.round(targetScale / scaleStep) * scaleStep;
  const scale = Math.min(maximumScale, Math.max(minimumScale, nearestScale));

  return {
    width: ratio.width * scale,
    height: ratio.height * scale,
  };
};

export const getAspectRatioOptions = (model, dimensionRatios) => {
  const capability = getImageSizeCapability(model);
  if (capability.type === 'aspect_ratio') {
    return capability.input.enum;
  }

  if (capability.type === 'dimensions') {
    return dimensionRatios.filter((ratio) => resolveImageDimensions(model, ratio));
  }

  return [];
};

export const buildImageSizePayload = (model, aspectRatio) => {
  const capability = getImageSizeCapability(model);
  if (capability.type === 'aspect_ratio') {
    return capability.input.enum.includes(aspectRatio) ? { aspect_ratio: aspectRatio } : {};
  }

  const dimensions = resolveImageDimensions(model, aspectRatio);
  return dimensions || {};
};
