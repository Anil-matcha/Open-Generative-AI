"use client";

import { LOCAL_RUNTIME_CAPABILITIES, normalizeLocalRuntime } from "./localRuntime.js";

export const LOCAL_STUDIO_MODEL_KIND = Object.freeze({
  IMAGE: "image",
  VIDEO_T2V: "video-t2v",
  VIDEO_I2V: "video-i2v",
});

const DEFAULT_LOCAL_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];

function makeStringInput(name, title, value) {
  return {
    type: "string",
    title,
    name,
    ...(value ? { default: value } : {}),
  };
}

function makeEnumInput(name, title, values, fallback) {
  const enumValues = Array.isArray(values) && values.length ? values : [fallback].filter(Boolean);
  return {
    type: "string",
    title,
    name,
    enum: enumValues,
    default: enumValues[0],
  };
}

function isAuxiliaryReady(model) {
  if (!model?.requiresAuxiliary) return true;
  const states = Object.values(model.auxiliaryStatus || {});
  return states.length > 0 && states.every((state) => state === "downloaded");
}

function getSdCppUnavailableReason(model) {
  if (model?.state !== "downloaded") return "模型尚未下载";
  if (!isAuxiliaryReady(model)) return "辅助模型尚未下载";
  return "";
}

function normalizeSdCppModel(model) {
  const ready = model?.state === "downloaded" && isAuxiliaryReady(model);
  const aspectRatios = model?.aspectRatios || DEFAULT_LOCAL_ASPECT_RATIOS;

  return {
    ...model,
    id: model.id,
    name: `${model.name} (sd.cpp)`,
    providerId: "local-sd-cpp",
    family: "local",
    maxImages: 1,
    local: true,
    localRuntime: {
      provider: LOCAL_RUNTIME_CAPABILITIES.SD_CPP,
      modelId: model.id,
      mediaType: "image",
      ready,
      state: model.state || "unknown",
      unavailableReason: ready ? "" : getSdCppUnavailableReason(model),
    },
    inputs: {
      prompt: makeStringInput("prompt", "Prompt"),
      aspect_ratio: makeEnumInput("aspect_ratio", "Aspect Ratio", aspectRatios, "1:1"),
    },
  };
}

function normalizeWan2gpModel(model) {
  const mediaType = model.type === "video" ? "video" : "image";
  const kind =
    mediaType === "image"
      ? LOCAL_STUDIO_MODEL_KIND.IMAGE
      : model.needsImage
        ? LOCAL_STUDIO_MODEL_KIND.VIDEO_I2V
        : LOCAL_STUDIO_MODEL_KIND.VIDEO_T2V;
  const aspectRatios = model.aspectRatios || DEFAULT_LOCAL_ASPECT_RATIOS;
  const ready = model.ready !== false;

  return {
    ...model,
    id: model.id,
    name: model.name,
    providerId: "wan2gp",
    family: model.family || "wan2gp",
    maxImages: 1,
    local: true,
    localKind: kind,
    localRuntime: {
      provider: LOCAL_RUNTIME_CAPABILITIES.WAN2GP,
      modelId: model.id,
      mediaType,
      needsImage: Boolean(model.needsImage),
      ready,
      state: ready ? "ready" : "unavailable",
      unavailableReason: ready ? "" : model.unavailableReason || "Wan2GP 未就绪",
    },
    inputs: {
      prompt: makeStringInput("prompt", "Prompt"),
      aspect_ratio: makeEnumInput("aspect_ratio", "Aspect Ratio", aspectRatios, "16:9"),
    },
  };
}

function createEmptyCatalog(warnings = []) {
  return {
    image: [],
    videoT2V: [],
    videoI2V: [],
    warnings,
  };
}

export function isLocalStudioModel(model) {
  return Boolean(model?.localRuntime?.provider && model?.localRuntime?.modelId);
}

export function isLocalStudioModelReady(model) {
  return isLocalStudioModel(model) && model.localRuntime.ready !== false;
}

export function getModelAspectRatios(model, fallback = DEFAULT_LOCAL_ASPECT_RATIOS) {
  return model?.inputs?.aspect_ratio?.enum || fallback;
}

export async function loadLocalRuntimeModelCatalog(runtime) {
  const normalized = normalizeLocalRuntime(runtime);
  const catalog = createEmptyCatalog();

  if (!normalized.available) return catalog;

  if (normalized.capabilities.sdCpp && typeof normalized.sdCpp?.listModels === "function") {
    try {
      const models = await normalized.sdCpp.listModels();
      catalog.image.push(...(Array.isArray(models) ? models.map(normalizeSdCppModel) : []));
    } catch (error) {
      catalog.warnings.push(`sd.cpp: ${error?.message || "模型目录读取失败"}`);
    }
  }

  if (normalized.capabilities.wan2gp && typeof normalized.wan2gp?.listModels === "function") {
    try {
      const models = await normalized.wan2gp.listModels();
      (Array.isArray(models) ? models.map(normalizeWan2gpModel) : []).forEach((model) => {
        if (model.localKind === LOCAL_STUDIO_MODEL_KIND.IMAGE) {
          catalog.image.push(model);
        } else if (model.localKind === LOCAL_STUDIO_MODEL_KIND.VIDEO_I2V) {
          catalog.videoI2V.push(model);
        } else {
          catalog.videoT2V.push(model);
        }
      });
    } catch (error) {
      catalog.warnings.push(`Wan2GP: ${error?.message || "模型目录读取失败"}`);
    }
  }

  return catalog;
}
