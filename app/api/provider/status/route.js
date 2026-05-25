import { NextResponse } from 'next/server';

const IMAGE_MODELS = [
    {
        id: 'doubao-seedream-5.0-lite',
        label: 'Doubao Seedream 5.0 Lite',
        provider: 'Volcengine Ark',
        kind: 'image',
        requires: 'ark-seedream',
    },
    {
        id: 'gemini-3.1-flash-image-preview',
        label: 'Nano Banana',
        provider: 'Yunwu / Provider Proxy',
        kind: 'image',
        requires: 'provider-key',
    },
    {
        id: 'gemini-3-pro-image-preview',
        label: 'Nano Banana Pro',
        provider: 'Yunwu / Provider Proxy',
        kind: 'image',
        requires: 'provider-key',
    },
    {
        id: 'gpt-image-2-all',
        label: 'GPT Image 2 All',
        provider: 'Yunwu / Provider Proxy',
        kind: 'image',
        requires: 'provider-key',
        aliases: ['gpt-image-2'],
    },
];

const VIDEO_MODELS = [
    {
        id: 'sd-2-vip',
        label: 'Seedance 2.0 I2V',
        provider: 'Volcengine Ark',
        kind: 'video',
        requires: 'ark-seedance',
    },
    {
        id: 'sd-2',
        label: 'Seedance 2.0 Fast',
        provider: 'Volcengine Ark',
        kind: 'video',
        requires: 'ark-seedance',
    },
];

function normalizeValue(value) {
    if (!value) return null;
    const trimmed = String(value).trim();
    return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
}

function hasEnv(name) {
    return Boolean(normalizeValue(process.env[name]));
}

function hasAnyEnv(names) {
    return names.some(hasEnv);
}

function parseJsonEnv(name) {
    const raw = normalizeValue(process.env[name]);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function getModelKeyMap() {
    return {
        ...parseJsonEnv('HFSY_MODEL_KEYS_JSON'),
        ...parseJsonEnv('API_PROVIDER_MODEL_KEYS_JSON'),
    };
}

function getModelAliases(modelId, aliases = []) {
    const raw = normalizeValue(modelId);
    if (!raw) return [];
    const id = raw.toLowerCase().replace(/_/g, '-');
    const values = new Set([id, ...aliases.map((alias) => String(alias || '').toLowerCase().replace(/_/g, '-'))]);
    values.add(id.replace(/-(text-to-image|image-to-image|text-to-video|image-to-video|async-generations|generations|edits)$/g, ''));
    if (id.includes('gpt-image-2-all')) values.add('gpt-image-2');
    if (id.includes('gpt-image-2')) values.add('gpt-image-2-all');
    if (id.includes('sd-2-vip')) values.add('sd-2-vip');
    if (id.includes('sd-2')) values.add('sd-2');
    return Array.from(values).filter(Boolean);
}

function hasModelKey(model) {
    const lowerMap = Object.fromEntries(
        Object.entries(getModelKeyMap()).map(([modelId, key]) => [
            String(modelId).toLowerCase().replace(/_/g, '-'),
            normalizeValue(key),
        ]),
    );
    return getModelAliases(model.id, model.aliases).some((alias) => Boolean(lowerMap[alias]));
}

function providerKeyStatus(model) {
    if (hasModelKey(model)) {
        return {
            status: 'ok',
            detail: '已配置模型专用密钥',
        };
    }

    if (hasAnyEnv(['YUNWU_API_KEY', 'API_PROVIDER_KEY', 'HFSY_API_KEY', 'MUAPI_API_KEY'])) {
        return {
            status: 'ok',
            detail: '已配置通用服务端密钥',
        };
    }

    return {
        status: 'error',
        detail: '缺少模型密钥或通用服务端密钥',
    };
}

function arkSeedreamStatus() {
    if (!hasEnv('ARK_API_KEY')) {
        return {
            status: 'error',
            detail: '缺少 ARK_API_KEY',
        };
    }

    if (!hasAnyEnv(['SEEDREAM_ENDPOINT_ID', 'SEEDREAM_MODEL', 'ARK_SEEDREAM_ENDPOINT_ID'])) {
        return {
            status: 'warn',
            detail: 'Ark 密钥存在，但未检测到 Seedream endpoint/model',
        };
    }

    return {
        status: 'ok',
        detail: '已配置 Ark 密钥和 Seedream endpoint/model',
    };
}

function arkSeedanceStatus() {
    if (!hasEnv('ARK_API_KEY')) {
        return {
            status: 'error',
            detail: '缺少 ARK_API_KEY',
        };
    }

    if (!hasAnyEnv(['SEEDANCE_ENDPOINT_ID', 'SEEDANCE_MODEL'])) {
        return {
            status: 'error',
            detail: '缺少 Seedance endpoint/model',
        };
    }

    return {
        status: 'ok',
        detail: '已配置 Ark 密钥和 Seedance endpoint/model',
    };
}

function resolveModelStatus(model) {
    const result =
        model.requires === 'ark-seedream'
            ? arkSeedreamStatus()
            : model.requires === 'ark-seedance'
                ? arkSeedanceStatus()
                : providerKeyStatus(model);

    return {
        id: model.id,
        label: model.label,
        kind: model.kind,
        provider: model.provider,
        status: result.status,
        detail: result.detail,
    };
}

export async function GET() {
    const models = [...IMAGE_MODELS, ...VIDEO_MODELS].map(resolveModelStatus);
    const summary = models.reduce(
        (acc, model) => {
            acc.total += 1;
            acc[model.status] = (acc[model.status] || 0) + 1;
            return acc;
        },
        { total: 0, ok: 0, warn: 0, error: 0 },
    );

    const status = summary.error > 0 ? 'error' : summary.warn > 0 ? 'warn' : 'ok';

    return NextResponse.json({
        status,
        summary,
        models,
        updatedAt: new Date().toISOString(),
    });
}
