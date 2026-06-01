// Supabase-backed user balance: identify the user from a request and
// atomically deduct / refund their ruble balance.
//
// Reuses the same Supabase project as creator-club (profiles.balance in RUB).
// Required env vars (add to Vercel — same values as creator-club):
//   SUPABASE_URL
//   SUPABASE_ANON_KEY            (publishable — to validate the user's JWT)
//   SUPABASE_SERVICE_ROLE_KEY    (secret — to update balance, bypasses RLS)
//
// If these are not set, billing is disabled and generations run free
// (so the app keeps working until auth + top-up are wired in the UI).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const BILLING_ENABLED = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);

let _anon = null, _admin = null;
function anon() {
    if (!_anon) _anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    return _anon;
}
function admin() {
    if (!_admin) _admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    return _admin;
}

// Extract the Supabase access token from a request.
// Sent by the frontend as the `x-sb-token` header or the `sb_access_token`
// cookie. We deliberately avoid the Authorization header — that one already
// carries the memefast API key — so the two never collide.
function getAccessToken(request) {
    const hdr = request.headers.get('x-sb-token');
    if (hdr) return hdr.trim();
    const m = request.headers.get('cookie')?.match(/sb_access_token=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
}

// Resolve the authenticated user, or null if not logged in / billing off.
async function getUser(request) {
    if (!BILLING_ENABLED) return null;
    const token = getAccessToken(request);
    if (!token) return null;
    try {
        const { data, error } = await anon().auth.getUser(token);
        if (error || !data?.user) return null;
        return data.user;
    } catch { return null; }
}

// Atomic compare-and-swap deduction. Returns:
//   { ok: true, balance }                — charged successfully
//   { ok: false, reason: 'insufficient', balance, required }
//   { ok: false, reason: 'error' | 'race', ... }
async function deduct(userId, amount) {
    if (amount <= 0) return { ok: true, balance: null };
    const db = admin();
    for (let attempt = 0; attempt < 4; attempt++) {
        const { data: profile, error: selErr } = await db
            .from('profiles').select('balance').eq('id', userId).single();
        if (selErr || !profile) return { ok: false, reason: 'error', error: selErr?.message };
        const balance = Number(profile.balance || 0);
        if (balance < amount) return { ok: false, reason: 'insufficient', balance, required: amount };

        const newBalance = round2(balance - amount);
        // CAS: only write if balance is still what we just read.
        const { data: updated, error: updErr } = await db
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId)
            .eq('balance', balance)
            .select();
        if (updErr) return { ok: false, reason: 'error', error: updErr.message };
        if (updated && updated.length) return { ok: true, balance: newBalance };
        // Someone changed the balance between read and write — retry.
    }
    return { ok: false, reason: 'race' };
}

// Best-effort refund (e.g. when generation fails after charging).
async function refund(userId, amount) {
    if (!BILLING_ENABLED || amount <= 0) return;
    const db = admin();
    for (let attempt = 0; attempt < 4; attempt++) {
        const { data: profile, error } = await db
            .from('profiles').select('balance').eq('id', userId).single();
        if (error || !profile) return;
        const balance = Number(profile.balance || 0);
        const { data: updated, error: updErr } = await db
            .from('profiles')
            .update({ balance: round2(balance + amount) })
            .eq('id', userId)
            .eq('balance', balance)
            .select();
        if (updErr) return;
        if (updated && updated.length) return;
    }
}

function round2(n) { return Math.round(n * 100) / 100; }

export { BILLING_ENABLED, getUser, deduct, refund };
