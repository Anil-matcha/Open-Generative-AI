import { analyzeBrandFromUrl, generateCampaignConcepts, generateCreativeAssets, generateProductPhoto, generateMarketingVideo } from './marketingStudioApiClient.js';

const BRAND_DNA_DEFAULT = { businessName:'', websiteUrl:'', tagline:'', offerSummary:'', audience:'', industry:'', tone:[], personality:[], colors:{primary:'',secondary:'',accent:''}, fonts:[], logoUrl:'', keyMessages:[], products:[], competitors:[], campaignAngles:[] };

export function createMarketingStudioController() {
  const state = { brandDna: { ...BRAND_DNA_DEFAULT }, outputs: [], selectedCampaign: null, loading: false, error: '' };

  const pushOutput = (type, payload) => state.outputs.unshift({ id: crypto.randomUUID(), type, text: JSON.stringify(payload, null, 2), createdAt: new Date().toISOString() });

  return {
    state,
    setBrandField(key, value) { state.brandDna[key] = value; },
    async analyzeUrl(url) {
      state.loading = true; state.error = '';
      try {
        const out = await analyzeBrandFromUrl({ url, options: {} });
        state.brandDna = { ...state.brandDna, ...out, websiteUrl: url };
        pushOutput('Brand DNA', out);
      } catch (e) { state.error = e.message; throw e; } finally { state.loading = false; }
    },
    async runCampaigns(slug) {
      state.loading = true; state.error = '';
      try {
        const result = await generateCampaignConcepts({ brandDna: state.brandDna, campaignType: slug });
        state.selectedCampaign = result;
        pushOutput(`Campaigns: ${slug}`, result);
        return result;
      } catch (e) { state.error = e.message; throw e; } finally { state.loading = false; }
    },
    async runCreative(assetType) {
      const result = await generateCreativeAssets({ brandDna: state.brandDna, campaign: state.selectedCampaign, assetType });
      pushOutput(`Creative: ${assetType}`, result);
      return result;
    },
    async runPhoto(prompt) {
      const result = await generateProductPhoto({ brandDna: state.brandDna, prompt });
      pushOutput('Product Photo', result);
      return result;
    },
    async runVideo(prompt) {
      const result = await generateMarketingVideo({ brandDna: state.brandDna, prompt });
      pushOutput('Video Prompt', result);
      return result;
    }
  };
}
