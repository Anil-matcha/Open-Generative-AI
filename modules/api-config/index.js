const config = {
  api: {
    muapi: {
      baseUrl: process.env.MUAPI_BASE_URL || "https://api.muapi.ai/api/v1",
      apiKey: process.env.MUAPI_API_KEY || "",
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      orgId: process.env.OPENAI_ORG_ID || "",
    },
    supabase: {
      url: process.env.SUPABASE_URL || "https://bzxohkrxcwodllketcpz.supabase.co",
      anonKey: process.env.SUPABASE_ANON_KEY || "",
      serviceKey: process.env.SUPABASE_SERVICE_KEY || "",
    },
  },
  features: {
    auth: process.env.DISABLE_AUTH !== "true",
  },
};

function getMuapiKey() {
  if (!config.api.muapi.apiKey) {
    throw new Error("MUAPI_API_KEY is not configured");
  }
  return config.api.muapi.apiKey;
}

function getOpenAICredentials() {
  if (!config.api.openai.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return {
    apiKey: config.api.openai.apiKey,
    orgId: config.api.openai.orgId,
  };
}

function getSupabaseClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(config.api.supabase.url, config.api.supabase.anonKey);
}

function getSupabaseAdminClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(config.api.supabase.url, config.api.supabase.serviceKey);
}

function getDatabaseUrl() {
  return `postgresql://postgres:${encodeURIComponent(config.api.supabase.serviceKey.split('.')[0])}@${config.api.supabase.url.replace('https://', '').replace('.supabase.co', '.supabase.co:5432/postgres')}`;
}

module.exports = {
  config,
  getMuapiKey,
  getOpenAICredentials,
  getSupabaseClient,
  getSupabaseAdminClient,
  getDatabaseUrl,
};