import { supabase } from './supabase-client';

export async function uploadToStorage(file, path) {
  const { data, error } = await supabase.storage.from('assets').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
}

export async function saveMediaRecord(record) {
  const { data, error } = await supabase.from('generated_assets').insert(record);
  if (error) throw error;
  return data;
}