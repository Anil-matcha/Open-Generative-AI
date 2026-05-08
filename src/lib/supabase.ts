import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user || null;
}

// Check workspace membership
export async function isWorkspaceMember(workspaceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_workspace_member', { _workspace_id: workspaceId });
  
  if (error) {
    console.error('Error checking workspace membership:', error);
    return false;
  }
  
  return data || false;
}

// Get user's workspaces
export async function getUserWorkspaces() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return [];
  
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(*)
    `)
    .eq('workspace_members.user_id', user.id);
  
  if (error) {
    console.error('Error fetching workspaces:', error);
    return [];
  }
  
  return data || [];
}

// Get campaigns for workspace
export async function getCampaigns(workspaceId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Create campaign
export async function createCampaign(campaign: Database['public']['Tables']['campaigns']['Insert']) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Get contacts for campaign
export async function getContacts(campaignId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Create contacts (bulk)
export async function createContacts(contacts: Database['public']['Tables']['contacts']['Insert'][]) {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contacts)
    .select();
  
  if (error) throw error;
  return data || [];
}

// Get personalized scripts for campaign
export async function getScripts(campaignId: string) {
  const { data, error } = await supabase
    .from('personalized_scripts')
    .select('*, contacts(first_name, last_name, email)')
    .eq('campaign_id', campaignId);
  
  if (error) throw error;
  return data || [];
}

// Get videos for workspace
export async function getVideos(workspaceId: string) {
  const { data, error } = await supabase
    .from('personalized_videos')
    .select('*, campaigns(name), contacts(first_name, last_name)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Get video events for analytics
export async function getVideoEvents(videoId: string) {
  const { data, error } = await supabase
    .from('video_events')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Get leads for campaign
export async function getLeads(campaignId: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('*, contacts(first_name, last_name, email)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Subscribe to generation job updates (Realtime)
export function subscribeToJobs(
  workspaceId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('generation_jobs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'generation_jobs',
        filter: `workspace_id=eq.${workspaceId}`,
      },
      callback
    )
    .subscribe();
}

// Upload file to storage
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);
  
  if (error) throw error;
  return data;
}

// Get public URL for file
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}
