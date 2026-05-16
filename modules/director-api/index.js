/**
 * Director API Configuration Module
 *
 * Manages API keys and configuration for the Director application.
 * The Director app uses a Python backend and multiple LLM providers.
 *
 * Environment variables:
 *   DIRECTOR_API_URL       - Backend URL (default: http://localhost:8000)
 *   DIRECTOR_API_KEY       - Optional API key for backend auth
 *   SUPABASE_URL           - Supabase project URL
 *   SUPABASE_ANON_KEY      - Supabase anonymous key
 *   SUPABASE_SERVICE_KEY   - Supabase service key (admin)
 *
 * LLM Provider keys are managed in the frontend via LLMKeyManager
 * and stored in localStorage, not here.
 */

const config = {
  api: {
    director: {
      baseUrl: process.env.DIRECTOR_API_URL || 'http://localhost:8000',
      apiKey: process.env.DIRECTOR_API_KEY || '',
    },
    supabase: {
      url: process.env.SUPABASE_URL || '',
      anonKey: process.env.SUPABASE_ANON_KEY || '',
      serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    },
  },
  features: {
    auth: process.env.DISABLE_AUTH !== 'true',
  },
};

function getDirectorBaseUrl() {
  return config.api.director.baseUrl;
}

function getDirectorApiKey() {
  if (!config.api.director.apiKey) {
    throw new Error('DIRECTOR_API_KEY is not configured');
  }
  return config.api.director.apiKey;
}

function getSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(config.api.supabase.url, config.api.supabase.anonKey);
}

function getSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(config.api.supabase.url, config.api.supabase.serviceKey);
}

module.exports = {
  config,
  getDirectorBaseUrl,
  getDirectorApiKey,
  getSupabaseClient,
  getSupabaseAdminClient,
};
