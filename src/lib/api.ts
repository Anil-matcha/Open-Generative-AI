import { supabase } from './supabase';

export const appApi = {
  generateScripts: (campaignId: string, contactIds: string[]) =>
    supabase.functions.invoke('generate-personalized-scripts', { body: { campaignId, contactIds } }),
  startMuApiJob: (payload: Record<string, unknown>) =>
    supabase.functions.invoke('start-muapi-media-job', { body: payload }),
};
