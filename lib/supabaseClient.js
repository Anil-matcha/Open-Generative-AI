'use client';
// Browser Supabase client — shared project with creator-club.
// The publishable key is public by design; override via NEXT_PUBLIC_* if needed.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsyuvhvjrjxdpvuzivvv.supabase.co';
export const SUPABASE_KEY =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_9bCiI4pZI45ObKbC2W1xvw_bscZtpFJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
