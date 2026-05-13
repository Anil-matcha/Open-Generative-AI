const config = {
  api: {
    muapi: {
      baseUrl: process.env.MUAPI_BASE_URL || "https://api.muapi.ai/api/v1",
      apiKey: process.env.MUAPI_API_KEY,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      orgId: process.env.OPENAI_ORG_ID,
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      anonKey: process.env.SUPABASE_ANON_KEY,
      serviceKey: process.env.SUPABASE_SERVICE_KEY,
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
  if (!config.api.supabase.url || !config.api.supabase.anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required");
  }
  return createClient(config.api.supabase.url, config.api.supabase.anonKey);
}

function getSupabaseAdminClient() {
  const { createClient } = require("@supabase/supabase-js");
  if (!config.api.supabase.url || !config.api.supabase.serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
  }
  return createClient(config.api.supabase.url, config.api.supabase.serviceKey);
}

module.exports = {
  config,
  getMuapiKey,
  getOpenAICredentials,
  getSupabaseClient,
  getSupabaseAdminClient,
};