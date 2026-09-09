import { getModelMediaCapabilities } from "./modelCapabilities.js";

const COMMON_INPUT_KEYS = new Set([
  "prompt",
  "aspect_ratio",
  "resolution",
  "quality",
  "mode",
  "duration",
  "name",
  "api_key",
  "request_id",
  "num_images",
  "batch_size",
]);

function mediaInputKeys(model) {
  const capabilities = getModelMediaCapabilities(model);
  const keys = new Set();
  for (const capability of Object.values(capabilities)) {
    if (capability.field) keys.add(capability.field);
    if (capability.lastField) keys.add(capability.lastField);
  }
  for (const [key, input] of Object.entries(model?.inputs || {})) {
    if (["image", "video", "audio"].includes(input?.field)) keys.add(key);
  }
  return keys;
}

export function getSupplementalModelInputs(model) {
  if (!model?.inputs) return [];
  const mediaKeys = mediaInputKeys(model);
  return Object.entries(model.inputs)
    .filter(([key]) => !COMMON_INPUT_KEYS.has(key) && !mediaKeys.has(key))
    .map(([key, schema]) => ({ key, schema }));
}

function defaultValue(schema) {
  if (schema.default !== undefined) return schema.default;
  if (schema.type === "boolean") return false;
  if (schema.type === "array") return [];
  return "";
}

function clampNumber(value, schema) {
  const number = Number(value);
  if (!Number.isFinite(number)) return undefined;
  const minimum = schema.minValue ?? schema.minimum;
  const maximum = schema.maxValue ?? schema.maximum;
  const clamped = Math.min(maximum ?? number, Math.max(minimum ?? number, number));
  const fractionalStep = schema.step !== undefined && !Number.isInteger(Number(schema.step));
  return ["int", "integer"].includes(schema.type) && !fractionalStep
    ? Math.round(clamped)
    : clamped;
}

function normalizeValue(value, schema, { includeEmpty = false } = {}) {
  if (schema.enum) {
    return schema.enum.includes(value) ? value : schema.default;
  }
  if (schema.type === "boolean") return typeof value === "boolean" ? value : !!schema.default;
  if (["number", "integer", "int"].includes(schema.type)) {
    return clampNumber(value, schema);
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) return [];
    const maxItems = schema.maxItems ?? schema.max_items ?? value.length;
    return value
      .slice(0, maxItems)
      .map((item) => normalizeValue(item, schema.items || {}, { includeEmpty }))
      .filter((item) => item !== undefined && (includeEmpty || item !== ""));
  }
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    const requiredKeys = schema.required || [];
    const stringKeys = Object.entries(schema.properties || {})
      .filter(([, propertySchema]) => propertySchema.type === "string")
      .map(([key]) => key);
    const identifyingKeys = requiredKeys.length > 0 ? requiredKeys : stringKeys;
    if (
      !includeEmpty &&
      identifyingKeys.length > 0 &&
      identifyingKeys.every((key) => !String(value[key] ?? "").trim())
    ) {
      return undefined;
    }
    const normalized = {};
    for (const [key, propertySchema] of Object.entries(schema.properties || {})) {
      const propertyValue = normalizeValue(value[key], propertySchema, { includeEmpty });
      if (propertyValue !== undefined && (includeEmpty || propertyValue !== "")) {
        normalized[key] = propertyValue;
      }
    }
    return Object.keys(normalized).length > 0 ? normalized : undefined;
  }
  if (value === null || value === undefined) return includeEmpty ? "" : undefined;
  const stringValue = String(value);
  return includeEmpty || stringValue.trim() ? stringValue : undefined;
}

export function createModelParameterValues(model, previousValues = {}) {
  const values = {};
  for (const { key, schema } of getSupplementalModelInputs(model)) {
    const source = Object.hasOwn(previousValues, key)
      ? previousValues[key]
      : defaultValue(schema);
    const normalized = normalizeValue(source, schema, { includeEmpty: true });
    values[key] = normalized === undefined ? defaultValue(schema) : normalized;
  }
  return values;
}

export function buildSupplementalInputPayload(model, values = {}) {
  const payload = {};
  for (const { key, schema } of getSupplementalModelInputs(model)) {
    if (!Object.hasOwn(values, key)) continue;
    const normalized = normalizeValue(values[key], schema);
    const isEmptyArray = Array.isArray(normalized) && normalized.length === 0;
    if (normalized !== undefined && normalized !== "" && !isEmptyArray) {
      payload[key] = normalized;
    }
  }
  return payload;
}
