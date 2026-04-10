import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables at startup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing required environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
  // Provide a graceful degradation - still export client but log warning
}

// Create client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'open-higgsfield-ai'
      }
    }
  });
} catch (error) {
  console.error('[Supabase] Failed to initialize client:', error);
  // Return a mock client for graceful degradation
  supabase = {
    storage: {
      from: () => ({
        upload: () => Promise.reject(new Error('Supabase not configured')),
        getPublicUrl: () => ({ data: { publicUrl: null } })
      })
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } })
    }
  };
}

export { supabase };

export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseUrl() {
  return supabaseUrl || '';
}

export function getUserKey() {
  const key = localStorage.getItem('muapi_key');
  if (!key) return 'anonymous';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'user_' + Math.abs(hash).toString(36);
}

export async function uploadFileToStorage(file) {
  const ext = file.name.split('.').pop() || 'bin';
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = `${getUserKey()}/${uniqueName}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(path);

  return urlData.publicUrl;
}
