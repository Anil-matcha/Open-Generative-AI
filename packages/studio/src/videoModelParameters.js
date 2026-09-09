const COMMON_FIELDS = Object.freeze([
  ["aspectRatio", "aspect_ratio", "aspectRatios"],
  ["duration", "duration", "durations"],
  ["resolution", "resolution", "resolutions"],
  ["quality", "quality", "qualities"],
]);
const optionsByModel = new WeakMap();
const EMPTY_OPTIONS = Object.fromEntries(COMMON_FIELDS.map(([, , key]) => [key, []]));

function schemaOptions(schema) {
  if (!schema) return [];
  if (Array.isArray(schema.enum)) return [...schema.enum];
  const minimum = schema.minValue ?? schema.minimum;
  const maximum = schema.maxValue ?? schema.maximum;
  const step = schema.step ?? (["int", "integer"].includes(schema.type) ? 1 : undefined);
  if (
    Number.isFinite(minimum) && Number.isFinite(maximum) &&
    Number.isFinite(step) && step > 0 && maximum >= minimum
  ) {
    const count = Math.floor((maximum - minimum) / step + 1e-9) + 1;
    // Common controls are small selects. Do not materialize an unbounded or
    // unexpectedly large range from a future provider schema.
    if (count > 1000) return [];
    return Array.from({ length: count }, (_, index) =>
      Number((minimum + index * step).toFixed(10)));
  }
  return schema.default === undefined ? [] : [schema.default];
}

export function matchingVideoParameterValue(options, value) {
  if (value === undefined || value === null || value === "") return undefined;
  return options.find((option) => option === value || String(option) === String(value));
}

function nearestDuration(options, value) {
  if (value === undefined || value === null || value === "" || !Number.isFinite(Number(value))) return undefined;
  // Zero means source length; use the target model's default when unsupported.
  if (Number(value) === 0) return undefined;
  let nearest;
  for (const option of options) {
    if (Number.isFinite(Number(option)) &&
        (nearest === undefined || Math.abs(Number(option) - Number(value)) < Math.abs(Number(nearest) - Number(value)))) {
      nearest = option;
    }
  }
  return nearest;
}

function getBaseOptions(model) {
  if (!model) return EMPTY_OPTIONS;
  const cached = optionsByModel.get(model);
  if (cached) return cached;
  const options = Object.fromEntries(COMMON_FIELDS.map(([, field, key]) =>
    [key, field === "aspect_ratio" && model.aspectRatioMode === "inherited"
      ? []
      : model.fixedParameters?.[field] !== undefined
        ? [model.fixedParameters[field]]
        : schemaOptions(model.inputs?.[field])]));
  optionsByModel.set(model, options);
  return options;
}

function resolveValues(model, options, previous) {
  return Object.fromEntries(COMMON_FIELDS.map(([key, field, optionsKey]) => {
    const allowed = options[optionsKey];
    const value = matchingVideoParameterValue(allowed, previous[key]) ??
      (key === "duration" ? nearestDuration(allowed, previous[key]) : undefined) ??
      matchingVideoParameterValue(allowed, model?.inputs?.[field]?.default) ?? allowed[0];
    return [key, value];
  }));
}

export function getVideoCommonOptions(model, values = {}) {
  const base = getBaseOptions(model);
  if (!model?.commonParameterRules) return base;
  const current = { ...values, ...resolveValues(model, base, values) };
  const options = { ...base };
  for (const rule of model.commonParameterRules) {
    if (Object.entries(rule.when).every(([key, allowed]) =>
      allowed.includes(current[key] ?? model.inputs?.[key]?.default))) {
      Object.assign(options, rule.options);
    }
  }
  return options;
}

export function getVideoCommonValues(model, previous = {}) {
  return resolveValues(model, getVideoCommonOptions(model, previous), previous);
}

export function buildVideoCommonPayload(model, values = {}) {
  const options = getVideoCommonOptions(model, values);
  const resolved = model?.commonParameterRules ? resolveValues(model, options, values) : values;
  return Object.fromEntries(COMMON_FIELDS.flatMap(([key, field, optionsKey]) => {
    const value = matchingVideoParameterValue(options[optionsKey], resolved[key]);
    return value === undefined || !model.inputs?.[field] ? [] : [[field, value]];
  }));
}

export const normalizeVideoResolution = (value) => String(value).toLowerCase();

export function formatVideoResolution(value) {
  const normalized = normalizeVideoResolution(value);
  return normalized.endsWith("k") ? normalized.toUpperCase() : normalized;
}

export function matchingVideoResolution(model, value) {
  return getVideoCommonOptions(model).resolutions.find((option) =>
    normalizeVideoResolution(option) === normalizeVideoResolution(value));
}
