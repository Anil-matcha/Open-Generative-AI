import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getMuapiWorkflows() {
  const { data, error } = await supabase
    .from('muapi_workflows')
    .select('*')
    .eq('is_active', true);
  
  if (error) throw error;
  return data || [];
}

export async function createGenerationJob(job: Partial<Database['public']['Tables']['generation_jobs']['Insert']>) {
  const { data, error } = await supabase
    .from('generation_jobs')
    .insert(job)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Helper to check workspace membership
export async function isWorkspaceMember(workspaceId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_workspace_member', { _workspace_id: workspaceId });
  
  if (error) {
    console.error('Error checking workspace membership:', error);
    return false;
  }
  
  return data || false;
}

// Get current user's workspaces
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

// Campaign services
export async function getCampaigns(workspaceId: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createCampaign(campaign: Partial<Database['public']['Tables']['campaigns']['Insert']>) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Contact services
export async function getContacts(campaignId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createContacts(contacts: Database['public']['Tables']['contacts']['Insert'][]) {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contacts)
    .select();
  
  if (error) throw error;
  return data || [];
}

// Script services
export async function getScripts(campaignId: string) {
  const { data, error } = await supabase
    .from('personalized_scripts')
    .select('*, contacts(first_name, last_name, email)')
    .eq('campaign_id', campaignId);
  
  if (error) throw error;
  return data || [];
}

// Video services
export async function getVideos(workspaceId: string) {
  const { data, error } = await supabase
    .from('personalized_videos')
    .select('*, campaigns(name), contacts(first_name, last_name)')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Analytics services
export async function getVideoEvents(videoId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('video_events')
    .select('*')
    .eq('video_id', videoId);
  
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Leads services
export async function getLeads(campaignId: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('*, contacts(first_name, last_name)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

// Password update service
export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  return { data, error };
}
