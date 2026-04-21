/**
 * Hybrid Supabase Configuration
 * Provides seamless online/offline functionality with automatic synchronization
 */

// Always use the hybrid client which handles online/offline automatically
export async function getSupabaseModule() {
  console.log('[Config] Using hybrid Supabase module');
  return await import('./hybrid-supabase.js');
}

// Export the hybrid module
export const supabaseModule = getSupabaseModule();