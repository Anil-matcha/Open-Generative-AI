export interface ApiConfig {
  api: {
    muapi: {
      baseUrl: string;
      apiKey: string;
    };
    openai: {
      apiKey: string;
      orgId: string;
    };
    videodb: {
      apiKey: string;
    };
    supabase: {
      url: string;
      anonKey: string;
      serviceKey: string;
    };
  };
  features: {
    auth: boolean;
  };
}

export function getMuapiKey(): string;
export function getOpenAICredentials(): { apiKey: string; orgId: string };
export function getSupabaseClient(): import('@supabase/supabase-js').SupabaseClient;
export function getSupabaseAdminClient(): import('@supabase/supabase-js').SupabaseClient;
export function getVideoDBKey(): string;
export function getDatabaseUrl(): string;

export const config: ApiConfig;