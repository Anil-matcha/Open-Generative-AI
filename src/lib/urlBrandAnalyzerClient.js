import { analyzeBrandFromUrl } from './marketingStudioApiClient.js';

export async function analyzeUrlBrand(url, apiKey, options = {}) {
  return analyzeBrandFromUrl({ url, apiKey, options });
}
