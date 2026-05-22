#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const outputPath = process.argv[2] || path.join(repoRoot, 'macos/OpenGenerativeAI/Resources/ModelCatalog.json');
const require = createRequire(import.meta.url);

const WAN2GP_META = {
  'wan2gp:flux-dev': {
    fn: 'flux',
    fnAliases: ['flux_dev', 'flux_1_dev', 'flux1_dev', 'flux_image'],
  },
  'wan2gp:qwen-image': {
    fn: 'qwen_image',
    fnAliases: ['qwen', 'qwen_t2i', 'qwen_image_t2i'],
  },
  'wan2gp:wan22-t2v': {
    fn: 'wan22_t2v',
    fnAliases: ['wan_2_2_t2v', 'wan22_text2video', 'wan_t2v', 'wan2_2_t2v', 't2v'],
  },
  'wan2gp:wan22-i2v': {
    fn: 'wan22_i2v',
    fnAliases: ['wan_2_2_i2v', 'wan22_image2video', 'wan_i2v', 'wan2_2_i2v', 'i2v'],
  },
  'wan2gp:hunyuan-video': {
    fn: 'hunyuan_video',
    fnAliases: ['hunyuan', 'hunyuan_t2v', 'hyvideo', 'hy_video'],
  },
  'wan2gp:ltx-video': {
    fn: 'ltx_video',
    fnAliases: ['ltx', 'ltx_t2v', 'ltxv', 'ltx_v', 'ltx_2', 'ltx2'],
  },
};

async function loadExports(sourcePath, exportNames) {
  const source = await fs.readFile(sourcePath, 'utf8');
  const moduleSource = `${source
    .replaceAll('export const ', 'const ')
    .replaceAll('export function ', 'function ')}

export { ${exportNames.join(', ')} };
`;

  const tempPath = path.join(
    os.tmpdir(),
    `open-generative-ai-native-catalog-${process.pid}-${path.basename(sourcePath)}.mjs`
  );
  await fs.writeFile(tempPath, moduleSource);
  try {
    return await import(pathToFileURL(tempPath).href);
  } finally {
    await fs.rm(tempPath, { force: true });
  }
}

function stringifyValue(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function compactInput([key, input]) {
  return {
    key,
    name: input?.name || key,
    title: input?.title || key,
    type: input?.type || 'string',
    description: input?.description || '',
    defaultValue: stringifyValue(input?.default),
    enumValues: Array.isArray(input?.enum) ? input.enum.map(String) : [],
    minValue: typeof input?.minValue === 'number' ? input.minValue : null,
    maxValue: typeof input?.maxValue === 'number' ? input.maxValue : null,
    step: typeof input?.step === 'number' ? input.step : null,
    maxItems: typeof input?.maxItems === 'number' ? input.maxItems : null,
  };
}

function compactModel(model, source, provider = 'muapi') {
  const extra = model.extra || {};
  return {
    id: model.id,
    name: model.name || model.id,
    endpoint: model.endpoint || model.id,
    family: model.family || model.provider || provider,
    detail: model.description || model.detail || '',
    source,
    provider: model.provider || provider,
    category: model.category || '',
    imageField: model.imageField || '',
    lastImageField: model.lastImageField || '',
    videoField: model.videoField || '',
    hasPrompt: Boolean(model.hasPrompt),
    needsImage: Boolean(model.needsImage),
    required: Array.isArray(model.required) ? model.required : [],
    type: model.type || '',
    filename: model.filename || '',
    downloadUrl: model.downloadUrl || '',
    sizeGB: typeof model.sizeGB === 'number' ? model.sizeGB : null,
    aspectRatios: Array.isArray(model.aspectRatios) ? model.aspectRatios : [],
    defaultSteps: typeof model.defaultSteps === 'number' ? model.defaultSteps : null,
    defaultGuidance: typeof model.defaultGuidance === 'number' ? model.defaultGuidance : null,
    sampler: model.sampler || '',
    scheduler: model.scheduler || '',
    requiresAuxiliary: Boolean(model.requiresAuxiliary),
    fn: extra.fn || model.fn || '',
    fnAliases: Array.isArray(extra.fnAliases) ? extra.fnAliases : (Array.isArray(model.fnAliases) ? model.fnAliases : []),
    inputs: Object.fromEntries(
      Object.entries(model.inputs || {}).map((entry) => {
        const compact = compactInput(entry);
        return [compact.key, compact];
      })
    ),
  };
}

const modelExports = await loadExports(
  path.join(repoRoot, 'packages/studio/src/models.js'),
  ['t2iModels', 't2vModels', 'i2iModels', 'i2vModels', 'v2vModels', 'lipsyncModels', 'audioModels']
);

const localExports = await loadExports(
  path.join(repoRoot, 'src/lib/localModels.js'),
  ['LOCAL_MODEL_CATALOG']
);

const {
  LOCAL_MODEL_CATALOG: SDCppCatalog,
  ZIMAGE_AUXILIARY,
} = require(path.join(repoRoot, 'electron/lib/modelCatalog.js'));

const sdcppById = new Map(SDCppCatalog.map((model) => [model.id, model]));
const enrichedLocal = localExports.LOCAL_MODEL_CATALOG.map((model) => ({
  ...model,
  ...(sdcppById.get(model.id) || {}),
  provider: model.provider,
  endpoint: model.id,
  extra: WAN2GP_META[model.id] || {},
}));

const catalog = {
  textToImage: modelExports.t2iModels.map((model) => compactModel(model, 'textToImage')),
  imageToImage: modelExports.i2iModels.map((model) => compactModel(model, 'imageToImage')),
  textToVideo: modelExports.t2vModels.map((model) => compactModel(model, 'textToVideo')),
  imageToVideo: modelExports.i2vModels.map((model) => compactModel(model, 'imageToVideo')),
  videoToVideo: modelExports.v2vModels.map((model) => compactModel(model, 'videoToVideo')),
  lipSync: modelExports.lipsyncModels.map((model) => compactModel(model, 'lipSync')),
  audio: modelExports.audioModels.map((model) => compactModel(model, 'audio')),
  local: enrichedLocal.map((model) => compactModel(model, 'local', model.provider || 'local')),
  localAuxiliary: Object.fromEntries(Object.entries(ZIMAGE_AUXILIARY).map(([key, aux]) => [
    key,
    {
      id: aux.id,
      filename: aux.filename,
      displayName: aux.displayName,
      sizeGB: aux.sizeGB,
      downloadUrl: aux.downloadUrl,
    },
  ])),
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated native model catalog: ${outputPath}`);
