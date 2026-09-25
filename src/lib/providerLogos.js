const PROVIDER_LOGOS = Object.freeze({
    openai: 'https://cdn.muapi.ai/models/openai.png',
    google: 'https://cdn.muapi.ai/models/gemini.png',
    kling: 'https://cdn.muapi.ai/models/kling.png',
    alibaba: 'https://cdn.muapi.ai/models/alibaba.png',
    bytedance: 'https://cdn.muapi.ai/models/bytedance.png',
    blackforest: 'https://cdn.muapi.ai/models/bfl.png',
    minimax: 'https://cdn.muapi.ai/models/minimax.png',
    suno: 'https://cdn.muapi.ai/models/suno.png',
    anthropic: 'https://cdn.muapi.ai/models/claude.png',
    meshy: 'https://cdn.muapi.ai/models/meshy-3.png',
    tripo3d: 'https://cdn.muapi.ai/models/tripo3d.png',
    grok: 'https://cdn.muapi.ai/models/xai.png',
    muapi: 'https://cdn.muapi.ai/models/muapi.png',
    midjourney: 'https://cdn.muapi.ai/models/midjourney.png',
    vidu: 'https://cdn.muapi.ai/models/vidu.png',
    runway: 'https://cdn.muapi.ai/models/runway.png',
    luma: 'https://cdn.muapi.ai/models/luma.png',
    ideogram: 'https://cdn.muapi.ai/models/ideogram.png',
    leonardoai: 'https://cdn.muapi.ai/models/leonardoai.png',
    hunyuan: 'https://cdn.muapi.ai/models/hunyuan.png',
    hidream: 'https://cdn.muapi.ai/models/hidream.png',
    lightricks: 'https://cdn.muapi.ai/models/lightricks.png',
    pixverse: 'https://cdn.muapi.ai/models/pixverse.png',
    reve: 'https://cdn.muapi.ai/models/reve.png',
    stability: 'https://cdn.muapi.ai/models/stability.png',
});

const INVERTED_PROVIDER_LOGOS = new Set([
    'openai',
    'blackforest',
    'runway',
    'ideogram',
    'lightricks',
    'grok',
]);

const titleCaseProvider = (provider) => provider
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const getProviderLogo = (provider) => PROVIDER_LOGOS[provider] || null;

export const getProviderLogoAlt = (model = {}) => {
    if (model.provider_name) return model.provider_name;
    if (model.provider) return titleCaseProvider(model.provider);
    return 'AI provider';
};

export const getProviderFallbackText = (model = {}) => model.name?.trim()?.charAt(0)?.toUpperCase() || 'AI';
export const createProviderFallbackTile = (documentRef, className, text) => {
    const fallback = documentRef.createElement('div');
    fallback.className = className;
    fallback.dataset.providerFallback = '';
    fallback.textContent = text;
    return fallback;
};

export const handleProviderLogoError = ({ image, failedProviderLogos, providerLogo, fallback }) => {
    if (!image?.parentElement) return false;
    failedProviderLogos.add(providerLogo);
    image.parentElement.replaceWith(fallback);
    return true;
};

export const shouldInvertProviderLogo = (provider) => INVERTED_PROVIDER_LOGOS.has(provider);
