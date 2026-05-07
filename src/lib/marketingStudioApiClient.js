import { buildBrandDnaPrompt } from './brandDnaPromptBuilder.js';
import { buildCampaignPrompt } from './campaignPromptBuilder.js';

const PROXY_URL = import.meta.env.VITE_MARKETING_STUDIO_PROXY_URL || '';

function getProviderConfig() {
  const raw = localStorage.getItem('marketing_studio_provider') || '{}';
  try { return JSON.parse(raw); } catch { return {}; }
}

async function postJson(path, payload) {
  if (!PROXY_URL) throw new Error('Missing VITE_MARKETING_STUDIO_PROXY_URL. Use standalone app URL or configure proxy.');
  const res = await fetch(`${PROXY_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Marketing Studio API error: ${res.status}`);
  return res.json();
}

export async function analyzeBrandFromUrl({ url, apiKey, options = {} }) {
  const provider = getProviderConfig();
  const prompt = buildBrandDnaPrompt({ url, extractedWebsiteData: options.extractedWebsiteData });
  return postJson('/analyze-brand', { url, prompt, apiKey, provider, options });
}

export async function generateCampaignConcepts({ brandDna, campaignType, apiKey, options = {} }) {
  const provider = getProviderConfig();
  const prompt = buildCampaignPrompt({ brandDna, campaignPreset: campaignType });
  return postJson('/generate-campaigns', { brandDna, campaignType, prompt, apiKey, provider, options });
}

export async function generateCreativeAssets({ brandDna, campaign, assetType, apiKey, options = {} }) {
  const provider = getProviderConfig();
  return postJson('/generate-creatives', { brandDna, campaign, assetType, apiKey, provider, options });
}

export async function generateProductPhoto({ brandDna, image, prompt, apiKey, options = {} }) {
  const provider = getProviderConfig();
  return postJson('/generate-product-photo', { brandDna, image, prompt, apiKey, provider, options });
}

export async function generateMarketingVideo({ brandDna, prompt, apiKey, options = {} }) {
  const provider = getProviderConfig();
  return postJson('/generate-marketing-video', { brandDna, prompt, apiKey, provider, options });
}
