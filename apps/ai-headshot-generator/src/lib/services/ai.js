const { getMuapiKey, config } = require("@higgsfield/api-config");

// Optional asset saving - only works when embedded in main Higgsfield app
let saveGeneratedAsset;
try {
  saveGeneratedAsset = require("../assets/assetActions").saveGeneratedAsset;
} catch (e) {
  saveGeneratedAsset = null;
}

module.exports = {
  getCreditCost() {
    return 60;
  },

  async generate({ image_url, category, aspect_ratio = "1:1" }) {
    const apiKey = getMuapiKey();
    const baseUrl = config.api?.muapi?.baseUrl || "https://api.muapi.ai";

    const submitUrl = `${baseUrl}/photo-pack`;
    
    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        image_url,
        category,
        aspect_ratio,
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`MU API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) throw new Error("No request_id received from MU API");

    return { request_id };
  },

  async checkStatus(requestId) {
    // In a real implementation we would poll MU API status endpoint here.
    // For now we assume the webhook will update Supabase and the client polls creations.
    return { status: "processing" };
  },

  async saveToAssetSystem(resultUrl, metadata = {}) {
    try {
      if (typeof saveGeneratedAsset === 'function') {
        await saveGeneratedAsset('headshot', {
          title: metadata.category || 'AI Headshot',
          media: { url: resultUrl },
          metadata: { ...metadata, source: 'ai-headshot-generator' }
        }, 'ai-headshot-generator');
      }
    } catch (e) {
      console.warn('[Headshot] Could not save to main asset system:', e.message);
    }
  }
};
